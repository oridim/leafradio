/// <reference no-default-lib="true" />
/// <reference lib="deno.worker" />

import audio from 'audio';

import type { AudioProperties } from '@/lib/playlist-packer/types.ts';
import type { MusicalFeatures } from '@/lib/music/mod.ts';
import { extractMusicalFeatures } from '@/lib/music/mod.ts';
import type { WorkerRunFunction } from '@/lib/workers/mod.ts';

export interface AudioProcessingWorkerInput {
    readonly filePath: string;
}

export interface AudioProcessingWorkerOutput {
    readonly audioProperties: AudioProperties;

    readonly musicalFeatures: MusicalFeatures;
}

export default (async (input) => {
    const { filePath } = input;

    const audioInstance = await audio(filePath);
    const extractedMusicalFeatures = await extractMusicalFeatures(
        audioInstance,
    );

    return {
        audioProperties: {
            duration: audioInstance.duration * 1000,
        },

        musicalFeatures: extractedMusicalFeatures,
    };
}) satisfies WorkerRunFunction<
    AudioProcessingWorkerInput,
    AudioProcessingWorkerOutput
>;
