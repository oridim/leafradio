import { join } from '@std/path';

import {
    boolean,
    command,
    number,
    positional,
    string,
} from '@drizzle-team/brocli';

import type { Track } from '@/lib/playlist-packer/mod.ts';
import {
    deserializePackPlaylistBucketsParameters,
    packPlaylistBuckets,
    serializeBucketsToPlaylist,
} from '@/lib/playlist-packer/mod.ts';

import {
    ENTITY_AUDIO_FILE,
    ENTITY_MANAGER,
    ENTITY_RADIO,
    withEntityManager,
} from '@/shared/database/mod.ts';

import { EXIT_CODES } from '@/cli/utilities/process.ts';

const COMMAND_OPTIONS = {
    radioIdentifier: positional('radio-identifier').desc(
        'radio ID to lookup',
    ).required(),

    resolveName: boolean('resolve-name').desc(
        'enables resolving the radio lookup by name rather than radio ID',
    ).default(false),

    outputFile: string('output-file').desc(
        'sets the file to output the playlist to',
    ),

    targetDurationPerBucket: number('target-duration-per-bucket').desc(
        'sets the max possible cumulative duration of individual buckets',
    ),
} as const;

export default command({
    name: 'generate',
    desc: 'Generates a M3U playlist based on a radio.',
    options: COMMAND_OPTIONS,

    handler: withEntityManager(
        async (
            {
                radioIdentifier,
                resolveName,
                outputFile,
                targetDurationPerBucket,
            },
        ) => {
            const radio = await ENTITY_MANAGER.findOne(
                ENTITY_RADIO,
                resolveName
                    ? {
                        name: radioIdentifier,
                    }
                    : {
                        radioID: parseInt(radioIdentifier),
                    },
            );

            if (!radio) {
                console.error(
                    `Invalid value: value for the argument 'radio-identifier' was not found`,
                );

                Deno.exit(EXIT_CODES.invalidOptions);
            }

            const {
                name,
                radioID,
                packPlaylistBucketsParameters:
                    serializedPackPlaylistBucketsParameters,
            } = radio;

            const packPlaylistBucketsParameters =
                serializedPackPlaylistBucketsParameters
                    ? deserializePackPlaylistBucketsParameters(
                        serializedPackPlaylistBucketsParameters,
                    )
                    : {};

            const audioFiles = await ENTITY_MANAGER.find(ENTITY_AUDIO_FILE, {
                repository: {
                    radios: {
                        radioID: radioID,
                    },
                },
            }, {
                populate: ['musicalFeatures', 'repository'],
            });

            const tracks = audioFiles.map<Track>((audioFile) => {
                const { musicalFeatures, relativeFilePath, repository } =
                    audioFile;

                const { directoryPath } = repository;
                const { arousal, bpm, duration, key, valence } =
                    musicalFeatures;

                const fullFilePath = join(directoryPath, relativeFilePath);

                return {
                    id: fullFilePath,

                    audioProperties: {
                        duration,
                    },

                    musicalFeatures: {
                        arousal: Number(arousal),
                        bpm,
                        key,
                        valence: Number(valence),
                    },
                };
            });

            const { numberOfBuckets = 1 } = packPlaylistBucketsParameters;

            const { buckets } = packPlaylistBuckets({
                ...packPlaylistBucketsParameters,
                targetDurationPerBucket: targetDurationPerBucket ??
                    Temporal.Duration
                            .from({ days: 1 })
                            .total('milliseconds') / numberOfBuckets,
                tracks,
                trackSpacing: 0,
            });

            const serializedPlaylist = serializeBucketsToPlaylist(
                name,
                buckets,
            );

            if (outputFile) {
                await Deno.writeTextFile(outputFile, serializedPlaylist);

                return;
            }

            console.log(serializedPlaylist);
        },
    ),
});
