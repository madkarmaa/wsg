import { useReducer } from '@modules/common/react';
import type { ComponentType } from 'react';
import { makeLazy } from './lazy';

/** A component that is resolved the first time it renders. Renders nothing if it can't be resolved */
export function LazyComponent<P extends object>(
    factory: () => ComponentType<P> | null | undefined,
    attempts = 5
) {
    const get = makeLazy(factory, attempts);

    const Lazy = (props: P) => {
        const Component = get();
        return Component ? <Component {...props} /> : null;
    };

    return Object.assign(Lazy, { $$wsgGetLazy: get });
}

export function useForceUpdater(): () => void {
    const [, increment] = useReducer((x: number) => x + 1, 0);
    return increment;
}
