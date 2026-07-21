import type { InferEntity } from '@mikro-orm/core';

import { defineEntity, p } from '@mikro-orm/core';

import { MusicalFeatures } from '@/lib/music/mod.ts';
import { AudioProperties } from '@/lib/playlist-packer/mod.ts';

export type ProcessedMetadataEntity = InferEntity<
    typeof ENTITY_PROCESSED_METADATA
>;

export const ENTITY_PROCESSED_METADATA = defineEntity({
    name: 'ProcessedMetadata',

    properties: {
        pcmHash: p.string().primary(),

        audioProperties: p.json<AudioProperties>(),

        musicalFeatures: p.json<MusicalFeatures>(),
    },
});
