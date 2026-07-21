import { boolean, command, positional, string } from '@drizzle-team/brocli';

import {
    determineProfile,
    PROFILE_NAMES,
    serializePackPlaylistBucketsParameters,
} from '@/lib/playlist-packer/mod.ts';

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

    profile: string().desc(
        "sets the a preset profile's parameters on a radio",
    ).enum(
        // **HACK:** `enum` definition function expects at least one non-dynamic
        // string element as the first element. Brocli is trying to enforce that
        // there is at least one string element.
        ...Object.values(PROFILE_NAMES) as [string, ...string[]],
    ),
} as const;

export default command({
    name: 'set-profile',
    desc:
        'Sets the playlist packing algorithm parameters of a radio to a preset profile.',
    options: COMMAND_OPTIONS,

    handler: withEntityManager(
        async ({ identifier, profile, resolveName }) => {
            const radio = await ENTITY_MANAGER.findOne(
                ENTITY_RADIO,
                resolveName
                    ? {
                        name: identifier,
                    }
                    : {
                        radioID: parseInt(identifier),
                    },
            );

            if (!radio) {
                console.error(
                    `Invalid value: value for the argument 'identifier' was not found`,
                );

                Deno.exit(EXIT_CODES.invalidOptions);
            }

            const { name, packPlaylistBucketsParameters, radioID } = radio;
            const profileParameters = determineProfile(profile);

            ENTITY_MANAGER.assign(radio, {
                packPlaylistBucketsParameters: Object.assign(
                    packPlaylistBucketsParameters ?? {},
                    serializePackPlaylistBucketsParameters(profileParameters),
                ),
            });

            await ENTITY_MANAGER.flush();

            console.log(
                `[LeafRadio] Updated radio '${radioID}' ('${name}')'s parameters to profile '${profile}'.`,
            );
        },
    ),
});
