import type { ConsolaReporter, LogObject } from 'consola';
import { createConsola, LogLevels } from 'consola';

import { APPLICATION_NAME } from '@/shared/configuration/application.ts';

const LOGGER = createConsola({
    defaults: {
        tag: APPLICATION_NAME,
    },

    level: LogLevels.info,
});

const REPORTER_JSONL: ConsolaReporter = {
    log(logObj: LogObject) {
        const { args, date, tag, type } = logObj;

        let message = '';
        const metadata: Record<string, unknown> = {};

        for (const arg of args) {
            if (arg instanceof Error) {
                metadata['error'] = {
                    name: arg.name,
                    message: arg.message,
                    stack: arg.stack,
                };
            } else if (typeof arg === 'object' && arg !== null) {
                Object.assign(metadata, arg);
            } else {
                message = message ? `${message} ${String(arg)}` : String(arg);
            }
        }

        const entry = {
            level: type,
            time: date.toISOString(),
            ...(tag ? { tag } : {}),
            ...(message ? { msg: message } : {}),
            ...metadata,
        };

        console.log(JSON.stringify(entry));
    },
};

export const LOG_FORMATS = {
    human: 'human',

    jsonl: 'jsonl',
} as const;

export const LOG_LEVEL_NAMES = {
    debug: 'debug',

    error: 'error',

    fatal: 'fatal',

    info: 'info',

    silent: 'silent',

    trace: 'trace',

    warn: 'warn',
} as const;

export type LogFormats = typeof LOG_FORMATS[keyof typeof LOG_FORMATS];

export type LogLevelNames =
    typeof LOG_LEVEL_NAMES[keyof typeof LOG_LEVEL_NAMES];

export interface ConfigureLoggerOptions {
    readonly logFormat?: LogFormats;

    readonly logLevel?: string;

    readonly quiet?: boolean;

    readonly verbose?: boolean;
}

export function configureLogger(options: ConfigureLoggerOptions): void {
    const { logFormat, logLevel, quiet, verbose } = options;

    switch (logFormat) {
        case LOG_FORMATS.jsonl:
            LOGGER.setReporters([REPORTER_JSONL]);
            break;
    }

    if (quiet) {
        LOGGER.level = LogLevels.error;
        return;
    }

    if (verbose) {
        LOGGER.level = LogLevels.debug;
        return;
    }

    if (!logLevel) {
        return;
    }

    switch (logLevel) {
        case LOG_LEVEL_NAMES.debug:
            LOGGER.level = LogLevels.debug;
            break;

        case LOG_LEVEL_NAMES.error:
        case LOG_LEVEL_NAMES.fatal:
            LOGGER.level = LogLevels.error;
            break;

        case LOG_LEVEL_NAMES.info:
            LOGGER.level = LogLevels.info;
            break;

        case LOG_LEVEL_NAMES.silent:
            LOGGER.level = LogLevels.silent;
            break;

        case LOG_LEVEL_NAMES.trace:
            LOGGER.level = LogLevels.trace;
            break;

        case LOG_LEVEL_NAMES.warn:
            LOGGER.level = LogLevels.warn;
            break;
    }

    throw new Error(
        `bad option 'ConfigureLoggerOptions.logLevel' to 'configureLogger' (log level '${logLevel}' not supported)`,
    );
}

export default LOGGER;
