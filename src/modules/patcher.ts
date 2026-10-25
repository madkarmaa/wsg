import { Logger } from '@utils/Logger';
import { evaluateExpression } from '@utils/evaluate';
import { canonicalizeMatch } from '@utils/patches';
import type { Patch } from '@utils/types';
import {
    _installRequireLazyHook,
    _notifyModuleLoaded,
    type CodeFilter,
    getModulesMap,
    stringMatches
} from './modules';
import type { ModuleFactory } from './types';

const logger = new Logger('Patcher', '#8caaee');

/** Patches waiting for their module. Single-use patches are removed once applied */
export const patches: Patch[] = [];

/** The original factory of every module defined since WSG initialised, by module id */
export const originalFactories = new Map<string, ModuleFactory>();
/** The patched source and the plugins that patched it, by module id */
export const patchedModules = new Map<string, { source: string; patchedBy: string[] }>();

export const SYM_ORIGINAL_FACTORY = Symbol('WSG.originalFactory');

// `__d` is WhatsApp's module definition function, `define` is used for a few oddly named modules
const DEFINE_METHODS = ['__d', 'define'] as const;
type DefineFn = (...args: unknown[]) => unknown;

/** Must run before WhatsApp's scripts, so every module definition goes through our hooks */
export function installModuleHooks() {
    for (const name of DEFINE_METHODS) hookDefineMethod(name);
    _installRequireLazyHook();
}

function hookDefineMethod(name: (typeof DEFINE_METHODS)[number]) {
    const existing = window[name];
    if (typeof existing === 'function') {
        logger.warn(`window.${name} already exists, modules defined before now can't be patched`);
        window[name] = wrapDefine(existing);
        return;
    }

    let current: DefineFn | undefined;
    Object.defineProperty(window, name, {
        configurable: true,
        enumerable: true,
        get: () => current,
        set(value) {
            current = typeof value === 'function' ? wrapDefine(value) : value;
        }
    });
}

function wrapDefine(define: DefineFn): DefineFn {
    const hooked = function (this: unknown, ...args: unknown[]) {
        const id = args.find((arg): arg is string => typeof arg === 'string');
        const factoryIndex = args.findIndex((arg) => typeof arg === 'function');

        if (id && factoryIndex !== -1)
            args[factoryIndex] = wrapFactory(id, args[factoryIndex] as ModuleFactory);

        return define.apply(this, args);
    };

    // keep static properties such as `define.amd`
    return Object.assign(hooked, define);
}

const isModuleObject = (id: string) => (arg: unknown) =>
    typeof arg === 'object' &&
    arg !== null &&
    (arg as { id?: unknown }).id === id &&
    'exports' in arg;

function wrapFactory(id: string, factory: ModuleFactory): ModuleFactory {
    originalFactories.set(id, factory);
    let patchedFactory: ModuleFactory | undefined;

    const wrapped = function (this: unknown, ...args: unknown[]) {
        // patch lazily, so only modules that actually run pay the cost
        patchedFactory ??= patchFactory(id, factory);

        let result: unknown;
        try {
            result = patchedFactory.apply(this, args);
        } catch (err) {
            if (patchedFactory === factory) throw err;

            logger.error(`Patched factory of ${id} threw, falling back to the original`, err);
            result = factory.apply(this, args);
        }

        const moduleObject = args.find(isModuleObject(id)) as { exports: unknown } | undefined;
        _notifyModuleLoaded(
            id,
            moduleObject ? moduleObject.exports : getModulesMap()?.[id]?.exports
        );

        return result;
    } as ModuleFactory;

    // WhatsApp's loader reads `factory.length` to decide which arguments to pass
    Object.defineProperties(wrapped, {
        length: { value: factory.length },
        name: { value: factory.name },
        toString: { value: () => Function.prototype.toString.call(factory) },
        [SYM_ORIGINAL_FACTORY]: { value: factory }
    });

    return wrapped;
}

function matchesModule(patch: Patch, id: string, getSource: () => string) {
    const { module, find } = patch;

    if (module != null && (typeof module === 'string' ? module !== id : !module.test(id)))
        return false;

    if (find != null) {
        const source = getSource();
        if (
            typeof find === 'string'
                ? !source.includes(find)
                : ((find.lastIndex = 0), !find.test(source))
        )
            return false;
    }

    return true;
}

