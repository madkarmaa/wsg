import { taggedLogger } from '@common/logger';
import { patches } from './state';
import type { PatchCallback } from './types';
// import { WA_DEBUG_MODULE } from '@common/constants';
// import type { JsModulesMap } from '@lib/types';

const logger = taggedLogger('hook', 'patcher');

export const registerPatch = (moduleId: string, callback: PatchCallback) => {
    if (!patches.has(moduleId)) patches.set(moduleId, []);
    patches.get(moduleId)!.push(callback);

    // Attempt late patching via debug module if available
    // if (window.require)
    //     try {
    //         const debug = window.require(WA_DEBUG_MODULE) as
    //             | { modulesMap: JsModulesMap }
    //             | undefined;
    //         if (debug && latePatch(debug.modulesMap, moduleId, callback)) return;
    //     } catch {
    //         // ignore
    //     }

    logger.info(`Registered patch for ${moduleId}, waiting for definition...`);
};

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

// const latePatch = (map: JsModulesMap, moduleId: string, callback: PatchCallback) => {
//     if (!map) return false;
//     const mod = map[moduleId];

//     if (!mod || !mod.exports) return false;

//     try {
//         // If the module has exports, apply the patch
//         callback(mod.exports);
//         logger.info(`Late-patched module ${moduleId} successfully`);
//         return true;
//     } catch (err) {
//         logger.error(`Error late-patching module ${moduleId}`, err);
//         return true; // We found it, but it errored. Still counts as found.
//     }
// };
