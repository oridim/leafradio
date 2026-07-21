import { command, number, positional } from '@drizzle-team/brocli';
import { M3uParser } from 'm3u-parser-generator';

import {
    formatPlaytimeDuration,
    getZonedDateTimeFromEpochMilliseconds,
} from '@/lib/utilities/datetime.ts';
import { determineNowPlaying as determineNowPlayingTrack } from '@/lib/utilities/playlists.ts';
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

        console.log('Now Playing Status:');
        console.log(`  File:      ${nowPlayingTrack.filePath}`);
        console.log(
            `  Track:     ${
                nowPlayingTrack.index + 1
            } of ${playlist.medias.length}`,
        );

        if (nowPlayingTrack.group) {
            console.log(`  Bucket:    ${nowPlayingTrack.group}`);
        }

        console.log(
            `  Position:  ${
                formatPlaytimeDuration(nowPlayingTrack.seekTime)
            } / ${formatPlaytimeDuration(nowPlayingTrack.trackDuration)} (${
                Math.floor(nowPlayingTrack.seekTime / 1000)
            }s / ${Math.floor(nowPlayingTrack.trackDuration / 1000)}s)`,
        );
    },
});
