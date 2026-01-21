import { taggedLogger } from '@common/logger';
import { WHATSAPP_DEBUG_MODULE } from '@common/constants';
import type { JsModule, JsModulesMap, JsModuleFactory } from '@lib/types';

const logger = taggedLogger('hook');

export type PatchCallback<T extends object = object> = (exports: T) => void;

const patches = new Map<string, PatchCallback[]>();

const applyPatches = (moduleId: string, exports: object) => {
    const callbacks = patches.get(moduleId);
    if (!callbacks) return;

    callbacks.forEach((callback) => {
        try {
            callback(exports);
            logger.info(`Patched module ${moduleId} successfully`);
        } catch (err) {
            logger.error(`Error patching module ${moduleId}`, err);
        }
    });
};

const wrapFactory = (moduleId: string, factory: JsModuleFactory): JsModuleFactory =>
    function (this: unknown, ...args: unknown[]) {
        const ret = factory.apply(this, args);

        let moduleObj: JsModule | null = null;

        for (const arg of args)
            if (
                arg &&
                typeof arg === 'object' &&
                (arg as JsModule).id === moduleId &&
                'exports' in arg
            ) {
                moduleObj = arg as JsModule;
                break;
            }

        if (moduleObj && moduleObj.exports) applyPatches(moduleId, moduleObj.exports);

        return ret;
    };

const latePatch = (map: JsModulesMap, moduleId: string, callback: PatchCallback) => {
    if (!map) return false;
    const mod = map[moduleId];

    if (!mod || !mod.exports) return false;

    try {
        // If the module has exports, apply the patch
        callback(mod.exports);
        logger.info(`Late-patched module ${moduleId} successfully`);
        return true;
    } catch (err) {
        logger.error(`Error late-patching module ${moduleId}`, err);
        return true; // We found it, but it errored. Still counts as found.
    }
};

export const registerPatch = (moduleId: string, callback: PatchCallback) => {
    if (!patches.has(moduleId)) patches.set(moduleId, []);
    patches.get(moduleId)!.push(callback);

    // Attempt late patching via debug module if available
    if (window.require) {
        try {
            const debug = window.require(WHATSAPP_DEBUG_MODULE) as
                | { modulesMap: JsModulesMap }
                | undefined;
            if (debug && latePatch(debug.modulesMap, moduleId, callback)) return;
        } catch {
            // ignore
        }
    }

    logger.info(`Registered patch for ${moduleId}, waiting for definition...`);
};

export const hookModuleLoader = () => {
    logger.info('Initializing module loader hook...');

    const hookFunc =
        (original: Window['__d']): Window['__d'] =>
        (...args) => {
            const moduleId = args.find((arg): arg is string => typeof arg === 'string');
            const factoryIndex = args.findIndex((arg) => typeof arg === 'function');

            if (moduleId && factoryIndex !== -1) {
                let factory = args[factoryIndex] as JsModuleFactory;
                if (patches.has(moduleId)) {
                    factory = wrapFactory(moduleId, factory);
                    const newArgs = [...args];
                    newArgs[factoryIndex] = factory;
                    return original.apply(window, newArgs);
                }
            }

            return original.apply(window, args);
        };

    if (window.__d) {
        window.__d = hookFunc(window.__d);
        logger.info('Hooked existing window.__d');
    } else {
        let _d: Window['__d'];
        Object.defineProperty(window, '__d', {
            configurable: true,
            enumerable: true,
            get: () => _d,
            set: (value) => {
                _d = hookFunc(value);
                logger.info('Hooked new window.__d assignment');
            }
        });
    }
};
