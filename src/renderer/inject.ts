import { taggedLogger } from '@common/logger';
import type { JsModulesMap } from '@lib/types';
import type { Mod } from '@lib/mods';
import { hookModuleLoader } from '@lib/hook';

const logger = taggedLogger('inject');

const loadMods = (modules: JsModulesMap) => {
    const mods = import.meta.glob('./mods/*.ts', { eager: true });

    Promise.all(
        Object.entries(mods).map(async ([path, modImport]) => {
            const mod = modImport as { default?: Mod };
            if (!mod.default) {
                logger.warn(`Mod ${path} has no default export, skipping`);
                return;
            }

            try {
                await mod.default.handler({ modules });
                logger.info(`Loaded "${mod.default.name}" v${mod.default.version}`);
            } catch (err) {
                logger.error(`Failed to load mod ${path}`, err);
            }
        })
    );
};

hookModuleLoader(loadMods);
