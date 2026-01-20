import type { ModId, ModMetadata, JsModulesMap, ReadyJsModule, JsModule } from '../types';

export const findModule = async <Exports extends object = object>(
    modules: JsModulesMap,
    ...predicates: ((module: ReadyJsModule<Exports>) => boolean)[]
): Promise<ReadyJsModule<Exports> | null> => {
    const checkModules = () => {
        let foundMatch: ReadyJsModule<Exports> | null = null;
        let allModulesLoaded = true;

        for (const id in modules) {
            const module = modules[id] as JsModule<Exports> | null;
            if (!module) continue;

            if (!module.exports) allModulesLoaded = false;
            else if (
                module.exports &&
                predicates.every((predicate) => predicate(module as ReadyJsModule<Exports>))
            )
                foundMatch = module as ReadyJsModule<Exports>;
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

export const byId =
    (id: string) =>
    (module: ReadyJsModule): boolean =>
        module.id === id;

export const byExports =
    (...exports: string[]) =>
    (module: ReadyJsModule): boolean =>
        exports.every((exportName) => exportName in module.exports);

export const modMetadata = (metadata: OmitFix<ModMetadata, 'id'>): ModMetadata => ({
    id: metadata.name.trim().toLowerCase().replaceAll(' ', '-') as ModId,
    name: metadata.name.trim(),
    description: metadata.description.trim(),
    version: metadata.version
});
