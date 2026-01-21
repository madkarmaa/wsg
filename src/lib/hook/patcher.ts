import { taggedLogger } from '@common/logger';
import type { JsModulesMap } from '@lib/types';
import { patches } from './state';
import type { PatchCallback } from './types';

const logger = taggedLogger('hook');

export const applyPatches = (moduleId: string, exports: object) => {
    const callbacks = patches.get(moduleId);
    if (!callbacks) return;

    callbacks.forEach((callback) => {
        try {
            callback(exports);
            logger.info(`Patched module ${moduleId} successfully`);
        } catch (err) {
            logger.error(`Error patching module ${moduleId}`, err);
        }
    });
};

export const latePatch = (map: JsModulesMap, moduleId: string, callback: PatchCallback) => {
    if (!map) return false;
    const mod = map[moduleId];

    if (!mod || !mod.exports) return false;

    try {
        // If the module has exports, apply the patch
        callback(mod.exports);
        logger.info(`Late-patched module ${moduleId} successfully`);
        return true;
    } catch (err) {
        logger.error(`Error late-patching module ${moduleId}`, err);
        return true; // We found it, but it errored. Still counts as found.
    }
};
