export const EXIT_CODES = {
    ok: 0,

    invalidOptions: 1,
    invalidValue: 2,

    badScan: 100,
} as const;

export type ExitCodes = typeof EXIT_CODES[keyof typeof EXIT_CODES];
