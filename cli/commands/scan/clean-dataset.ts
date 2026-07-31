import { exists } from '@std/fs';
import { join, resolve } from '@std/path';

import { command, positional, string } from '@drizzle-team/brocli';

import { FILE_NAME_AUDIO_DATA } from '@/shared/configuration/filesystem.ts';
import type {
    AudioData,
    AudioFile,
    ProcessedMetadata,
} from '@/shared/models/mod.ts';
import { readAudioData, writeAudioData } from '@/shared/models/mod.ts';

import LOGGER from '@/cli/utilities/logger.ts';
import { EXIT_CODES } from '@/cli/utilities/process.ts';

const COMMAND_OPTIONS = {
    directoryPath: positional('directory-path')
        .desc('directory path containing the audio data file to clean')
        .required(),

    audioDataFile: string('audio-data-file')
        .desc('sets the file to use as the audio data lookup'),
} as const;

function compareLexically(a: string, b: string): number {
    return a < b ? -1 : a > b ? 1 : 0;
}

async function findRemainingAudioFiles(
    directoryPath: string,
    audioFiles: Readonly<Record<string, AudioFile>>,
): Promise<AudioFile[]> {
    const remainingAudioFiles = await Promise.all(
        Object
            .values(audioFiles)
            .map(async (audioFile) => {
                const absoluteFilePath = join(
                    directoryPath,
                    audioFile.filePath,
                );

                return (await exists(absoluteFilePath, { isFile: true }))
                    ? audioFile
                    : undefined;
            }),
    );

    return remainingAudioFiles
        .filter((audioFile) => audioFile !== undefined)
        .sort((audioFileA, audioFileB) =>
            compareLexically(
                audioFileA.filePath.toLowerCase(),
                audioFileB.filePath.toLowerCase(),
            )
        );
}

function findRemainingProcessedMetadata(
    processedMetadata: Readonly<Record<string, ProcessedMetadata>>,
    remainingPCMHashes: ReadonlySet<string>,
): ProcessedMetadata[] {
    return Object
        .values(processedMetadata)
        .filter((metadata) => remainingPCMHashes.has(metadata.pcmHash))
        .sort((metadataA, metadataB) =>
            compareLexically(metadataA.pcmHash, metadataB.pcmHash)
        );
}

export default command({
    name: 'clean-dataset',
    desc:
        "Purges stale entries from a directory's audio data file and sorts it.",
    options: COMMAND_OPTIONS,

    handler: async ({ audioDataFile, directoryPath }) => {
        const resolvedDirectoryPath = resolve(directoryPath);
        const resolvedAudioDataFile = audioDataFile ??
            join(resolvedDirectoryPath, FILE_NAME_AUDIO_DATA);

        LOGGER.info(
            `Cleaning dataset '${resolvedAudioDataFile}'...`,
        );

        let audioData: AudioData;

        try {
            audioData = await readAudioData(resolvedAudioDataFile);
        } catch {
            LOGGER.error(
                `Failed to load audio data file '${resolvedAudioDataFile}'.`,
            );

            Deno.exit(EXIT_CODES.invalidOptions);
        }

        const originalAudioFileCount =
            Object.values(audioData.audioFiles).length;

        const originalMetadataCount =
            Object.values(audioData.processedMetadata).length;

        const sortedAudioFiles = await findRemainingAudioFiles(
            resolvedDirectoryPath,
            audioData.audioFiles as Record<string, AudioFile>,
        );

        const remainingPCMHashes = new Set(
            sortedAudioFiles.map((audioFile) => audioFile.pcmHash),
        );

        const sortedProcessedMetadata = findRemainingProcessedMetadata(
            audioData.processedMetadata as Record<string, ProcessedMetadata>,
            remainingPCMHashes,
        );

        const cleanedAudioData: AudioData = {
            audioFiles: Object.fromEntries(
                sortedAudioFiles.map((audioFile) => [
                    audioFile.filePath,
                    audioFile,
                ]),
            ),

            processedMetadata: Object.fromEntries(
                sortedProcessedMetadata.map((metadata) => [
                    metadata.pcmHash,
                    metadata,
                ]),
            ),
        };

        await writeAudioData(resolvedAudioDataFile, cleanedAudioData);

        LOGGER.info(
            `Purged '${
                originalAudioFileCount - sortedAudioFiles.length
            }' audio file(s) and '${
                originalMetadataCount - sortedProcessedMetadata.length
            }' processed metadata entr(y/ies).`,
        );

        LOGGER.info('Clean finished!');
    },
});
