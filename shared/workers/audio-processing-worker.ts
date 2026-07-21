/// <reference no-default-lib="true" />
/// <reference lib="deno.worker" />

import type { AudioProperties } from '@/lib/playlist-packer/types.ts';
import type { MusicalFeatures } from '@/lib/music/mod.ts';
import { extractMusicalFeatures } from '@/lib/music/mod.ts';
import { decodeAudioFile } from '@/lib/utilities/audio.ts';
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

    const audioBuffer = await decodeAudioFile(filePath);
    const extractedMusicalFeatures = await extractMusicalFeatures(audioBuffer);

    return {
        audioProperties: {
            duration: audioBuffer.duration,
        },

        musicalFeatures: extractedMusicalFeatures,
    };
}) satisfies WorkerRunFunction<
    AudioProcessingWorkerInput,
    AudioProcessingWorkerOutput
>;
