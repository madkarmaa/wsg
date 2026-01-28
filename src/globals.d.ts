import { type ReactRef } from '@lib/hook/react';
import {
    type APP_DEV_MODE_KEY,
    type APP_NAME,
    type WA_DEFINE_METHOD,
    type WA_D_METHOD
} from '@common/constants';

declare global {
    const __brand: unique symbol;
    type Brand<T, B extends string> = T & { [__brand]: B };

    type MaybePromise<T> = T | Promise<T>;
    type OmitFix<T, K extends keyof T> = { [P in Exclude<keyof T, K>]: T[P] };

    interface Window {
        [WA_D_METHOD]: (...args: unknown[]) => void;
        [WA_DEFINE_METHOD]: ((...args: unknown[]) => void) & { amd: object };
        [APP_NAME]: {
            ReactCreateElement: ReactRef['createElement'];
            ReactFragment: ReactRef['Fragment'];
        };
        [APP_DEV_MODE_KEY]: boolean;
    }
}

export {};
