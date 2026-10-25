/**
 * WhatsApp's CSP forbids `eval`, but allows inline scripts carrying the page's nonce,
 * and inline scripts run synchronously as soon as they are inserted.
 * Avoiding eval also avoids CSP violation reports, which are sent to WhatsApp with a sample of the code.
 */

const RESULT_KEY = '__wsgEvaluated';

type ResultHolder = Window & { [RESULT_KEY]?: unknown };

let nonce: string | undefined;

function findNonce() {
    // the attribute is hidden once parsed, but the property keeps the value
    nonce ??= [...document.scripts].find((script) => script.nonce)?.nonce;
    return nonce;
}

/**
 * Evaluates a JavaScript expression in the page's global scope and returns its value.
 * @param header A comment placed above the code, visible in DevTools
 * @param sourceURL How the code shows up in DevTools' sources and stack traces
 */
export function evaluateExpression(expression: string, sourceURL: string, header = ''): unknown {
    const currentNonce = findNonce();
    const comment = header && `// ${header}\n`;

    // pages without a CSP don't use nonces
    if (!currentNonce) return (0, eval)(`${comment}${expression}\n//# sourceURL=${sourceURL}`);

    const holder = window as ResultHolder;
    let error: unknown;
    const onError = (event: ErrorEvent) => {
        error = event.error ?? new SyntaxError(event.message);
        event.preventDefault();
    };

    const script = document.createElement('script');
    script.nonce = currentNonce;
    script.textContent = `${comment}window.${RESULT_KEY}=(${expression}\n);\n//# sourceURL=${sourceURL}`;

    // errors thrown by the script are reported as window error events rather than thrown here
    window.addEventListener('error', onError);
    try {
        document.documentElement.append(script);
    } finally {
        window.removeEventListener('error', onError);
        script.remove();
    }

    const result = holder[RESULT_KEY];
    delete holder[RESULT_KEY];

    if (error !== undefined) throw error;
    return result;
}
