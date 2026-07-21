import { boolean, command, number, positional } from '@drizzle-team/brocli';

import type { SerializedPackPlaylistBucketParameters } from '@/lib/playlist-packer/mod.ts';

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
        'deletes only the distribution curve forumla to determine track inclusion in a bucket',
    ),

    mixingRule: boolean('mixing-rule').desc(
        'deletes only the sorting algorithm used to determine track distribution inside of buckets',
    ),

    maxTracksPerBucket: boolean('max-tracks-per-bucket').desc(
        'deletes only the maximum amount of tracks per bucket',
    ),

    numberOfBuckets: boolean('number-of-buckets').desc(
        'deletes only how many buckets the linked repositories of tracks are split into',
    ),

    pacingStrictnessArousal: boolean('pacing-strictness-arousal').desc(
        'deletes only how closely the track distribution must follow the energy curve',
    ),

    pacingStrictnessValence: boolean('pacing-strictness-valence').desc(
        'deletes only how closely the track distribution must follow the vibe target',
    ),

    scoreFuzziness: boolean('score-fuzziness').desc(
        "deletes only how exacting a track's scoring must match for inclusion by introducing randomness",
    ),

    seed: number('boolean').desc(
        'deletes only the seed used for the random number generator',
    ),

    trackSpacing: boolean('track-spacing').desc(
        'gets how much time (in milliseconds) is padded between each track in a bucket',
    ),

    vibeTarget: boolean('vibe-target').desc(
        'gets how weighted tracks included from linked repositories towards positive or negative vibes are',
    ),
} as const;

export default command({
    name: 'delete-parameters',
    desc: 'Deletes the playlist packing algorithm parameters of a radio.',
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

            if (!packPlaylistBucketsParameters) {
                console.error(
                    `Invalid value: value for the argument 'identifier' has no parameters set`,
                );

                Deno.exit(EXIT_CODES.invalidValue);
            }

            const keysToDelete = Object
                .keys(parameters)
                .filter((key) => parameters[key]);

            if (keysToDelete.length > 0) {
                for (const key of keysToDelete) {
                    delete packPlaylistBucketsParameters[
                        key as keyof SerializedPackPlaylistBucketParameters
                    ];
                }

                const areParametersEmpty =
                    Object.keys(packPlaylistBucketsParameters).length === 0;

                ENTITY_MANAGER.assign(radio, {
                    packPlaylistBucketsParameters: areParametersEmpty
                        ? null
                        : packPlaylistBucketsParameters,
                });
            } else {
                ENTITY_MANAGER.assign(radio, {
                    packPlaylistBucketsParameters: null,
                });
            }

            await ENTITY_MANAGER.flush();

            console.log(
                keysToDelete.length > 0
                    ? `[LeafRadio] Deleted some of radio '${radioID}' ('${name}')'s parameters.`
                    : `[LeafRadio] Deleted radio '${radioID}' ('${name}')'s parameters.`,
            );
        },
    ),
});
