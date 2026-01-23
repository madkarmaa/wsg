import { APP_NAME, type WA_DEFINE_METHOD, type WA_D_METHOD } from '@common/constants';
import { type ReactRef } from '@lib/hook/react';

export type JsModuleFactory = (...args: unknown[]) => unknown;

export type JsModule<Exports extends object = object> = {
    id: string;
    exports: Exports | null;
    defaultExport?: 'default' extends keyof Exports ? Exports['default'] : object;
    factory?: JsModuleFactory;
    [key: string]: unknown;
};

export type ReadyJsModule<Exports extends object = object> = Required<JsModule<Exports>> & {
    exports: Exports;
};

export type JsModulesMap = Record<string, JsModule | null>;

declare global {
    interface Window {
        [WA_D_METHOD]: (...args: unknown[]) => void;
        [WA_DEFINE_METHOD]: ((...args: unknown[]) => void) & { amd: object };
        [APP_NAME]: {
            ReactCreateElement: ReactRef['createElement'];
            ReactFragment: ReactRef['Fragment'];
        };
    }
}
