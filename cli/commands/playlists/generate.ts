import * as CSV from '@std/csv';
import { expandGlob } from '@std/fs';

import { command, number, positional, string } from '@drizzle-team/brocli';
import { M3uMedia, M3uPlaylist } from 'm3u-parser-generator';

import type { Bucket, Track } from '@/lib/playlist-packer/mod.ts';
import {
    DEFAULT_SERIALIZED_PACK_PLAYLIST_BUCKETS_PARAMETERS,
    deserializePackPlaylistBucketsParameters,
    determineProfile,
    ENERGY_CURVE_NAMES,
    MIXING_RULE_NAMES,
    packPlaylistBuckets,
    PROFILE_NAMES,
} from '@/lib/playlist-packer/mod.ts';
import { GLOB_AUDIO_FILES } from '@/lib/utilities/path.ts';

import {
    ENTITY_AUDIO_FILE,
    ENTITY_MANAGER,
    withEntityManager,
} from '@/shared/database/mod.ts';

const OUTPUT_FORMATS = {
    csv: 'csv',

    json: 'json',

    m3u: 'm3u',
} as const;

type OutputFormats = typeof OUTPUT_FORMATS[keyof typeof OUTPUT_FORMATS];

const COMMAND_OPTIONS = {
    directoryPath: positional('directory-path')
        .desc('directory path to build a playlist from')
        .required(),

    outputFile: string('output-file')
        .desc('sets the file to output the playlist to'),

    outputFormat: string('output-format')
        .desc('sets the format to output the playlist as')
        .enum(
            // **HACK:** `enum` definition function expects at least one non-dynamic
            // string element as the first element. Brocli is trying to enforce that
            // there is at least one string element.
            ...Object.values(OUTPUT_FORMATS) as [string, ...string[]],
        )
        .default(OUTPUT_FORMATS.m3u),

    profile: string()
        .desc(
            "sets the a preset profile's to use as a baseline",
        )
        .enum(
            // **HACK:** See above note on `output-format`.
            ...Object.values(PROFILE_NAMES) as [string, ...string[]],
        ),

    energyCurve: string('energy-curve')
        .desc(
            'sets the distribution curve forumla to determine track inclusion in a bucket',
        )
        .enum(
            // **HACK:** See above note on `output-format`.
            ...Object.values(ENERGY_CURVE_NAMES) as [string, ...string[]],
        ),

    maxTracksPerBucket: number('max-tracks-per-bucket')
        .desc('sets the maximum amount of tracks per bucket'),

    minimumDuration: number('minimum-duration')
        .desc(
            'sets the minimum duration (in milliseconds) a track requires to be included',
        )
        .default(0),

    mixingRule: string('mixing-rule')
        .desc(
            'sets the sorting algorithm used to determine track distribution inside of buckets',
        )
        .enum(
            // **HACK:** See above note on `output-format`.
            ...Object.values(MIXING_RULE_NAMES) as [string, ...string[]],
        ),

    numberOfBuckets: number('number-of-buckets')
        .desc(
            'sets how many buckets the linked repositories of tracks are split into',
        ),

    pacingStrictnessArousal: number('pacing-strictness-arousal')
        .desc(
            'sets how closely the track distribution must follow the energy curve',
        ),

    pacingStrictnessValence: number('pacing-strictness-valence')
        .desc(
            'sets how closely the track distribution must follow the vibe target',
        ),

    scoreFuzziness: number('score-fuzziness')
        .desc(
            "sets how exacting a track's scoring must match for inclusion by introducing randomness",
        ),

    seed: number('seed')
        .desc('sets the seed used for the random number generator')
        .default(
            Temporal.Now
                .zonedDateTimeISO()
                .startOfDay()
                .epochMilliseconds,
        ),

    targetDurationPerBucket: number('target-duration-per-bucket')
        .desc(
            'sets the max possible cumulative duration of individual buckets',
        ),

    trackSpacing: number('track-spacing')
        .desc(
            'sets how much time (in milliseconds) is padded between each track in a bucket',
        ),

    vibeTarget: number('vibe-target')
        .desc(
            'sets how weighted tracks included from linked repositories towards positive or negative vibes are',
        ),
} as const;

