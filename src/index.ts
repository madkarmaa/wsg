import { initPluginManager, startAllPlugins } from '@api/PluginManager';
import { _resolveReady, installModuleHooks, onceReady, requireModules } from '@modules';
import { APP_ASCII_ART, APP_COLOR } from '@utils/constants';
import { Logger } from '@utils/Logger';
import { StartAt } from '@utils/types';
import * as WSG from './WSG';

const logger = new Logger('WSG', APP_COLOR);

function printBanner() {
    console.log(
        `%c${APP_ASCII_ART}%c\n\nUse %cWSG.Modules.findModule('<MODULE_ID>')%c to access a module's exports.`,
        `color: ${APP_COLOR};`,
        '',
        'color: #FF6F61; font-weight: bold;',
        ''
    );
}

// Extension.js runs this at document_start, before any of WhatsApp's scripts
export default function main() {
    if (window.WSG) {
        logger.warn('Already initialised, skipping');
        return;
    }

    window.WSG = WSG;
    printBanner();

    installModuleHooks();
    initPluginManager();
    startAllPlugins(StartAt.Init);

    document.addEventListener('DOMContentLoaded', () => startAllPlugins(StartAt.DOMContentLoaded), {
        once: true
    });

    requireModules('React', 'ReactDOM').then(_resolveReady);
    onceReady.then(() => startAllPlugins(StartAt.ModulesReady));

    // Extension.js reloads pages for document_start scripts on change. Should it remount instead,
    // reload anyway: module hooks can't be undone, and remounting would leave stale patches in place
    if (IS_DEV) return () => location.reload();
}
