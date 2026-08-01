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
    groupDecayFactor: number,
    groupUsageCounts: Map<string, number>,
    maxTracks: number | undefined,
    scoredTrackPool: ScoredTrack[],
    targetDuration: number,
    trackSpacing: number,
): { packedTracks: Track[]; leftovers: Track[]; totalDuration: number } {
    const leftovers: Track[] = [];
    const packedTracks: Track[] = [];

    const remainingScoredTracks = scoredTrackPool
        .map((scoredTrack) => {
            const { score, track } = scoredTrack;
            const { groupId } = track;

            const groupCount = groupId ? groupUsageCounts.get(groupId) ?? 0 : 0;

            return {
                track,
                baseScore: score,
                currentScore: score * Math.pow(groupDecayFactor, groupCount),
            };
        })
        .sort((scoredTrackA, scoredTrackB) =>
            scoredTrackB.currentScore - scoredTrackA.currentScore
        );

    let totalDuration = 0;

    while (remainingScoredTracks.length > 0) {
        if (maxTracks && packedTracks.length >= maxTracks) {
            leftovers.push(
                ...remainingScoredTracks.map((item) => item.track),
            );

            break;
        }

        const candidate = remainingScoredTracks.shift()!;

        const { baseScore, track } = candidate;
        const { audioProperties, groupId } = track;

        const groupCount = groupId ? groupUsageCounts.get(groupId) ?? 0 : 0;
        const newEffectiveScore = baseScore *
            Math.pow(groupDecayFactor, groupCount);

        if (
            remainingScoredTracks.length > 0 &&
            newEffectiveScore < remainingScoredTracks[0].currentScore
        ) {
            candidate.currentScore = newEffectiveScore;

            const insertIndex = remainingScoredTracks.findIndex(
                (item) => item.currentScore <= newEffectiveScore,
            );

            if (insertIndex === -1) {
                remainingScoredTracks.push(candidate);
            } else {
                remainingScoredTracks.splice(insertIndex, 0, candidate);
            }

            continue;
        }

        const spacingCost = packedTracks.length > 0 ? trackSpacing : 0;
        const costToPack = audioProperties.duration + spacingCost;

        if (totalDuration + costToPack <= targetDuration) {
            packedTracks.push(track);
            totalDuration += costToPack;

            if (groupId) {
                groupUsageCounts.set(groupId, groupCount + 1);
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

function scoreTrackPool(
    trackPool: Track[],
    pacingStrictnessArousal: number,
    pacingStrictnessValence: number,
    randomGenerator: RandomNumberGenerator,
    scoreFuzziness: number,
    targetArousal: number,
    vibeTarget: number,
): ScoredTrack[] {
    return trackPool.map((track) => {
        const { weight = 1.0 } = track;

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

        const rawScore = Math.max(0, baseScore + fuzz);

        return {
            track,
            score: rawScore * weight,
        };
    });
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

        const scoredTrackPool = scoreTrackPool(
            availablePool,
            pacingStrictnessArousal,
            pacingStrictnessValence,
            randomGenerator,
            scoreFuzziness,
            targetArousal,
            vibeTarget,
        );

        const { packedTracks, leftovers, totalDuration } = fillBucket(
            groupDecayFactor,
            groupUsageCounts,
            maxTracksPerBucket,
            scoredTrackPool,
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
