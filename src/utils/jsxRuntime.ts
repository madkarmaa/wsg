// Aliased as `react/jsx-runtime` and `react/jsx-dev-runtime` in extension.config.mjs.
// WSG doesn't bundle React: JSX is rendered with WhatsApp's instance, which only exists once its module loads.

import { React, onReactLoaded } from '@modules/common/react';
import type { ElementType, Key } from 'react';

export let Fragment: typeof React.Fragment;
onReactLoaded((react) => (Fragment = react.Fragment));

type JsxRuntime = { jsx(type: ElementType, props: unknown, key?: Key): unknown };

export const jsx = (type: ElementType, props: unknown, key?: Key) =>
    (React as unknown as JsxRuntime).jsx(type, props, key);

export const jsxs = jsx;

// dev builds call this with extra debug arguments, which production React doesn't need
export const jsxDEV = (type: ElementType, props: unknown, key?: Key) => jsx(type, props, key);
