export type JsModuleFactory = (...args: unknown[]) => unknown;

type JsModuleBase = { id: string; [key: string]: unknown };

export type JsModule = JsModuleBase & {
    exports: null;
    factory: JsModuleFactory;
};

export type ReadyJsModule<Exports extends object = object> = JsModuleBase & {
    exports: Exports;
    factory: null;
};

export type JsModulesMap = Record<string, JsModule | null>;
