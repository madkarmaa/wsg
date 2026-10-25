import { APP_COLOR, APP_NAME } from './constants';

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

const badge = (background: string) =>
    `background: ${background}; color: black; font-weight: bold; border-radius: 5px;`;

export class Logger {
    /**
     * Returns console format args for a standalone badge.
     * @example logger.errorCustomFmt(...Logger.makeTitle('white', 'Before'), code);
     */
    static makeTitle(color: string, title: string): [string, ...string[]] {
        return ['%c %c %s ', '', badge(color), title];
    }

    constructor(
        public readonly name: string,
        public readonly color = 'white'
    ) {}

    private print(level: LogLevel, levelColor: string, args: unknown[], customFmt = '') {
        console[level](
            `%c ${APP_NAME} %c %c ${this.name} ${customFmt}`,
            badge(levelColor),
            '',
            badge(this.color),
            ...args
        );
    }

    log(...args: unknown[]) {
        this.print('log', APP_COLOR, args);
    }

    info(...args: unknown[]) {
        this.print('info', APP_COLOR, args);
    }

    warn(...args: unknown[]) {
        this.print('warn', '#e5c890', args);
    }

    error(...args: unknown[]) {
        this.print('error', '#e78284', args);
    }

    errorCustomFmt(fmt: string, ...args: unknown[]) {
        this.print('error', '#e78284', args, fmt);
    }

    debug(...args: unknown[]) {
        if (IS_DEV) this.print('debug', '#eebebe', args);
    }
}
