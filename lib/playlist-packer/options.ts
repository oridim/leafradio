import type { EnergyCurveFunction } from '@/lib/playlist-packer/energy-curves.ts';
import { waveEnergyCurve } from '@/lib/playlist-packer/energy-curves.ts';
import type { MixingRuleFunction } from '@/lib/playlist-packer/mixing-rules.ts';
import { harmonicMixingRule } from '@/lib/playlist-packer/mixing-rules.ts';
import type { Track } from '@/lib/playlist-packer/types.ts';

export const DEFAULT_PACK_PLAYLIST_BUCKETS_PARAMETERS = {
    energyCurve: waveEnergyCurve,
    maxTracksPerBucket: 0,
    mixingRule: harmonicMixingRule,
    numberOfBuckets: 1,
    pacingStrictnessArousal: 1.0,
    pacingStrictnessValence: 1.0,
    scoreFuzziness: 0,
    seed: 0,
    trackSpacing: 0,
    vibeTarget: 0.5,
} satisfies Required<PackPlaylistBucketsParameters>;

export type PackPlaylistBucketsParameters = Omit<
    PackPlaylistBucketsOptions,
    'targetDurationPerBucket' | 'tracks'
>;

export interface PackPlaylistBucketsOptions {
    readonly energyCurve?: EnergyCurveFunction;

    readonly maxTracksPerBucket?: number;

    readonly mixingRule?: MixingRuleFunction;

    readonly numberOfBuckets?: number;

    readonly pacingStrictnessArousal?: number;

    readonly pacingStrictnessValence?: number;

    readonly scoreFuzziness?: number;

    readonly seed?: number;

    readonly targetDurationPerBucket: number;

    readonly tracks: Track[];

    readonly trackSpacing?: number;

    readonly vibeTarget?: number;
}
