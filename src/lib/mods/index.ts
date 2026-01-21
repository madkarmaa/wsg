export type ModHandler = () => MaybePromise<void>;

export type ModDependency<T extends object = object> = () => MaybePromise<T>;

type TupleToIntersection<T extends readonly unknown[]> = T extends readonly [
    infer Head,
    ...infer Tail
]
    ? Head & TupleToIntersection<Tail>
    : object;

export const withDependencies =
    <const Deps extends readonly ModDependency[]>(...dependencies: Deps) =>
    (
        handler: (
            deps: TupleToIntersection<{
                [K in keyof Deps]: Deps[K] extends ModDependency<infer R> ? Awaited<R> : never;
            }>
        ) => MaybePromise<void>
    ): ModHandler =>
    async () => {
        const results = await Promise.all(dependencies.map((dep) => dep()));
        const deps = Object.assign({}, ...results);
        await handler(deps);
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
