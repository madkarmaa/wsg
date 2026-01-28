import { type PatchCallback, registerPatch } from '@lib/hook';
import { modules } from '@lib/hook/state';

export const patchModule = <Exports extends object = object>(
    id: string,
    callback: PatchCallback<Exports>
) => registerPatch(id, callback as PatchCallback);

export const waitForModule = <Exports extends object = object>(id: string) =>
    new Promise<Exports>((resolve) => {
        const existingModule = modules.get(id) as Exports | undefined;
        if (existingModule) return resolve(existingModule);

        registerPatch(id, (exports) => {
            modules.set(id, exports);
            resolve(exports as Exports);
        });
    });
