import { uniformInt } from 'pure-rand/distribution/uniformInt';
import { uniformFloat64 } from 'pure-rand/distribution/uniformFloat64';
import { xoroshiro128plus } from 'pure-rand/generator/xoroshiro128plus';

import { fnv32a } from '@/lib/utilities/crypto.ts';

export interface RandomNumberGenerator {
    random(): number;

    pickElement<T>(array: readonly T[]): T;

    randomFloat(min: number, max: number): number;

    randomInteger(min: number, max: number): number;

    shuffleElements<T>(array: T[]): T[];
}

export function resolveSeed(
    input: string | number,
    timeZone = 'UTC',
): number {
    if (typeof input === 'number') {
        return Math.floor(input);
    }

    const trimmedInput = input.trim();

    if (/^\d+$/.test(trimmedInput)) {
        return Number.parseInt(trimmedInput, 10);
    }

    try {
        const duration = Temporal.Duration.from(trimmedInput);

        return Temporal.Now
            .zonedDateTimeISO(timeZone)
            .add(duration)
            .epochMilliseconds;
    } catch {}

    try {
        return Temporal.Instant
            .from(trimmedInput)
            .epochMilliseconds;
    } catch {}

    try {
        return Temporal.ZonedDateTime
            .from(trimmedInput)
            .epochMilliseconds;
    } catch {}

    try {
        return Temporal.PlainDateTime
            .from(trimmedInput)
            .toZonedDateTime(timeZone)
            .epochMilliseconds;
    } catch {}

    try {
        return Temporal.PlainDateTime
            .from(`${trimmedInput}:00`)
            .toZonedDateTime(timeZone)
            .epochMilliseconds;
    } catch {}

    try {
        return Temporal.PlainDate
            .from(trimmedInput)
            .toZonedDateTime(timeZone)
            .epochMilliseconds;
    } catch {}

    try {
        return Temporal.PlainYearMonth
            .from(trimmedInput)
            .toPlainDate({ day: 1 })
            .toZonedDateTime(timeZone)
            .epochMilliseconds;
    } catch {}

    return fnv32a(trimmedInput);
}

export function makeRandomNumberGenerator(
    seed: number | null = null,
): RandomNumberGenerator {
    seed = seed === null || seed < 0
        ? Date.now() ^ (Math.random() * 0x100000000)
        : seed;

    const generator = xoroshiro128plus(seed);

    const pickElement = ((array) => {
        const index = randomInteger(0, array.length - 1);

        return array[index];
    }) satisfies RandomNumberGenerator['pickElement'];

    const random = (() => {
        return uniformFloat64(generator);
    }) satisfies RandomNumberGenerator['random'];

    const randomFloat = ((min, max) => {
        return min + random() * (max - min);
    }) satisfies RandomNumberGenerator['randomFloat'];

    const randomInteger = ((min, max) => {
        return uniformInt(generator, min, max);
    }) satisfies RandomNumberGenerator['randomInteger'];

    const shuffleElements = ((array) => {
        for (
            let shuffleFromIndex = array.length - 1;
            shuffleFromIndex > 0;
            shuffleFromIndex -= 1
        ) {
            const shuffleToIndex = randomInteger(0, shuffleFromIndex);
            const shuffleToValue = array[shuffleToIndex];

            array[shuffleToIndex] = array[shuffleFromIndex];
            array[shuffleFromIndex] = shuffleToValue;
        }

        return array;
    }) satisfies RandomNumberGenerator['shuffleElements'];

    return {
        pickElement,
        random,
        randomFloat,
        randomInteger,
        shuffleElements,
    };
}

export const {
    pickElement,
    random,
    randomFloat,
    randomInteger,
    shuffleElements,
} = makeRandomNumberGenerator();
