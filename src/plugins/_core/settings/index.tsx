import { openPluginsModal } from '@components/settings/PluginsModal';
import styles from '@components/settings/styles';
import { findIcon, MenuItem } from '@modules/common';
import { requireModules } from '@modules/modules';
import { APP_NAME, Devs } from '@utils/constants';
import definePlugin from '@utils/types';

function SettingsMenuItem() {
    return (
        <MenuItem
            title={`${APP_NAME} Plugins`}
            Icon={findIcon('IcCode')}
            testid="wsg-settings menu-item"
            onPress={(event) => {
                event?.stopPropagation();
                openPluginsModal();
            }}
        />
    );
}

export default definePlugin({
    name: 'Settings',
    description: 'Adds the WSG plugin settings to the chat list menu.',
    authors: [Devs.madkarma],
    required: true,
    managedStyle: styles,

    patches: [
        {
            module: 'WAWebChatlistHeaderDropdown.react',
            replacement: {
                // insert our item right before the separator above "Log out"
                match: /(\i)=(\i)\.jsx\((\i)\("WDSMenuItem\.react"\),\{type:"separator"\}\)/,
                replace:
                    '$1=$2.jsxs($2.Fragment,{children:[$self.renderMenuItem(),$2.jsx($3("WDSMenuItem.react"),{type:"separator"})]})'
            }
        }
    ],

    start() {
        // icons are lazy loaded by WhatsApp, and the menu item only renders once
        requireModules('WDSIconIcCode.react', 'WDSIconIcSettings.react');
    },

    renderMenuItem: () => <SettingsMenuItem />,

    openPluginsModal
});
