import type { Track } from '@/lib/playlist-packer/types.ts';

const MAJOR_CIRCLE_KEYS = [
    'c',
    'g',
    'd',
    'a',
    'e',
    'b',
    'g♭',
    'd♭',
    'a♭',
    'e♭',
    'b♭',
    'f',
];

const MINOR_CIRCLE_KEYS = [
    'am',
    'em',
    'bm',
    'g♭m',
    'd♭m',
    'a♭m',
    'e♭m',
    'b♭m',
    'fm',
    'cm',
    'gm',
    'dm',
];

export const MIXING_RULE_NAMES = {
    energyBuildUpMixingRule: 'energyBuildUpMixingRule',

    harmonicMixingRule: 'harmonicMixingRule',

    strictTempoMixingRule: 'strictTempoMixingRule',

    vibeTransitionMixingRule: 'vibeTransitionMixingRule',
} as const;

export type MixingRuleFunction = (tracks: Track[]) => Track[];

export type MixingRuleNames =
    typeof MIXING_RULE_NAMES[keyof typeof MIXING_RULE_NAMES];

function areKeysHarmonicallyCompatible(
    keyOne: string,
    keyTwo: string,
): boolean {
    const indexOne = getStandardKeyIndex(keyOne);
    const indexTwo = getStandardKeyIndex(keyTwo);

    if (indexOne === -1 || indexTwo === -1) {
        return false;
    }

    const distance = Math.abs(indexOne - indexTwo);

    return distance === 0 || distance === 1 || distance === 11;
}

function createHarmonicMixingRule(
    isCompatible: (keyOne: string, keyTwo: string) => boolean,
): MixingRuleFunction {
    return (tracks: Track[]) => {
        if (tracks.length <= 1) return tracks;

        const unsorted = [...tracks].sort((a, b) =>
            a.musicalFeatures.bpm - b.musicalFeatures.bpm
        );

        const sorted: Track[] = [unsorted.shift()!];

        while (unsorted.length > 0) {
            const current = sorted[sorted.length - 1];

            unsorted.sort((a, b) => {
                const scoreA = Math.abs(
                    a.musicalFeatures.bpm - current.musicalFeatures.bpm,
                ) +
                    (isCompatible(
                            current.musicalFeatures.key,
                            a.musicalFeatures.key,
                        )
                        ? 0
                        : 20);

                const scoreB = Math.abs(
                    b.musicalFeatures.bpm - current.musicalFeatures.bpm,
                ) +
                    (isCompatible(
                            current.musicalFeatures.key,
                            b.musicalFeatures.key,
                        )
                        ? 0
                        : 20);

                return scoreA - scoreB;
            });

            sorted.push(unsorted.shift()!);
        }

        return sorted;
    };
}

function createLinearMixingRule(
    getFeature: (track: Track) => number,
): MixingRuleFunction {
    return (tracks: Track[]) =>
        [...tracks].sort((a, b) => getFeature(a) - getFeature(b));
}

function getStandardKeyIndex(key: string): number {
    const normalized = key.toLowerCase();
    const majorIndex = MAJOR_CIRCLE_KEYS.indexOf(normalized);

    return majorIndex !== -1
        ? majorIndex
        : MINOR_CIRCLE_KEYS.indexOf(normalized);
}

export const energyBuildUpMixingRule = createLinearMixingRule((track) =>
    track.musicalFeatures.arousal
);

export const harmonicMixingRule = createHarmonicMixingRule(
    areKeysHarmonicallyCompatible,
);

export const strictTempoMixingRule = createLinearMixingRule((track) =>
    track.musicalFeatures.bpm
);

export const vibeTransitionMixingRule = createLinearMixingRule((track) =>
    track.musicalFeatures.valence
);

export function determineMixingRule(
    mixingRuleName: MixingRuleNames,
): MixingRuleFunction {
    switch (mixingRuleName) {
        case MIXING_RULE_NAMES.energyBuildUpMixingRule:
            return energyBuildUpMixingRule;

        case MIXING_RULE_NAMES.harmonicMixingRule:
            return harmonicMixingRule;

        case MIXING_RULE_NAMES.strictTempoMixingRule:
            return strictTempoMixingRule;

        case MIXING_RULE_NAMES.vibeTransitionMixingRule:
            return vibeTransitionMixingRule;
    }
}

export function determineMixingRuleName(
    mixingRuleFunction: MixingRuleFunction,
): MixingRuleNames {
    switch (mixingRuleFunction) {
        case energyBuildUpMixingRule:
            return MIXING_RULE_NAMES.energyBuildUpMixingRule;

        case harmonicMixingRule:
            return MIXING_RULE_NAMES.harmonicMixingRule;

        case strictTempoMixingRule:
            return MIXING_RULE_NAMES.strictTempoMixingRule;

        case vibeTransitionMixingRule:
            return MIXING_RULE_NAMES.vibeTransitionMixingRule;
    }

    throw new Error(
        `bad argument #0 to 'determineMixingRuleName' (mixing rule function not supported)`,
    );
}
