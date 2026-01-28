import { patchModule } from '@lib/modules';
import { modMetadata, type Mod } from '@lib/mods';

const METADATA = modMetadata({
    name: 'Remove Clutter',
    description: 'Removes clutter from the app.',
    version: '1.0.0'
});

export default {
    ...METADATA,
    handler: () =>
        patchModule<{
            getUserDesktopOs: () => string | null;
        }>('WAWebDesktopUpsellUtils', (exports) => {
            exports.getUserDesktopOs = () => null;
        })
} satisfies Mod;
