import { createConsola, LogLevels } from 'consola';

const LOGGER = createConsola({
    level: LogLevels.info,
});

export const LOG_LEVEL_NAMES = {
    debug: 'debug',

    error: 'error',

    fatal: 'fatal',

    info: 'info',

    silent: 'silent',

    trace: 'trace',

    warn: 'warn',
} as const;

export type LogLevelNames =
    typeof LOG_LEVEL_NAMES[keyof typeof LOG_LEVEL_NAMES];

export interface ConfigureLoggerOptions {
    readonly logLevel?: string;

    readonly quiet?: boolean;

    readonly verbose?: boolean;
}

export function configureLogger(options: ConfigureLoggerOptions): void {
    const { logLevel, quiet, verbose } = options;

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
