/// <reference no-default-lib="true" />
/// <reference lib="deno.worker" />

import type { MusicalFeatures } from '@/lib/music/mod.ts';
import { extractMusicalFeatures } from '@/lib/music/mod.ts';
import { decodeAudioFile } from '@/lib/utilities/audio.ts';
import type { WorkerRunFunction } from '@/lib/workers/mod.ts';

export type MusicalFeaturesWorkerOutput = MusicalFeatures & {
    readonly duration: number;
};

export interface MusicalFeaturesWorkerInput {
    readonly filePath: string;
}

export default (async (input) => {
    const { filePath } = input;

    const audioBuffer = await decodeAudioFile(filePath);
    const extractedMusicalFeatures = await extractMusicalFeatures(audioBuffer);

    return {
        ...extractedMusicalFeatures,
        duration: audioBuffer.duration,
    };
}) satisfies WorkerRunFunction<
    MusicalFeaturesWorkerInput,
    MusicalFeaturesWorkerOutput
>;
