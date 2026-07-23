import { resolve } from '@std/path';

import { command, positional, string } from '@drizzle-team/brocli';

import { FILE_AUDIO_DATA } from '@/shared/configuration/mod.ts';
import { scanDirectory } from '@/shared/pipelines/mod.ts';

import { EXIT_CODES } from '@/cli/utilities/process.ts';
import LOGGER from '@/cli/utilities/logger.ts';

const COMMAND_OPTIONS = {
    directoryPath: positional('directory-path')
        .desc('directory path to scan for audio files')
        .required(),

    audioDataFile: string('audio-data-file')
        .desc('sets the file to store the audio data lookup')
        .default(FILE_AUDIO_DATA),
} as const;

export default command({
    name: 'directory',
    desc: 'Scans a directory of audio files to preprocess them.',
    options: COMMAND_OPTIONS,

    handler: async ({ audioDataFile, directoryPath }) => {
        const resolvedDirectoryPath = resolve(directoryPath);

        LOGGER.info(
            `Scanning '${directoryPath}'...`,
        );

        const success = await scanDirectory(
            audioDataFile,
            resolvedDirectoryPath,
        );

        if (!success) {
            LOGGER.error('Scan failed due to an error.');
            Deno.exit(EXIT_CODES.badScan);
        }

        LOGGER.info('Scanning finished!');
    },
});
