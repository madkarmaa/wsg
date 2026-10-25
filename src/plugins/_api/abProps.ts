import { getABPropOverride } from '@api/ABProps';
import { Devs } from '@utils/constants';
import definePlugin from '@utils/types';

export default definePlugin({
    name: 'ABPropsAPI',
    description: 'API to override A/B test props. Required by plugins that unlock gated features.',
    authors: [Devs.madkarma],
    hidden: true,

    patches: [
        {
            module: 'WAWebABProps',
            replacement: {
                // function m(t){var n,a=o("WAWebABPropsConfigs").ABPropConfigs[t]; ...
                match: /function \i\((\i)\)\{(?=var \i,\i=\i\("WAWebABPropsConfigs"\)\.ABPropConfigs\[\1\])/,
                replace:
                    '$&var wsgOverride=$self.getOverride($1);if(wsgOverride!==void 0)return wsgOverride;'
            }
        }
    ],

    getOverride: getABPropOverride
});
