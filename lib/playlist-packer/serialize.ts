import { M3uMedia, M3uPlaylist } from 'm3u-parser-generator';

import type { EnergyCurveNames } from '@/lib/playlist-packer/energy-curves.ts';
import {
    determineEnergyCurve,
    determineEnergyCurveName,
} from '@/lib/playlist-packer/mod.ts';
import type { MixingRuleNames } from '@/lib/playlist-packer/mixing-rules.ts';
import {
    determineMixingRule,
    determineMixingRuleName,
} from '@/lib/playlist-packer/mixing-rules.ts';
import type { PackPlaylistBucketsParameters } from '@/lib/playlist-packer/pack-playlists.ts';
import type { Bucket } from '@/lib/playlist-packer/types.ts';

export type SerializedPackPlaylistBucketParameters =
    & {
        readonly energyCurve?: EnergyCurveNames;

        readonly mixingRule?: MixingRuleNames;
    }
    & Omit<
        PackPlaylistBucketsParameters,
        'energyCurve' | 'mixingRule'
    >;

export function deserializePackPlaylistBucketsParameters(
    serializedOptions: SerializedPackPlaylistBucketParameters,
): PackPlaylistBucketsParameters {
    const { energyCurve, mixingRule, ...options } = serializedOptions;

    return Object.assign(
        options,
        energyCurve ? { energyCurve: determineEnergyCurve(energyCurve) } : {},
        mixingRule ? { mixingRule: determineMixingRule(mixingRule) } : {},
    );
}

export function serializePackPlaylistBucketsParameters(
    options: PackPlaylistBucketsParameters,
): SerializedPackPlaylistBucketParameters {
    const { energyCurve, mixingRule, ...serializedOptions } = options;

    return Object.assign(
        serializedOptions,
        energyCurve
            ? { energyCurve: determineEnergyCurveName(energyCurve) }
            : {},
        mixingRule ? { mixingRule: determineMixingRuleName(mixingRule) } : {},
    );
}

export function serializeBucketsToPlaylist(
    name: string,
    buckets: Bucket[],
): string {
    const playlist = Object.assign(
        new M3uPlaylist(),
        {
            title: name,
        },
    );

    const { medias } = playlist;

    for (const { id: bucketID, tracks } of buckets) {
        for (const { audioProperties, id: fullFilePath } of tracks) {
            const { duration } = audioProperties;

            const media = Object.assign(
                new M3uMedia(fullFilePath),
                {
                    duration: Math.floor(duration / 1000),
                    group: `Bucket ${bucketID}`,
                    name: '',
                },
            );

            medias.push(media);
        }
    }

    return playlist.getM3uString();
}
