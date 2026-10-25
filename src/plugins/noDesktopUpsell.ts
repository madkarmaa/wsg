import { Devs } from '@utils/constants';
import definePlugin from '@utils/types';

export default definePlugin({
    name: 'NoDesktopUpsell',
    description: 'Hides the prompts to download the WhatsApp desktop app.',
    authors: [Devs.madkarma],
    enabledByDefault: true,

    patches: [
        {
            module: 'WAWebDesktopUpsellUtils',
            replacement: {
                // upsells are only shown when the user's desktop OS is known
                match: /(\i\.getUserDesktopOs=)\i/,
                replace: '$1()=>null'
            }
        }
    ]
});
