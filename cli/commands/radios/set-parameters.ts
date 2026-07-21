import {
    boolean,
    command,
    number,
    positional,
    string,
} from '@drizzle-team/brocli';

import {
    ENERGY_CURVE_NAMES,
    MIXING_RULE_NAMES,
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

    energyCurve: string('energy-curve').desc(
        'sets the distribution curve forumla to determine track inclusion in a bucket',
    ).enum(
        // **HACK:** `enum` definition function expects at least one non-dynamic
        // string element as the first element. Brocli is trying to enforce that
        // there is at least one string element.
        ...Object.values(ENERGY_CURVE_NAMES) as [string, ...string[]],
    ),

    mixingRule: string('mixing-rule').desc(
        'sets the sorting algorithm used to determine track distribution inside of buckets',
    ).enum(
        // **HACK:** See above.
        ...Object.values(MIXING_RULE_NAMES) as [string, ...string[]],
    ),

    maxTracksPerBucket: number('max-tracks-per-bucket').desc(
        'sets the maximum amount of tracks per bucket',
    ),

    numberOfBuckets: number('number-of-buckets').desc(
        'sets how many buckets the linked repositories of tracks are split into',
    ),

    pacingStrictnessArousal: number('pacing-strictness-arousal').desc(
        'sets how closely the track distribution must follow the energy curve',
    ),

    pacingStrictnessValence: number('pacing-strictness-valence').desc(
        'sets how closely the track distribution must follow the vibe target',
    ),

    scoreFuzziness: number('score-fuzziness').desc(
        "sets how exacting a track's scoring must match for inclusion by introducing randomness",
    ),

    seed: number('seed').desc(
        'sets the seed used for the random number generator',
    ),

    trackSpacing: number('track-spacing').desc(
        'sets how much time (in milliseconds) is padded between each track in a bucket',
    ),

    vibeTarget: number('vibe-target').desc(
        'sets how weighted tracks included from linked repositories towards positive or negative vibes are',
    ),
} as const;

export default command({
    name: 'set-parameters',
    desc: 'Sets the playlist packing algorithm parameters a radio.',
    options: COMMAND_OPTIONS,

    handler: withEntityManager(
        async ({ identifier, resolveName, ...parameters }) => {
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
            const definedParameters = Object.fromEntries(
                Object
                    .entries(parameters)
                    .filter(([_key, value]) => value !== undefined),
            );

            ENTITY_MANAGER.assign(radio, {
                packPlaylistBucketsParameters: Object.assign(
                    packPlaylistBucketsParameters ?? {},
                    definedParameters,
                ),
            });

            await ENTITY_MANAGER.flush();

            console.log(
                `[LeafRadio] Updated radio '${radioID}' ('${name}')'s parameters.`,
            );
        },
    ),
});
