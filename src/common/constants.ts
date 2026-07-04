export const APP_NAME = 'WSG' as const;
export const APP_ASCII_ART = `
░▒▓█▓▒░░▒▓█▓▒░░▒▓█▓▒░░▒▓███████▓▒░░▒▓██████▓▒░
░▒▓█▓▒░░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░
░▒▓█▓▒░░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░
░▒▓█▓▒░░▒▓█▓▒░░▒▓█▓▒░░▒▓██████▓▒░░▒▓█▓▒▒▓███▓▒░
░▒▓█▓▒░░▒▓█▓▒░░▒▓█▓▒░      ░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░
░▒▓█▓▒░░▒▓█▓▒░░▒▓█▓▒░      ░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░
 ░▒▓█████████████▓▒░░▒▓███████▓▒░ ░▒▓██████▓▒░
`.trim();

export const WA_DEBUG_MODULE = '__debug' as const;
export const WA_D_METHOD = '__d' as const;
export const WA_DEFINE_METHOD = 'define' as const;
export const WA_REQUIRELAZY_METHOD = 'requireLazy' as const;
export const WA_MOUNT_ELEMENT_SELECTOR = 'body > div[id^="mount"]' as const;
export const WA_APP_ELEMENT_SELECTOR = `${WA_MOUNT_ELEMENT_SELECTOR} > * > div[id^="app"]` as const;
export const WA_MAIN_COLOR = '#25D366' as const;
