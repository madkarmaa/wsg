/**
 * WhatsApp gates features behind server-side A/B test props, read through `WAWebABProps.getABPropConfigValue`.
 * The ABPropsAPI plugin patches it to consult these overrides first.
 */

export type ABPropValue = boolean | number | string;

const overrides = new Map<string, ABPropValue>();

export function setABPropOverride(name: string, value: ABPropValue) {
    overrides.set(name, value);
}

export function removeABPropOverride(name: string) {
    overrides.delete(name);
}

export function getABPropOverride(name: string): ABPropValue | undefined {
    return overrides.get(name);
}

export function getABPropOverrides(): ReadonlyMap<string, ABPropValue> {
    return overrides;
}
