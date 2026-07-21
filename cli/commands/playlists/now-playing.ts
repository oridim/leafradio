import { command, number, positional } from '@drizzle-team/brocli';
import { M3uParser } from 'm3u-parser-generator';

import { getZonedDateTimeFromEpochMilliseconds } from '@/lib/utilities/datetime.ts';
import { determineNowPlaying } from '@/lib/utilities/playlists.ts';
import { EXIT_CODES } from '@/cli/utilities/process.ts';

import LOGGER from '@/cli/utilities/logger.ts';

const COMMAND_OPTIONS = {
    playlistFile: positional('playlist-file')
        .desc('path to the m3u or m3u8 playlist file')
        .required(),

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

export default command({
    name: 'now-playing',
    desc:
        'Determines the currently playing track and seek position based on the time of day.',
    options: COMMAND_OPTIONS,

    handler: async ({ playlistFile, timestamp }) => {
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
        const nowPlaying = determineNowPlaying(playlist, zonedDateTime);

        if (!nowPlaying) {
            LOGGER.info(
                `Playlist file '${playlistFile}' is empty or ran out of tracks.`,
            );

            Deno.exit(EXIT_CODES.invalidValue);
        }

        const seekDuration = Temporal.Duration
            .from({
                milliseconds: nowPlaying.seekTime,
            })
            .round({
                largestUnit: 'hour',
                smallestUnit: 'second',
                roundingMode: 'trunc',
            });

        const trackDuration = Temporal.Duration
            .from({
                milliseconds: nowPlaying.trackDuration,
            })
            .round({
                largestUnit: 'hour',
                smallestUnit: 'second',
                roundingMode: 'trunc',
            });

        const durationFormatter = new Intl.DurationFormat('en-US', {
            style: 'digital',
        });

        console.log('Now Playing Status:');
        console.log(`  File:      ${nowPlaying.filePath}`);
        console.log(
            `  Track:     ${nowPlaying.index + 1} of ${playlist.medias.length}`,
        );

        if (nowPlaying.group) {
            console.log(`  Bucket:    ${nowPlaying.group}`);
        }

        console.log(
            `  Position:  ${durationFormatter.format(seekDuration)} / ${
                durationFormatter.format(trackDuration)
            } (${Math.floor(nowPlaying.seekTime / 1000)}s / ${
                Math.floor(nowPlaying.trackDuration / 1000)
            }s)`,
        );
    },
});
