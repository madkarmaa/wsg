export type UnknownRecord = Record<PropertyKey, unknown>;

/** Objects and functions, i.e. anything properties can be read from */
export const isIndexable = (value: unknown): value is UnknownRecord =>
    (typeof value === 'object' || typeof value === 'function') && value !== null;

export const isFunction = (value: unknown): value is (...args: unknown[]) => unknown =>
    typeof value === 'function';
