/**
 * Wraps a factory so it only runs once it is first called, caching the first non-nullish result.
 * Gives up (and keeps returning the nullish result) after `attempts` tries.
 */
export function makeLazy<T>(factory: () => T, attempts = 5): () => T {
    let tries = 0;
    let cache: T | undefined;
    let hasValue = false;

    return () => {
        if (!hasValue && tries < attempts) {
            tries++;
            cache = factory();
            hasValue = cache != null;
            if (!hasValue && tries === attempts) console.error('Lazy factory failed:', factory);
        }
        return cache as T;
    };
}

export const SYM_LAZY_GET = Symbol.for('wsg.lazy.get');
export const SYM_LAZY_CACHED = Symbol.for('wsg.lazy.cached');

// Proxy invariants require these to match the function target, so they are never forwarded
const UNCONFIGURABLE_KEYS = ['arguments', 'caller', 'prototype'] as const;
const isUnconfigurable = (key: PropertyKey) =>
    (UNCONFIGURABLE_KEYS as readonly PropertyKey[]).includes(key);

interface LazyTarget {
    (): void;
    [SYM_LAZY_CACHED]: object | null | undefined;
    [SYM_LAZY_GET](): object;
}

const resolve = (target: LazyTarget) => {
    const value = target[SYM_LAZY_GET]();
    if (value == null) throw new TypeError('Lazy value could not be resolved');
    return value;
};

// traps that simply run against the resolved value instead of the dummy target
const handler: ProxyHandler<LazyTarget> = {
    apply: (target, thisArg, args) => Reflect.apply(resolve(target) as Function, thisArg, args),
    construct: (target, args, newTarget) =>
        Reflect.construct(resolve(target) as Function, args, newTarget),
    defineProperty: (target, key, descriptor) =>
        Reflect.defineProperty(resolve(target), key, descriptor),
    deleteProperty: (target, key) => Reflect.deleteProperty(resolve(target), key),
    getPrototypeOf: (target) => Reflect.getPrototypeOf(resolve(target)),
    has: (target, key) => Reflect.has(resolve(target), key),
    isExtensible: (target) => Reflect.isExtensible(resolve(target)),
    preventExtensions: (target) => Reflect.preventExtensions(resolve(target)),
    set: (target, key, value) => Reflect.set(resolve(target), key, value),
    setPrototypeOf: (target, proto) => Reflect.setPrototypeOf(resolve(target), proto),

    ownKeys(target) {
        const keys = Reflect.ownKeys(resolve(target));
        for (const key of UNCONFIGURABLE_KEYS) if (!keys.includes(key)) keys.push(key);
        return keys;
    },
    getOwnPropertyDescriptor(target, key) {
        if (isUnconfigurable(key)) return Reflect.getOwnPropertyDescriptor(target, key);

        const descriptor = Reflect.getOwnPropertyDescriptor(resolve(target), key);
        if (descriptor) Object.defineProperty(target, key, descriptor);
        return descriptor;
    }
};

/**
 * Returns a Proxy that behaves like the object returned by `factory`, which is only evaluated on first use.
 * Property reads made in the same tick the proxy was created return nested lazies,
 * so destructuring at module top level (`const { foo } = findByPropsLazy('foo')`) works.
 */
export function proxyLazy<T extends object>(
    factory: () => T | null | undefined,
    attempts = 5,
    isChild = false
): T {
    let isSameTick = !isChild;
    if (isSameTick) setTimeout(() => (isSameTick = false), 0);

    let tries = 0;
    const target = Object.assign(function () {}, {
        [SYM_LAZY_CACHED]: undefined as object | null | undefined,
        [SYM_LAZY_GET](): object {
            if (target[SYM_LAZY_CACHED] == null && tries < attempts) {
                tries++;
                target[SYM_LAZY_CACHED] = factory();
                if (target[SYM_LAZY_CACHED] == null && tries === attempts)
                    console.error('Lazy factory failed:', factory);
            }
            // nullish only once every attempt failed, reported above
            return target[SYM_LAZY_CACHED] as object;
        }
    });

    const proxy = new Proxy<LazyTarget>(target, {
        ...handler,
        get(target, key, receiver) {
            if (key === SYM_LAZY_CACHED || key === SYM_LAZY_GET)
                return Reflect.get(target, key, receiver);

            if (isSameTick)
                return proxyLazy<object>(
                    () => {
                        const value: unknown = Reflect.get(resolve(target), key);
                        return typeof value === 'object' || typeof value === 'function'
                            ? value
                            : null;
                    },
                    attempts,
                    true
                );

            return Reflect.get(resolve(target), key);
        }
    });

    // the proxy forwards every operation to the resolved value, so it can stand in for it
    return proxy as unknown as T;
}
