export const MODIFIER_COLOR_SCHEMES = {
    constructive: 'constructive',

    destructive: 'destructive',

    executing: 'executing',

    faulted: 'faulted',

    fulfilled: 'fufilled',

    inspective: 'inspective',

    mutative: 'mutative',

    queued: 'queued',

    suspended: 'suspended',
} as const;

export type ModifierColorSchemes =
    typeof MODIFIER_COLOR_SCHEMES[keyof typeof MODIFIER_COLOR_SCHEMES];

export function applyColorScheme(
    colorScheme?: ModifierColorSchemes | undefined,
): object {
    return {
        'is-constructive': colorScheme === MODIFIER_COLOR_SCHEMES.constructive,
        'is-executing': colorScheme === MODIFIER_COLOR_SCHEMES.executing,
        'is-destructive': colorScheme === MODIFIER_COLOR_SCHEMES.destructive,
        'is-faulted': colorScheme === MODIFIER_COLOR_SCHEMES.faulted,
        'is-fulfilled': colorScheme === MODIFIER_COLOR_SCHEMES.faulted,
        'is-inspective': colorScheme === MODIFIER_COLOR_SCHEMES.inspective,
        'is-mutative': colorScheme === MODIFIER_COLOR_SCHEMES.mutative,
        'is-queued': colorScheme === MODIFIER_COLOR_SCHEMES.queued,
        'is-suspended': colorScheme === MODIFIER_COLOR_SCHEMES.suspended,
    };
}
