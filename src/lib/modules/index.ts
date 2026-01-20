import type { JsModulesMap, ReadyJsModule, JsModule } from '@lib/types';
import { type JsModuleFinder } from './finders';

export const findModule = async <Exports extends object = object>(
    modules: JsModulesMap,
    ...finders: JsModuleFinder[]
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
                finders.every((predicate) => predicate(module as ReadyJsModule))
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
