import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import { resolve } from 'path';
import { globSync } from 'glob';

const input = globSync('src/renderer/*.ts').reduce((acc, file) => {
    const name = file.split(/[\\/]/).pop()!.replace('.ts', '');

    if (name === 'types.d') return acc;
    acc[name] = resolve(file);

    return acc;
}, {});

export default defineConfig({
    main: {
        resolve: {
            alias: {
                '@common': resolve('src/common')
            }
        },
        plugins: [externalizeDepsPlugin()]
    },
    preload: {
        resolve: {
            alias: {
                '@common': resolve('src/common')
            }
        },
        plugins: [externalizeDepsPlugin()]
    },
    renderer: {
        resolve: {
            alias: {
                '@common': resolve('src/common'),
                '@lib': resolve('src/lib')
            }
        },
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
