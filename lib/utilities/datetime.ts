export function getZonedDateTimeFromEpochMilliseconds(
    timestamp: number,
): Temporal.ZonedDateTime {
    return Temporal.Instant
        .fromEpochMilliseconds(timestamp)
        .toZonedDateTimeISO(Temporal.Now.timeZoneId());
}
