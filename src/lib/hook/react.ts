import { taggedLogger } from '@common/logger';
import { waitForModule } from '@lib/modules';
import type * as ReactType from 'react';
import type * as ReactDOMType from 'react-dom';
import type * as ReactDOMClientType from 'react-dom/client';

const logger = taggedLogger('react-hook');

export type ReactRef = typeof ReactType;
export type ReactDOMRef = typeof ReactDOMType & typeof ReactDOMClientType;

export let React: ReactRef;
export let ReactDOM: ReactDOMRef;
export let useState: typeof React.useState;
export let useEffect: typeof React.useEffect;
export let useLayoutEffect: typeof React.useLayoutEffect;
export let useMemo: typeof React.useMemo;
export let useRef: typeof React.useRef;
export let useReducer: typeof React.useReducer;
export let useCallback: typeof React.useCallback;

const enableReact = async () => {
    React = await waitForModule<ReactRef>('React');
    ({ useState, useEffect, useLayoutEffect, useMemo, useRef, useReducer, useCallback } = React);

    window.WSG.ReactCreateElement = React.createElement;
    window.WSG.ReactFragment = React.Fragment;

    logger.info('React is available');

    ReactDOM = await waitForModule<ReactDOMRef>('ReactDOM');
    logger.info('ReactDOM is available');
};

enableReact();
