import { taggedLogger } from '@common/logger';
import type { Mod } from '@lib/mods';
import { hookModuleLoader } from '@lib/hook';

const logger = taggedLogger('inject');

const loadMods = () => {
    const mods = import.meta.glob('./mods/*.ts', { eager: true });

    Promise.all(
        Object.entries(mods).map(async ([path, modImport]) => {
            const mod = modImport as { default?: Mod };
            if (!mod.default) return logger.warn(`Mod ${path} has no default export, skipping`);

            try {
                await mod.default.handler();
                logger.info(`Loaded "${mod.default.name}" v${mod.default.version}`);
            } catch (err) {
                logger.error(`Failed to load mod ${path}`, err);
            }
        })
    );
};

loadMods();
hookModuleLoader();
