import type { FromSchema, JSONSchema } from 'json-schema-to-ts';

import type { AudioFile } from '@/shared/models/audio-file.ts';
import { SCHEMA_AUDIO_FILE } from '@/shared/models/audio-file.ts';
import type { ProcessedMetadata } from '@/shared/models/processed-metadata.ts';
import { SCHEMA_PROCESSED_METADATA } from '@/shared/models/processed-metadata.ts';

const SCHEMA_SERIALIZED_AUDIO_DATA = {
    type: 'object',

    additionalProperties: false,
    required: ['audioFiles', 'processedMetadata'],

    properties: {
        audioFiles: {
            type: 'array',
            items: SCHEMA_AUDIO_FILE,
        },

        processedMetadata: {
            type: 'array',
            items: SCHEMA_PROCESSED_METADATA,
        },
    },
} as const satisfies JSONSchema;

type SerializedAudioData = Readonly<
    FromSchema<typeof SCHEMA_SERIALIZED_AUDIO_DATA>
>;

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
            audioFiles: Object.values(
                audioData.audioFiles as Record<
                    string,
                    AudioFile
                >,
            ),
            processedMetadata: Object.values(
                audioData.processedMetadata as Record<
                    string,
                    ProcessedMetadata
                >,
            ),
        } satisfies SerializedAudioData,
    );

    return Deno.writeTextFile(filePath, payload);
}
