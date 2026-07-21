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
import type { PackPlaylistBucketsParameters } from '@/lib/playlist-packer/options.ts';
import { DEFAULT_PACK_PLAYLIST_BUCKETS_PARAMETERS } from '@/lib/playlist-packer/mod.ts';

export const DEFAULT_SERIALIZED_PACK_PLAYLIST_BUCKETS_PARAMETERS =
    serializePackPlaylistBucketsParameters(
        DEFAULT_PACK_PLAYLIST_BUCKETS_PARAMETERS,
    ) as Required<SerializedPackPlaylistBucketsParameters>;

export type SerializedPackPlaylistBucketsParameters =
    & {
        readonly energyCurve?: EnergyCurveNames;

        readonly mixingRule?: MixingRuleNames;
    }
    & Omit<
        PackPlaylistBucketsParameters,
        'energyCurve' | 'mixingRule'
    >;

export function deserializePackPlaylistBucketsParameters(
    serializedOptions: SerializedPackPlaylistBucketsParameters,
): PackPlaylistBucketsParameters {
    const { energyCurve, mixingRule, ...options } = serializedOptions;

    return {
        ...options,
        ...(
            energyCurve
                ? { energyCurve: determineEnergyCurve(energyCurve) }
                : {}
        ),
        ...(
            mixingRule ? { mixingRule: determineMixingRule(mixingRule) } : {}
        ),
    };
}

export function serializePackPlaylistBucketsParameters(
    options: PackPlaylistBucketsParameters,
): SerializedPackPlaylistBucketsParameters {
    const { energyCurve, mixingRule, ...serializedOptions } = options;

    return {
        ...serializedOptions,
        ...(
            energyCurve
                ? { energyCurve: determineEnergyCurveName(energyCurve) }
                : {}
        ),
        ...(
            mixingRule
                ? { mixingRule: determineMixingRuleName(mixingRule) }
                : {}
        ),
    };
}
