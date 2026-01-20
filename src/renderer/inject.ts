import { WHATSAPP_DEBUG_MODULE } from '../common/constants';
import { taggedLogger } from '../common/logger';
import type { Mod, ModulesMap } from './types';

const logger = taggedLogger('inject');

let req: typeof window.require | undefined;
Object.defineProperty(window, 'require', {
    configurable: true,
    enumerable: true,
    get: () => req,
    set(value) {
        logger.info('Detected change to window.require');
        req = value;

        queueMicrotask(() => {
            try {
                logger.info(`Attempting to load ${WHATSAPP_DEBUG_MODULE} module...`);

                const modules = req?.(WHATSAPP_DEBUG_MODULE)?.modulesMap as ModulesMap;
                if (!modules) return;

                logger.info(`${WHATSAPP_DEBUG_MODULE} module loaded, loading mods...`);
                loadMods(modules);
            } catch (err) {
                logger.error(`Failed to load ${WHATSAPP_DEBUG_MODULE} module`, err);
            }
        });
    }
});

const loadMods = (modules: ModulesMap) => {
    const mods = import.meta.glob('./mods/*.ts', { eager: true });

    Promise.all(
        Object.entries(mods).map(async ([path, modImport]) => {
            const mod = modImport as { default?: Mod };
            if (!mod.default) {
                logger.warn(`Mod ${path} has no default export, skipping`);
                return;
            }

            try {
                await mod.default.execute(modules);
                logger.info(`Loaded "${mod.default.name}" v${mod.default.version}`);
            } catch (err) {
                logger.error(`Failed to load mod ${path}`, err);
            }
        })
    );
};
