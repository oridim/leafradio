import type { AudioInstance } from 'audio';

import { computeAverageFeatures } from '@/lib/utilities/meyda.ts';

import type {
    EmotionWeights,
    FeatureBounds,
} from '@/lib/music/emotion-scores.ts';
import type { FeatureExtractionOptions } from '@/lib/music/feature-extraction.ts';
import { DEFAULT_FEATURE_EXTRACTION_OPTIONS } from '@/lib/music/feature-extraction.ts';
import { determineBeatsPerMinute } from '@/lib/music/beats-per-minute.ts';
import { determineEmotionScores } from '@/lib/music/emotion-scores.ts';
import { determineKey } from '@/lib/music/key.ts';

export interface MusicalFeatures {
    readonly arousal: number;

    readonly bpm: number;

    readonly key: string;

    readonly valence: number;
}

export interface ExtractMusicalFeaturesOptions {
    readonly emotionWeights?: EmotionWeights;

    readonly featureBounds?: FeatureBounds;

    readonly featureExtraction?: FeatureExtractionOptions;
}

export async function extractMusicalFeatures(
    audioInstance: AudioInstance,
    options: ExtractMusicalFeaturesOptions = {},
): Promise<MusicalFeatures> {
    const {
        emotionWeights,
        featureBounds,
    } = options;

    const featureExtraction = {
        ...DEFAULT_FEATURE_EXTRACTION_OPTIONS,
        ...options.featureExtraction,
    } as Required<FeatureExtractionOptions>;

    const downmixedAudioInstance = audioInstance.remix(1);
    const averageFeatures = await computeAverageFeatures(
        downmixedAudioInstance,
        [
            'chroma',
            'complexSpectrum',
            'rms',
            'spectralCentroid',
            'spectralFlatness',
        ],
        featureExtraction.bufferSize,
    );

    if (!averageFeatures) {
        throw new Error(
            "bad argument #0 to 'extractMusicalFeatures' (features could not be extracted out of the audio data)",
        );
    }

    const bpm = await determineBeatsPerMinute(downmixedAudioInstance);
    const key = determineKey(averageFeatures.chroma);

    const { arousal, valence } = determineEmotionScores({
        averageFeatures,
        bpm,
        emotionWeights,
        featureBounds,
        key,
    });

    return {
        arousal,
        bpm,
        key,
        valence,
    };
}
