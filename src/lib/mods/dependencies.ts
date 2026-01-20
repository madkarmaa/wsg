import type * as ReactType from 'react';
import { type ModDependency } from '@lib/mods';
import { byId } from '@lib/modules/finders';
import { findModule } from '@lib/modules';

export const react = (async (modules) => {
    const MODULE_ID = 'React' as const;

    const module = await findModule<typeof ReactType>(modules, byId(MODULE_ID));
    if (!module) throw new Error(`Module ${MODULE_ID} not found`);

    return { React: module.exports };
}) satisfies ModDependency;
