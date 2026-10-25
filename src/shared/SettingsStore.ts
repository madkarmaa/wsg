export const SYM_IS_PROXY = Symbol('SettingsStore.isProxy');
export const SYM_RAW_TARGET = Symbol('SettingsStore.rawTarget');

type UnknownRecord = Record<PropertyKey, unknown>;

type PathListener = (value: unknown) => void;
type PrefixListener = (value: unknown, path: string) => void;
type GlobalListener<T> = (root: T, path: string) => void;

export interface DefaultValueContext {
    target: UnknownRecord;
    key: string;
    /** Dot separated path of `target` */
    path: string;
}

const isRecord = (value: unknown): value is UnknownRecord =>
    typeof value === 'object' && value !== null;

const isStoreProxy = (value: unknown): value is UnknownRecord =>
    isRecord(value) && value[SYM_IS_PROXY] === true;

/**
 * A deeply reactive store. Writes through {@link store} notify listeners of the written path, its prefixes,
 * and global listeners. {@link plain} is the same data without any of that.
 */
export class SettingsStore<T extends object> {
    private readonly pathListeners = new Map<string, Set<PathListener>>();
    private readonly prefixListeners = new Map<string, Set<PrefixListener>>();
    private readonly globalListeners = new Set<GlobalListener<T>>();

    readonly store: T;

    constructor(
        readonly plain: T,
        private readonly getDefaultValue?: (ctx: DefaultValueContext) => unknown
    ) {
        this.store = this.makeProxy(plain, '');
    }

    private makeProxy<O extends object>(object: O, path: string): O {
        const self = this;
        const childPath = (key: string) => (path ? `${path}.${key}` : key);

        const handler: ProxyHandler<UnknownRecord> = {
            get(target, key) {
                if (key === SYM_IS_PROXY) return true;
                if (key === SYM_RAW_TARGET) return target;

                let value = target[key];
                if (typeof key !== 'string') return value;

                if (!(key in target) && self.getDefaultValue)
                    value = self.getDefaultValue({ target, key, path });

                return isRecord(value) && !isStoreProxy(value)
                    ? self.makeProxy(value, childPath(key))
                    : value;
            },
            set(target, key, value: unknown) {
                const raw = isStoreProxy(value) ? value[SYM_RAW_TARGET] : value;
                if (target[key] === raw) return true;

                target[key] = raw;
                if (typeof key === 'string') self.notify(childPath(key), raw);
                return true;
            },
            deleteProperty(target, key) {
                if (!(key in target)) return true;

                delete target[key];
                if (typeof key === 'string') self.notify(childPath(key), undefined);
                return true;
            }
        };

        // every object is indexable at runtime, the cast only widens what the handler may read
        return new Proxy(object as unknown as UnknownRecord, handler) as unknown as O;
    }

    private notify(path: string, value: unknown) {
        for (const listener of this.globalListeners) listener(this.plain, path);
        for (const listener of this.pathListeners.get(path) ?? []) listener(value);

        const segments = path.split('.');
        for (let i = 1; i <= segments.length; i++) {
            const prefix = segments.slice(0, i).join('.');
            for (const listener of this.prefixListeners.get(prefix) ?? []) listener(value, path);
        }
    }

    /** Fires whenever any setting changes */
    addGlobalChangeListener(listener: GlobalListener<T>) {
        this.globalListeners.add(listener);
    }

    removeGlobalChangeListener(listener: GlobalListener<T>) {
        this.globalListeners.delete(listener);
    }

    /** Fires when exactly this path is written, e.g. `plugins.Foo.enabled` */
    addChangeListener(path: string, listener: PathListener) {
        let listeners = this.pathListeners.get(path);
        if (!listeners) this.pathListeners.set(path, (listeners = new Set()));
        listeners.add(listener);
    }

    removeChangeListener(path: string, listener: PathListener) {
        const listeners = this.pathListeners.get(path);
        listeners?.delete(listener);
        if (listeners?.size === 0) this.pathListeners.delete(path);
    }

    /** Fires when this path or anything below it is written, e.g. `plugins.Foo` */
    addPrefixChangeListener(prefix: string, listener: PrefixListener) {
        let listeners = this.prefixListeners.get(prefix);
        if (!listeners) this.prefixListeners.set(prefix, (listeners = new Set()));
        listeners.add(listener);
    }

    removePrefixChangeListener(prefix: string, listener: PrefixListener) {
        const listeners = this.prefixListeners.get(prefix);
        listeners?.delete(listener);
        if (listeners?.size === 0) this.prefixListeners.delete(prefix);
    }

    /** Notifies global listeners without changing anything, e.g. after mutating {@link plain} */
    markAsChanged() {
        for (const listener of this.globalListeners) listener(this.plain, '');
    }
}
