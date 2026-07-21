import { DATABASE, ENTITY_MANAGER } from '@/shared/database/orm.ts';

export async function initDatabase(): Promise<void> {
    await ENTITY_MANAGER.execute('PRAGMA journal_mode = WAL;');
    await DATABASE.migrator.up();

    await Promise.all([]);
}
