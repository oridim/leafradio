import type { FromSchema, JSONSchema } from 'json-schema-to-ts';

export const SCHEMA_PROCESSED_METADATA = {
    type: 'object',

    additionalProperties: false,
    required: ['pcmHash', 'audioProperties', 'musicalFeatures'],

    properties: {
        pcmHash: { type: 'string' },

        audioProperties: {
            type: 'object',

            additionalProperties: false,
            required: ['duration'],

            properties: {
                duration: { type: 'number' },
            },
        },

        musicalFeatures: {
            type: 'object',

            additionalProperties: false,
            required: ['arousal', 'bpm', 'key', 'valence'],

            properties: {
                arousal: { type: 'number' },

                bpm: { type: 'number' },

                key: { type: 'string' },

                valence: { type: 'number' },
            },
        },
    },
} as const satisfies JSONSchema;

export type ProcessedMetadata = Readonly<
    FromSchema<typeof SCHEMA_PROCESSED_METADATA>
>;
