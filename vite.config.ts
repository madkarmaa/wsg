import { resolve } from 'node:path';
import webExtension from '@samrum/vite-plugin-web-extension';
import { defineConfig, type PluginOption } from 'vite';
import pkg from './package.json';

const manifest = {
    manifest_version: 3,
    name: 'WSG',
    version: pkg.version,
    description: pkg.description,
    minimum_chrome_version: '102',
    icons: {
        '16': 'icons/icon-16.png',
        '48': 'icons/icon-48.png',
        '128': 'icons/icon-128.png',
        '512': 'icons/icon-512.png'
    },
    content_scripts: [
        {
            matches: ['https://web.whatsapp.com/*'],
            js: ['src/renderer/inject.ts'],
            run_at: 'document_start',
            world: 'MAIN'
        }
    ]
} satisfies chrome.runtime.ManifestV3;

const webExtensionPlugin = webExtension({
    manifest
}) as unknown as PluginOption;

export default defineConfig({
    publicDir: 'resources',
    plugins: [webExtensionPlugin],
    resolve: {
        alias: {
            '@common': resolve('src/common'),
            '@lib': resolve('src/lib'),
            '@resources': resolve('resources')
        }
    },
    esbuild: {
        jsx: 'transform',
        jsxFactory: 'WSG.ReactCreateElement',
        jsxFragment: 'WSG.ReactFragment'
    },
    build: {
        emptyOutDir: true,
        assetsInlineLimit: 1024 * 1024
    }
});
