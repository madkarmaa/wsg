import { app, shell, BrowserWindow, ipcMain, Menu } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import { APP_ID, APP_NAME, USER_AGENT, WHATSAPP_WEB_URL } from './utils/constants';
import icon from '../../resources/icon.png?asset';
import css from './style.css?inline';

const createWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 900,
        height: 670,
        center: true,
        show: false,
        autoHideMenuBar: true,
        ...(process.platform === 'linux' ? { icon } : {}),
        webPreferences: {
            preload: join(import.meta.dirname, '../preload/index.js'),
            sandbox: false
        }
    });

    Menu.setApplicationMenu(null);

    mainWindow.on('ready-to-show', () => {
        mainWindow.maximize();
        mainWindow.show();
    });

    mainWindow.setTitle(APP_NAME);
    mainWindow.on('page-title-updated', (e) => e.preventDefault());

    mainWindow.webContents.on('dom-ready', () => {
        mainWindow.webContents.insertCSS(css);
    });

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url);
        return { action: 'deny' };
    });

    // spoof Chrome user agent to avoid being detected as Electron
    // https://stackoverflow.com/a/79406250
    mainWindow.webContents.setUserAgent(USER_AGENT);

    if (is.dev) mainWindow.webContents.openDevTools();

    mainWindow.loadURL(WHATSAPP_WEB_URL);
};

app.whenReady().then(() => {
    electronApp.setAppUserModelId(APP_ID);

    app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window);
    });

    ipcMain.on('ping', () => console.log('pong'));

    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
