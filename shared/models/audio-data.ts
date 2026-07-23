import { AudioFile } from '@/shared/models/audio-file.ts';
import { ProcessedMetadata } from '@/shared/models/processed-metadata.ts';

export interface AudioData {
    readonly audioFiles: Record<string, AudioFile | undefined>;

    readonly processedMetadata: Record<string, ProcessedMetadata | undefined>;
}

export async function readAudioData(filePath: string): Promise<AudioData> {
    // **TODO:** validation
    const text = await Deno.readTextFile(filePath);

    return JSON.parse(text);
}

export function writeAudioData(
    filePath: string,
    audioData: AudioData,
): Promise<void> {
    const payload = JSON.stringify(audioData);

    return Deno.writeTextFile(filePath, payload);
}
