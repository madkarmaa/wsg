declare const __brand: unique symbol;

declare global {
    type MaybePromise<T> = T | Promise<T>;
    type Brand<T, B extends string> = T & { [__brand]: B };
    type OmitFix<T, K extends keyof T> = { [P in Exclude<keyof T, K>]: T[P] };
}

export {};
