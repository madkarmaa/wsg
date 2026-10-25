/** Module exports are opaque until a finder's caller states what it expects */
export type ModuleExports = unknown;

export type ModuleFactory = (...args: unknown[]) => unknown;

/** An entry of WhatsApp's module registry, `require('__debug').modulesMap` */
export interface ModuleRecord {
    id: string;
    exports: ModuleExports;
    defaultExport: ModuleExports;
    /** Null once the module has been initialised */
    factory: ModuleFactory | null;
    factoryFinished: boolean;
    hasError: boolean;
    dependencies: unknown[] | null;
}

export type ModulesMap = Record<string, ModuleRecord | null | undefined>;

export type FilterFn = (exports: ModuleExports) => boolean;

export type ModuleCallback<T = ModuleExports> = (exports: T, id: string) => void;
