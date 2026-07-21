/// <reference no-default-lib="true" />
/// <reference lib="deno.worker" />

import { decodeAudioFile } from '@/lib/utilities/audio.ts';
import { digest } from '@/lib/utilities/crypto.ts';
import type { WorkerRunFunction } from '@/lib/workers/mod.ts';

export interface HashWorkerInput {
    readonly filePath: string;
}

export interface HashWorkerOutput {
    readonly pcmHash: string;
}

export default (async (input) => {
    const { filePath } = input;

    const audioBuffer = await decodeAudioFile(filePath);
    const pcmHash = await digest('BLAKE3', audioBuffer.audioData);

    return {
        pcmHash,
    };
}) satisfies WorkerRunFunction<
    HashWorkerInput,
    HashWorkerOutput
>;
