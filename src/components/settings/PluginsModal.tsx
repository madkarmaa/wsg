import { plugins } from '@api/PluginManager';
import { showToast } from '@api/Toasts';
import { Button, ConfirmPopup, ModalManager, Text, useMemo, useState } from '@modules/common';
import { requireModules } from '@modules/modules';
import { APP_NAME } from '@utils/constants';
import { Logger } from '@utils/Logger';
import type { Plugin } from '@utils/types';
import { PluginCard } from './PluginCard';

const logger = new Logger('PluginsModal');

/** Plugins toggled this session whose changes only apply after a reload. Survives reopening the modal */
const pendingRestart = new Set<string>();

const matchesSearch = (plugin: Plugin, query: string) =>
    [plugin.name, plugin.description, ...(plugin.searchTerms ?? [])].some((text) =>
        text.toLowerCase().includes(query)
    );

function PluginsModal() {
    const [query, setQuery] = useState('');
    const [restartNeeded, setRestartNeeded] = useState(() => [...pendingRestart]);

    const visiblePlugins = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        return Object.values(plugins)
            .filter((p) => !p.hidden && matchesSearch(p, normalized))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [query]);

    const handleRestartNeeded = (name: string) => {
        pendingRestart.add(name);
        setRestartNeeded([...pendingRestart]);
    };

    return (
        <ConfirmPopup title={`${APP_NAME} Plugins`} okText="Done" onOK={() => ModalManager.close()}>
            <div className="wsg-plugins">
                <input
                    className="wsg-input"
                    type="search"
                    placeholder="Search plugins"
                    aria-label="Search plugins"
                    value={query}
                    onChange={(e) => setQuery(e.currentTarget.value)}
                />

                {restartNeeded.length > 0 && (
                    <div className="wsg-notice" role="status">
                        <Text type="Body2">
                            Reload WhatsApp to apply your changes to {restartNeeded.join(', ')}
                        </Text>
                        <Button
                            label="Reload"
                            variant="filled"
                            size="small"
                            onPress={() => location.reload()}
                        />
                    </div>
                )}

                <div className="wsg-plugin-list">
                    {visiblePlugins.map((plugin) => (
                        <PluginCard
                            key={plugin.name}
                            plugin={plugin}
                            onRestartNeeded={handleRestartNeeded}
                        />
                    ))}
                    {visiblePlugins.length === 0 && (
                        <Text type="Body2" colorName="contentDeemphasized">
                            No plugins match your search
                        </Text>
                    )}
                </div>
            </div>
        </ConfirmPopup>
    );
}

export async function openPluginsModal() {
    try {
        // make sure every component the modal uses is downloaded, so none of them renders empty
        await requireModules(
            'WAWebModalManager',
            'WAWebConfirmPopup.react',
            'WDSSwitch.react',
            'WDSButton.react',
            'WDSText.react'
        );
        ModalManager.open(<PluginsModal />);
    } catch (err) {
        logger.error('Failed to open the plugins modal', err);
        showToast('Failed to open the WSG settings, check the console');
    }
}
