import { taggedLogger } from '@common/logger';
import { WA_DEBUG_MODULE } from '@common/constants';
import type { JsModulesMap } from '@lib/types';
import { patches } from './state';
import type { PatchCallback } from './types';
import { latePatch } from './patcher';

const logger = taggedLogger('hook');

export const registerPatch = (moduleId: string, callback: PatchCallback) => {
    if (!patches.has(moduleId)) patches.set(moduleId, []);
    patches.get(moduleId)!.push(callback);

    // Attempt late patching via debug module if available
    if (window.require) {
        try {
            const debug = window.require(WA_DEBUG_MODULE) as
                | { modulesMap: JsModulesMap }
                | undefined;
            if (debug && latePatch(debug.modulesMap, moduleId, callback)) return;
        } catch {
            // ignore
        }
    }

    logger.info(`Registered patch for ${moduleId}, waiting for definition...`);
};
