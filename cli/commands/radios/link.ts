import { resolve } from '@std/path';

import { boolean, command, positional } from '@drizzle-team/brocli';

import {
    ENTITY_MANAGER,
    ENTITY_RADIO,
    ENTITY_REPOSITORY,
    withEntityManager,
} from '@/shared/database/mod.ts';

import { EXIT_CODES } from '@/cli/utilities/process.ts';

const COMMAND_OPTIONS = {
    radioIdentifier: positional('radio-identifier').desc(
        'radio ID to lookup',
    ).required(),

    repositoryIdentifier: positional('repository-identifier').desc(
        'repository ID to link',
    ).required(),

    resolveDirectoryPath: boolean('resolve-directory-path').desc(
        'enables resolving the repository lookup by directory path rather than repository ID',
    ).default(false),

    resolveName: boolean('resolve-name').desc(
        'enables resolving the radio lookup by name rather than radio ID',
    ).default(false),
} as const;

export default command({
    name: 'link',
    desc: 'Links a repository to a radio.',
    options: COMMAND_OPTIONS,

    handler: withEntityManager(
        async (
            {
                radioIdentifier,
                repositoryIdentifier,
                resolveDirectoryPath,
                resolveName,
            },
        ) => {
            const radio = await ENTITY_MANAGER.findOne(
                ENTITY_RADIO,
                resolveName
                    ? {
                        name: radioIdentifier,
                    }
                    : {
                        radioID: parseInt(radioIdentifier),
                    },
                {
                    populate: ['repositories'],
                },
            );

            if (!radio) {
                console.error(
                    `Invalid value: value for the argument 'radio-identifier' was not found`,
                );

                Deno.exit(EXIT_CODES.invalidOptions);
            }

            const repository = await ENTITY_MANAGER.findOne(
                ENTITY_REPOSITORY,
                resolveDirectoryPath
                    ? {
                        directoryPath: resolve(repositoryIdentifier),
                    }
                    : {
                        repositoryID: parseInt(repositoryIdentifier),
                    },
            );

            if (!repository) {
                console.error(
                    `Invalid value: value for the argument 'repository-identifier' was not found`,
                );

                Deno.exit(EXIT_CODES.invalidOptions);
            }

            const { name, radioID, repositories } = radio;

            if (repositories.contains(repository)) {
                console.error(
                    `Invalid value: value for the argument 'radio-identifier' was already linked with argument 'repository-identifier'`,
                );

                Deno.exit(EXIT_CODES.invalidOptions);
            }

            repositories.add(repository);
            ENTITY_MANAGER.flush();

            const { repositoryID, directoryPath } = repository;

            console.log(
                `[LeafRadio] Linked radio '${radioID}' ('${name}') with repository '${repositoryID}' ('${directoryPath}').`,
            );
        },
    ),
});
