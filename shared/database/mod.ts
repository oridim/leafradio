export { initDatabase } from '@/shared/database/lifecycle.ts';

export type { EntityManager } from '@/shared/database/orm.ts';
export { ENTITY_MANAGER, withEntityManager } from '@/shared/database/orm.ts';

export type { AudioFileEntity } from '@/shared/database/entities/audio-file-entity.ts';
export { ENTITY_AUDIO_FILE } from '@/shared/database/entities/audio-file-entity.ts';

export type { ProcessedMetadataEntity } from '@/shared/database/entities/processed-metadata-entity.ts';
export { ENTITY_PROCESSED_METADATA } from '@/shared/database/entities/processed-metadata-entity.ts';
