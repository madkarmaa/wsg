export const APP_NAME = 'WassApp' as const;
export const APP_ID = 'com.wassapp.desktop' as const;

export const WHATSAPP_WEB_URL = 'https://web.whatsapp.com' as const;
export const WHATSAPP_DEBUG_MODULE = '__debug' as const;
export const WHATSAPP_DEFINE_METHOD = '__d' as const;

export const MIN_WIDTH = 940 as const;
export const MIN_HEIGHT = 500 as const;
export const DEFAULT_WIDTH = 1280 as const;
export const DEFAULT_HEIGHT = 720 as const;

export enum IpcChannels {
    PING = 'ping',
    GET_INJECTION_SCRIPT = 'get-injection-script'
}
