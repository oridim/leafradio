import { boolean, run, string } from '@drizzle-team/brocli';

import { APPLICATION_VERSION } from '@/shared/configuration/mod.ts';

import type { ConfigureLoggerOptions } from '@/cli/utilities/logger.ts';
import {
    configureLogger,
    LOG_FORMATS,
    LOG_LEVEL_NAMES,
} from '@/cli/utilities/logger.ts';

import COMMAND_PLAYLISTS from '@/cli/commands/playlists.ts';
import COMMAND_SCAN from '@/cli/commands/scan.ts';

const GLOBAL_OPTIONS = {
    logFormat: string('log-format')
        .desc('sets the logging format')
        .enum(
            // **HACK:** `enum` definition function expects at least one non-dynamic
            // string element as the first element. Brocli is trying to enforce that
            // there is at least one string element.
            ...Object.values(LOG_FORMATS) as [string, ...string[]],
        ),

    logLevel: string('log-level')
        .desc('sets the logging level')
        .enum(
            // **HACK:** See above note on `output-format`.
            ...Object.values(LOG_LEVEL_NAMES) as [string, ...string[]],
        ),

    quiet: boolean('quiet')
        .desc('suppresses non-essential log output'),

    verbose: boolean('verbose')
        .desc('enables detailed debug log output'),
} as const;

run(
    [
        COMMAND_PLAYLISTS,
        COMMAND_SCAN,
    ],
    {
        name: 'leafradio',
        version: `v${APPLICATION_VERSION}`,
        description: 'Leaf Radio application CLI.',
        globals: GLOBAL_OPTIONS,

        hook: (event, _command, options) => {
            switch (event) {
                case 'before':
                    configureLogger(options as ConfigureLoggerOptions);
                    break;
            }
        },
    },
);
