import { proxyLazy } from '@utils/lazy';
import type { ReactElement } from 'react';
import { findModule } from '../modules';

type EventCallback = (...args: unknown[]) => void;

interface EventEmitter {
    on(event: string, callback: EventCallback): void;
    off(event: string, callback: EventCallback): void;
    trigger(event: string, ...args: unknown[]): void;
}

export interface ModalManagerType extends EventEmitter {
    open(modal: ReactElement, options?: Record<string, unknown>): void;
    close(modal?: ReactElement): void;
}
export const ModalManager = proxyLazy(
    () => findModule<{ ModalManager: ModalManagerType }>('WAWebModalManager')?.ModalManager
);

export interface ToastManagerType extends EventEmitter {
    open(toast: ReactElement, options?: Record<string, unknown>): void;
    close(id: string): void;
}
export const ToastManager = proxyLazy(
    () => findModule<{ ToastManager: ToastManagerType }>('WAWebToastManager')?.ToastManager
);

/** WhatsApp's global command bus */
export const Cmd = proxyLazy(() => findModule<{ Cmd: EventEmitter }>('WAWebCmd')?.Cmd);
