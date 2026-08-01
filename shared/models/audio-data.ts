import type { Schema } from '@cfworker/json-schema';
import { Validator } from '@cfworker/json-schema';
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

const VALIDATOR_SERIALIZED_AUDIO_DATA = new Validator(
    SCHEMA_SERIALIZED_AUDIO_DATA as JSONSchema as Schema,
);

type SerializedAudioData = Readonly<
    FromSchema<typeof SCHEMA_SERIALIZED_AUDIO_DATA>
>;

export interface AudioData {
    readonly audioFiles: Record<string, AudioFile | undefined>;

    readonly processedMetadata: Record<string, ProcessedMetadata | undefined>;
}

export async function readAudioData(filePath: string): Promise<AudioData> {
    const text = await Deno.readTextFile(filePath);
    const parsed = JSON.parse(text);

    const validationResult = VALIDATOR_SERIALIZED_AUDIO_DATA.validate(parsed);

    if (!validationResult.valid) {
        const issues = validationResult.errors
            .map((error) => `'${error.instanceLocation}' ${error.error}`)
            .join('; ');

        throw new Error(
            `bad argument #0 to 'readAudioData' (audio data file '${filePath}' failed schema validation):\n${issues}`,
        );
    }

    const serializedAudioData = parsed as SerializedAudioData;

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
