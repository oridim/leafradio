import type { EventArgs, EventSubscriber, InferEntity } from '@mikro-orm/core';
import { defineEntity, p } from '@mikro-orm/core';

import type { SerializedPackPlaylistBucketParameters } from '@/lib/playlist-packer/mod.ts';
import { makeEvent } from '@/lib/utilities/event.ts';

import { ENTITY_REPOSITORY } from '@/shared/database/entities/repository-entity.ts';

export const EVENT_RADIOS_MUTATED = makeEvent();

export type RadioEntity = InferEntity<typeof ENTITY_RADIO>;

export class RadioEventsSubscriber implements EventSubscriber<RadioEntity> {
    getSubscribedEntities() {
        return [ENTITY_RADIO];
    }

    afterCreate(_args: EventArgs<RadioEntity>) {
        EVENT_RADIOS_MUTATED.dispatch();
    }

    afterDelete(_args: EventArgs<RadioEntity>) {
        EVENT_RADIOS_MUTATED.dispatch();
    }

    afterUpdate(_args: EventArgs<RadioEntity>) {
        EVENT_RADIOS_MUTATED.dispatch();
    }

    afterUpsert(_args: EventArgs<RadioEntity>) {
        EVENT_RADIOS_MUTATED.dispatch();
    }
}

export const ENTITY_RADIO = defineEntity({
    name: 'Radio',

    properties: {
        radioID: p.integer().primary(),

        name: p.string(),

        packPlaylistBucketsParameters: p.json<
            SerializedPackPlaylistBucketParameters
        >()
            .nullable(),

        repositories: () => p.manyToMany(ENTITY_REPOSITORY),
    },
});
