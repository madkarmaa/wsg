import type { PluginAuthor } from './types';

export const APP_NAME = 'WSG';
export const APP_COLOR = '#25D366';
export const APP_ASCII_ART = `
░▒▓█▓▒░░▒▓█▓▒░░▒▓█▓▒░░▒▓███████▓▒░░▒▓██████▓▒░
░▒▓█▓▒░░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░
░▒▓█▓▒░░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░
░▒▓█▓▒░░▒▓█▓▒░░▒▓█▓▒░░▒▓██████▓▒░░▒▓█▓▒▒▓███▓▒░
░▒▓█▓▒░░▒▓█▓▒░░▒▓█▓▒░      ░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░
░▒▓█▓▒░░▒▓█▓▒░░▒▓█▓▒░      ░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░
 ░▒▓█████████████▓▒░░▒▓███████▓▒░ ░▒▓██████▓▒░
`.trim();

/** localStorage key holding the persisted settings */
export const SETTINGS_KEY = 'WSG_Settings';

export const Devs = {
    madkarma: { name: 'madkarma', github: 'madkarmaa' }
} satisfies Record<string, PluginAuthor>;
