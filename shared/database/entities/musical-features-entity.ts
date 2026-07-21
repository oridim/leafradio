import type { InferEntity } from '@mikro-orm/core';

import { defineEntity, p } from '@mikro-orm/core';

export type MusicalFeaturesEntity = InferEntity<typeof ENTITY_MUSICAL_FEATURES>;

export const ENTITY_MUSICAL_FEATURES = defineEntity({
    name: 'MusicalFeatures',

    properties: {
        musicalFeaturesHash: p.string().primary(),

        arousal: p.double(),

        bpm: p.integer(),

        duration: p.integer(),

        key: p.string(),

        valence: p.double(),
    },
});
