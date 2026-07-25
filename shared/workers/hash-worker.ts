/// <reference no-default-lib="true" />
/// <reference lib="deno.worker" />

import audio from 'audio';

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

    const audioInstance = await audio(filePath);
    const downMixedAudioInstance = audioInstance.remix(1);

    const pcmData = await downMixedAudioInstance.read({ channel: 0 });
    const rawData = Array.isArray(pcmData) ? pcmData[0] : pcmData;

    const audioData =
        rawData instanceof Float32Array && rawData.buffer instanceof ArrayBuffer
            ? (rawData as Float32Array<ArrayBuffer>)
            : new Float32Array(rawData || 0);

    const pcmHash = await digest('BLAKE3', audioData);

    return {
        pcmHash,
    };
}) satisfies WorkerRunFunction<
    HashWorkerInput,
    HashWorkerOutput
>;
