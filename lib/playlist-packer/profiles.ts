import {
    bellEnergyCurve,
    climbEnergyCurve,
    descentEnergyCurve,
    steadyEnergyCurve,
    valleyEnergyCurve,
    waveEnergyCurve,
} from '@/lib/playlist-packer/energy-curves.ts';
import {
    energyBuildUpMixingRule,
    harmonicMixingRule,
    strictTempoMixingRule,
    vibeTransitionMixingRule,
} from '@/lib/playlist-packer/mixing-rules.ts';
import type { PackPlaylistBucketsParameters } from '@/lib/playlist-packer/options.ts';

// Drives high energy with a darker, intense mood for letting off steam.
export const PROFILE_AGGRESSIVE_RELEASE = {
    energyCurve: climbEnergyCurve,
    mixingRule: energyBuildUpMixingRule,
    pacingStrictnessArousal: 0.7,
    pacingStrictnessValence: 0.9,
    scoreFuzziness: 0.1,
    vibeTarget: 0.15,
} satisfies PackPlaylistBucketsParameters;

// Dips into a deep, moody valley before swelling to an emotional finish using harmonic transitions.
export const PROFILE_CINEMATIC_JOURNEY = {
    energyCurve: valleyEnergyCurve,
    mixingRule: harmonicMixingRule,
    pacingStrictnessArousal: 0.5,
    pacingStrictnessValence: 0.9,
    scoreFuzziness: 0.15,
    vibeTarget: 0.2,
} satisfies PackPlaylistBucketsParameters;

// Maintains a completely flat energy level to prevent distractions during deep work or study.
export const PROFILE_DEEP_FOCUS = {
    energyCurve: steadyEnergyCurve,
    mixingRule: vibeTransitionMixingRule,
    pacingStrictnessArousal: 0.9,
    pacingStrictnessValence: 0.4,
    scoreFuzziness: 0.1,
    vibeTarget: 0.5,
} satisfies PackPlaylistBucketsParameters;

// Embraces chaos with high fuzziness and low strictness, anchored only by a steady tempo.
export const PROFILE_ECLECTIC_DISCOVERY = {
    energyCurve: waveEnergyCurve,
    mixingRule: strictTempoMixingRule,
    pacingStrictnessArousal: 0.3,
    pacingStrictnessValence: 0.3,
    scoreFuzziness: 0.6,
    vibeTarget: 0.5,
} satisfies PackPlaylistBucketsParameters;

// Builds up to a massive, upbeat peak in the middle before safely bringing the energy back down.
export const PROFILE_EUPHORIC_PEAK = {
    energyCurve: bellEnergyCurve,
    mixingRule: harmonicMixingRule,
    pacingStrictnessArousal: 0.85,
    pacingStrictnessValence: 0.9,
    scoreFuzziness: 0.05,
    vibeTarget: 0.9,
} satisfies PackPlaylistBucketsParameters;

// Aggressively ramps up energy over time while ignoring mood, perfect for pacing a workout.
export const PROFILE_EXERCISE_CLIMB = {
    energyCurve: climbEnergyCurve,
    mixingRule: energyBuildUpMixingRule,
    pacingStrictnessArousal: 0.8,
    pacingStrictnessValence: 0.2,
    scoreFuzziness: 0.2,
    vibeTarget: 0.7,
} satisfies PackPlaylistBucketsParameters;

// Locks into a steady, somber mood with low energy to allow for quiet introspection.
export const PROFILE_MELANCHOLIC_DRIFT = {
    energyCurve: steadyEnergyCurve,
    mixingRule: vibeTransitionMixingRule,
    pacingStrictnessArousal: 0.9,
    pacingStrictnessValence: 0.85,
    scoreFuzziness: 0.1,
    vibeTarget: 0.2,
} satisfies PackPlaylistBucketsParameters;

// Fosters a peaceful, slightly positive atmosphere that slowly tapers down in energy.
export const PROFILE_NOSTALGIC_CHILL = {
    energyCurve: descentEnergyCurve,
    mixingRule: vibeTransitionMixingRule,
    pacingStrictnessArousal: 0.8,
    pacingStrictnessValence: 0.6,
    scoreFuzziness: 0.15,
    vibeTarget: 0.65,
} satisfies PackPlaylistBucketsParameters;

// Creates a wavy, danceable energy flow with harmonic mixing to ensure smooth transitions.
export const PROFILE_PARTY_FLOW = {
    energyCurve: waveEnergyCurve,
    mixingRule: harmonicMixingRule,
    pacingStrictnessArousal: 0.6,
    pacingStrictnessValence: 0.5,
    scoreFuzziness: 0.05,
    vibeTarget: 0.8,
} satisfies PackPlaylistBucketsParameters;

// Holds a consistent, upbeat tempo and energy ideal for highway cruising or flow states.
export const PROFILE_STEADY_DRIVE = {
    energyCurve: steadyEnergyCurve,
    mixingRule: strictTempoMixingRule,
    pacingStrictnessArousal: 0.8,
    pacingStrictnessValence: 0.5,
    scoreFuzziness: 0.15,
    vibeTarget: 0.7,
} satisfies PackPlaylistBucketsParameters;

// Forces a strict, calming descent in both energy and mood to help transition into sleep.
export const PROFILE_WIND_DOWN = {
    energyCurve: descentEnergyCurve,
    mixingRule: vibeTransitionMixingRule,
    pacingStrictnessArousal: 0.95,
    pacingStrictnessValence: 0.7,
    scoreFuzziness: 0.1,
    vibeTarget: 0.3,
} satisfies PackPlaylistBucketsParameters;

export const PROFILE_NAMES = {
    aggressiveRelease: 'aggressiveRelease',
    cinematicJourney: 'cinematicJourney',
    deepFocus: 'deepFocus',
    eclecticDiscovery: 'eclecticDiscovery',
    euphoricPeak: 'euphoricPeak',
    exerciseClimb: 'exerciseClimb',
    melancholicDrift: 'melancholicDrift',
    nostalgicChill: 'nostalgicChill',
    partyFlow: 'partyFlow',
    steadyDrive: 'steadyDrive',
    windDown: 'windDown',
} as const;

export type ProfileNames = typeof PROFILE_NAMES[keyof typeof PROFILE_NAMES];

export function determineProfile(
    profile: ProfileNames,
): PackPlaylistBucketsParameters {
    switch (profile) {
        case PROFILE_NAMES.aggressiveRelease:
            return PROFILE_AGGRESSIVE_RELEASE;
        case PROFILE_NAMES.cinematicJourney:
            return PROFILE_CINEMATIC_JOURNEY;
        case PROFILE_NAMES.deepFocus:
            return PROFILE_DEEP_FOCUS;
        case PROFILE_NAMES.eclecticDiscovery:
            return PROFILE_ECLECTIC_DISCOVERY;
        case PROFILE_NAMES.euphoricPeak:
            return PROFILE_EUPHORIC_PEAK;
        case PROFILE_NAMES.exerciseClimb:
            return PROFILE_EXERCISE_CLIMB;
        case PROFILE_NAMES.melancholicDrift:
            return PROFILE_MELANCHOLIC_DRIFT;
        case PROFILE_NAMES.nostalgicChill:
            return PROFILE_NOSTALGIC_CHILL;
        case PROFILE_NAMES.partyFlow:
            return PROFILE_PARTY_FLOW;
        case PROFILE_NAMES.steadyDrive:
            return PROFILE_STEADY_DRIVE;
        case PROFILE_NAMES.windDown:
            return PROFILE_WIND_DOWN;
    }
}
