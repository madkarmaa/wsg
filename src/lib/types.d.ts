import { type WHATSAPP_DEFINE_METHOD } from '@common/constants';

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
        [WHATSAPP_DEFINE_METHOD]: (...args: unknown[]) => void;
    }
}
