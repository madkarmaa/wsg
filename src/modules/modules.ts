import { isFunction, isIndexable } from '@utils/guards';
import { proxyLazy } from '@utils/lazy';
import { Logger } from '@utils/Logger';
import { canonicalizeMatch } from '@utils/patches';
import type { ComponentType } from 'react';
import type { FilterFn, ModuleCallback, ModuleExports, ModulesMap } from './types';

// Finders return whatever the module exports; the type parameter is the caller's assertion of its shape

const logger = new Logger('Modules', '#ef9f76');

let resolveReady: () => void = () => {};
/** Resolves once WhatsApp's core modules (React, ReactDOM) have loaded */
export const onceReady = new Promise<void>((resolve) => (resolveReady = resolve));
export const _resolveReady = () => resolveReady();

/** Called with the exports of every module, right after its factory ran */
export const moduleListeners = new Set<ModuleCallback>();
/** One-shot subscriptions fired by the first module (or module export) matching the filter */
export const waitForSubscriptions = new Map<FilterFn, ModuleCallback>();
/** One-shot subscriptions fired once the module with the given id has loaded */
export const moduleIdSubscriptions = new Map<string, ModuleCallback[]>();

export function getModulesMap(): ModulesMap | null {
    try {
        const debug = window.require?.('__debug');
        return isIndexable(debug) && isIndexable(debug.modulesMap)
            ? (debug.modulesMap as ModulesMap)
            : null;
    } catch {
        return null;
    }
}

export type CodeFilter = (string | RegExp)[];

export const stringMatches = (str: string, code: CodeFilter) =>
    code.every((c) => (typeof c === 'string' ? str.includes(c) : ((c.lastIndex = 0), c.test(str))));

export const filters = {
    byProps:
        (...props: string[]): FilterFn =>
        (m) =>
            isIndexable(m) && props.every((p) => m[p] !== undefined),

    byCode: (...code: CodeFilter): FilterFn => {
        const canonical = code.map(canonicalizeMatch);
        return (m) =>
            isFunction(m) && stringMatches(Function.prototype.toString.call(m), canonical);
    },

    /** WhatsApp components carry a displayName like `S [from WAWebIntroPanelV2.react]` */
    byDisplayName:
        (name: string): FilterFn =>
        (m) =>
            isIndexable(m) &&
            typeof m.displayName === 'string' &&
            (m.displayName === name || m.displayName.endsWith(`[from ${name}]`)),

    /** Matches function components, unwrapping memo and forwardRef */
    componentByCode: (...code: CodeFilter): FilterFn => {
        const byCode = filters.byCode(...code);
        return (m) => {
            for (let inner: unknown = m; isIndexable(inner); inner = inner.type ?? inner.render) {
                if (byCode(inner)) return true;
                if (!inner.$$typeof) return false;
            }
            return false;
        };
    }
};

function* loadedModules(): Generator<[string, ModuleExports]> {
    const modulesMap = getModulesMap();
    if (!modulesMap) return;

    for (const id in modulesMap) {
        const record = modulesMap[id];
        if (record?.factoryFinished && record.exports != null) yield [id, record.exports];
    }
}

/** The exports themselves if they match, otherwise the first matching export */
function matchModule(filter: FilterFn, exports: ModuleExports, topLevelOnly: boolean): unknown {
    try {
        if (filter(exports)) return exports;
    } catch {}

    if (topLevelOnly || typeof exports !== 'object' || exports === null) return null;

    for (const key in exports) {
        try {
            const nested: unknown = (exports as Record<string, unknown>)[key];
            if (nested != null && filter(nested)) return nested;
        } catch {}
    }

    return null;
}

function handleModuleNotFound(method: string, ...filter: unknown[]) {
    logger.error(`${method} found no module. Filter:`, ...filter);
}

/** Returns the first loaded module (or module export) matching the filter */
export function find<T = ModuleExports>(
    filter: FilterFn,
    { topLevelOnly = false, isIndirect = false } = {}
): T | null {
    for (const [, exports] of loadedModules()) {
        const match = matchModule(filter, exports, topLevelOnly);
        if (match != null) return match as T;
    }

    if (!isIndirect) handleModuleNotFound('find', filter);
    return null;
}

export function findAll<T = ModuleExports>(filter: FilterFn, { topLevelOnly = false } = {}): T[] {
    const results: T[] = [];
    for (const [, exports] of loadedModules()) {
        const match = matchModule(filter, exports, topLevelOnly);
        if (match != null) results.push(match as T);
    }
    return results;
}

/**
 * Returns the exports of the module with the given id, initialising it if it was defined but not required yet.
 * Returns null if WhatsApp hasn't downloaded the module.
 */
