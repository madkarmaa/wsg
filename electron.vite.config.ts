import { defineConfig } from 'electron-vite';
import { resolve } from 'path';
import { globSync } from 'glob';

const input = globSync('src/renderer/*.ts').reduce((acc, file) => {
    const name = file.split(/[\\/]/).pop()!.replace('.ts', '');

    if (name === 'types.d') return acc;
    acc[name] = resolve(file);

    return acc;
}, {});

export default defineConfig({
    main: {},
    preload: {},
    renderer: {
        build: {
            rollupOptions: {
                input,
                output: {
                    entryFileNames: '[name].js'
                }
            }
        }
    }
});
