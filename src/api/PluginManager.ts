import { patches } from '@modules/patcher';
import { Logger } from '@utils/Logger';
import { canonicalizePatch } from '@utils/patches';
import { OptionType, type Plugin, StartAt } from '@utils/types';
import plugins from '@plugins';
import { _setPluginDefaultsResolver, Settings, SettingsStore } from './Settings';
import { disableStyle, enableStyle } from './Styles';

export { plugins };

const logger = new Logger('PluginManager', '#a6d189');

export function isPluginEnabled(name: string) {
    const plugin = plugins[name];
    return Boolean(plugin?.required || plugin?.isDependency || Settings.plugins[name]?.enabled);
}

export function pluginRequiresRestart(plugin: Plugin) {
    return plugin.requiresRestart ?? Boolean(plugin.patches?.length);
}

function registerPatches(plugin: Plugin) {
    for (const def of plugin.patches ?? []) {
        const patch = canonicalizePatch(def, plugin.name);
        if (patch) patches.push(patch);
    }
}

/** Resolves the defaults of unset plugin settings, see {@link Settings} */
_setPluginDefaultsResolver(({ target, key, path }) => {
    if (path === 'plugins') {
        const plugin = plugins[key];
        if (plugin) return { enabled: Boolean(plugin.required || plugin.enabledByDefault) };
        return target[key];
    }

    const def = plugins[path.slice('plugins.'.length)]?.settings?.def[key];
    if (!def) return target[key];

    if ('default' in def) return def.default;
    if (def.type === OptionType.SELECT) return def.options.find((o) => o.default)?.value;

    return target[key];
});

/** Must run before WhatsApp's modules load, so patches of enabled plugins can be applied */
export function initPluginManager() {
    for (const plugin of Object.values(plugins)) {
        if (!isPluginEnabled(plugin.name)) continue;

        for (const dependency of plugin.dependencies ?? []) {
            const dep = plugins[dependency];
            if (!dep) {
                logger.warn(`${plugin.name} depends on unknown plugin ${dependency}`);
                continue;
            }
            dep.isDependency = true;
        }
    }

    for (const plugin of Object.values(plugins)) {
        if (plugin.settings) {
            plugin.settings.pluginName = plugin.name;

            for (const [key, def] of Object.entries(plugin.settings.def)) {
                if (!def.onChange) continue;

                // the store only ever holds values matching the setting's definition
                const onChange = def.onChange as unknown as (value: unknown) => void;
                SettingsStore.addChangeListener(`plugins.${plugin.name}.${key}`, onChange);
            }
        }

        if (isPluginEnabled(plugin.name)) registerPatches(plugin);
    }
}

export function startAllPlugins(target: StartAt) {
    logger.info(`Starting plugins (stage ${target})`);

    for (const plugin of Object.values(plugins))
        if (isPluginEnabled(plugin.name) && (plugin.startAt ?? StartAt.ModulesReady) === target)
            startPlugin(plugin);
}

/**
 * Enables (and starts, if possible) the dependencies of a plugin that is about to be enabled.
 * @returns whether a reload is required for all of them to take effect
 */
export function startDependenciesRecursive(plugin: Plugin): {
    restartNeeded: boolean;
    failures: string[];
} {
    let restartNeeded = false;
    const failures: string[] = [];

    for (const name of plugin.dependencies ?? []) {
        const dep = plugins[name];
        if (!dep || isPluginEnabled(name)) continue;

        const result = startDependenciesRecursive(dep);
        restartNeeded ||= result.restartNeeded;
        failures.push(...result.failures);

        dep.isDependency = true;
        Settings.plugins[name].enabled = true;

        if (pluginRequiresRestart(dep)) {
            restartNeeded = true;
            continue;
        }

        if (!startPlugin(dep)) failures.push(name);
    }

    return { restartNeeded, failures };
}

export function startPlugin(plugin: Plugin) {
    if (plugin.started) {
        logger.warn(`${plugin.name} is already started`);
        return false;
    }

    try {
        plugin.start?.();
    } catch (err) {
        logger.error(`Failed to start ${plugin.name}`, err);
        return false;
    }

    plugin.started = true;
    if (plugin.managedStyle) enableStyle(plugin.managedStyle);

    logger.debug(`Started ${plugin.name}`);
    return true;
}

export function stopPlugin(plugin: Plugin) {
    if (!plugin.started) {
        logger.warn(`${plugin.name} is already stopped`);
        return false;
    }

    try {
        plugin.stop?.();
    } catch (err) {
        logger.error(`Failed to stop ${plugin.name}`, err);
        return false;
    }

    plugin.started = false;
    if (plugin.managedStyle) disableStyle(plugin.managedStyle);

    logger.debug(`Stopped ${plugin.name}`);
    return true;
}

/** Names of the enabled plugins that depend on the given plugin */
export function getDependents(name: string) {
    return Object.values(plugins)
        .filter((p) => p.dependencies?.includes(name) && isPluginEnabled(p.name))
        .map((p) => p.name);
}
