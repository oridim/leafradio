import { boolean, command, positional } from '@drizzle-team/brocli';

import {
    ENTITY_MANAGER,
    ENTITY_RADIO,
    withEntityManager,
} from '@/shared/database/mod.ts';

import { EXIT_CODES } from '@/cli/utilities/process.ts';

const COMMAND_OPTIONS = {
    identifier: positional().desc(
        'radio ID to delete',
    ).required(),

    resolveName: boolean('resolve-name').desc(
        'enables resolving the radio lookup by name rather than radio ID',
    ).default(false),
} as const;

export default command({
    name: 'delete',
    desc: 'Deletes a radio from the database.',
    options: COMMAND_OPTIONS,

    handler: withEntityManager(async ({ identifier, resolveName }) => {
        const radio = await ENTITY_MANAGER.findOne(
            ENTITY_RADIO,
            resolveName
                ? { name: identifier }
                : { radioID: parseInt(identifier) },
        );

        if (!radio) {
            console.error(
                `Invalid value: value for the argument 'identifier' was not found`,
            );

            Deno.exit(EXIT_CODES.invalidOptions);
        }

        const { name, radioID } = radio;

        ENTITY_MANAGER.remove(radio);
        await ENTITY_MANAGER.flush();

        console.log(
            `[LeafRadio] Deleted radio '${radioID}' ('${name}').`,
        );
    }),
});
