import { join } from 'path';
import { readFileSync } from 'fs';
import { IpcChannels } from '@common/constants';
import { taggedLogger } from '@common/logger';

const logger = taggedLogger('ipc-main');

type IpcMainOn = Parameters<typeof Electron.ipcMain.on>;
type IpcEvent = { event: IpcChannels | `${IpcChannels}`; listener: IpcMainOn[1] };

export const ping = {
    event: IpcChannels.PING,
    listener: () => console.log('pong')
} satisfies IpcEvent;

export const getInjectionScript = {
    event: IpcChannels.GET_INJECTION_SCRIPT,
    listener(event) {
        logger.info('Received request for injected script');
        const injectedPath = join(import.meta.dirname, '../renderer/inject.js');
        try {
            event.returnValue = readFileSync(injectedPath, 'utf-8');
            logger.info('Successfully read injected script from:', injectedPath);
        } catch (err) {
            logger.error('Failed to read injected script from:', injectedPath, err);
            event.returnValue = '';
        }
    }
} satisfies IpcEvent;
