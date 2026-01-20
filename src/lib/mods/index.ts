import type { JsModulesMap } from '@lib/types';

export type ModHandler<T extends object = object> = (
    params: { modules: JsModulesMap } & T
) => MaybePromise<void>;

export type ModDependency<T extends object = object> = (modules: JsModulesMap) => MaybePromise<T>;

type TupleToIntersection<T extends readonly unknown[]> = T extends readonly [
    infer Head,
    ...infer Tail
]
    ? Head & TupleToIntersection<Tail>
    : object;

export const withDependencies =
    <const Deps extends readonly ModDependency[]>(...dependencies: Deps) =>
    (
        handler: ModHandler<
            TupleToIntersection<{
                [K in keyof Deps]: Deps[K] extends ModDependency<infer R> ? Awaited<R> : never;
            }>
        >
    ): ModHandler =>
    async ({ modules }) => {
        const results = await Promise.all(dependencies.map((dep) => dep(modules)));
        const deps = Object.assign({}, ...results);
        await handler({ modules, ...deps });
    };

type ModId = Brand<string, 'mod-id'>;

type ModMetadata = {
    id: ModId;
    name: string;
    description: string;
    version: `${number}.${number}.${number}`;
};

export type Mod = ModMetadata & { handler: ModHandler };

export const modMetadata = (metadata: OmitFix<ModMetadata, 'id'>): ModMetadata => ({
    id: metadata.name.trim().toLowerCase().replaceAll(' ', '-') as ModId,
    name: metadata.name.trim(),
    description: metadata.description.trim(),
    version: metadata.version
});
