import type { InferEntity } from '@mikro-orm/core';
import { defineEntity, p } from '@mikro-orm/core';

import { ENTITY_PROCESSED_METADATA } from '@/shared/database/entities/processed-metadata-entity.ts';

export type AudioFileEntity = InferEntity<typeof ENTITY_AUDIO_FILE>;

export const ENTITY_AUDIO_FILE = defineEntity({
    name: 'AudioFile',

    properties: {
        audioFileID: p.integer().primary(),

        absoluteFilePath: p.string().unique(),

        lastModified: p.integer(),

        processedMetadata: () => p.manyToOne(ENTITY_PROCESSED_METADATA),
    },
});
