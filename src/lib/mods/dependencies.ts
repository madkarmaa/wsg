import { type ModDependency } from '@lib/mods';
import { waitForModule } from '@lib/modules';

export const react = (async () => {
    const React = await waitForModule<typeof import('react')>('React');
    return { React };
}) satisfies ModDependency;
