import type { AudioInstance } from 'audio';

export async function determineBeatsPerMinute(
    audioInstance: AudioInstance,
): Promise<number> {
    const [
        highPassedTempo,
        lowPassedTempo,
    ] = await Promise.all([
        audioInstance.filter('highpass', 2000, 0.707).detect(),
        audioInstance.filter('lowpass', 150, 0.707).detect(),
    ]);

    return highPassedTempo.confidence >= lowPassedTempo.confidence
        ? highPassedTempo.bpm
        : lowPassedTempo.bpm;
}
