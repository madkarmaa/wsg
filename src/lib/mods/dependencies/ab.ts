import { waitForModule } from '@lib/modules';
import { type ModDependency } from '@lib/mods';

export const abFlags = (async () => {
    const abModule = await waitForModule<{
        getABPropConfigValue: (id: string) => unknown;
    }>('WAWebABProps');

    const flagOverwrites = new Map<string, unknown>();
    const overwriteABFlag = (id: string, value: unknown) => {
        id = id.trim();
        flagOverwrites.set(id, value);
    };

    const og = abModule.getABPropConfigValue;
    abModule.getABPropConfigValue = (id: string) => {
        const result = og(id);
        if (flagOverwrites.has(id)) return flagOverwrites.get(id);
        return result;
    };

    return { overwriteABFlag };
}) satisfies ModDependency;
