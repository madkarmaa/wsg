import { LazyComponent } from '@utils/react';
import type { ComponentType } from 'react';
import { type CodeFilter, findComponentByCode, findModule } from './modules';

// Kept apart from ./modules, since LazyComponent depends on React, which itself is found through ./modules

/** A component that is looked up the first time it renders */
export const findComponentLazy = <P extends object>(
    factory: () => ComponentType<P> | null | undefined
) => LazyComponent<P>(factory);

export const findComponentByCodeLazy = <P extends object>(...code: CodeFilter) =>
    LazyComponent<P>(() => findComponentByCode<P>(...code));

/** An export (by default `default`) of the module with the given id, looked up the first time it renders */
export const findModuleComponentLazy = <P extends object>(id: string, exportName = 'default') =>
    LazyComponent<P>(() => findModule<Partial<Record<string, ComponentType<P>>>>(id)?.[exportName]);
