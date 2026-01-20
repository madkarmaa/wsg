import { ipcMain } from 'electron';
import { join } from 'path';
import { readFileSync } from 'fs';
import { taggedLogger } from '../common/logger';

const logger = taggedLogger('main-ipc');

export const setupIpcHandlers = () => {
    ipcMain.on('ping', () => logger.log('pong'));

    ipcMain.on('get-injected-script', (event) => {
        logger.info('Received request for injected script');
        const injectedPath = join(import.meta.dirname, '../renderer/inject.js');
        try {
            event.returnValue = readFileSync(injectedPath, 'utf-8');
            logger.info('Successfully read injected script from:', injectedPath);
        } catch (err) {
            logger.error('Failed to read injected script from:', injectedPath, err);
            event.returnValue = '';
        }
    });
};
