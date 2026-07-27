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
    groupUsageCounts: Map<string, number>,
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

        const { audioProperties, groupId } = track;

        const spacingCost = packedTracks.length > 0 ? trackSpacing : 0;
        const costToPack = audioProperties.duration + spacingCost;

        if (totalDuration + costToPack <= targetDuration) {
            packedTracks.push(track);
            totalDuration += costToPack;

            if (groupId) {
                const currentCount = groupUsageCounts.get(groupId) ?? 0;

                groupUsageCounts.set(groupId, currentCount + 1);
            }
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
    groupDecayFactor: number,
    groupUsageCounts: Map<string, number>,
    pacingStrictnessArousal: number,
    pacingStrictnessValence: number,
    randomGenerator: RandomNumberGenerator,
    scoreFuzziness: number,
    targetArousal: number,
    vibeTarget: number,
): ScoredTrack[] {
    return pool.map((track) => {
        const { groupId, weight = 1.0 } = track;

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

        const groupCount = groupId ? groupUsageCounts.get(groupId) ?? 0 : 0;
        const groupMultiplier = Math.pow(groupDecayFactor, groupCount);

        const rawScore = Math.max(0, baseScore + fuzz);
        const finalScore = rawScore * weight * groupMultiplier;

        return {
            track,
            score: finalScore,
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
        groupDecayFactor,
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

    const buckets: Bucket[] = [];
    const groupUsageCounts = new Map<string, number>();
    const randomGenerator = makeRandomNumberGenerator(seed);

    let availablePool = randomGenerator.shuffleElements([...tracks]);

    for (let bucketIndex = 0; bucketIndex < numberOfBuckets; bucketIndex++) {
        const targetArousal = calculateTargetArousal(
            bucketIndex,
            numberOfBuckets,
            energyCurve,
        );

        const scoredPool = scoreAndSortPool(
            availablePool,
            groupDecayFactor,
            groupUsageCounts,
            pacingStrictnessArousal,
            pacingStrictnessValence,
            randomGenerator,
            scoreFuzziness,
            targetArousal,
            vibeTarget,
        );

        const { packedTracks, leftovers, totalDuration } = fillBucket(
            groupUsageCounts,
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
