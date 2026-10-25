import {
    getDependents,
    isPluginEnabled,
    pluginRequiresRestart,
    startDependenciesRecursive,
    startPlugin,
    stopPlugin
} from '@api/PluginManager';
import { Settings, useSettings } from '@api/Settings';
import { showToast } from '@api/Toasts';
import { findIcon, Switch, Text, useState } from '@modules/common';
import { Logger } from '@utils/Logger';
import type { Plugin } from '@utils/types';
import { isSettingHidden, PluginSettings } from './PluginSettings';

const logger = new Logger('PluginCard');

/** Toggles a plugin, starting or stopping it right away when possible. Returns whether a reload is needed */
function togglePlugin(plugin: Plugin, enabled: boolean) {
    const settings = Settings.plugins[plugin.name];

    if (enabled) {
        const { restartNeeded, failures } = startDependenciesRecursive(plugin);
        if (failures.length) {
            logger.error(`Failed to start dependencies of ${plugin.name}:`, failures);
            showToast(`Failed to start dependencies of ${plugin.name}: ${failures.join(', ')}`);
            return false;
        }

        settings.enabled = true;
        if (restartNeeded || pluginRequiresRestart(plugin)) return true;
        if (!startPlugin(plugin)) showToast(`Failed to start ${plugin.name}, check the console`);
        return false;
    }

    settings.enabled = false;
    if (pluginRequiresRestart(plugin)) return true;
    if (plugin.started && !stopPlugin(plugin))
        showToast(`Failed to stop ${plugin.name}, check the console`);
    return false;
}

interface PluginCardProps {
    plugin: Plugin;
    onRestartNeeded(pluginName: string): void;
}

export function PluginCard({ plugin, onRestartNeeded }: PluginCardProps) {
    useSettings([`plugins.${plugin.name}.enabled`]);
    const [expanded, setExpanded] = useState(false);

    const enabled = isPluginEnabled(plugin.name);
    const dependents = getDependents(plugin.name);
    const lockReason = plugin.required
        ? 'Required by WSG'
        : dependents.length
          ? `Required by ${dependents.join(', ')}`
          : null;

    const hasSettings =
        plugin.settings != null &&
        (plugin.settingsAboutComponent != null ||
            Object.values(plugin.settings.def).some((def) => !isSettingHidden(def)));

    const SettingsIcon = findIcon('IcSettings');

    return (
        <div className="wsg-plugin-card">
            <div className="wsg-plugin-header">
                <div className="wsg-plugin-info">
                    <Text type="Body1Emphasized">{plugin.name}</Text>
                    <Text type="Body2" colorName="contentDeemphasized">
                        {plugin.description}
                    </Text>
                    {lockReason && (
                        <Text type="Body3" colorName="contentDeemphasized">
                            {lockReason}
                        </Text>
                    )}
                </div>

                {hasSettings && (
                    <button
                        type="button"
                        className="wsg-icon-button"
                        aria-label={`${plugin.name} settings`}
                        aria-expanded={expanded}
                        title="Settings"
                        disabled={!enabled}
                        onClick={() => setExpanded((e) => !e)}
                    >
                        {SettingsIcon ? <SettingsIcon width={20} height={20} /> : '⚙'}
                    </button>
                )}

                <Switch
                    value={enabled}
                    disabled={lockReason != null}
                    aria-label={`Enable ${plugin.name}`}
                    onChange={(value) => {
                        if (togglePlugin(plugin, value)) onRestartNeeded(plugin.name);
                    }}
                />
            </div>

            {expanded && enabled && (
                <PluginSettings
                    plugin={plugin}
                    onRestartNeeded={() => onRestartNeeded(plugin.name)}
                />
            )}
        </div>
    );
}
