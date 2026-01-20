import { webFrame, ipcRenderer } from 'electron';
import css from './style.css?inline';
import { taggedLogger } from '@common/logger';

const logger = taggedLogger('preload');

const injectScript = () => {
    try {
        const script = ipcRenderer.sendSync('get-injected-script');
        if (script && typeof script === 'string') {
            logger.info('Injecting script into renderer process...');
            webFrame.executeJavaScript(script);
            logger.info('Script injected successfully.');
        } else logger.error('Failed to retrieve injected script from main process.');
    } catch (e) {
        logger.error('Error injecting script:', e);
    }
};

const injectCSS = () => {
    try {
        logger.info('Injecting CSS into renderer process...');
        webFrame.insertCSS(css);
        logger.info('CSS injected successfully.');
    } catch (e) {
        logger.error('Error injecting CSS:', e);
    }
};

injectCSS();
injectScript();
