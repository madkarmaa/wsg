import { byId } from '@lib/modules/finders';
import { findModule } from '@lib/modules';
import { modMetadata, type Mod } from '@lib/mods';

const MODULE_ID = 'WAWebDesktopUpsellUtils' as const;
type Exports = {
    getUserDesktopOs: () => string | null;
};

const METADATA = modMetadata({
    name: 'No Desktop App Ad',
    description: 'Removes the desktop app advertisement banner.',
    version: '1.0.0'
});

export default {
    ...METADATA,
    handler: async ({ modules }) => {
        const module = await findModule<Exports>(modules, byId(MODULE_ID));
        if (!module) throw new Error(`Module ${MODULE_ID} not found`);

        module.exports.getUserDesktopOs = () => null;
    }
} satisfies Mod;
