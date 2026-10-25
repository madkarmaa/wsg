import { removeABPropOverride, setABPropOverride } from '@api/ABProps';
import { Devs } from '@utils/constants';
import definePlugin, { StartAt } from '@utils/types';

const CALLING_PROPS = [
    'enable_web_calling',
    'enable_web_group_calling',
    'enable_web_calls_tab',
    'enable_web_call_link'
];

export default definePlugin({
    name: 'EnableCalls',
    description: 'Enables voice and video calls, group calls, call links and the calls tab.',
    authors: [Devs.madkarma],
    dependencies: ['ABPropsAPI'],
    enabledByDefault: true,
    // WhatsApp reads these props while booting
    startAt: StartAt.Init,
    requiresRestart: true,

    start() {
        for (const prop of CALLING_PROPS) setABPropOverride(prop, true);
    },

    stop() {
        for (const prop of CALLING_PROPS) removeABPropOverride(prop);
    }
});
