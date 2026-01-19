import { taggedLogger } from '../common/logger';
import { findModule, type ModulesMap } from './utils';

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

const main = async () => {
    const modules = await bootstrap();
    if (!modules) return;
};

main();
