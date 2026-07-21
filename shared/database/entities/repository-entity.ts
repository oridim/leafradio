import type { EventArgs, EventSubscriber, InferEntity } from '@mikro-orm/core';
import { defineEntity, p } from '@mikro-orm/core';

import { makeEvent } from '@/lib/utilities/event.ts';

import type { EntityManager } from '@/shared/database/orm.ts';

import { ENTITY_AUDIO_FILE } from '@/shared/database/entities/audio-file-entity.ts';
import { ENTITY_RADIO } from '@/shared/database/entities/radio-entity.ts';

export const EVENT_REPOSITORIES_MUTATED = makeEvent();

export const REPOSITORY_SCAN_STATES = {
    badScan: 'badScan',

    notScanning: 'notScanning',

    interruptedScan: 'interruptedScan',

    processingFiles: 'processingFiles',

    scanningDirectory: 'scanningDirectory',

    unscanned: 'unscanned',
} as const;

export type RepositoryEntity = InferEntity<typeof ENTITY_REPOSITORY>;

export type RepositoryScanStates =
    typeof REPOSITORY_SCAN_STATES[keyof typeof REPOSITORY_SCAN_STATES];

export async function initRepositories(
    entityManager: EntityManager,
): Promise<void> {
    await entityManager.nativeUpdate(
        ENTITY_REPOSITORY,
        {
            $or: [
                { scanState: REPOSITORY_SCAN_STATES.processingFiles },
                { scanState: REPOSITORY_SCAN_STATES.scanningDirectory },
            ],
        },
        { scanState: REPOSITORY_SCAN_STATES.interruptedScan },
    );

    // **TODO:** put missing repository directories into `badScan` state
    // **TODO:** put repositories with untracked files into `unscanned` state
}

export class RepositoryEventSubscriber
    implements EventSubscriber<RepositoryEntity> {
    getSubscribedEntities() {
        return [ENTITY_REPOSITORY];
    }

    afterCreate(_args: EventArgs<RepositoryEntity>) {
        EVENT_REPOSITORIES_MUTATED.dispatch();
    }

    afterDelete(_args: EventArgs<RepositoryEntity>) {
        EVENT_REPOSITORIES_MUTATED.dispatch();
    }

    afterUpdate(_args: EventArgs<RepositoryEntity>) {
        EVENT_REPOSITORIES_MUTATED.dispatch();
    }

    afterUpsert(_args: EventArgs<RepositoryEntity>) {
        EVENT_REPOSITORIES_MUTATED.dispatch();
    }
}

export const ENTITY_REPOSITORY = defineEntity({
    name: 'Repository',

    properties: {
        repositoryID: p.integer().primary(),

        directoryPath: p.string().unique(),

        scanState: p.enum(() => REPOSITORY_SCAN_STATES).default(
            REPOSITORY_SCAN_STATES.unscanned,
        ),

        audioFiles: () =>
            p
                .oneToMany(ENTITY_AUDIO_FILE)
                .mappedBy('repository').orphanRemoval(),

        radios: () =>
            p
                .manyToMany(ENTITY_RADIO)
                .mappedBy('repositories'),
    },
});
