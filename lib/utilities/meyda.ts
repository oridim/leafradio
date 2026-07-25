import type { AudioInstance } from 'audio';
import type { MeydaAudioFeature, MeydaFeaturesObject } from 'meyda';
import Meyda from 'meyda';

// **HACK:** `meyda` doesn't properly type its default export.
const MEYDA = Meyda as unknown as Meyda.default;

export type MeydaFeature =
    | number
    | number[]
    | Float32Array
    | { [key: string]: MeydaFeature };

export type ExtractedMeydaFeatures<T extends MeydaAudioFeature> = Pick<
    MeydaFeatures,
    T
>;

export interface MeydaFeatures extends MeydaFeaturesObject {
    melBands: number[];

    spectralFlux: number;
}

function addValues<T extends MeydaFeature>(target: T, source: T): T {
    if (typeof source === 'number') {
        const targetNumber = target as number;

        return (targetNumber +
            (Number.isNaN(source) ? 0 : source)) as T;
    }

    if (Array.isArray(source) || source instanceof Float32Array) {
        const targetArray = target as number[] | Float32Array;

        for (let arrayIndex = 0; arrayIndex < source.length; arrayIndex++) {
            targetArray[arrayIndex] += source[arrayIndex];
        }

        return target;
    }

    if (typeof source === 'object' && source !== null) {
        const sourceObject = source as Record<string, MeydaFeature>;
        const targetObject = target as Record<string, MeydaFeature>;

        for (const key in sourceObject) {
            targetObject[key] = addValues(targetObject[key], sourceObject[key]);
        }

        return target;
    }

    return target;
}

function* chunkAudioData(
    audioData: Float32Array<ArrayBuffer>,
    bufferSize: number,
    hopSize: number = bufferSize,
): Generator<Float32Array<ArrayBuffer>> {
    const frameMaximumIndex = audioData.length - bufferSize;

    for (
        let frameStartIndex = 0;
        frameStartIndex <= frameMaximumIndex;
        frameStartIndex += hopSize
    ) {
        yield audioData.slice(
            frameStartIndex,
            frameStartIndex + bufferSize,
        );
    }
}

function createEmptyShape<T extends MeydaFeature>(value: T): T {
    if (typeof value === 'number') {
        return 0 as T;
    }

    if (Array.isArray(value)) {
        return new Array(value.length).fill(0) as T;
    }

    if (value instanceof Float32Array) {
        return new Float32Array(value.length) as T;
    }

    if (typeof value === 'object' && value !== null) {
        const targetShape: Record<string, MeydaFeature> = {};

        for (const key in value) {
            targetShape[key] = createEmptyShape(
                (value as Record<string, MeydaFeature>)[key],
            );
        }

        return targetShape as T;
    }

    return value;
}

function divideValues<T extends MeydaFeature>(
    target: T,
    framesProcessed: number,
): T {
    if (typeof target === 'number') {
        return (target / framesProcessed) as T;
    }

    if (Array.isArray(target) || target instanceof Float32Array) {
        for (let arrayIndex = 0; arrayIndex < target.length; arrayIndex++) {
            target[arrayIndex] /= framesProcessed;
        }

        return target;
    }

    if (typeof target === 'object' && target !== null) {
        const targetObject = target as Record<string, MeydaFeature>;

        for (const key in targetObject) {
            targetObject[key] = divideValues(
                targetObject[key],
                framesProcessed,
            );
        }

        return target;
    }

    return target;
}

function* extractMeydaFeatures<T extends MeydaAudioFeature>(
    audioData: Float32Array<ArrayBuffer>,
    features: T[],
    bufferSize: number,
    hopSize: number = bufferSize,
): Generator<ExtractedMeydaFeatures<T>> {
    const generator = chunkAudioData(audioData, bufferSize, hopSize);

    for (const sample of generator) {
        const extractedFeatures = MEYDA.extract(features, sample);

        if (!extractedFeatures) continue;

        yield extractedFeatures as Pick<MeydaFeatures, T>;
    }
}

export async function computeAverageFeatures<T extends MeydaAudioFeature>(
    audioInstance: AudioInstance,
    features: T[],
    bufferSize: number,
    hopSize: number = bufferSize,
): Promise<Pick<MeydaFeatures, T> | null> {
    const pcmData = await audioInstance.read({ channel: 0 });
    const rawData = Array.isArray(pcmData) ? pcmData[0] : pcmData;

    const audioData =
        rawData instanceof Float32Array && rawData.buffer instanceof ArrayBuffer
            ? (rawData as Float32Array<ArrayBuffer>)
            : new Float32Array(rawData || 0);

    const generator = extractMeydaFeatures(
        audioData,
        features,
        bufferSize,
        hopSize,
    );

    let framesProcessed = 0;
    const accumulatedFeatures = {} as Record<string, MeydaFeature>;

    for (const frameFeatures of generator) {
        for (const featureName of features) {
            const featureValue = frameFeatures[featureName];

            if (framesProcessed === 0) {
                accumulatedFeatures[featureName] = createEmptyShape(
                    featureValue,
                );
            }

            accumulatedFeatures[featureName] = addValues(
                accumulatedFeatures[featureName],
                featureValue,
            );
        }
        framesProcessed++;
    }

    if (framesProcessed === 0) return null;

    for (const featureName of features) {
        accumulatedFeatures[featureName] = divideValues(
            accumulatedFeatures[featureName],
            framesProcessed,
        );
    }

    return accumulatedFeatures as Pick<MeydaFeatures, T>;
}
