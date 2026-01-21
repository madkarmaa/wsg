import { type PatchCallback, registerPatch } from '@lib/hook';

export const patchModule = <Exports extends object = object>(
    id: string,
    callback: (exports: Exports) => void
) => registerPatch(id, callback as PatchCallback);

export const waitForModule = <Exports extends object = object>(id: string) =>
    new Promise<Exports>((resolve) => registerPatch(id, (exports) => resolve(exports as Exports)));
