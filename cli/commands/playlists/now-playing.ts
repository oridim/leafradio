import * as CSV from '@std/csv';

import { Table } from '@cliffy/table';
import { command, number, positional, string } from '@drizzle-team/brocli';
import type { M3uPlaylist } from 'm3u-parser-generator';
import { M3uParser } from 'm3u-parser-generator';

import {
    formatPlaytimeDuration,
    getZonedDateTimeFromEpochMilliseconds,
} from '@/lib/utilities/datetime.ts';
import type { NowPlayingTrack } from '@/lib/utilities/playlists.ts';
import { determineNowPlayingTrack } from '@/lib/utilities/playlists.ts';
import { EXIT_CODES } from '@/cli/utilities/process.ts';
import { truncateCenter } from '@/lib/utilities/string.ts';

import LOGGER from '@/cli/utilities/logger.ts';

const OUTPUT_FORMATS = {
    csv: 'csv',

    human: 'human',

    json: 'json',
} as const;

type OutputFormats = typeof OUTPUT_FORMATS[keyof typeof OUTPUT_FORMATS];

const COMMAND_OPTIONS = {
    playlistFile: positional('playlist-file')
        .desc('path to the m3u or m3u8 playlist file')
        .required(),

    outputFormat: string('output-format')
        .desc('sets the format to output the playlist as')
        .enum(
            // **HACK:** `enum` definition function expects at least one non-dynamic
            // string element as the first element. Brocli is trying to enforce that
            // there is at least one string element.
            ...Object.values(OUTPUT_FORMATS) as [string, ...string[]],
        )
        .default(OUTPUT_FORMATS.human),

    timestamp: number('timestamp')
        .desc(
            'sets the UTC timestamp (in milliseconds) to determine playback status at',
        )
        .default(
            Temporal.Now
                .zonedDateTimeISO()
                .epochMilliseconds,
        ),
} as const;

function formatOutput(
    outputFormat: OutputFormats,
    playlist: M3uPlaylist,
    nowPlayingTrack: NowPlayingTrack,
): string {
    const { filePath, index, group, seekTime, trackDuration } = nowPlayingTrack;

    const bucketID = group ? group.slice(7) : null;
    const trackID = index + 1;
    const { length: trackCount } = playlist.medias;

    switch (outputFormat) {
        case OUTPUT_FORMATS.csv:
            return CSV.stringify(
                [{
                    bucketID: bucketID ?? '',
                    filePath,
                    seekTime,
                    trackCount,
                    trackDuration,
                    trackID,
                }],
                {
                    columns: [
                        'bucketID',
                        'trackID',
                        'trackCount',
                        'seekTime',
                        'trackDuration',
                        'filePath',
                    ],
                },
            );

        case OUTPUT_FORMATS.human:
            return new Table()
                .header(['Bucket ID', 'Track ID', 'Position', 'File Path'])
                .body(
                    [
                        [
                            bucketID ?? 'N/A',
                            `${trackID} / ${trackCount}`,
                            [
                                formatPlaytimeDuration(seekTime),
                                formatPlaytimeDuration(trackDuration),
                            ].join(' / '),
                            truncateCenter(filePath, 64 + 32 + 16),
                        ],
                    ],
                )
                .border(true)
                .toString();

        case OUTPUT_FORMATS.json:
            return JSON.stringify({
                bucketID,
                trackID,
                trackCount,
                seekTime,
                trackDuration,
                filePath,
            });
    }
}

export default command({
    name: 'now-playing',
    desc:
        'Determines the currently playing track and seek position based on the time of day.',
    options: COMMAND_OPTIONS,

    handler: async ({ playlistFile, outputFormat, timestamp }) => {
        let playlistText: string;

        try {
            playlistText = await Deno.readTextFile(playlistFile);
        } catch (error) {
            LOGGER.error(`Failed to read playlist file '${playlistFile}'.`);
            LOGGER.error(error);

            Deno.exit(EXIT_CODES.invalidOptions);
        }

        let zonedDateTime: Temporal.ZonedDateTime;

        try {
            zonedDateTime = getZonedDateTimeFromEpochMilliseconds(timestamp);
        } catch (error) {
            LOGGER.error(`Failed to parse timestamp '${timestamp}'.`);
            LOGGER.error(error);

            Deno.exit(EXIT_CODES.invalidOptions);
        }

        const parser = new M3uParser();
        const playlist = parser.parse(playlistText);

        const nowPlayingTrack = determineNowPlayingTrack(
            playlist,
            zonedDateTime,
        );

        if (!nowPlayingTrack) {
            LOGGER.info(
                `Playlist file '${playlistFile}' is empty or ran out of tracks.`,
            );

            Deno.exit(EXIT_CODES.invalidValue);
        }

        const formattedOutput = formatOutput(
            outputFormat as OutputFormats,
            playlist,
            nowPlayingTrack,
        );

        console.log(formattedOutput);
    },
});
