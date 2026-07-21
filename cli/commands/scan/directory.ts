import { resolve } from '@std/path';

import { command, positional } from '@drizzle-team/brocli';

import { withEntityManager } from '@/shared/database/mod.ts';
import { scanDirectory } from '@/shared/pipelines/mod.ts';

import { EXIT_CODES } from '@/cli/utilities/process.ts';

const COMMAND_OPTIONS = {
    directoryPath: positional('directory-path').desc(
        'directory path to scan for audio files',
    )
        .required(),
} as const;

export default command({
    name: 'directory',
    desc: 'Scans a directory of audio files to preprocess them.',
    options: COMMAND_OPTIONS,

    handler: withEntityManager(async ({ directoryPath }) => {
        const resolvedDirectoryPath = resolve(directoryPath);

        console.log(
            `[LeafRadio] Scanning '${directoryPath}'...`,
        );

        const success = await scanDirectory(resolvedDirectoryPath);

        if (!success) {
            console.error('[LeafRadio] Scan failed due to an error.');
            Deno.exit(EXIT_CODES.badScan);
        }

        console.log('[LeafRadio] Scanning finished!');
    }),
});
