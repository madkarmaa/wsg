import { Toast, ToastManager } from '@modules/common';
import { requireModules } from '@modules/modules';
import { Logger } from '@utils/Logger';
import type { ReactNode } from 'react';

const logger = new Logger('Toasts');

let toastCount = 0;

export interface ToastOptions {
    /** In milliseconds */
    duration?: number;
    action?: { text: ReactNode; onAction(): void };
}

/** Shows a WhatsApp toast at the bottom of the screen */
export async function showToast(message: ReactNode, { duration, action }: ToastOptions = {}) {
    try {
        // the toast module is lazy loaded by WhatsApp
        await requireModules('WAWebToast.react', 'WAWebToastManager');

        const id = `wsg-toast-${++toastCount}`;
        ToastManager.open(
            <Toast
                id={id}
                msg={message}
                duration={duration}
                action={action && { actionText: action.text, onAction: action.onAction }}
            />
        );
        return id;
    } catch (err) {
        logger.error('Failed to show toast', err);
        return null;
    }
}
