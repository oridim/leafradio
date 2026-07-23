import { ensureDir, expandGlob } from '@std/fs';
import { dirname } from '@std/path';

import type { PipelineStep } from '@/lib/utilities/pipeline.ts';
import { GLOB_AUDIO_FILES } from '@/lib/utilities/path.ts';
import { makePipeline } from '@/lib/utilities/pipeline.ts';
import { makeWorkerPool } from '@/lib/workers/mod.ts';

import type { AudioData, AudioFile } from '@/shared/models/mod.ts';
import { readAudioData, writeAudioData } from '@/shared/models/mod.ts';

import type {
    AudioProcessingWorkerInput,
    AudioProcessingWorkerOutput,
    HashWorkerInput,
    HashWorkerOutput,
} from '@/shared/workers/mod.ts';
import {
    FILE_AUDIO_PROCESSING_WORKER,
    FILE_HASH_WORKER,
} from '@/shared/workers/mod.ts';

const WORKER_POOL = makeWorkerPool({
    maximumWorkers: Math.floor(navigator.hardwareConcurrency * 0.75) || 1,
});

type ScanPipelineStep = PipelineStep<ScanPipelineContext>;

interface ExtractionJob {
    readonly entry: FileEntry;

    readonly existingAudioFile?: AudioFile;
}

type ExtractionResult = {
    readonly success: false;
} | {
    readonly entry: FileEntry;

    readonly existingAudioFile?: AudioFile;

    readonly processedData?: AudioProcessingWorkerOutput;

    readonly pcmHash: string;

    readonly success: true;
};

interface FileEntry {
    readonly filePath: string;

    readonly lastModified: number;
}

type HashJobResult = {
    readonly success: false;
} | {
    readonly entry: FileEntry;

    readonly existingAudioFile?: AudioFile;

    readonly pcmHash: string;

    readonly success: true;
};

interface ScanPipelineContext {
    audioData: AudioData;

    audioDataFile: string;

    directoryFiles: FileEntry[];

    directoryPath: string;

    existingHashes: Set<string>;

    extractionResults: ExtractionResult[];

    hashResults: HashJobResult[];

    jobs: ExtractionJob[];
}

async function collectDirectoryFiles(
    directoryPath: string,
): Promise<FileEntry[]> {
    const entries = await Array.fromAsync(
        expandGlob(GLOB_AUDIO_FILES, {
            followSymlinks: true,
            root: directoryPath,
        }),
    );

    return await Promise.all(
        entries
            .filter((entry) => entry.isFile)
            .map(
                async (entry) => {
                    const { path: filePath } = entry;
                    const { mtime } = await Deno.stat(filePath);

                    if (mtime === null) {
                        throw new Error(
                            "bad dispatch to 'collectDirectoryFiles' (timestamp not available on platform)",
                        );
                    }

                    return {
                        filePath,
                        lastModified: mtime.getTime(),
                    };
                },
            ),
    );
}

function determineExtractionJobs(
    audioData: AudioData,
    directoryFiles: FileEntry[],
): ExtractionJob[] {
    const { audioFiles, processedMetadata } = audioData;

    return directoryFiles
        .map((entry) => ({
            entry,
            existingAudioFile: audioFiles[entry.filePath],
        }))
        .filter(
            ({ entry, existingAudioFile }) =>
                !existingAudioFile ||
                entry.lastModified !== existingAudioFile.lastModified ||
                !processedMetadata[existingAudioFile.pcmHash],
        );
}

async function extractAudioData(
    hashResults: HashJobResult[],
    existingHashes: Set<string>,
): Promise<ExtractionResult[]> {
    return await Promise.all(
        hashResults.map(async (result): Promise<ExtractionResult> => {
            if (!result.success) {
                return {
                    success: false,
                };
            }

            const { entry, existingAudioFile, pcmHash } = result;

            try {
                const processedData = existingHashes.has(pcmHash)
                    ? undefined
                    : await runAudioProcessingWorker(entry.filePath);

                return {
                    entry,
                    existingAudioFile,
                    pcmHash,
                    processedData,
                    success: true,
                };
            } catch (error) {
                console.error(
                    `bad argument #0 to 'extractAudioData' (failed to process audio for '${entry.filePath}'):`,
                );

                console.error(error);

                return {
                    success: false,
                };
            }
        }),
    );
}

function fetchExistingHashes(
    audioData: AudioData,
    hashResults: HashJobResult[],
): Set<string> {
    const { processedMetadata } = audioData;
    const hashes = new Set<string>();

    for (const result of hashResults) {
        if (result.success && processedMetadata[result.pcmHash]) {
            hashes.add(result.pcmHash);
        }
    }

    return hashes;
}

