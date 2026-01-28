import { modMetadata, withDependencies, type Mod } from '@lib/mods';
import { abFlags } from '@lib/mods/dependencies/ab';

const METADATA = modMetadata({
    name: 'AB Testing Overwrites',
    description: 'Overwrites specific A/B testing flags.',
    version: '1.0.0'
});

export default {
    ...METADATA,
    handler: withDependencies(abFlags)(({ overwriteABFlag }) => {
        overwriteABFlag('use_per_chat_wallpaper', true);
    })
} satisfies Mod;
