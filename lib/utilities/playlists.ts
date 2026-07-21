import type { M3uPlaylist } from 'm3u-parser-generator';

export interface NowPlayingInfo {
    readonly filePath: string;

    readonly group?: string;

    readonly index: number;

    readonly seekTime: number;

    readonly trackDuration: number;
}

export function determineNowPlaying(
    playlist: M3uPlaylist,
    zonedDateTime: Temporal.ZonedDateTime,
): NowPlayingInfo | null {
    const totalDuration = playlist
        .medias
        .reduce(
            (accumulated, media) => accumulated + (media.duration * 1000),
            0,
        );

    if (totalDuration === 0) {
        return null;
    }

    const elapsedStartOfDayDuration = zonedDateTime
        .since(zonedDateTime.startOfDay())
        .total('milliseconds');

    const currentPlaylistOffset = elapsedStartOfDayDuration % totalDuration;

    let accumulatedDuration = 0;

    for (const [index, media] of playlist.medias.entries()) {
        const trackDuration = media.duration * 1000;

        if (accumulatedDuration + trackDuration > currentPlaylistOffset) {
            return {
                filePath: media.location,
                group: media.group,
                index,
                seekTime: currentPlaylistOffset - accumulatedDuration,
                trackDuration: trackDuration,
            };
        }

        accumulatedDuration += trackDuration;
    }

    return null;
}
