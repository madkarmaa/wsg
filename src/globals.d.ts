/// <reference types="@samrum/vite-plugin-web-extension/client" />

import {
    type APP_NAME,
    type WA_D_METHOD,
    type WA_DEFINE_METHOD,
    type WA_REQUIRELAZY_METHOD
} from '@common/constants';

declare global {
    const __brand: unique symbol;
    type Brand<T, B extends string> = T & { [__brand]: B };

    type MaybePromise<T> = T | Promise<T>;
    type OmitFix<T, K extends keyof T> = { [P in Exclude<keyof T, K>]: T[P] };

    interface Window {
        [WA_D_METHOD]: (...args: unknown[]) => void;
        [WA_DEFINE_METHOD]: (...args: unknown[]) => void;
        [WA_REQUIRELAZY_METHOD]: import('./lib/hook/require').RequireLazy;

        [APP_NAME]: {
            ReactCreateElement: import('./lib/hook/react').ReactRef['createElement'];
            ReactFragment: import('./lib/hook/react').ReactRef['Fragment'];
        };
    }
}

export {};
