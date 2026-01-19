import { taggedLogger } from '../../common/logger';
import type { Mod } from '../types';
import { findModule, modMetadata } from '../utils';

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
        const module = await findModule<Exports>(modules, (module) => module.id === MODULE_ID);
        if (!module) return logger.error(`Module ${MODULE_ID} not found`);

        module.exports.getUserDesktopOs = () => null;
    }
} satisfies Mod;

export default mod;
