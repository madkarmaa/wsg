import { taggedLogger } from '../common/logger';
import type { Mod, ModulesMap } from './types';

const logger = taggedLogger('inject');

const bootstrap = async () => {
    logger.info('Waiting for WhatsApp Web internal modules...');

    const requireHook = await new Promise<typeof window.require>((resolve) => {
        if (typeof window.require !== 'undefined') return resolve(window.require);

        let windowRequire: typeof window.require | undefined;
        Object.defineProperty(window, 'require', {
            configurable: true,
            get: () => windowRequire,
            set: (value) => {
                windowRequire = value;

                Object.defineProperty(window, 'require', {
                    value: windowRequire,
                    writable: true,
                    configurable: true,
                    enumerable: true
                });

                resolve(value);
            }
        });
    });

    let modulesMap: ModulesMap | undefined;
    try {
        modulesMap = requireHook('__debug')?.modulesMap as ModulesMap | undefined;
    } catch (error) {
        logger.error('Failed to get internal modules map:', error);
        return undefined;
    }

    logger.info('Internal modules intercepted');
    return modulesMap;
};

const loadMods = async (modules?: ModulesMap) => {
    if (!modules) return;

    const mods = import.meta.glob('./mods/*.ts', { eager: true });

    await Promise.all(
        Object.entries(mods).map(async ([path, modImport]) => {
            const mod = modImport as { default?: Mod };
            if (!mod.default) return logger.warn(`Mod ${path} has no default export, skipping`);

            try {
                await mod.default.execute(modules);
                logger.info(`Loaded "${mod.default.name}" v${mod.default.version}`);
            } catch (err) {
                logger.error(`Failed to load mod ${path}:`, err);
            }
        })
    );
};

bootstrap().then(loadMods);
