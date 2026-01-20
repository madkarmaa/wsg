import { ipcMain } from 'electron';
import { taggedLogger } from '@common/logger';
import * as events from './events';

const logger = taggedLogger('ipc-main-setup');

export const setupIpcHandlers = () => {
    for (const { event, listener } of Object.values(events)) {
        ipcMain.on(event.toString(), listener);
        logger.info(`Registered IPC handler for event: ${event}`);
    }
};
