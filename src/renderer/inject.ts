import { taggedLogger } from '../common/logger';
import type { Mod, ModulesMap } from './types';

const logger = taggedLogger('inject');

const bootstrap = async () => {
    logger.info('Waiting for WhatsApp Web internal modules...');

    const getModules = () => window.require?.('__debug')?.modulesMap as ModulesMap;

    let modulesMap = getModules();
    while (!modulesMap) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        modulesMap = getModules();
    }

    logger.info('Internal modules intercepted', modulesMap);
    return modulesMap;
};

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
