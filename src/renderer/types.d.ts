export type WebpackModule<T extends object = object> = {
    id: string;
    exports: T | null;
    defaultExport?: 'default' extends keyof T ? T['default'] : object;
    [key: string]: unknown;
};

export type ModulesMap = Record<string, WebpackModule | null>;

export type ModId = Brand<string, 'mod-id'>;
export type ModMetadata = {
    id: ModId;
    name: string;
    description: string;
    version: `${number}.${number}.${number}`;
};
export type Mod = (modules: ModulesMap) => MaybePromise<ModMetadata>;
