export type WebpackModule<Exports extends object = object> = {
    id: string;
    exports: Exports | null;
    defaultExport?: 'default' extends keyof Exports ? Exports['default'] : object;
    [key: string]: unknown;
};

export type ReadyWebpackModule<Exports extends object = object> = Required<
    WebpackModule<Exports>
> & {
    exports: Exports;
};

export type ModulesMap = Record<string, WebpackModule | null>;

export type ModId = Brand<string, 'mod-id'>;

export type ModMetadata = {
    id: ModId;
    name: string;
    description: string;
    version: `${number}.${number}.${number}`;
};

export type Mod = ModMetadata & {
    execute: (modules: ModulesMap) => MaybePromise<void>;
};
