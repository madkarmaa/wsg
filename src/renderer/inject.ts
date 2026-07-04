import { taggedLogger, setLogLevel, LogLevel } from '@common/logger';
import type { Mod } from '@lib/mods';
import { hookModuleLoader } from '@lib/hook';
import { APP_NAME, APP_ASCII_ART, WA_MAIN_COLOR } from '@common/constants';

import '@lib/hook/require';
import '@lib/hook/react';

const logger = taggedLogger('inject');
const isDevelopment = import.meta.env.MODE === 'development';

if (!window[APP_NAME]) window[APP_NAME] = {} as Window[typeof APP_NAME];

console.log(
    `%c${APP_ASCII_ART}%c\n\nUse %crequire('__debug')['modulesMap']['<MODULE_ID>']%c to access a module's structure.`,
    `color: ${WA_MAIN_COLOR};`,
    '',
    'color: #FF6F61; font-weight: bold;',
    ''
);

const loadMods = () => {
    const mods = import.meta.glob('./mods/**/*.{ts,tsx}', { eager: true });

    Promise.all(
        Object.entries(mods).map(async ([path, modImport]) => {
            const mod = modImport as { default?: Mod };

            if (!mod.default || typeof mod.default.id !== 'string')
                return logger.verbose(`Mod ${path} has no default export, skipping`);

            try {
                await mod.default.handler();
                logger.info(`Loaded "${mod.default.name}" v${mod.default.version}`);
            } catch (err) {
                logger.error(`Failed to load mod ${path}`, err);
            }
        })
    );
};

setLogLevel(isDevelopment ? LogLevel.VERBOSE : LogLevel.WARN);
hookModuleLoader();
loadMods();
