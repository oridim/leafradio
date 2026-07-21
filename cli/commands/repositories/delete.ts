import { resolve } from '@std/path';

import { boolean, command, positional } from '@drizzle-team/brocli';

import {
    ENTITY_MANAGER,
    ENTITY_REPOSITORY,
    withEntityManager,
} from '@/shared/database/mod.ts';

import { EXIT_CODES } from '@/cli/utilities/process.ts';

const COMMAND_OPTIONS = {
    identifier: positional().desc(
        'repository ID to delete',
    ).required(),

    resolveDirectoryPath: boolean('resolve-directory-path').desc(
        'enables resolving the repository lookup by directoy path rather than repository ID',
    ).default(false),
} as const;

export default command({
    name: 'delete',
    desc: 'Deletes a music repository from the database.',
    options: COMMAND_OPTIONS,

    handler: withEntityManager(async ({ identifier, resolveDirectoryPath }) => {
        const repository = await ENTITY_MANAGER.findOne(
            ENTITY_REPOSITORY,
            resolveDirectoryPath
                ? { directoryPath: resolve(identifier) }
                : { repositoryID: parseInt(identifier) },
        );

        if (!repository) {
            console.error(
                `Invalid value: value for the argument 'identifier' was not found`,
            );

            Deno.exit(EXIT_CODES.invalidOptions);
        }

        const { directoryPath, repositoryID } = repository;

        ENTITY_MANAGER.remove(repository);
        await ENTITY_MANAGER.flush();

        console.log(
            `[LeafRadio] Deleted repository '${repositoryID}' ('${directoryPath}').`,
        );
    }),
});
