import { useEffect } from '@modules/common/react';
import {
    type DefaultValueContext,
    SettingsStore as SettingsStoreClass
} from '@shared/SettingsStore';
import { SETTINGS_KEY } from '@utils/constants';
import { Logger } from '@utils/Logger';
import { useForceUpdater } from '@utils/react';
import type { DefinedSettings, SettingsDefinition, SettingsValues } from '@utils/types';

const logger = new Logger('Settings', '#a6d189');

export interface PluginSettings {
    enabled: boolean;
    [setting: string]: unknown;
}

export interface Settings {
    plugins: Record<string, PluginSettings>;
}

const DEFAULT_SETTINGS: Settings = {
    plugins: {}
};

function loadSettings(): Settings {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        return { ...structuredClone(DEFAULT_SETTINGS), ...parsed };
    } catch (err) {
        logger.error('Failed to load settings, falling back to defaults', err);
        return structuredClone(DEFAULT_SETTINGS);
    }
}

function saveSettings(settings: Settings) {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (err) {
        logger.error('Failed to save settings', err);
    }
}

type DefaultsResolver = (ctx: DefaultValueContext) => unknown;
let resolvePluginDefault: DefaultsResolver | undefined;

/** Lets the plugin manager supply default values for plugin settings, which only it knows */
export function _setPluginDefaultsResolver(resolver: DefaultsResolver) {
    resolvePluginDefault = resolver;
}

export const SettingsStore = new SettingsStoreClass<Settings>(loadSettings(), (ctx) => {
    if (!resolvePluginDefault || !ctx.path.startsWith('plugins')) return ctx.target[ctx.key];

    const value = resolvePluginDefault(ctx);
    // persist resolved defaults in memory, so later reads (and plain) see them
    if (value !== undefined) ctx.target[ctx.key] = value;
    return value;
});

SettingsStore.addGlobalChangeListener((root) => saveSettings(root));

/** The settings, deeply reactive. Writes are persisted and notify listeners */
export const Settings = SettingsStore.store;

/**
 * The raw settings object. Treat it as read-only: writes are neither persisted nor notified.
 * Unlike {@link Settings}, defaults of unset values are not resolved.
 */
export const PlainSettings = SettingsStore.plain;

/**
 * React hook returning the settings store, re-rendering when one of the given paths change.
 * Paths ending in `.*` match everything below them. Without paths, re-renders on any change.
 */
export function useSettings(paths?: string[]) {
    const forceUpdate = useForceUpdater();

    useEffect(() => {
        if (!paths) {
            SettingsStore.addGlobalChangeListener(forceUpdate);
            return () => SettingsStore.removeGlobalChangeListener(forceUpdate);
        }

        for (const path of paths) {
            if (path.endsWith('.*'))
                SettingsStore.addPrefixChangeListener(path.slice(0, -2), forceUpdate);
            else SettingsStore.addChangeListener(path, forceUpdate);
        }

        return () => {
            for (const path of paths) {
                if (path.endsWith('.*'))
                    SettingsStore.removePrefixChangeListener(path.slice(0, -2), forceUpdate);
                else SettingsStore.removeChangeListener(path, forceUpdate);
            }
        };
    }, [paths?.join()]);

    return Settings;
}

export function definePluginSettings<
    D extends SettingsDefinition,
    Private extends object = Record<never, never>
>(def: D): DefinedSettings<D, Private> {
    type Values = SettingsValues<D> & Private;

    // values are typed by their definitions; missing ones resolve to their defaults through the store
    const getPluginSettings = (settings: Settings) => {
        if (!definedSettings.pluginName)
            throw new Error('Cannot access settings before plugin init');
        return settings.plugins[definedSettings.pluginName] as unknown as Values;
    };

    const definedSettings: DefinedSettings<D, Private> = {
        def,
        pluginName: '',
        get store() {
            return getPluginSettings(Settings);
        },
        get plain() {
            return getPluginSettings(PlainSettings);
        },
        use(keys) {
            const prefix = `plugins.${definedSettings.pluginName}`;
            return getPluginSettings(
                useSettings(keys ? keys.map((key) => `${prefix}.${key}`) : [`${prefix}.*`])
            );
        },
        withPrivateSettings<T extends object>() {
            return this as unknown as DefinedSettings<D, T>;
        }
    };

    return definedSettings;
}

/** Moves a plugin's settings over from its previous name(s) */
export function migratePluginSettings(name: string, ...oldNames: string[]) {
    const { plugins } = PlainSettings;
    if (name in plugins) return;

    for (const oldName of oldNames) {
        if (!(oldName in plugins)) continue;

        logger.info(`Migrating settings from ${oldName} to ${name}`);
        plugins[name] = plugins[oldName];
        delete plugins[oldName];
        SettingsStore.markAsChanged();
        break;
    }
}
