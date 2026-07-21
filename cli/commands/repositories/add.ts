import { exists } from '@std/fs';
import { resolve } from '@std/path';

import { command, positional } from '@drizzle-team/brocli';

import {
    ENTITY_MANAGER,
    ENTITY_REPOSITORY,
    withEntityManager,
} from '@/shared/database/mod.ts';

import { EXIT_CODES } from '@/cli/utilities/process.ts';

const COMMAND_OPTIONS = {
    directoryPath: positional('directory-path').desc(
        'filesystem path to add as music repository',
    )
        .required(),
} as const;

export default command({
    name: 'add',
    desc: 'Adds a music repository to the database.',
    options: COMMAND_OPTIONS,

    handler: withEntityManager(async ({ directoryPath }) => {
        const resolvedDirectoryPath = resolve(directoryPath);
        const isDirectory = await exists(resolvedDirectoryPath, {
            isDirectory: true,
        });

        if (!isDirectory) {
            console.error(
                `Invalid value: value for the argument 'directory-path' is not a valid directory or does not exist`,
            );

            Deno.exit(EXIT_CODES.invalidOptions);
        }

        let repository = await ENTITY_MANAGER.findOne(
            ENTITY_REPOSITORY,
            { directoryPath: resolvedDirectoryPath },
        );

        if (repository) {
            console.error(
                `Invalid value: value for the argument 'directory-path' already existed as a repository`,
            );

            Deno.exit(EXIT_CODES.invalidOptions);
        }

        repository = ENTITY_MANAGER.create(ENTITY_REPOSITORY, {
            directoryPath: resolvedDirectoryPath,
        });

        ENTITY_MANAGER.persist(repository);
        await ENTITY_MANAGER.flush();

        console.log(
            `[LeafRadio] Added directory path '${resolvedDirectoryPath}' as repository '${repository.repositoryID}'.`,
        );
    }),
});
