/// <reference no-default-lib="true" />
/// <reference lib="deno.worker" />

import { digest } from '@/lib/utilities/crypto.ts';
import type { WorkerRunFunction } from '@/lib/workers/mod.ts';

export interface HashWorkerInput {
    readonly filePath: string;
}

export interface HashWorkerOutput {
    readonly hash: string;
}

export default (async (input) => {
    const { filePath } = input;

    using file = await Deno.open(filePath);
    const hash = await digest('BLAKE3', file.readable);

    return {
        hash,
    };
}) satisfies WorkerRunFunction<
    HashWorkerInput,
    HashWorkerOutput
>;
