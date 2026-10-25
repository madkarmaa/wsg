const styles = new Map<string, HTMLStyleElement>();

// at document_start <head> may not exist yet, but <html> always does
const styleRoot = () => document.head ?? document.documentElement;

/** Injects the CSS, unless it is already injected. Returns false if it was */
export function enableStyle(css: string) {
    if (styles.has(css)) return false;

    const style = document.createElement('style');
    style.dataset.wsg = '';
    style.textContent = css;
    styleRoot().append(style);
    styles.set(css, style);
    return true;
}

/** Removes CSS injected with {@link enableStyle}. Returns false if it wasn't injected */
export function disableStyle(css: string) {
    const style = styles.get(css);
    if (!style) return false;

    style.remove();
    styles.delete(css);
    return true;
}

export const isStyleEnabled = (css: string) => styles.has(css);
