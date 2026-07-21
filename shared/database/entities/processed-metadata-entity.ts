import type { InferEntity } from '@mikro-orm/core';

import { defineEntity, p } from '@mikro-orm/core';

export type ProcessedMetadataEntity = InferEntity<
    typeof ENTITY_PROCESSED_METADATA
>;

export const ENTITY_PROCESSED_METADATA = defineEntity({
    name: 'ProcessedMetadataEntity',

    properties: {
        pcmHash: p.string().primary(),

        arousal: p.double(),

        bpm: p.integer(),

        duration: p.integer(),

        key: p.string(),

        valence: p.double(),
    },
});
