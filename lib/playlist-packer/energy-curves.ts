export const ENERGY_CURVE_NAMES = {
    bellEnergyCurve: 'bellEnergyCurve',

    climbEnergyCurve: 'climbEnergyCurve',

    descentEnergyCurve: 'descentEnergyCurve',

    steadyEnergyCurve: 'steadyEnergyCurve',

    valleyEnergyCurve: 'valleyEnergyCurve',

    waveEnergyCurve: 'waveEnergyCurve',
} as const;

export type EnergyCurveFunction = (progress: number) => number;

export type EnergyCurveNames =
    typeof ENERGY_CURVE_NAMES[keyof typeof ENERGY_CURVE_NAMES];

export const bellEnergyCurve =
    ((progress) => Math.sin(progress * Math.PI)) satisfies EnergyCurveFunction;

export const climbEnergyCurve =
    ((progress) => progress) satisfies EnergyCurveFunction;

export const descentEnergyCurve =
    ((progress) => 1 - progress) satisfies EnergyCurveFunction;

export const steadyEnergyCurve = (() => 0.5) satisfies EnergyCurveFunction;

export const valleyEnergyCurve =
    ((progress) =>
        1 - Math.sin(progress * Math.PI)) satisfies EnergyCurveFunction;

export const waveEnergyCurve = ((progress) =>
    0.5 +
    0.5 * Math.sin(progress * Math.PI * 4)) satisfies EnergyCurveFunction;

export function determineEnergyCurve(
    energyCurveName: EnergyCurveNames,
): EnergyCurveFunction {
    switch (energyCurveName) {
        case ENERGY_CURVE_NAMES.bellEnergyCurve:
            return bellEnergyCurve;

        case ENERGY_CURVE_NAMES.climbEnergyCurve:
            return climbEnergyCurve;

        case ENERGY_CURVE_NAMES.descentEnergyCurve:
            return descentEnergyCurve;

        case ENERGY_CURVE_NAMES.steadyEnergyCurve:
            return steadyEnergyCurve;

        case ENERGY_CURVE_NAMES.valleyEnergyCurve:
            return valleyEnergyCurve;

        case ENERGY_CURVE_NAMES.waveEnergyCurve:
            return waveEnergyCurve;
    }
}

export function determineEnergyCurveName(
    energyCurveFunction: EnergyCurveFunction,
): EnergyCurveNames {
    switch (energyCurveFunction) {
        case bellEnergyCurve:
            return ENERGY_CURVE_NAMES.bellEnergyCurve;

        case climbEnergyCurve:
            return ENERGY_CURVE_NAMES.climbEnergyCurve;

        case descentEnergyCurve:
            return ENERGY_CURVE_NAMES.descentEnergyCurve;

        case steadyEnergyCurve:
            return ENERGY_CURVE_NAMES.steadyEnergyCurve;

        case valleyEnergyCurve:
            return ENERGY_CURVE_NAMES.valleyEnergyCurve;

        case waveEnergyCurve:
            return ENERGY_CURVE_NAMES.waveEnergyCurve;
    }

    throw new Error(
        `bad argument #0 to 'determineEnergyCurveName' (energy curve function not supported)`,
    );
}
