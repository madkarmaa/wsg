import type { ModId, ModMetadata, ModulesMap, ReadyWebpackModule, WebpackModule } from '../types';

export const findModule = async <Exports extends object = object>(
    modules: ModulesMap,
    predicate: (module: ReadyWebpackModule<Exports>) => boolean
): Promise<ReadyWebpackModule<Exports> | null> => {
    const checkModules = () => {
        let foundMatch: ReadyWebpackModule<Exports> | null = null;
        let allModulesLoaded = true;

        for (const id in modules) {
            const module = modules[id] as WebpackModule<Exports> | null;
            if (!module) continue;

            if (!module.exports) allModulesLoaded = false;
            else if (module.exports && predicate(module as ReadyWebpackModule<Exports>))
                foundMatch = module as ReadyWebpackModule<Exports>;
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

export const modMetadata = (metadata: OmitFix<ModMetadata, 'id'>): ModMetadata => ({
    id: metadata.name.trim().toLowerCase().replaceAll(' ', '-') as ModId,
    name: metadata.name.trim(),
    description: metadata.description.trim(),
    version: metadata.version
});
