import * as CSV from '@std/csv';
import type { WalkEntry } from '@std/fs';
import { expandGlob } from '@std/fs';
import { dirname, extname, join, relative, resolve } from '@std/path';

import { Table } from '@cliffy/table';
import { command, number, positional, string } from '@drizzle-team/brocli';
import { M3uMedia, M3uParser, M3uPlaylist } from 'm3u-parser-generator';

import type { Bucket, ProfileNames, Track } from '@/lib/playlist-packer/mod.ts';
import {
    DEFAULT_SERIALIZED_PACK_PLAYLIST_BUCKETS_PARAMETERS,
    deserializePackPlaylistBucketsParameters,
    determineProfile,
    ENERGY_CURVE_NAMES,
    MIXING_RULE_NAMES,
    packPlaylistBuckets,
    PROFILE_NAMES,
} from '@/lib/playlist-packer/mod.ts';
import {
    formatPlaytimeDuration,
    resolveTimezone,
} from '@/lib/utilities/datetime.ts';
import { GLOB_AUDIO_FILES } from '@/lib/utilities/path.ts';
import { resolveSeed } from '@/lib/utilities/random.ts';
import { truncateCenter } from '@/lib/utilities/string.ts';

import { FILE_NAME_AUDIO_DATA } from '@/shared/configuration/filesystem.ts';
import type { AudioData } from '@/shared/models/mod.ts';
import { readAudioData } from '@/shared/models/mod.ts';

import LOGGER from '@/cli/utilities/logger.ts';
import { EXIT_CODES } from '@/cli/utilities/process.ts';

const OUTPUT_FORMATS = {
    csv: 'csv',

    human: 'human',

    json: 'json',

    m3u: 'm3u',
} as const;

type OutputFormats = typeof OUTPUT_FORMATS[keyof typeof OUTPUT_FORMATS];

