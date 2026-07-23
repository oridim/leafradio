import { AudioFile } from '@/shared/models/audio-file.ts';
import { ProcessedMetadata } from '@/shared/models/processed-metadata.ts';

interface SerializedAudioData {
    readonly audioFiles: readonly AudioFile[];

    readonly processedMetadata: readonly ProcessedMetadata[];
}

export interface AudioData {
    readonly audioFiles: Record<string, AudioFile | undefined>;

    readonly processedMetadata: Record<string, ProcessedMetadata | undefined>;
}

export async function readAudioData(filePath: string): Promise<AudioData> {
    // **TODO:** validation
    const text = await Deno.readTextFile(filePath);
    const serializedAudioData = JSON.parse(text) as SerializedAudioData;

    return {
        audioFiles: Object.fromEntries(
            serializedAudioData
                .audioFiles
                .map((file) => [file.filePath, file]),
        ),

        processedMetadata: Object.fromEntries(
            serializedAudioData
                .processedMetadata
                .map((metadata) => [metadata.pcmHash, metadata]),
        ),
    };
}

export function writeAudioData(
    filePath: string,
    audioData: AudioData,
): Promise<void> {
    const payload = JSON.stringify(
        {
            audioFiles: Object
                .values(audioData.audioFiles)
                .filter((file) => file !== undefined),
            processedMetadata: Object
                .values(audioData.processedMetadata)
                .filter((metadata) => metadata !== undefined),
        } satisfies SerializedAudioData,
    );

    return Deno.writeTextFile(filePath, payload);
}
