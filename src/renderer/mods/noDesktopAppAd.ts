import { taggedLogger } from '@common/logger';
import type { Mod } from '@lib';
import { byId, findModule, modMetadata } from '@lib';

const MODULE_ID = 'WAWebDesktopUpsellUtils' as const;
type Exports = {
    getUserDesktopOs: () => string | null;
};

const METADATA = modMetadata({
    name: 'No Desktop App Ad',
    description: 'Removes the desktop app advertisement banner.',
    version: '1.0.0'
});

const logger = taggedLogger(METADATA.id);

const mod = {
    ...METADATA,
    execute: async (modules) => {
        const module = await findModule<Exports>(modules, byId(MODULE_ID));
        if (!module) return logger.error(`Module ${MODULE_ID} not found`);

        module.exports.getUserDesktopOs = () => null;
    }
} satisfies Mod;

export default mod;
