import { taggedLogger } from '@common/logger';
import { WA_DEFINE_METHOD, WA_D_METHOD } from '@common/constants';
import type { JsModule, JsModuleFactory } from '@lib/types';
import { patches } from './state';
import { applyPatches } from './patcher';

const logger = taggedLogger('hook', 'loader');
type LoaderMethodName = typeof WA_D_METHOD | typeof WA_DEFINE_METHOD;

const wrapFactory = (moduleId: string, factory: JsModuleFactory): JsModuleFactory => {
    const wrapped = function (this: unknown, ...args: unknown[]) {
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

    Object.defineProperty(wrapped, 'length', { value: factory.length });
    return wrapped;
};

export const hookModuleLoader = (...debugModules: string[]) => {
    const createHook = (original: (...args: unknown[]) => void, methodName: LoaderMethodName) => {
        const hooked = function (this: unknown, ...args: unknown[]) {
            const moduleId = args.find((arg): arg is string => typeof arg === 'string');
            const factoryIndex = args.findIndex((arg) => typeof arg === 'function');

            if (moduleId && factoryIndex !== -1) {
                if (debugModules.includes(moduleId))
                    logger.debug(`called window.${methodName} for`, moduleId, args);

                let factory = args[factoryIndex] as JsModuleFactory;
                if (patches.has(moduleId)) {
                    factory = wrapFactory(moduleId, factory);
                    const newArgs = [...args];
                    newArgs[factoryIndex] = factory;
                    return original.apply(this, newArgs);
                }
            }

            return original.apply(this, args);
        };

        Object.assign(hooked, original);
        return hooked;
    };

    const attach = (methodName: LoaderMethodName) => {
        if (window[methodName]) {
            window[methodName] = createHook(window[methodName], methodName);
            logger.info(`Hooked existing window.${methodName}`);
        } else {
            let _val: unknown;
            Object.defineProperty(window, methodName, {
                configurable: true,
                enumerable: true,
                get: () => _val,
                set: (value) => {
                    _val = createHook(value, methodName);
                    logger.info(`Hooked new window.${methodName} assignment`);
                }
            });
        }
    };

    attach(WA_D_METHOD); // this seems to be the main module definition method
    attach(WA_DEFINE_METHOD); // but sometimes this one is also used for some strangely named modules
};
