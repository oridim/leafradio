export { initDatabase } from '@/shared/database/lifecycle.ts';

export type { EntityManager } from '@/shared/database/orm.ts';
export { ENTITY_MANAGER, withEntityManager } from '@/shared/database/orm.ts';

export type { AudioFileEntity } from '@/shared/database/entities/audio-file-entity.ts';
export { ENTITY_AUDIO_FILE } from '@/shared/database/entities/audio-file-entity.ts';

export type { MusicalFeaturesEntity } from '@/shared/database/entities/musical-features-entity.ts';
export { ENTITY_MUSICAL_FEATURES } from '@/shared/database/entities/musical-features-entity.ts';

export type { RadioEntity } from '@/shared/database/entities/radio-entity.ts';
export {
    ENTITY_RADIO,
    EVENT_RADIOS_MUTATED,
} from '@/shared/database/entities/radio-entity.ts';

export type {
    RepositoryEntity,
    RepositoryScanStates,
} from '@/shared/database/entities/repository-entity.ts';
export {
    ENTITY_REPOSITORY,
    EVENT_REPOSITORIES_MUTATED,
    REPOSITORY_SCAN_STATES,
} from '@/shared/database/entities/repository-entity.ts';
