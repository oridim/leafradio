const FORMATTER_PLAYTIME = new Intl.DurationFormat('en-US', {
    style: 'digital',
});

export function getZonedDateTimeFromEpochMilliseconds(
    timestamp: number,
): Temporal.ZonedDateTime {
    return Temporal.Instant
        .fromEpochMilliseconds(timestamp)
        .toZonedDateTimeISO(Temporal.Now.timeZoneId());
}

export function formatPlaytimeDuration(playtimeDuration: number): string {
    const duration = Temporal.Duration
        .from({
            milliseconds: Math.floor(playtimeDuration),
        })
        .round({
            largestUnit: 'hour',
            smallestUnit: 'second',
            roundingMode: 'trunc',
        });

    return FORMATTER_PLAYTIME.format(duration);
}

export function resolveTimezone(): string {
    return Intl.DateTimeFormat()
        .resolvedOptions()
        .timeZone;
}
