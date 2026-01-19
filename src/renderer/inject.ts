import { taggedLogger } from '../common/logger';
import type { Mod, ModulesMap } from './types';

const logger = taggedLogger('inject');

async function bootstrap() {
    logger.info('Waiting for WhatsApp Web internal modules...');

    const waitForRequire = (): Promise<typeof window.require> =>
        new Promise((resolve) => {
            const check = () => {
                if (typeof window.require === 'function') resolve(window.require);
                else setTimeout(check, 100);
            };
            check();
        });

    try {
        const require = await waitForRequire();

        const getModules = () => {
            try {
                const debugModule = require('__debug');
                if (debugModule.modulesMap) return debugModule.modulesMap as ModulesMap;
                return null;
            } catch {
                return null;
            }
        };

        let modulesMap = getModules();
        while (!modulesMap) {
            await new Promise((resolve) => setTimeout(resolve, 100));
            modulesMap = getModules();
        }

        logger.info('Internal modules intercepted');
        return modulesMap;
    } catch (err) {
        logger.error('Failed to bootstrap:', err);
        return null;
    }
}

const loadMods = async (modules: ModulesMap | null) => {
    if (!modules) return;

    const mods = import.meta.glob('./mods/*.ts', { eager: true });

    await Promise.all(
        Object.entries(mods).map(async ([path, modImport]) => {
            const mod = modImport as { default?: Mod };
            if (!mod.default) return logger.warn(`Mod ${path} has no default export, skipping`);

            try {
                const metadata = await mod.default(modules);
                logger.info(`Loaded "${metadata.name}" v${metadata.version}`);
            } catch (err) {
                logger.error(`Failed to load mod ${path}:`, err);
            }
        })
    );
};

bootstrap().then(loadMods);