export function findModule<T = ModuleExports>(id: string): T | null {
    const record = getModulesMap()?.[id];
    if (!record) return null;
    if (record.factoryFinished) return record.exports as T;

    try {
        return (window.require?.(id) ?? null) as T | null;
    } catch (err) {
        logger.error(`Failed to require module ${id}`, err);
        return null;
    }
}

export function findByProps<T = ModuleExports>(...props: string[]): T | null {
    const result = find<T>(filters.byProps(...props), { isIndirect: true });
    if (result == null) handleModuleNotFound('findByProps', ...props);
    return result;
}

export function findByCode<T = ModuleExports>(...code: CodeFilter): T | null {
    const result = find<T>(filters.byCode(...code), { isIndirect: true });
    if (result == null) handleModuleNotFound('findByCode', ...code);
    return result;
}

export function findComponentByCode<P extends object>(
    ...code: CodeFilter
): ComponentType<P> | null {
    const result = find<ComponentType<P>>(filters.componentByCode(...code), { isIndirect: true });
    if (result == null) handleModuleNotFound('findComponentByCode', ...code);
    return result;
}

export const findLazy = <T extends object>(filter: FilterFn) => proxyLazy(() => find<T>(filter));

export const findModuleLazy = <T extends object>(id: string) => proxyLazy(() => findModule<T>(id));

export const findByPropsLazy = <T extends object>(...props: string[]) =>
    proxyLazy(() => findByProps<T>(...props));

export const findByCodeLazy = <T extends object>(...code: CodeFilter) =>
    proxyLazy(() => findByCode<T>(...code));

/**
 * Calls the callback with the first module matching the filter, or with the module with the given id.
 * If no such module has loaded yet, the callback runs synchronously right after it does,
 * before any other module can use it.
 */
export function waitFor<T = ModuleExports>(filter: FilterFn | string, callback: ModuleCallback<T>) {
    const untypedCallback: ModuleCallback = (exports, id) => callback(exports as T, id);

    if (typeof filter === 'string') {
        const record = getModulesMap()?.[filter];
        if (record?.factoryFinished) return untypedCallback(record.exports, filter);

        const subscriptions = moduleIdSubscriptions.get(filter) ?? [];
        subscriptions.push(untypedCallback);
        moduleIdSubscriptions.set(filter, subscriptions);
        return;
    }

    for (const [id, exports] of loadedModules()) {
        const match = matchModule(filter, exports, false);
        if (match != null) return untypedCallback(match, id);
    }

    waitForSubscriptions.set(filter, untypedCallback);
}

export const waitForModule = <T = ModuleExports>(filter: FilterFn | string) =>
    new Promise<T>((resolve) => waitFor<T>(filter, resolve));

/** Runs the callbacks subscribed to a module that just finished loading */
export function _notifyModuleLoaded(id: string, exports: ModuleExports) {
    if (exports == null) return;

    for (const listener of moduleListeners) {
        try {
            listener(exports, id);
        } catch (err) {
            logger.error('Error in module listener', err);
        }
    }

    const idSubscriptions = moduleIdSubscriptions.get(id);
    if (idSubscriptions) {
        moduleIdSubscriptions.delete(id);
        for (const callback of idSubscriptions) {
            try {
                callback(exports, id);
            } catch (err) {
                logger.error(`Error in waitFor callback for module ${id}`, err);
            }
        }
    }

    for (const [filter, callback] of waitForSubscriptions) {
        const match = matchModule(filter, exports, false);
        if (match == null) continue;

        waitForSubscriptions.delete(filter);
        try {
            callback(match, id);
        } catch (err) {
            logger.error('Error in waitFor callback', err, filter);
        }
    }
}

type RequireLazy = NonNullable<Window['requireLazy']>;

let runtimeRequireLazy: RequireLazy | undefined;
const requireLazyQueue: Parameters<RequireLazy>[] = [];

/** Captures WhatsApp's `requireLazy` as soon as it is defined, flushing calls made before that */
export function _installRequireLazyHook() {
    const install = (fn: RequireLazy) => {
        runtimeRequireLazy = fn;
        for (const args of requireLazyQueue.splice(0)) fn(...args);
    };

    if (typeof window.requireLazy === 'function') return install(window.requireLazy);

    Object.defineProperty(window, 'requireLazy', {
        configurable: true,
        enumerable: true,
        get: () => runtimeRequireLazy,
        set: install
    });
}

/**
 * Loads the given modules, downloading them if necessary, and resolves with their exports.
 * The type parameter asserts the shape of each module's exports, in order.
 */
export function requireModules<T extends ModuleExports[] = ModuleExports[]>(...ids: string[]) {
    return new Promise<T>((resolve) => {
        const callback = (...modules: ModuleExports[]) => resolve(modules as T);
        if (runtimeRequireLazy) runtimeRequireLazy(ids, callback);
        else requireLazyQueue.push([ids, callback]);
    });
}
