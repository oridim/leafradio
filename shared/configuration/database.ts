import { fromFileUrl } from '@std/path';

import { Migrator } from '@mikro-orm/migrations';
import { defineConfig, NodeSqliteDialect, SqliteDriver } from '@mikro-orm/sql';

import {
    DIRECTORY_DATA,
    FILE_DATABASE,
} from '@/shared/configuration/filesystem.ts';
import { ENTITY_AUDIO_FILE } from '@/shared/database/entities/audio-file-entity.ts';
import { ENTITY_MUSICAL_FEATURES } from '@/shared/database/entities/musical-features-entity.ts';
import {
    ENTITY_RADIO,
    RadioEventsSubscriber,
} from '@/shared/database/entities/radio-entity.ts';
import {
    ENTITY_REPOSITORY,
    RepositoryEventSubscriber,
} from '@/shared/database/entities/repository-entity.ts';

const DIRECTORY_MIGRATIONS = new URL('../database/migrations', import.meta.url);

export default async function makeDatabaseConfiguration() {
    // **HACK:** I do not like doing the directory creation here instead of
    // `initFilesystem`. _BUT_, the MikrORM CLI does not automatically,
    // recursively create the parent directory for the target database. And
    // it requires a live connection to generate migrations.
    await Deno.mkdir(DIRECTORY_DATA, { recursive: true });

    return defineConfig({
        driver: SqliteDriver,
        dbName: FILE_DATABASE,
        driverOptions: new NodeSqliteDialect(FILE_DATABASE),
        extensions: [Migrator],
        entities: [
            ENTITY_AUDIO_FILE,
            ENTITY_MUSICAL_FEATURES,
            ENTITY_RADIO,
            ENTITY_REPOSITORY,
        ],

        migrations: {
            path: fromFileUrl(DIRECTORY_MIGRATIONS),
        },

        subscribers: [RadioEventsSubscriber, RepositoryEventSubscriber],
    });
}
