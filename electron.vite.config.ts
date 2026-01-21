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
    main: {
        resolve: {
            alias: {
                '@common': resolve('src/common'),
                '@main': resolve('src/main'),
                '@resources': resolve('resources')
            }
        }
    },
    preload: {
        resolve: {
            alias: {
                '@common': resolve('src/common'),
                '@lib': resolve('src/lib')
            }
        }
    },
    renderer: {
        resolve: {
            alias: {
                '@common': resolve('src/common'),
                '@lib': resolve('src/lib')
            }
        },
        esbuild: {
            jsx: 'transform',
            jsxFactory: 'React.createElement',
            jsxFragment: 'React.Fragment'
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
