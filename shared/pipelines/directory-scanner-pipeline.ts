import { expandGlob } from '@std/fs';

import type { PipelineStep } from '@/lib/utilities/pipeline.ts';
import { GLOB_AUDIO_FILES } from '@/lib/utilities/path.ts';
import { makePipeline } from '@/lib/utilities/pipeline.ts';
import { makeWorkerPool } from '@/lib/workers/mod.ts';

import type { AudioFileEntity } from '@/shared/database/mod.ts';
import {
    ENTITY_AUDIO_FILE,
    ENTITY_MANAGER,
    ENTITY_PROCESSED_METADATA,
} from '@/shared/database/mod.ts';
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

    readonly existingAudioFile?: AudioFileEntity;
}

type ExtractionResult = {
    readonly success: false;
} | {
    readonly entry: FileEntry;

    readonly existingAudioFile?: AudioFileEntity;

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

    readonly existingAudioFile?: AudioFileEntity;

    readonly pcmHash: string;

    readonly success: true;
};

interface ScanPipelineContext {
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
    const entries = await Array.fromAsync(expandGlob(GLOB_AUDIO_FILES, {
        followSymlinks: true,
        root: directoryPath,
    }));

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

async function determineExtractionJobs(
    directoryFiles: FileEntry[],
): Promise<ExtractionJob[]> {
    const filePaths = directoryFiles.map((file) => file.filePath);

    const existingAudioFiles = await ENTITY_MANAGER.find(ENTITY_AUDIO_FILE, {
        absoluteFilePath: { $in: filePaths },
    });

    const audioFilesMap = new Map(
        existingAudioFiles.map((file) => [file.absoluteFilePath, file]),
    );

    return directoryFiles
        .map((entry) => ({
            entry,
            existingAudioFile: audioFilesMap.get(entry.filePath),
        }))
        .filter(
            ({ entry, existingAudioFile }) =>
                !existingAudioFile ||
                entry.lastModified !== existingAudioFile.lastModified,
        );
}

async function extractAudioData(
    hashResults: HashJobResult[],
    existingHashes: Set<string>,
): Promise<ExtractionResult[]> {
    return await Promise.all(
        hashResults.map(async (result): Promise<ExtractionResult> => {
            if (!result.success) {
                return { success: false };
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

                return { success: false };
            }
        }),
    );
}

async function fetchExistingHashes(
    hashResults: HashJobResult[],
): Promise<Set<string>> {
    const hashes = hashResults.flatMap((result) =>
        result.success ? [result.pcmHash] : []
    );

    return new Set(
        hashes.length === 0 ? [] : (
            await ENTITY_MANAGER.find(ENTITY_PROCESSED_METADATA, {
                pcmHash: { $in: hashes },
            })
        ).map((metadata) => metadata.pcmHash),
    );
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
                    success: true as const,
                };
            } catch (error) {
                console.error(
                    `bad argument #0 to 'hashFiles' (failed to hash file '${filePath}'):`,
                );
                console.error(error);

                return {
                    success: false as const,
                };
            }
        }),
    );
}

async function processExtractionResults(
    results: ExtractionResult[],
): Promise<void> {
    const metadataToUpsert = [];

    for (const result of results) {
        if (!result.success) {
            continue;
        }

        const {
            entry,
            existingAudioFile,
            pcmHash,
            processedData,
        } = result;

        if (!pcmHash) {
            continue;
        }

        if (processedData) {
            const { audioProperties, musicalFeatures } = processedData;

            metadataToUpsert.push({
                audioProperties,
                musicalFeatures,
                pcmHash,
            });
        }

        const { filePath: absoluteFilePath, lastModified } = entry;

        if (existingAudioFile) {
            ENTITY_MANAGER.assign(existingAudioFile, {
                lastModified,
                processedMetadata: pcmHash,
            });
        } else {
            ENTITY_MANAGER.persist(
                ENTITY_MANAGER.create(ENTITY_AUDIO_FILE, {
                    absoluteFilePath,
                    lastModified,
                    processedMetadata: pcmHash,
                }),
            );
        }
    }

    if (metadataToUpsert.length > 0) {
        ENTITY_MANAGER.persist(
            await ENTITY_MANAGER.upsertMany(
                ENTITY_PROCESSED_METADATA,
                metadataToUpsert,
            ),
        );
    }

    await ENTITY_MANAGER.flush();
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

const stepCollectFiles = (async (context) => {
    context.directoryFiles = await collectDirectoryFiles(context.directoryPath);

    return context.directoryFiles.length !== 0;
}) satisfies ScanPipelineStep;

const stepDetermineJobs = (async (context) => {
    context.jobs = await determineExtractionJobs(context.directoryFiles);

    return context.jobs.length !== 0;
}) satisfies ScanPipelineStep;

const stepHashFiles = (async (context) => {
    context.hashResults = await hashFiles(context.jobs);

    return context.hashResults.some((result) => result.success);
}) satisfies ScanPipelineStep;

const stepCheckExistingHashes = (async (context) => {
    context.existingHashes = await fetchExistingHashes(context.hashResults);
}) satisfies ScanPipelineStep;

const stepExtractAudioData = (async (context) => {
    context.extractionResults = await extractAudioData(
        context.hashResults,
        context.existingHashes,
    );
}) satisfies ScanPipelineStep;

const stepSaveResults = (async (context) => {
    await processExtractionResults(context.extractionResults);
}) satisfies ScanPipelineStep;

export async function scanDirectory(directoryPath: string): Promise<boolean> {
    let hasError = false;

    const pipeline = makePipeline<ScanPipelineContext>({
        directoryFiles: [],
        directoryPath,
        existingHashes: new Set(),
        extractionResults: [],
        hashResults: [],
        jobs: [],
    })
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