const COMMAND_OPTIONS = {
    directoryPath: positional('directory-path')
        .desc('directory path to build a playlist from')
        .required(),

    allowedTracks: string('allowed-tracks')
        .desc(
            'sets a file (.csv, .json, .m3u, .m3u8) containing tracks to exclusively allow',
        ),

    audioDataFile: string('audio-data-file')
        .desc('sets the file to use as the audio data lookup'),

    disallowedTracks: string('disallowed-tracks')
        .desc(
            'sets a file (.csv, .json, .m3u, .m3u8) containing tracks to exclude',
        ),

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
        .default(OUTPUT_FORMATS.human),

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

    seed: string('seed')
        .desc('sets the seed used for the random number generator')
        .default(
            Temporal.Now
                .zonedDateTimeISO()
                .startOfDay()
                .epochMilliseconds
                .toString(),
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
                { id: filePath, audioProperties: { duration } },
            ) => ({ bucketID, duration, filePath }))
        );

    switch (outputFormat) {
        case OUTPUT_FORMATS.csv:
            return CSV.stringify(collectedTracks, {
                columns: ['bucketID', 'duration', 'filePath'],
            });

        case OUTPUT_FORMATS.human:
            return new Table()
                .header(['Bucket ID', 'Duration', 'Absolute File Path'])
                .body(
                    collectedTracks.map((
                        { filePath, bucketID, duration },
                    ) => [
                        bucketID,
                        formatPlaytimeDuration(duration),
                        truncateCenter(filePath, 64 + 32 + 16),
                    ]),
                )
                .border(true)
                .toString();

        case OUTPUT_FORMATS.json:
            return JSON.stringify(collectedTracks);

        case OUTPUT_FORMATS.m3u: {
            const playlist = new M3uPlaylist();

            playlist.medias = collectedTracks
                .map(({ filePath, bucketID, duration }) =>
                    Object.assign(
                        new M3uMedia(filePath),
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

async function readTrackListFile(filePath: string): Promise<Set<string>> {
    const resolvedPath = resolve(filePath);
    const content = await Deno.readTextFile(resolvedPath);
    const extension = extname(resolvedPath).toLowerCase();
    const trackPaths = new Set<string>();

    switch (extension) {
        case '.csv': {
            const tracks = CSV.parse(content, {
                columns: ['bucketID', 'duration', 'filePath'],
                skipFirstRow: true,
            });

            for (const track of tracks) {
                trackPaths.add(
                    resolve(track.filePath),
                );
            }

            break;
        }

        case '.json': {
            const records = JSON.parse(content) as { filePath: string }[];

            for (const record of records) {
                trackPaths.add(
                    resolve(record.filePath),
                );
            }

            break;
        }

        case '.m3u':
        case '.m3u8': {
            const parser = new M3uParser();
            const playlist = parser.parse(content);

            for (const media of playlist.medias) {
                trackPaths.add(
                    resolve(media.location),
                );
            }
            break;
        }

        default:
            throw new Error(
                `Unsupported track list file format '${extension}'.`,
            );
    }

    return trackPaths;
}

function* walkDirectoryTracks(
    directoryPath: string,
    entries: Iterable<WalkEntry>,
    audioData: AudioData,
    minimumDuration: number,
    allowedTracks?: Set<string>,
    disallowedTracks?: Set<string>,
): Generator<Track> {
    const { audioFiles, processedMetadata } = audioData;

    for (const entry of entries) {
        const { isFile, path } = entry;

        if (!isFile) {
            continue;
        }

        const resolvedPath = resolve(path);

        if (allowedTracks && !allowedTracks.has(resolvedPath)) {
            continue;
        }

        if (disallowedTracks && disallowedTracks.has(resolvedPath)) {
            continue;
        }

        const relativePath = relative(directoryPath, path);
        const audioFile = audioFiles[relativePath];
        const pcmHash = audioFile?.pcmHash;

        if (!pcmHash) {
            continue;
        }

        const metadata = processedMetadata[pcmHash];

        if (!metadata || metadata.audioProperties.duration < minimumDuration) {
            continue;
        }

        const { audioProperties, musicalFeatures } = metadata;

        yield {
            groupId: dirname(relativePath),
            id: path,
            audioProperties,
            musicalFeatures,
        };
    }
}

export default command({
    name: 'generate',
    desc: 'Generates a playlist out of audio files in a directory.',
    options: COMMAND_OPTIONS,

    handler: async (
        {
            allowedTracks: allowedTracksFile,
            audioDataFile,
            directoryPath,
            disallowedTracks: disallowedTracksFile,
            minimumDuration,
            profile,
            outputFile,
            outputFormat,
            seed,
            targetDurationPerBucket,
            ...serializedPackPlaylistBucketsParameters
        },
    ) => {
        const resolvedDirectoryPath = resolve(directoryPath);
        const resolvedAudioDataFile = audioDataFile ??
            join(resolvedDirectoryPath, FILE_NAME_AUDIO_DATA);

        let audioData: AudioData;

        try {
            audioData = await readAudioData(resolvedAudioDataFile);
        } catch {
            LOGGER.error(
                `Failed to load audio data file '${resolvedAudioDataFile}'.`,
            );

            Deno.exit(EXIT_CODES.invalidOptions);
        }

        let allowedTracks: Set<string> | undefined;

        if (allowedTracksFile) {
            try {
                allowedTracks = await readTrackListFile(allowedTracksFile);
            } catch {
                LOGGER.error(
                    `Failed to load allowed tracks file '${allowedTracksFile}'.`,
                );

                Deno.exit(EXIT_CODES.invalidOptions);
            }
        }

        let disallowedTracks: Set<string> | undefined;

        if (disallowedTracksFile) {
            try {
                disallowedTracks = await readTrackListFile(
                    disallowedTracksFile,
                );
            } catch {
                LOGGER.error(
                    `Failed to load disallowed tracks file '${disallowedTracksFile}'.`,
                );

                Deno.exit(EXIT_CODES.invalidOptions);
            }
        }

        const parameters = {
            ...(profile ? determineProfile(profile as ProfileNames) : {}),
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
                root: resolvedDirectoryPath,
            }),
        );

        const tracks = Array.from(
            walkDirectoryTracks(
                resolvedDirectoryPath,
                entries,
                audioData,
                minimumDuration,
                allowedTracks,
                disallowedTracks,
            ),
        );

        if (tracks.length === 0) {
            LOGGER.info('No files were included, skipping generation.');

            return;
        }

        LOGGER.info(
            `'${tracks.length}' audio files were filtered for possible playlist inclusion.`,
        );

        const { buckets } = packPlaylistBuckets({
            ...parameters,
            seed: resolveSeed(seed, resolveTimezone()),
            tracks,
            targetDurationPerBucket: targetDurationPerBucket ??
                determineTargetBucketDuration(
                    parameters.numberOfBuckets ??
                        DEFAULT_SERIALIZED_PACK_PLAYLIST_BUCKETS_PARAMETERS
                            .numberOfBuckets,
                ),
        });

        const includedTracks = buckets.flatMap((bucket) => bucket.tracks);

        LOGGER.info(
            `'${includedTracks.length}' audio files included in the playlist.`,
        );

        const formattedOutput = formatOutput(
            outputFormat as OutputFormats,
            buckets,
        );

        if (outputFile) {
            await Deno.writeTextFile(outputFile, formattedOutput);
            return;
        }

        console.log(formattedOutput);
    },
});
