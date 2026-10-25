import { Switch, Text, useState } from '@modules/common';
import { OptionType, type Plugin, type SettingDef } from '@utils/types';
import type { ChangeEvent } from 'react';

const resolveFlag = (flag?: boolean | (() => boolean)) =>
    typeof flag === 'function' ? flag() : Boolean(flag);

export const isSettingHidden = (def: SettingDef) =>
    def.type === OptionType.CUSTOM || resolveFlag(def.hidden);

/** `showCat` -> `Show Cat` */
const toDisplayName = (key: string) =>
    key.replace(/([a-z\d])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());

interface SettingProps<D extends SettingDef = SettingDef> {
    id: string;
    def: D;
    value: unknown;
    disabled: boolean;
    onChange(value: unknown): void;
}

function validate(def: SettingDef, value: string | number): string | null {
    let result: boolean | string = true;

    if (def.type === OptionType.STRING && typeof value === 'string')
        result = def.isValid?.(value) ?? true;
    else if (def.type === OptionType.NUMBER && typeof value === 'number')
        result = def.isValid?.(value) ?? true;

    if (result === true) return null;
    return typeof result === 'string' ? result : 'Invalid value';
}

/** Text based input that only commits values that pass validation */
function TextSetting({ id, def, value, disabled, onChange }: SettingProps) {
    const isNumber = def.type === OptionType.NUMBER;
    const [draft, setDraft] = useState(String(value ?? ''));
    const [error, setError] = useState<string | null>(null);

    const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const text = event.currentTarget.value;
        setDraft(text);

        const parsed = isNumber ? Number(text) : text;
        const err = isNumber && Number.isNaN(parsed) ? 'Not a number' : validate(def, parsed);
        setError(err);
        if (!err) onChange(parsed);
    };

    const placeholder = 'placeholder' in def ? def.placeholder : undefined;
    const multiline = def.type === OptionType.STRING && def.multiline;

    return (
        <>
            {multiline ? (
                <textarea
                    id={id}
                    className="wsg-input"
                    rows={4}
                    value={draft}
                    placeholder={placeholder}
                    disabled={disabled}
                    onChange={handleChange}
                />
            ) : (
                <input
                    id={id}
                    className="wsg-input"
                    type={isNumber ? 'number' : 'text'}
                    value={draft}
                    placeholder={placeholder}
                    disabled={disabled}
                    onChange={handleChange}
                />
            )}
            {error && <span className="wsg-setting-error">{error}</span>}
        </>
    );
}

function SettingControl(props: SettingProps) {
    const { id, def, value, disabled, onChange } = props;

    switch (def.type) {
        case OptionType.STRING:
        case OptionType.NUMBER:
            return <TextSetting {...props} />;

        case OptionType.SELECT:
            return (
                <select
                    id={id}
                    className="wsg-input"
                    value={String(value)}
                    disabled={disabled}
                    onChange={(e) =>
                        onChange(
                            def.options.find((o) => String(o.value) === e.currentTarget.value)
                                ?.value
                        )
                    }
                >
                    {def.options.map((option) => (
                        <option key={String(option.value)} value={String(option.value)}>
                            {option.label}
                        </option>
                    ))}
                </select>
            );

        case OptionType.SLIDER: {
            const min = Math.min(...def.markers);
            const max = Math.max(...def.markers);
            const listId = `${id}-markers`;
            const current = typeof value === 'number' ? value : def.default;

            return (
                <div className="wsg-slider">
                    <input
                        id={id}
                        type="range"
                        min={min}
                        max={max}
                        step={def.stickToMarkers ? undefined : 'any'}
                        list={listId}
                        value={current}
                        disabled={disabled}
                        onChange={(e) => {
                            const raw = Number(e.currentTarget.value);
                            onChange(
                                def.stickToMarkers
                                    ? def.markers.reduce((a, b) =>
                                          Math.abs(b - raw) < Math.abs(a - raw) ? b : a
                                      )
                                    : raw
                            );
                        }}
                    />
                    <datalist id={listId}>
                        {def.markers.map((m) => (
                            <option key={m} value={m} />
                        ))}
                    </datalist>
                    <Text type="Body2" colorName="contentDeemphasized">
                        {Math.round(current * 100) / 100}
                    </Text>
                </div>
            );
        }

        case OptionType.COMPONENT: {
            const Component = def.component;
            return <Component value={value} setValue={onChange} />;
        }

        default:
            return null;
    }
}

interface PluginSettingsProps {
    plugin: Plugin;
    onRestartNeeded(): void;
}

export function PluginSettings({ plugin, onRestartNeeded }: PluginSettingsProps) {
    const settings = plugin.settings!;
    // indexed by the keys of settings.def, whose values are typed through the definitions
    const store: Record<string, unknown> = settings.use();
    const About = plugin.settingsAboutComponent;

    return (
        <div className="wsg-plugin-settings">
            {About && <About />}

            {Object.entries(settings.def).map(([key, def]) => {
                if (isSettingHidden(def) || def.type === OptionType.CUSTOM) return null;

                const id = `wsg-setting-${plugin.name}-${key}`;
                const disabled = resolveFlag(def.disabled);
                const onChange = (value: unknown) => {
                    store[key] = value;
                    if (def.restartNeeded) onRestartNeeded();
                };

                if (def.type === OptionType.BOOLEAN)
                    return (
                        <div key={key} className="wsg-setting wsg-setting-inline">
                            <label htmlFor={id} className="wsg-setting-label">
                                <Text type="Body2Emphasized">{toDisplayName(key)}</Text>
                                <Text type="Body3" colorName="contentDeemphasized">
                                    {def.description}
                                </Text>
                            </label>
                            <Switch
                                value={Boolean(store[key])}
                                onChange={onChange}
                                disabled={disabled}
                                aria-label={toDisplayName(key)}
                            />
                        </div>
                    );

                return (
                    <div key={key} className="wsg-setting">
                        <label htmlFor={id} className="wsg-setting-label">
                            <Text type="Body2Emphasized">{toDisplayName(key)}</Text>
                            {def.description && (
                                <Text type="Body3" colorName="contentDeemphasized">
                                    {def.description}
                                </Text>
                            )}
                        </label>
                        <SettingControl
                            id={id}
                            def={def}
                            value={store[key]}
                            disabled={disabled}
                            onChange={onChange}
                        />
                    </div>
                );
            })}
        </div>
    );
}
