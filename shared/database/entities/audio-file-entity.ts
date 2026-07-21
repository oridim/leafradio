import type { InferEntity } from '@mikro-orm/core';
import { defineEntity, p } from '@mikro-orm/core';

import { ENTITY_MUSICAL_FEATURES } from '@/shared/database/entities/musical-features-entity.ts';
import { ENTITY_REPOSITORY } from '@/shared/database/entities/repository-entity.ts';

export type AudioFileEntity = InferEntity<typeof ENTITY_AUDIO_FILE>;

export const ENTITY_AUDIO_FILE = defineEntity({
    name: 'AudioFile',

    properties: {
        audioFileID: p.integer().primary(),

        lastModified: p.integer(),

        musicalFeatures: () => p.manyToOne(ENTITY_MUSICAL_FEATURES),

        relativeFilePath: p.string(),

        repository: () =>
            p
                .manyToOne(ENTITY_REPOSITORY)
                .deleteRule('cascade'),
    },

    uniques: [
        { properties: ['relativeFilePath', 'repository'] },
    ],
});
