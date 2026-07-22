import type { M3uPlaylist } from 'm3u-parser-generator';

export interface NowPlayingTrack {
    readonly filePath: string;

    readonly group?: string;

    readonly index: number;

    readonly seekTime: number;

    readonly trackDuration: number;
}

export interface DetermineNowPlayingTrackOptions {
    readonly currentIndex?: number;

    readonly previousIndex?: number;
}

export function determineNowPlayingTrack(
    playlist: M3uPlaylist,
    zonedDateTime: Temporal.ZonedDateTime,
    options: DetermineNowPlayingTrackOptions = {},
): NowPlayingTrack | null {
    const { currentIndex, previousIndex } = options;
    const { medias } = playlist;

    if (medias.length === 0) {
        return null;
    }

    let targetIndex: number | undefined;

    if (currentIndex !== undefined) {
        targetIndex = options.currentIndex;
    } else if (previousIndex !== undefined) {
        targetIndex = (previousIndex + 1) % medias.length;
    }

    if (targetIndex !== undefined && medias[targetIndex]) {
        const media = medias[targetIndex];

        return {
            filePath: media.location,
            group: media.group,
            index: targetIndex,
            seekTime: -1,
            trackDuration: media.duration * 1000,
        };
    }

    const totalDuration = medias.reduce(
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

    for (const [index, media] of medias.entries()) {
        const trackDuration = media.duration * 1000;

        if (accumulatedDuration + trackDuration > currentPlaylistOffset) {
            return {
                filePath: media.location,
                group: media.group,
                index,
                seekTime: currentPlaylistOffset - accumulatedDuration,
                trackDuration,
            };
        }

        accumulatedDuration += trackDuration;
    }

    return null;
}
