import type { EnergyCurveFunction } from '@/lib/playlist-packer/energy-curves.ts';
import type { Track } from '@/lib/playlist-packer/types.ts';

export function calculateSuitabilityScore(
    track: Track,
    targetArousal: number,
    targetValence: number,
    weightArousal: number,
    weightValence: number,
): number {
    const { arousal, valence } = track.musicalFeatures;

    const arousalPenalty = weightArousal * Math.abs(arousal - targetArousal);
    const valencePenalty = weightValence * Math.abs(valence - targetValence);

    return 1 - (arousalPenalty + valencePenalty);
}

export function calculateTargetArousal(
    bucketIndex: number,
    totalBuckets: number,
    curve: EnergyCurveFunction,
): number {
    if (totalBuckets <= 1) {
        return 0.5;
    }

    const progress = bucketIndex / (totalBuckets - 1);

    return curve(progress);
}