/** Turns a function's source into an expression, e.g. `function c(e){}` into `0,function(e){}` */
function toExpression(source: string) {
    if (source.startsWith('(') || /^(?:async\s+)?\w+\s*=>/.test(source)) return '0,' + source;
    const isAsync = source.startsWith('async');
    return `0,${isAsync ? 'async ' : ''}function${source.slice(source.indexOf('('))}`;
}

function evaluateFactory(id: string, code: string, patchedBy: string[]): ModuleFactory {
    const factory = evaluateExpression(
        code,
        `wsg://patched/${encodeURIComponent(id)}`,
        `WhatsApp module ${id}, patched by ${patchedBy.join(', ')}`
    );

    if (typeof factory !== 'function')
        throw new TypeError('Patched code did not evaluate to a function');
    return factory as ModuleFactory;
}

function patchFactory(id: string, factory: ModuleFactory): ModuleFactory {
    if (!patches.length) return factory;

    let source: string | undefined;
    const getSource = () => (source ??= Function.prototype.toString.call(factory));

    let state: PatchState | null = null;

    for (let i = 0; i < patches.length; i++) {
        const patch = patches[i];
        if (!matchesModule(patch, id, getSource)) continue;

        state ??= { code: toExpression(getSource()), factory, patchedBy: [] };
        state = applyPatch(id, patch, state);

        if (!patch.all) patches.splice(i--, 1);
    }

    if (!state || state.factory === factory) return factory;

    patchedModules.set(id, { source: state.code, patchedBy: state.patchedBy });
    logger.debug(`Patched ${id} (${state.patchedBy.join(', ')})`);
    return state.factory;
}

interface PatchState {
    code: string;
    factory: ModuleFactory;
    patchedBy: string[];
}

/** Applies a patch's replacements one by one. Returns the previous state if a patch group fails */
function applyPatch(id: string, patch: Patch, previous: PatchState): PatchState {
    let state = previous;

    for (const replacement of patch.replacement) {
        const { match } = replacement;
        if (typeof match !== 'string') match.lastIndex = 0;

        const { replace } = replacement;
        const newCode =
            typeof replace === 'string'
                ? state.code.replace(match, replace)
                : state.code.replace(match, replace);

        if (newCode === state.code) {
            if (!patch.noWarn && !replacement.noWarn)
                logger.warn(`Patch by ${patch.plugin} had no effect on ${id}: ${String(match)}`);

            if (patch.group) return undoGroup(id, patch, previous);
            continue;
        }

        const patchedBy = state.patchedBy.includes(patch.plugin)
            ? state.patchedBy
            : [...state.patchedBy, patch.plugin];

        try {
            state = { code: newCode, factory: evaluateFactory(id, newCode, patchedBy), patchedBy };
        } catch (err) {
            logger.error(`Patch by ${patch.plugin} errored on ${id}: ${String(match)}`, err);
            if (IS_DEV) logPatchDiff(state.code, newCode, match);

            if (patch.group) return undoGroup(id, patch, previous);
        }
    }

    return state;
}

function undoGroup(id: string, patch: Patch, previous: PatchState) {
    logger.warn(`Undoing patch group by ${patch.plugin} on ${id}`);
    return previous;
}

function logPatchDiff(before: string, after: string, match: string | RegExp) {
    const index = typeof match === 'string' ? before.indexOf(match) : before.search(match);
    const start = Math.max(0, index - 150);
    const sizeChange = after.length - before.length;
    const end = index + 300;

    logger.errorCustomFmt(...Logger.makeTitle('white', 'Before'), before.slice(start, end));
    logger.errorCustomFmt(
        ...Logger.makeTitle('white', 'After'),
        after.slice(start, end + sizeChange)
    );
}

/** The source of a module's factory, as WhatsApp defined it */
export function getModuleSource(id: string) {
    const factory = originalFactories.get(id) ?? getModulesMap()?.[id]?.factory;
    return factory ? Function.prototype.toString.call(factory) : null;
}

/** Ids of all modules whose original source contains all the given code */
export function findModuleIds(...code: CodeFilter) {
    const canonical = code.map(canonicalizeMatch);
    const ids: string[] = [];
    for (const [id, factory] of originalFactories)
        if (stringMatches(Function.prototype.toString.call(factory), canonical)) ids.push(id);
    return ids;
}
