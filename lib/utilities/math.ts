export function normalizeValue(
    value: number,
    min: number,
    max: number,
): number {
    const normalized = (value - min) / (max - min);

    return Math.max(0, Math.min(1, normalized));
}
