import { deepMerge } from '@std/collections';

import { normalizeValue } from '@/lib/utilities/math.ts';
import type { ExtractedMeydaFeatures } from '@/lib/utilities/meyda.ts';
import type { DeepRequired } from '@/lib/utilities/types.ts';

export const DEFAULT_EMOTION_WEIGHTS = {
    arousal: {
        constant: 0,
        brightness: 0.20,
        directEnergy: 0.40,
        tempo: 0.40,
    },

    valence: {
        constant: 0.5,
        majorKeyOffset: 0.5,
        minorKeyOffset: 0.0,
        nosiness: -0.20,
        spectralRoughness: -0.30,
    },
} satisfies Required<EmotionWeights>;

export const DEFAULT_FEATURE_BOUNDS = {
    bpm: [40, 200],
    rms: [0.0, 0.20],
    spectralRoughness: [0.0, 1.0],
    spectralCentroid: [0, 3000],
    spectralFlatness: [0.0, 1.0],
} satisfies Required<FeatureBounds>;

type ExpectedFeatures = ExtractedMeydaFeatures<
    | 'complexSpectrum'
    | 'rms'
    | 'spectralCentroid'
    | 'spectralFlatness'
>;

export interface DetermineEmotionScoresOptions {
    readonly averageFeatures: ExpectedFeatures;

    readonly bpm: number;

    readonly emotionWeights?: EmotionWeights;

    readonly featureBounds?: FeatureBounds;

    readonly key: string;
}

export interface EmotionScores {
    readonly arousal: number;

    readonly valence: number;
}

export interface EmotionWeights {
    readonly arousal?: {
        readonly brightness?: number;

        readonly constant?: number;

        readonly directEnergy?: number;

        readonly tempo?: number;
    };

    readonly valence?: {
        readonly constant?: number;

        readonly majorKeyOffset?: number;

        readonly minorKeyOffset?: number;

        readonly nosiness?: number;

        readonly spectralRoughness?: number;
    };
}

export interface FeatureBounds {
    readonly bpm?: [number, number];

    readonly rms?: [number, number];

    readonly spectralCentroid?: [number, number];

    readonly spectralFlatness?: [number, number];

    readonly spectralRoughness?: [number, number];
}

function computeEmotionScores(
    bpm: number,
    key: string,
    rms: number,
    spectralCentroid: number,
    spectralFlatness: number,
    spectralRoughness: number,
    weights: DeepRequired<EmotionWeights>,
): EmotionScores {
    const {
        arousal: { brightness, constant: arousalConstant, directEnergy, tempo },
        valence: {
            constant: valenceConstant,
            majorKeyOffset,
            minorKeyOffset,
            nosiness,
            spectralRoughness: roughnessWeight,
        },
    } = weights;

    const keyWeight = key.endsWith('m') ? minorKeyOffset : majorKeyOffset;

    const arousalScore = (rms * directEnergy) +
        (spectralCentroid * brightness) +
        (bpm * tempo) +
        arousalConstant;

    const valenceScore = keyWeight +
        (spectralFlatness * nosiness) +
        (spectralRoughness * roughnessWeight) +
        valenceConstant;

    return {
        arousal: arousalScore,
        valence: valenceScore,
    };
}

function computeSpectralRoughness(
    complexSpectrum: ExpectedFeatures['complexSpectrum'],
): number {
    const { real, imag } = complexSpectrum;

    if (real.length === 0) {
        return 0;
    }

    let spectralRoughness = 0;
    let previousMagnitude = Math.sqrt(
        (real[0] * real[0]) + (imag[0] * imag[0]),
    );

    for (
        let frequencyIndex = 1;
        frequencyIndex < real.length;
        frequencyIndex++
    ) {
        const currentMagnitude = Math.sqrt(
            (real[frequencyIndex] * real[frequencyIndex]) +
                (imag[frequencyIndex] * imag[frequencyIndex]),
        );

        spectralRoughness += Math.abs(currentMagnitude - previousMagnitude);
        previousMagnitude = currentMagnitude;
    }

    return spectralRoughness / real.length;
}

export function determineEmotionScores(
    options: DetermineEmotionScoresOptions,
): EmotionScores {
    const emotionWeights = (options.emotionWeights
        ? deepMerge(
            DEFAULT_EMOTION_WEIGHTS,
            options.emotionWeights as Record<string, unknown>,
        )
        : DEFAULT_EMOTION_WEIGHTS) as DeepRequired<EmotionWeights>;

    const featureBounds = {
        ...DEFAULT_FEATURE_BOUNDS,
        ...options.featureBounds,
    } as Required<FeatureBounds>;

    const {
        averageFeatures: {
            complexSpectrum,
            rms,
            spectralCentroid,
            spectralFlatness,
        },
        bpm,
        key,
    } = options;

    const {
        bpm: [minBpm, maxBpm],
        rms: [minRms, maxRms],
        spectralRoughness: [minDissonance, maxDissonance],
        spectralCentroid: [minCentroid, maxCentroid],
        spectralFlatness: [minFlatness, maxFlatness],
    } = featureBounds;

    const spectralRougness = computeSpectralRoughness(complexSpectrum);

    return computeEmotionScores(
        normalizeValue(bpm, minBpm, maxBpm),
        key,
        normalizeValue(rms, minRms, maxRms),
        normalizeValue(spectralCentroid, minCentroid, maxCentroid),
        normalizeValue(spectralFlatness, minFlatness, maxFlatness),
        normalizeValue(spectralRougness, minDissonance, maxDissonance),
        emotionWeights,
    );
}
