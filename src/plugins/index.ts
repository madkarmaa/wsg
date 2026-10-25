import { Logger } from '@utils/Logger';
import type { Plugin } from '@utils/types';

const logger = new Logger('Plugins');

/**
 * Every plugin, by name. Plugins are discovered at build time from:
 * - `plugins/<name>.ts(x)` or `plugins/<name>/index.ts(x)`
 * - the same inside `plugins/_api` (APIs used by other plugins) and `plugins/_core` (WSG itself)
 */
const plugins: Record<string, Plugin> = {};

const context = import.meta.webpackContext('./', {
    recursive: true,
    regExp: /^\.\/(?:_api\/|_core\/)?[^/_][^/]*(?:\/index)?\.tsx?$/
});

for (const path of context.keys()) {
    if (path === './index.ts') continue;

    const plugin = (context(path) as { default?: Plugin }).default;
    if (!plugin?.name) {
        logger.error(`${path} has no default exported plugin`);
        continue;
    }

    if (plugin.name in plugins) {
        logger.error(`Duplicate plugin name ${plugin.name} (${path})`);
        continue;
    }

    plugin.started = false;
    plugins[plugin.name] = plugin;
}

export default plugins;
