import { taggedLogger } from '@common/logger';
import type { JsModule, JsModuleFactory } from '@lib/types';
import { patches } from './state';
import { applyPatches } from './patcher';

const logger = taggedLogger('hook');

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