async function hashFiles(jobs: ExtractionJob[]): Promise<HashJobResult[]> {
    return await Promise.all(
        jobs.map(async ({ entry, existingAudioFile }) => {
            const { filePath } = entry;

            try {
                const { pcmHash } = await runHashWorker(filePath);

                return {
                    entry,
                    existingAudioFile,
                    pcmHash,
                    success: true,
                };
            } catch (error) {
                console.error(
                    `bad argument #0 to 'hashFiles' (failed to hash file '${filePath}'):`,
                );

                console.error(error);

                return {
                    success: false,
                };
            }
        }),
    );
}

async function processExtractionResults(
    audioDataFile: string,
    audioData: AudioData,
    results: ExtractionResult[],
): Promise<void> {
    for (const result of results) {
        if (!result.success) {
            continue;
        }

        const {
            entry,
            pcmHash,
            processedData,
        } = result;

        if (!pcmHash) {
            continue;
        }

        if (processedData) {
            const { audioProperties, musicalFeatures } = processedData;

            audioData.processedMetadata[pcmHash] = {
                audioProperties,
                musicalFeatures,
                pcmHash,
            };
        }

        const { filePath: absoluteFilePath, lastModified } = entry;

        audioData.audioFiles[absoluteFilePath] = {
            absoluteFilePath,
            lastModified,
            pcmHash,
        };
    }

    await ensureDir(dirname(audioDataFile));
    await writeAudioData(audioDataFile, audioData);
}

function runAudioProcessingWorker(
    filePath: string,
): Promise<AudioProcessingWorkerOutput> {
    return WORKER_POOL.run<
        AudioProcessingWorkerInput,
        AudioProcessingWorkerOutput
    >(
        FILE_AUDIO_PROCESSING_WORKER,
        { filePath },
    );
}

function runHashWorker(filePath: string): Promise<HashWorkerOutput> {
    return WORKER_POOL.run<
        HashWorkerInput,
        HashWorkerOutput
    >(
        FILE_HASH_WORKER,
        { filePath },
    );
}

const stepLoadAudioData = (async (context) => {
    try {
        context.audioData = await readAudioData(context.audioDataFile);
    } catch {
        context.audioData = {
            audioFiles: {},
            processedMetadata: {},
        };
    }
}) satisfies ScanPipelineStep;

const stepCollectFiles = (async (context) => {
    context.directoryFiles = await collectDirectoryFiles(context.directoryPath);

    return context.directoryFiles.length !== 0;
}) satisfies ScanPipelineStep;

const stepDetermineJobs = ((context) => {
    context.jobs = determineExtractionJobs(
        context.audioData,
        context.directoryFiles,
    );

    return context.jobs.length !== 0;
}) satisfies ScanPipelineStep;

const stepHashFiles = (async (context) => {
    context.hashResults = await hashFiles(context.jobs);

    return context.hashResults.some((result) => result.success);
}) satisfies ScanPipelineStep;

const stepCheckExistingHashes = ((context) => {
    context.existingHashes = fetchExistingHashes(
        context.audioData,
        context.hashResults,
    );
}) satisfies ScanPipelineStep;

const stepExtractAudioData = (async (context) => {
    context.extractionResults = await extractAudioData(
        context.hashResults,
        context.existingHashes,
    );
}) satisfies ScanPipelineStep;

const stepSaveResults = (async (context) => {
    await processExtractionResults(
        context.audioDataFile,
        context.audioData,
        context.extractionResults,
    );
}) satisfies ScanPipelineStep;

export async function scanDirectory(
    audioDataFile: string,
    directoryPath: string,
): Promise<boolean> {
    let hasError = false;

    const pipeline = makePipeline<ScanPipelineContext>({
        audioData: { audioFiles: {}, processedMetadata: {} },
        audioDataFile,
        directoryFiles: [],
        directoryPath,
        existingHashes: new Set(),
        extractionResults: [],
        hashResults: [],
        jobs: [],
    })
        .addStep(stepLoadAudioData)
        .addStep(stepCollectFiles)
        .addStep(stepDetermineJobs)
        .addStep(stepHashFiles)
        .addStep(stepCheckExistingHashes)
        .addStep(stepExtractAudioData)
        .addStep(stepSaveResults);

    try {
        await pipeline.execute();
    } catch (error) {
        console.error(
            `bad dispatch to 'scanDirectory' (failed to scan directory '${directoryPath}'):`,
        );
        console.error(error);

        hasError = true;
    }

    return !hasError;
}
