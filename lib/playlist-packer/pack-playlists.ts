import type { RandomNumberGenerator } from '@/lib/utilities/random.ts';
import { makeRandomNumberGenerator } from '@/lib/utilities/random.ts';

import type { PackPlaylistBucketsOptions } from '@/lib/playlist-packer/options.ts';
import { DEFAULT_PACK_PLAYLIST_BUCKETS_PARAMETERS } from '@/lib/playlist-packer/mod.ts';
import {
    calculateSuitabilityScore,
    calculateTargetArousal,
} from '@/lib/playlist-packer/scoring.ts';
import type {
    Bucket,
    PackedBuckets,
    Track,
} from '@/lib/playlist-packer/types.ts';

interface ScoredTrack {
    readonly score: number;

    readonly track: Track;
}

function fillBucket(
    maxTracks: number | undefined,
    scoredPool: ScoredTrack[],
    targetDuration: number,
    trackSpacing: number,
): { packedTracks: Track[]; leftovers: Track[]; totalDuration: number } {
    const leftovers: Track[] = [];
    const packedTracks: Track[] = [];

    let totalDuration = 0;

    for (const { track } of scoredPool) {
        if (maxTracks && packedTracks.length >= maxTracks) {
            leftovers.push(track);
            continue;
        }

        const spacingCost = packedTracks.length > 0 ? trackSpacing : 0;
        const costToPack = track.audioProperties.duration + spacingCost;

        if (totalDuration + costToPack <= targetDuration) {
            packedTracks.push(track);
            totalDuration += costToPack;
        } else {
            leftovers.push(track);
        }
    }

    return {
        leftovers,
        packedTracks,
        totalDuration,
    };
}

function scoreAndSortPool(
    pool: Track[],
    pacingStrictnessArousal: number,
    pacingStrictnessValence: number,
    randomGenerator: RandomNumberGenerator,
    scoreFuzziness: number,
    targetArousal: number,
    vibeTarget: number,
): ScoredTrack[] {
    return pool.map((track) => {
        const baseScore = calculateSuitabilityScore(
            track,
            targetArousal,
            vibeTarget,
            pacingStrictnessArousal,
            pacingStrictnessValence,
        );

        const fuzz = scoreFuzziness > 0
            ? randomGenerator.randomFloat(-scoreFuzziness, scoreFuzziness)
            : 0;

        return {
            track,
            score: baseScore + fuzz,
        };
    }).sort((scoredTrackA, scoredTrackB) =>
        scoredTrackB.score - scoredTrackA.score
    );
}

export function packPlaylistBuckets(
    options: PackPlaylistBucketsOptions,
): PackedBuckets {
    const {
        energyCurve,
        maxTracksPerBucket,
        mixingRule,
        numberOfBuckets,
        pacingStrictnessArousal,
        pacingStrictnessValence,
        scoreFuzziness,
        seed,
        targetDurationPerBucket,
        tracks,
        trackSpacing,
        vibeTarget,
    } = { ...DEFAULT_PACK_PLAYLIST_BUCKETS_PARAMETERS, ...options };

    const randomGenerator = makeRandomNumberGenerator(seed);
    const buckets: Bucket[] = [];

    let availablePool = randomGenerator.shuffleElements([...tracks]);

    for (let bucketIndex = 0; bucketIndex < numberOfBuckets; bucketIndex++) {
        const targetArousal = calculateTargetArousal(
            bucketIndex,
            numberOfBuckets,
            energyCurve,
        );

        const scoredPool = scoreAndSortPool(
            availablePool,
            pacingStrictnessArousal,
            pacingStrictnessValence,
            randomGenerator,
            scoreFuzziness,
            targetArousal,
            vibeTarget,
        );

        const { packedTracks, leftovers, totalDuration } = fillBucket(
            maxTracksPerBucket,
            scoredPool,
            targetDurationPerBucket,
            trackSpacing,
        );

        buckets.push({
            id: bucketIndex + 1,
            tracks: mixingRule(packedTracks),
            targetDuration: targetDurationPerBucket,
            targetArousal,
            targetValence: vibeTarget,
            totalDuration,
        });

        availablePool = leftovers;
    }

    return {
        buckets,
        leftovers: availablePool,
    };
}
