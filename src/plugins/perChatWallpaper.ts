import { removeABPropOverride, setABPropOverride } from '@api/ABProps';
import { Devs } from '@utils/constants';
import definePlugin, { StartAt } from '@utils/types';

const PROP = 'use_per_chat_wallpaper';

export default definePlugin({
    name: 'PerChatWallpaper',
    description: 'Allows setting a different wallpaper for each chat.',
    authors: [Devs.madkarma],
    dependencies: ['ABPropsAPI'],
    enabledByDefault: true,
    startAt: StartAt.Init,
    requiresRestart: true,

    start() {
        setABPropOverride(PROP, true);
    },

    stop() {
        removeABPropOverride(PROP);
    }
});
