import type { ComponentType } from 'react';

export type ReplaceFn = (match: string, ...groups: string[]) => string;

export interface PatchReplacement {
    /**
     * What to replace in the module source. Strings are matched literally.
     * In RegExps, `\i` matches any identifier, which keeps patches resilient to minified name changes.
     */
    match: string | RegExp;
    /** The replacement. `$self` is replaced with a reference to the plugin object. */
    replace: string | ReplaceFn;
    /** Don't warn if this replacement had no effect */
    noWarn?: boolean;
    /** Evaluated when the patch is registered; the replacement is dropped if this returns false */
    predicate?(): boolean;
}

interface PatchBase {
    /** The replacement(s) to apply to the matched module's factory source */
    replacement: PatchReplacement | PatchReplacement[];
    /** Keep the patch around after the first match and apply it to every matching module */
    all?: boolean;
    /** Don't warn if this patch had no effect */
    noWarn?: boolean;
    /** Only apply the replacements if all of them succeed. Use this if they depend on each other */
    group?: boolean;
    /** Evaluated when the patch is registered; the patch is dropped if this returns false */
    predicate?(): boolean;
}

/**
 * WhatsApp modules have stable, human readable ids (e.g. `WAWebABProps`), so most patches should target one directly.
 * `find` matches against the factory source instead, which is useful to patch every module containing some code.
 * If both are set, a module has to satisfy both.
 */
export type PatchDef = PatchBase &
    (
        | { module: string | RegExp; find?: string | RegExp }
        | { module?: string | RegExp; find: string | RegExp }
    );

export type Patch = PatchDef & { plugin: string; replacement: PatchReplacement[] };

export interface PluginAuthor {
    name: string;
    /** GitHub username */
    github?: string;
}

export const enum StartAt {
    /** As soon as WSG initialises, before any WhatsApp code runs */
    Init = 'Init',
    /** Once the document has been parsed */
    DOMContentLoaded = 'DOMContentLoaded',
    /** Once WhatsApp's core modules (React, ReactDOM) have loaded */
    ModulesReady = 'ModulesReady'
}

export interface PluginDef {
    name: string;
    description: string;
    authors: PluginAuthor[];
    /** Additional terms that bring up this plugin when searching in the settings */
    searchTerms?: string[];
    start?(): void;
    stop?(): void;
    patches?: PatchDef[];
    /** Plugins this plugin depends on. They are enabled automatically */
    dependencies?: string[];
    /** Forcefully enabled, can't be disabled */
    required?: boolean;
    /** Hidden from the settings UI */
    hidden?: boolean;
    /** Enabled unless the user disables it */
    enabledByDefault?: boolean;
    /**
     * Whether toggling this plugin requires reloading WhatsApp.
     * Defaults to true if the plugin has patches, since those can only be applied before a module loads.
     */
    requiresRestart?: boolean;
    /**
     * When to call {@link start}
     * @default StartAt.ModulesReady
     */
    startAt?: StartAt;
    settings?: DefinedSettings;
    /** Extra component rendered at the top of this plugin's settings */
    settingsAboutComponent?: ComponentType;
    /** CSS injected while the plugin is running */
    managedStyle?: string;
}

export interface Plugin extends PluginDef {
    started: boolean;
    /** Enabled because another enabled plugin depends on it */
    isDependency?: boolean;
}

/**
 * Identity function that gives plugin definitions proper typing.
 * Extra properties are kept (and typed), so the plugin object can hold helpers referenced from patches via `$self`.
 */
export default function definePlugin<P extends PluginDef>(plugin: P): P & Plugin {
    // `started` is set when the plugin is registered
    return plugin as P & Plugin;
}

export const enum OptionType {
    STRING,
    NUMBER,
    BOOLEAN,
    SELECT,
    SLIDER,
    COMPONENT,
    CUSTOM
}

interface SettingDefCommon<T> {
    description: string;
    /** Called after the value changes */
    onChange?(newValue: T): void;
    /** Whether changing this setting requires reloading WhatsApp */
    restartNeeded?: boolean;
    hidden?: boolean | (() => boolean);
    disabled?: boolean | (() => boolean);
}

interface Validated<T> {
    /** Return true if valid, or a string describing the problem */
    isValid?(value: T): boolean | string;
}

export interface StringSettingDef extends SettingDefCommon<string>, Validated<string> {
    type: OptionType.STRING;
    default?: string;
    placeholder?: string;
    multiline?: boolean;
}

export interface NumberSettingDef extends SettingDefCommon<number>, Validated<number> {
    type: OptionType.NUMBER;
    default?: number;
    placeholder?: string;
}

export interface BooleanSettingDef extends SettingDefCommon<boolean> {
    type: OptionType.BOOLEAN;
    default?: boolean;
}

export interface SelectOption<V extends string | number | boolean = string | number | boolean> {
    label: string;
    value: V;
    default?: boolean;
}

export interface SelectSettingDef extends SettingDefCommon<SelectOption['value']> {
    type: OptionType.SELECT;
    options: readonly SelectOption[];
}

export interface SliderSettingDef extends SettingDefCommon<number> {
    type: OptionType.SLIDER;
    /** Values shown as markers on the slider. Needs at least two */
    markers: readonly number[];
    default: number;
    /** Only allow selecting the marker values */
    stickToMarkers?: boolean;
}

export interface ComponentSettingProps {
    /** The stored value. It was persisted as JSON, so validate it before use */
    value: unknown;
    setValue(newValue: unknown): void;
}

export interface ComponentSettingDef extends Omit<SettingDefCommon<unknown>, 'description'> {
    type: OptionType.COMPONENT;
    description?: string;
    component: ComponentType<ComponentSettingProps>;
    default?: unknown;
}

/** A setting that is persisted but never shown in the UI */
export interface CustomSettingDef {
    type: OptionType.CUSTOM;
    default?: unknown;
    onChange?(newValue: unknown): void;
}

export type SettingDef =
    | StringSettingDef
    | NumberSettingDef
    | BooleanSettingDef
    | SelectSettingDef
    | SliderSettingDef
    | ComponentSettingDef
    | CustomSettingDef;

export type SettingsDefinition = Record<string, SettingDef>;

/** Maps a setting definition to the type of its value */
export type SettingType<D extends SettingDef> = D extends StringSettingDef
    ? string
    : D extends NumberSettingDef | SliderSettingDef
      ? number
      : D extends BooleanSettingDef
        ? boolean
        : D extends SelectSettingDef
          ? D['options'][number]['value']
          : D extends { default: infer T }
            ? T
            : unknown;

export type SettingsValues<D extends SettingsDefinition> = { [K in keyof D]: SettingType<D[K]> };

export interface DefinedSettings<
    D extends SettingsDefinition = SettingsDefinition,
    Private extends object = Record<never, never>
> {
    def: D;
    /** Reactive store. Writes are persisted and notify listeners */
    store: SettingsValues<D> & Private;
    /** Plain object. Writes are neither persisted nor notified */
    plain: SettingsValues<D> & Private;
    /**
     * React hook returning the store, re-rendering when one of the given (or any) settings change
     */
    use<K extends Extract<keyof D | keyof Private, string>>(
        keys?: K[]
    ): Pick<SettingsValues<D> & Private, K>;
    /** Name of the owning plugin, set when the plugin manager initialises */
    pluginName: string;
    /** Extend the store type with settings that aren't shown in the UI */
    withPrivateSettings<T extends object>(): DefinedSettings<D, T>;
}
