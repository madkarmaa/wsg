import { patchModule } from '@lib/modules';
import { type ModDependency } from '@lib/mods';

export const ABFlags = (() => {
    const flagOverwrites = new Map<string, unknown>();
    const overwriteABFlag = (id: string, value: unknown) => {
        id = id.trim();
        flagOverwrites.set(id, value);
    };

    patchModule<{
        getABPropConfigValue: (id: string) => unknown;
    }>('WAWebABProps', (exports) => {
        const og = exports.getABPropConfigValue;
        exports.getABPropConfigValue = (id: string) => {
            const result = og(id);
            if (flagOverwrites.has(id)) return flagOverwrites.get(id);
            return result;
        };
    });

    return { overwriteABFlag };
}) satisfies ModDependency;
