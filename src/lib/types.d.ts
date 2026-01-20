export type JsModule<Exports extends object = object> = {
    id: string;
    exports: Exports | null;
    defaultExport?: 'default' extends keyof Exports ? Exports['default'] : object;
    [key: string]: unknown;
};

export type ReadyJsModule<Exports extends object = object> = Required<JsModule<Exports>> & {
    exports: Exports;
};

export type JsModulesMap = Record<string, JsModule | null>;

export type ModId = Brand<string, 'mod-id'>;

export type ModMetadata = {
    id: ModId;
    name: string;
    description: string;
    version: `${number}.${number}.${number}`;
};

export type Mod = ModMetadata & {
    execute: (modules: JsModulesMap) => MaybePromise<void>;
};
