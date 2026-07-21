import { combTempo } from 'beat-detection';

import type { DecodedAudioData } from '@/lib/utilities/audio.ts';
import {
    applyHighPassFilter,
    applyLowPassFilter,
} from '@/lib/utilities/audio.ts';

export async function determineBeatsPerMinute(
    decodedAudioData: DecodedAudioData,
): Promise<number> {
    const [
        highPassedAudioData,
        lowPassedAudioData,
    ] = await Promise.all([
        applyHighPassFilter(decodedAudioData, { frequency: 2000, q: 0.707 }),
        applyLowPassFilter(decodedAudioData, { frequency: 150, q: 0.707 }),
    ]);

    const highPassedTempo = combTempo(highPassedAudioData.audioData, {
        fs: decodedAudioData.sampleRate,
    });

    const lowPassedTempo = combTempo(lowPassedAudioData.audioData, {
        fs: decodedAudioData.sampleRate,
    });

    return highPassedTempo.confidence >= lowPassedTempo.confidence
        ? highPassedTempo.bpm
        : lowPassedTempo.bpm;
}
