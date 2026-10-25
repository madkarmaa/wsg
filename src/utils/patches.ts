import type { PatchDef, Patch, PatchReplacement, ReplaceFn } from './types';

const IDENTIFIER = String.raw`(?:[A-Za-z_$][\w$]*)`;

/** Expands `\i` in RegExps into a pattern matching any identifier. Strings are returned as is */
export function canonicalizeMatch<T extends string | RegExp>(match: T): T {
    if (typeof match === 'string') return match;

    const source = match.source.replaceAll(/(\\*)\\i/g, (whole, escapes: string) =>
        // an even number of preceding backslashes means `\i` itself isn't escaped
        escapes.length % 2 === 0 ? escapes + IDENTIFIER : whole.slice(1)
    );

    const canonical = new RegExp(source, match.flags);
    canonical.toString = match.toString.bind(match);
    return canonical as T;
}

/** Replaces `$self` with an expression evaluating to the plugin object */
export function canonicalizeReplace<T extends string | ReplaceFn>(replace: T, selfRef: string): T {
    if (typeof replace === 'string') return replace.replaceAll('$self', selfRef) as T;

    return ((...args: Parameters<ReplaceFn>) => replace(...args).replaceAll('$self', selfRef)) as T;
}

export function pluginSelfRef(pluginName: string) {
    return `WSG.Plugins.plugins[${JSON.stringify(pluginName)}]`;
}

/** Normalises a plugin's patch definition into a registrable patch, or returns null if its predicate fails */
export function canonicalizePatch(def: PatchDef, pluginName: string): Patch | null {
    if (def.predicate && !def.predicate()) return null;

    const selfRef = pluginSelfRef(pluginName);
    const replacements = (Array.isArray(def.replacement) ? def.replacement : [def.replacement])
        .filter((r) => !r.predicate || r.predicate())
        .map((r): PatchReplacement => ({
            ...r,
            match: canonicalizeMatch(r.match),
            replace: canonicalizeReplace(r.replace, selfRef)
        }));

    return {
        ...def,
        plugin: pluginName,
        find: def.find != null ? canonicalizeMatch(def.find) : undefined,
        replacement: replacements
    } as Patch;
}
