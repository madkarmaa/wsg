import type { ModId, ModMetadata, ModulesMap, WebpackModule } from '../types';

export const findModule = async <T extends object = object>(
    modules: ModulesMap,
    query: (module: WebpackModule<T>) => boolean
): Promise<WebpackModule<T> | null> => {
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
};

export const modMeta = (metadata: OmitFix<ModMetadata, 'id'>): ModMetadata => ({
    id: metadata.name.trim().toLowerCase().replaceAll(' ', '-') as ModId,
    name: metadata.name.trim(),
    description: metadata.description.trim(),
    version: metadata.version
});
