import { expandGlob } from '@std/fs';

import { command, number, positional, string } from '@drizzle-team/brocli';

import type {
    PackPlaylistBucketsParameters,
    Track,
} from '@/lib/playlist-packer/mod.ts';
import {
    DEFAULT_SERIALIZED_PACK_PLAYLIST_BUCKETS_PARAMETERS,
    deserializePackPlaylistBucketsParameters,
    ENERGY_CURVE_NAMES,
    MIXING_RULE_NAMES,
    packPlaylistBuckets,
    serializeBucketsToPlaylist,
} from '@/lib/playlist-packer/mod.ts';
import { GLOB_AUDIO_FILES } from '@/lib/utilities/path.ts';

import {
    ENTITY_AUDIO_FILE,
    ENTITY_MANAGER,
    withEntityManager,
} from '@/shared/database/mod.ts';

const COMMAND_OPTIONS = {
    directoryPath: positional('directory-path')
        .desc('directory path to build a playlist from')
        .required(),

    outputFile: string('output-file')
        .desc('sets the file to output the playlist to'),

    energyCurve: string('energy-curve')
        .desc(
            'sets the distribution curve forumla to determine track inclusion in a bucket',
        )
        .enum(
            // **HACK:** `enum` definition function expects at least one non-dynamic
            // string element as the first element. Brocli is trying to enforce that
            // there is at least one string element.
            ...Object.values(ENERGY_CURVE_NAMES) as [string, ...string[]],
        )
        .default(
            DEFAULT_SERIALIZED_PACK_PLAYLIST_BUCKETS_PARAMETERS
                .energyCurve,
        ),

    maxTracksPerBucket: number('max-tracks-per-bucket')
        .desc('sets the maximum amount of tracks per bucket')
        .default(
            DEFAULT_SERIALIZED_PACK_PLAYLIST_BUCKETS_PARAMETERS
                .maxTracksPerBucket,
        ),

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
            // **HACK:** See above note on `energyCurve`.
            ...Object.values(MIXING_RULE_NAMES) as [string, ...string[]],
        )
        .default(
            DEFAULT_SERIALIZED_PACK_PLAYLIST_BUCKETS_PARAMETERS
                .mixingRule,
        ),

    numberOfBuckets: number('number-of-buckets')
        .desc(
            'sets how many buckets the linked repositories of tracks are split into',
        )
        .default(
            DEFAULT_SERIALIZED_PACK_PLAYLIST_BUCKETS_PARAMETERS
                .numberOfBuckets,
        ),

    pacingStrictnessArousal: number('pacing-strictness-arousal')
        .desc(
            'sets how closely the track distribution must follow the energy curve',
        )
        .default(
            DEFAULT_SERIALIZED_PACK_PLAYLIST_BUCKETS_PARAMETERS
                .pacingStrictnessArousal,
        ),

    pacingStrictnessValence: number('pacing-strictness-valence')
        .desc(
            'sets how closely the track distribution must follow the vibe target',
        )
        .default(
            DEFAULT_SERIALIZED_PACK_PLAYLIST_BUCKETS_PARAMETERS
                .pacingStrictnessValence,
        ),

    scoreFuzziness: number('score-fuzziness')
        .desc(
            "sets how exacting a track's scoring must match for inclusion by introducing randomness",
        )
        .default(
            DEFAULT_SERIALIZED_PACK_PLAYLIST_BUCKETS_PARAMETERS
                .scoreFuzziness,
        ),

    seed: number('seed')
        .desc('sets the seed used for the random number generator')
        .default(
            Temporal.Now.zonedDateTimeISO().with({
                hour: 0,
                minute: 0,
                second: 0,
                millisecond: 0,
            }).epochMilliseconds,
        ),

    targetDurationPerBucket: number('target-duration-per-bucket')
        .desc(
            'sets the max possible cumulative duration of individual buckets',
        ),

    trackSpacing: number('track-spacing')
        .desc(
            'sets how much time (in milliseconds) is padded between each track in a bucket',
        )
        .default(
            DEFAULT_SERIALIZED_PACK_PLAYLIST_BUCKETS_PARAMETERS
                .trackSpacing,
        ),

    vibeTarget: number('vibe-target')
        .desc(
            'sets how weighted tracks included from linked repositories towards positive or negative vibes are',
        )
        .default(
            DEFAULT_SERIALIZED_PACK_PLAYLIST_BUCKETS_PARAMETERS
                .vibeTarget,
        ),
} as const;

function determineTargetBucketDuration(numberOfBuckets: number): number {
    return Temporal.Duration
        .from({ days: 1 })
        .total('milliseconds') / numberOfBuckets;
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
                outputFile,
                targetDurationPerBucket,
                ...serializedPackPlaylistBucketsParameters
            },
        ) => {
            const {
                energyCurve,
                mixingRule,
                maxTracksPerBucket,
                numberOfBuckets,
                pacingStrictnessArousal,
                pacingStrictnessValence,
                scoreFuzziness,
                seed,
                trackSpacing,
                vibeTarget,
            } = deserializePackPlaylistBucketsParameters(
                serializedPackPlaylistBucketsParameters,
            ) as Required<PackPlaylistBucketsParameters>;

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

            console.log(`[LeafRadio] '${tracks.length}' files included.`);
            console.log(
                `[LeafRadio] '${skippedCount}' files skipped due to being unprocessed or under-duration.`,
            );

            const { buckets } = packPlaylistBuckets({
                energyCurve,
                maxTracksPerBucket,
                mixingRule,
                numberOfBuckets,
                pacingStrictnessArousal,
                pacingStrictnessValence,
                scoreFuzziness,
                seed,
                targetDurationPerBucket: targetDurationPerBucket ??
                    determineTargetBucketDuration(numberOfBuckets),
                tracks,
                trackSpacing,
                vibeTarget,
            });

            const serializedPlaylist = serializeBucketsToPlaylist(buckets);

            if (outputFile) {
                await Deno.writeTextFile(outputFile, serializedPlaylist);

                return;
            }

            console.log(serializedPlaylist);
        },
    ),
});
