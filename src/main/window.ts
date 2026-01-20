import { BrowserWindow, Menu, shell } from 'electron';
import { join } from 'path';
import { is } from '@electron-toolkit/utils';
import {
    APP_NAME,
    DEFAULT_HEIGHT,
    DEFAULT_WIDTH,
    MIN_HEIGHT,
    MIN_WIDTH,
    WHATSAPP_WEB_URL
} from '../common/constants';
import icon from '../../resources/icon.png?asset';

const USER_AGENT =
    `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${process.versions.chrome.split('.')[0]}.0.0.0 Safari/537.36` as const;

export const createWindow = () => {
    const mainWindow = new BrowserWindow({
        width: DEFAULT_WIDTH,
        minWidth: MIN_WIDTH,
        height: DEFAULT_HEIGHT,
        minHeight: MIN_HEIGHT,
        center: true,
        show: false,
        autoHideMenuBar: true,
        ...(process.platform === 'linux' ? { icon } : {}),
        webPreferences: {
            preload: join(import.meta.dirname, '../preload/index.js'),
            sandbox: true,
            contextIsolation: true
        }
    });

    Menu.setApplicationMenu(null);

    mainWindow.on('ready-to-show', () => {
        mainWindow.maximize();
        mainWindow.show();
    });

    mainWindow.setTitle(APP_NAME);
    mainWindow.on('page-title-updated', (e) => e.preventDefault());

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url);
        return { action: 'deny' };
    });

    // spoof Chrome user agent to avoid being detected as Electron
    // https://stackoverflow.com/a/79406250
    mainWindow.webContents.setUserAgent(USER_AGENT);

    if (is.dev) mainWindow.webContents.openDevTools();

    mainWindow.loadURL(WHATSAPP_WEB_URL);

    return mainWindow;
};
