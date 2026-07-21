import { resolve } from '@std/path';

import { boolean, command, positional } from '@drizzle-team/brocli';

import {
    ENTITY_MANAGER,
    ENTITY_REPOSITORY,
    REPOSITORY_SCAN_STATES,
    withEntityManager,
} from '@/shared/database/mod.ts';
import { scanRepository } from '@/shared/pipelines/mod.ts';

import { EXIT_CODES } from '@/cli/utilities/process.ts';

const COMMAND_OPTIONS = {
    identifier: positional().desc(
        'repository ID to delete',
    )
        .required(),
    resolveDirectoryPath: boolean('resolve-directory-path').desc(
        'enables resolving the repository lookup by directoy path rather than repository ID',
    ).default(false),
} as const;

export default command({
    name: 'directory',
    desc: 'Scans a directory of audio files to preprocess them.',
    options: COMMAND_OPTIONS,

    handler: withEntityManager(async ({ identifier, resolveDirectoryPath }) => {
        const repository = await ENTITY_MANAGER.findOne(
            ENTITY_REPOSITORY,
            resolveDirectoryPath
                ? { directoryPath: resolve(identifier) }
                : { repositoryID: parseInt(identifier) },
        );

        if (!repository) {
            console.error(
                `Invalid value: value for the argument 'identifier' was not found`,
            );

            Deno.exit(EXIT_CODES.invalidOptions);
        }

        const { directoryPath, repositoryID, scanState } = repository;

        if (
            ([
                REPOSITORY_SCAN_STATES.processingFiles,
                REPOSITORY_SCAN_STATES.scanningDirectory,
            ] as string[]).includes(scanState)
        ) {
            console.error(
                `Invalid value: value for the argument 'identifier' was already being scanned`,
            );

            Deno.exit(EXIT_CODES.invalidScanState);
        }

        console.log(
            `[LeafRadio] Scanning repository '${repositoryID}' ('${directoryPath}')...`,
        );

        const success = await scanRepository(repositoryID);

        if (!success) {
            console.error('[LeafRadio] Scan failed due to an error.');
            Deno.exit(EXIT_CODES.badScan);
        }

        console.log('[LeafRadio] Scanning finished!');
    }),
});
