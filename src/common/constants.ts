export const APP_NAME = 'WSG' as const;
export const APP_ID = 'com.wsg.desktop' as const;

export const WA_WEB_URL = 'https://web.whatsapp.com' as const;
export const WA_DEBUG_MODULE = '__debug' as const;
export const WA_DEFINE_METHOD = '__d' as const;
export const WA_MOUNT_ELEMENT_SELECTOR = 'div[id^="mount"]' as const;
export const WA_APP_ELEMENT_SELECTOR = 'div[id^="app"]' as const;

export const MIN_WIDTH = 940 as const;
export const MIN_HEIGHT = 500 as const;
export const DEFAULT_WIDTH = 1280 as const;
export const DEFAULT_HEIGHT = 720 as const;

export enum IpcChannels {
    PING = 'ping',
    GET_INJECTION_SCRIPT = 'get-injection-script'
}
