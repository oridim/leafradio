import { DATABASE, ENTITY_MANAGER } from '@/shared/database/orm.ts';
import { initRepositories } from '@/shared/database/entities/repository-entity.ts';

export async function initDatabase(): Promise<void> {
    await ENTITY_MANAGER.execute('PRAGMA journal_mode = WAL;');
    await DATABASE.migrator.up();

    await Promise.all([
        initRepositories(ENTITY_MANAGER),
    ]);
}
