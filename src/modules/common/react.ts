import type * as ReactTypes from 'react';
import type * as ReactDOMTypes from 'react-dom';
import { waitFor } from '../modules';

// WhatsApp's own React instance. These are live bindings, populated once the module loads

export let React: typeof ReactTypes;
export let ReactDOM: typeof ReactDOMTypes;

export let useState: typeof React.useState;
export let useEffect: typeof React.useEffect;
export let useLayoutEffect: typeof React.useLayoutEffect;
export let useMemo: typeof React.useMemo;
export let useRef: typeof React.useRef;
export let useReducer: typeof React.useReducer;
export let useCallback: typeof React.useCallback;
export let useSyncExternalStore: typeof React.useSyncExternalStore;

const reactListeners: ((react: typeof ReactTypes) => void)[] = [];

/** Runs the callback once React has loaded, immediately if it already has */
export function onReactLoaded(callback: (react: typeof ReactTypes) => void) {
    if (React) callback(React);
    else reactListeners.push(callback);
}

function setReact(react: typeof ReactTypes) {
    if (React) return;

    React = react;
    ({
        useState,
        useEffect,
        useLayoutEffect,
        useMemo,
        useRef,
        useReducer,
        useCallback,
        useSyncExternalStore
    } = react);

    for (const listener of reactListeners.splice(0)) listener(react);
}

// both ids point to the same exports, whichever initialises first wins
waitFor('React', setReact);
waitFor('react', setReact);
waitFor<typeof ReactDOMTypes>('ReactDOM', (reactDOM) => (ReactDOM = reactDOM));
