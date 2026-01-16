import { app, shell, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import { electronApp, optimizer } from '@electron-toolkit/utils';
import icon from '../../resources/icon.png?asset';
import { chromeUserAgent } from './utils';

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

    mainWindow.on('ready-to-show', () => {
        mainWindow.maximize();
        mainWindow.show();
    });

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url);
        return { action: 'deny' };
    });

    mainWindow.loadURL('https://web.whatsapp.com');
};

app.whenReady().then(() => {
    electronApp.setAppUserModelId('com.wassapp.desktop');

    // spoof Chrome user agent to avoid being detected as Electron
    // https://stackoverflow.com/a/79406250
    app.userAgentFallback = chromeUserAgent('144.0.0.0');

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
