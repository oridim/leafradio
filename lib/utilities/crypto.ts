import type { DIGEST_ALGORITHM_NAMES } from '@std/crypto';
import { crypto } from '@std/crypto';

const { digest: _digest } = crypto.subtle;

export async function digest(
    algorithm: typeof DIGEST_ALGORITHM_NAMES[number],
    data: BufferSource | AsyncIterable<BufferSource> | Iterable<BufferSource>,
): Promise<string> {
    const buffer = await _digest(algorithm, data);

    return Array.from(new Uint8Array(buffer))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
}

export function fnv32a(value: string): number {
    let hash = 2166136261;

    for (let i = 0; i < value.length; i++) {
        hash ^= value.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }

    return hash >>> 0;
}
