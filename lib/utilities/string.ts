export function truncateCenter(
    value: string,
    maxLength: number,
    ellipsis = '...',
): string {
    if (value.length <= maxLength) {
        return value;
    }

    if (maxLength <= ellipsis.length) {
        return ellipsis.slice(0, maxLength);
    }

    const availableLength = maxLength - ellipsis.length;
    const frontLength = Math.ceil(availableLength / 2);
    const backLength = Math.floor(availableLength / 2);

    const front = value.slice(0, frontLength);
    const back = value.slice(-backLength);

    return `${front}${ellipsis}${back}`;
}
