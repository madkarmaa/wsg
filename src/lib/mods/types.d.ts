export type ModHandler = () => MaybePromise<void>;

export type ModDependency<T extends object = object> = () => MaybePromise<T>;

type TupleToIntersection<T extends readonly unknown[]> = T extends readonly [
    infer Head,
    ...infer Tail
]
    ? Head & TupleToIntersection<Tail>
    : object;

export type DepsTuple<Deps extends readonly ModDependency[]> = TupleToIntersection<{
    [K in keyof Deps]: Deps[K] extends ModDependency<infer R> ? Awaited<R> : never;
}>;

export type ModId = Brand<string, 'mod-id'>;

export type ModMetadata = {
    id: ModId;
    name: string;
    description: string;
    version: `${number}.${number}.${number}`;
};

export type Mod = ModMetadata & { handler: ModHandler };
