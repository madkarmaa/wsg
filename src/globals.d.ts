// IS_DEV is declared in the generated extension-env.d.ts, from `define` in extension.config.mjs

declare global {
    interface Window {
        /** Set by WSG at document_start */
        WSG?: typeof import('./WSG');

        // WhatsApp's module system
        __d?: (...args: unknown[]) => unknown;
        define?: (...args: unknown[]) => unknown;
        require?: (id: string) => unknown;
        requireLazy?: (ids: string[], callback: (...modules: unknown[]) => void) => void;
    }

    interface ImportMeta {
        /** Rspack's build-time module context, see https://rspack.rs/api/runtime-api/module-variables#importmetawebpackcontext */
        webpackContext(
            request: string,
            options?: {
                recursive?: boolean;
                regExp?: RegExp;
                include?: RegExp;
                exclude?: RegExp;
                mode?: 'sync' | 'eager' | 'weak' | 'lazy' | 'lazy-once';
            }
        ): {
            (id: string): unknown;
            keys(): string[];
            resolve(id: string): string;
            id: string;
        };
    }
}

export {};
