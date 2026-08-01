import type { FromSchema, JSONSchema } from 'json-schema-to-ts';

export const SCHEMA_AUDIO_FILE = {
    type: 'object',

    additionalProperties: false,
    required: ['filePath', 'lastModified', 'pcmHash'],

    properties: {
        filePath: {
            type: 'string',
        },

        lastModified: {
            type: 'number',
        },

        pcmHash: {
            type: 'string',
        },
    },
} as const satisfies JSONSchema;

export type AudioFile = Readonly<FromSchema<typeof SCHEMA_AUDIO_FILE>>;