function determineTargetBucketDuration(numberOfBuckets: number): number {
    return Temporal.Duration
        .from({ days: 1 })
        .total('milliseconds') / numberOfBuckets;
}

function formatOutput(outputFormat: OutputFormats, buckets: Bucket[]): string {
    const collectedTracks = buckets
        .flatMap(({ id: bucketID, tracks }) =>
            tracks.map((
                { id: absoluteFilePath, audioProperties: { duration } },
            ) => ({ bucketID, duration, absoluteFilePath }))
        );

    switch (outputFormat) {
        case OUTPUT_FORMATS.csv:
            return CSV.stringify(collectedTracks, {
                columns: ['bucketID', 'duration', 'absoluteFilePath'],
            });

        case OUTPUT_FORMATS.json:
            return JSON.stringify(collectedTracks);

        case OUTPUT_FORMATS.m3u: {
            const playlist = new M3uPlaylist();

            playlist.medias = collectedTracks
                .map(({ absoluteFilePath, bucketID, duration }) =>
                    Object.assign(
                        new M3uMedia(absoluteFilePath),
                        {
                            duration: Math.floor(duration / 1000),
                            group: `Bucket ${bucketID}`,
                            name: '',
                        },
                    )
                );

            return playlist.getM3uString();
        }
    }
}

export default command({
    name: 'generate',
    desc: 'Generates a M3U playlist out of audio files in a directory.',
    options: COMMAND_OPTIONS,

    handler: withEntityManager(
        async (
            {
                directoryPath,
                minimumDuration,
                profile,
                outputFile,
                outputFormat,
                targetDurationPerBucket,
                ...serializedPackPlaylistBucketsParameters
            },
        ) => {
            const parameters = {
                ...(profile ? determineProfile(profile) : {}),
                ...deserializePackPlaylistBucketsParameters(
                    Object.fromEntries(
                        Object
                            .entries(serializedPackPlaylistBucketsParameters)
                            .filter(([_key, value]) => value !== undefined),
                    ),
                ),
            };

            const entries = await Array.fromAsync(
                expandGlob(GLOB_AUDIO_FILES, {
                    followSymlinks: true,
                    root: directoryPath,
                }),
            );

            const absoluteFilePaths = entries
                .filter((entry) => entry.isFile)
                .map((entry) => entry.path);

            const audioFiles = await ENTITY_MANAGER.find(
                ENTITY_AUDIO_FILE,
                { absoluteFilePath: { $in: absoluteFilePaths } },
                { populate: ['processedMetadata'] },
            );

            const tracks: Track[] = [];
            let skippedCount = absoluteFilePaths.length;

            for (const audioFile of audioFiles) {
                if (!audioFile.processedMetadata) {
                    continue;
                }

                const { audioProperties, musicalFeatures } =
                    audioFile.processedMetadata;

                if (audioProperties.duration < minimumDuration) {
                    continue;
                }

                tracks.push({
                    id: audioFile.absoluteFilePath,
                    audioProperties,
                    musicalFeatures,
                });

                skippedCount--;
            }

            if (tracks.length === 0) {
                console.log(
                    '[LeafRadio] No files were included, skipping generation.',
                );

                return;
            }

            console.log(`[LeafRadio] '${tracks.length}' files were included.`);
            console.log(
                `[LeafRadio] '${skippedCount}' files were skipped due to being unprocessed or under-duration.`,
            );

            const { buckets } = packPlaylistBuckets({
                ...parameters,
                tracks,
                targetDurationPerBucket: targetDurationPerBucket ??
                    determineTargetBucketDuration(
                        parameters.numberOfBuckets ??
                            DEFAULT_SERIALIZED_PACK_PLAYLIST_BUCKETS_PARAMETERS
                                .numberOfBuckets,
                    ),
            });

            const formattedOutput = formatOutput(outputFormat, buckets);

            if (outputFile) {
                await Deno.writeTextFile(outputFile, formattedOutput);

                return;
            }

            console.log(formattedOutput);
        },
    ),
});
