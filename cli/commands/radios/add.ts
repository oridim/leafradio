import { command, positional } from '@drizzle-team/brocli';

import {
    ENTITY_MANAGER,
    ENTITY_RADIO,
    withEntityManager,
} from '@/shared/database/mod.ts';

import { EXIT_CODES } from '@/cli/utilities/process.ts';

const COMMAND_OPTIONS = {
    name: positional().desc(
        'name to use for the radio',
    )
        .required(),
} as const;

export default command({
    name: 'add',
    desc: 'Adds a radio to the database.',
    options: COMMAND_OPTIONS,

    handler: withEntityManager(async ({ name }) => {
        let radio = await ENTITY_MANAGER.findOne(
            ENTITY_RADIO,
            { name },
        );

        if (radio) {
            console.error(
                `Invalid value: value for the argument 'name' already existed as a radio`,
            );

            Deno.exit(EXIT_CODES.invalidOptions);
        }

        radio = ENTITY_MANAGER.create(ENTITY_RADIO, {
            name,
        });

        ENTITY_MANAGER.persist(radio);
        await ENTITY_MANAGER.flush();

        console.log(
            `[LeafRadio] Added '${name}' as repository '${radio.radioID}'.`,
        );
    }),
});
