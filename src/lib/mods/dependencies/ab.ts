import { patchModule } from '@lib/modules';
import { type ModDependency } from '@lib/mods';

export const ABFlags = (() => {
    const flagOverwrites = new Map<string, unknown>();
    const overwriteABFlag = (id: string, value: unknown) => flagOverwrites.set(id.trim(), value);

    patchModule<{
        getABPropConfigValue: (id: string) => unknown;
    }>('WAWebABProps', (exports) => {
        const og = exports.getABPropConfigValue;
        exports.getABPropConfigValue = (id: string) => {
            if (flagOverwrites.has(id)) return flagOverwrites.get(id);
            return og(id);
        };
    });

    return { overwriteABFlag };
}) satisfies ModDependency;
