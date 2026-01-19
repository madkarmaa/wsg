export type WebpackModule<T extends object = object> = {
    id: string;
    exports: T | null;
    defaultExport?: 'default' extends keyof T ? T['default'] : undefined;
    [key: string]: unknown;
};

export type ModulesMap = Record<string, WebpackModule | null>;

export async function findModule<T extends object = object>(
    modules: ModulesMap,
    query: (module: WebpackModule<T>) => boolean
): Promise<WebpackModule<T> | null> {
    const checkModules = () => {
        let foundMatch: WebpackModule<T> | null = null;
        let allModulesLoaded = true;

        for (const id in modules) {
            const module = modules[id] as WebpackModule<T> | null;
            if (!module) continue;

            if (!module.exports) allModulesLoaded = false;
            else if (query(module)) foundMatch = module;
        }

        return { foundMatch, allModulesLoaded };
    };

    while (true) {
        const { foundMatch, allModulesLoaded } = checkModules();

        if (foundMatch) return foundMatch;
        if (allModulesLoaded) return null;

        await new Promise((resolve) => setTimeout(resolve, 100));
    }
}
