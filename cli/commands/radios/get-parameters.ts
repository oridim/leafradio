import { boolean, command, number, positional } from '@drizzle-team/brocli';

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

    energyCurve: boolean('energy-curve').desc(
        'gets the distribution curve forumla to determine track inclusion in a bucket',
    ),

    mixingRule: boolean('mixing-rule').desc(
        'gets the sorting algorithm used to determine track distribution inside of buckets',
    ),

    maxTracksPerBucket: boolean('max-tracks-per-bucket').desc(
        'gets the maximum amount of tracks per bucket',
    ),

    numberOfBuckets: boolean('number-of-buckets').desc(
        'gets how many buckets the linked repositories of tracks are split into',
    ),

    pacingStrictnessArousal: boolean('pacing-strictness-arousal').desc(
        'gets how closely the track distribution must follow the energy curve',
    ),

    pacingStrictnessValence: boolean('pacing-strictness-valence').desc(
        'gets how closely the track distribution must follow the vibe target',
    ),

    scoreFuzziness: boolean('score-fuzziness').desc(
        "gets how exacting a track's scoring must match for inclusion by introducing randomness",
    ),

    seed: number('boolean').desc(
        'gets the seed used for the random number generator',
    ),

    trackSpacing: boolean('track-spacing').desc(
        'gets how much time (in milliseconds) is padded between each track in a bucket',
    ),

    vibeTarget: boolean('vibe-target').desc(
        'gets how weighted tracks included from linked repositories towards positive or negative vibes are',
    ),
} as const;

export default command({
    name: 'get-parameters',
    desc: 'Gets the playlist packing algorithm parameters of a radio.',
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

            const packPlaylistBucketsParameters =
                radio.packPlaylistBucketsParameters ?? {};

            const hasParameterFilter = Object
                .entries(parameters)
                .some(([_key, value]) => value);

            const selectedParameters = hasParameterFilter
                ? Object.fromEntries(
                    Object
                        .entries(packPlaylistBucketsParameters)
                        .filter(([key]) => parameters[key]),
                )
                : packPlaylistBucketsParameters;

            console.table(selectedParameters);
        },
    ),
});
