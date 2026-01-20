import { modMetadata, type Mod, withDependencies } from '@lib/mods';
import { react } from '@lib/mods/dependencies';

const METADATA = modMetadata({
    name: 'Test Mod',
    description: 'This is a test mod for demonstration purposes.',
    version: '1.0.0'
});

export default {
    ...METADATA,
    handler: withDependencies(react)(async ({ React }) => {
        console.warn(React);
    })
} satisfies Mod;
