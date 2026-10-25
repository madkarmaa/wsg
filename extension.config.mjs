import { resolve } from 'node:path';

const jsxRuntime = resolve(import.meta.dirname, 'src/utils/jsxRuntime.ts');

/** @type {import('extension').FileConfig} */
export default {
    define: {
        IS_DEV: false
    },
    commands: {
        dev: {
            browser: 'chrome',
            persistProfile: true,
            startingUrl: 'https://web.whatsapp.com/',
            define: { IS_DEV: true }
        },
        start: {
            browser: 'chrome',
            persistProfile: true,
            startingUrl: 'https://web.whatsapp.com/'
        },
        build: {
            browser: 'chrome'
        }
    },
    config: (config) => {
        config.resolve ??= {};
        config.resolve.alias = {
            ...config.resolve.alias,
            // JSX is rendered with WhatsApp's own React instance, which only exists at runtime
            'react/jsx-runtime$': jsxRuntime,
            'react/jsx-dev-runtime$': jsxRuntime
        };
        return config;
    }
};
