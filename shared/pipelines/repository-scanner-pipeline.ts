import { expandGlob } from '@std/fs';
import { relative } from '@std/path';

import type { PipelineStep } from '@/lib/utilities/pipeline.ts';
import { makePipeline } from '@/lib/utilities/pipeline.ts';
import { makeWorkerPool } from '@/lib/workers/mod.ts';

import type {
    AudioFileEntity,
    RepositoryScanStates,
} from '@/shared/database/mod.ts';
import {
    ENTITY_AUDIO_FILE,
    ENTITY_MANAGER,
    ENTITY_MUSICAL_FEATURES,
    ENTITY_REPOSITORY,
    EVENT_REPOSITORIES_MUTATED,
    REPOSITORY_SCAN_STATES,
} from '@/shared/database/mod.ts';
import type {
    HashWorkerInput,
    HashWorkerOutput,
    MusicalFeaturesWorkerInput,
    MusicalFeaturesWorkerOutput,
} from '@/shared/workers/mod.ts';
import {
    FILE_HASH_WORKER,
    FILE_MUSICAL_FEATURES_WORKER,
} from '@/shared/workers/mod.ts';

const GLOB_AUDIO_FILES = '**/*.{aac,flac,m4a,mp3,ogg,wav}';

const WORKER_POOL = makeWorkerPool({
    maximumWorkers: Math.floor(navigator.hardwareConcurrency * 0.75) || 1,
});

type ScanPipelineStep = PipelineStep<ScanPipelineContext>;

interface ExtractionJob {
    readonly entry: RepositoryFileEntry;

    readonly existingAudioFile?: AudioFileEntity;
}

type ExtractionResult = {
    readonly success: false;
} | {
    readonly entry: RepositoryFileEntry;

    readonly existingAudioFile?: AudioFileEntity;

    readonly features?: MusicalFeaturesWorkerOutput;

    readonly musicalFeaturesHash: string;

    readonly success: true;
};

type HashJobResult = {
    readonly success: false;
} | {
    readonly entry: RepositoryFileEntry;

    readonly existingAudioFile?: AudioFileEntity;

    readonly hash: string;

    readonly success: true;
};

interface RepositoryFileEntry {
    readonly filePath: string;

    readonly lastModified: number;

    readonly relativeFilePath: string;

    readonly repositoryID: number;
}

interface ScanPipelineContext {
    existingHashes: Set<string>;

    extractionResults: ExtractionResult[];

    hashResults: HashJobResult[];

    jobs: ExtractionJob[];

    repositoryFiles: RepositoryFileEntry[];

    repositoryID: number;
}

async function collectRepositoryFiles(
    repositoryID: number,
): Promise<RepositoryFileEntry[]> {
    const { directoryPath } = await ENTITY_MANAGER.findOneOrFail(
        ENTITY_REPOSITORY,
        { repositoryID },
    );

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
                    const relativeFilePath = relative(directoryPath, filePath);
                    const { mtime } = await Deno.stat(filePath);

                    if (mtime === null) {
                        throw new Error(
                            "bad dispatch to 'collectRepositoryFiles' (timestamp not available on platform)",
                        );
                    }

                    return {
                        filePath,
                        lastModified: mtime.getTime(),
                        relativeFilePath,
                        repositoryID,
                    };
                },
            ),
    );
}

async function determineExtractionJobs(
    repositoryID: number,
    repositoryFiles: RepositoryFileEntry[],
): Promise<ExtractionJob[]> {
    const existingAudioFiles = await ENTITY_MANAGER.find(ENTITY_AUDIO_FILE, {
        repository: repositoryID,
    });

    const audioFilesMap = new Map(
        existingAudioFiles.map((file) => [file.relativeFilePath, file]),
    );

    return repositoryFiles
        .map((entry) => ({
            entry,
            existingAudioFile: audioFilesMap.get(entry.relativeFilePath),
        }))
        .filter(
            ({ entry, existingAudioFile }) =>
                !existingAudioFile ||
                entry.lastModified !== existingAudioFile.lastModified,
        );
}

async function extractFeatures(
    hashResults: HashJobResult[],
    existingHashes: Set<string>,
): Promise<ExtractionResult[]> {
    return await Promise.all(
        hashResults.map(async (result): Promise<ExtractionResult> => {
            if (!result.success) {
                return { success: false };
            }

            const { entry, existingAudioFile, hash } = result;

            try {
                const features = existingHashes.has(hash)
                    ? undefined
                    : await runMusicalFeaturesWorker(entry.filePath);

                return {
                    entry,
                    existingAudioFile,
                    features,
                    musicalFeaturesHash: hash,
                    success: true,
                };
            } catch (error) {
                console.error(
                    `bad argument #0 to 'extractFeatures' (failed to extract features for '${entry.filePath}'):`,
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
        result.success ? [result.hash] : []
    );

    return new Set(
        hashes.length === 0 ? [] : (
            await ENTITY_MANAGER.find(ENTITY_MUSICAL_FEATURES, {
                musicalFeaturesHash: { $in: hashes },
            })
        ).map((feature) => feature.musicalFeaturesHash),
    );
}

async function hashFiles(jobs: ExtractionJob[]): Promise<HashJobResult[]> {
    return await Promise.all(
        jobs.map(async ({ entry, existingAudioFile }) => {
            const { filePath } = entry;

            try {
                const { hash } = await runHashWorker(filePath);

                return {
                    entry,
                    existingAudioFile,
                    hash,
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
    repositoryID: number,
    results: ExtractionResult[],
): Promise<void> {
    const featuresToUpsert = [];

    for (const result of results) {
        if (!result.success) {
            continue;
        }

        const {
            entry,
            existingAudioFile,
            features,
            musicalFeaturesHash,
        } = result;

        if (!musicalFeaturesHash) {
            continue;
        }

        if (features) {
            const {
                arousal,
                bpm,
                duration,
                key,
                valence,
            } = features;

            featuresToUpsert.push({
                arousal,
                bpm,
                duration,
                key,
                musicalFeaturesHash,
                valence,
            });
        }

        const { lastModified, relativeFilePath } = entry;

        if (existingAudioFile) {
            ENTITY_MANAGER.assign(existingAudioFile, {
                lastModified,
                musicalFeatures: musicalFeaturesHash,
            });
        } else {
            ENTITY_MANAGER.persist(
                ENTITY_MANAGER.create(ENTITY_AUDIO_FILE, {
                    lastModified,
                    relativeFilePath,
                    musicalFeatures: musicalFeaturesHash,
                    repository: repositoryID,
                }),
            );
        }
    }

    if (featuresToUpsert.length > 0) {
        ENTITY_MANAGER.persist(
            await ENTITY_MANAGER.upsertMany(
                ENTITY_MUSICAL_FEATURES,
                featuresToUpsert,
            ),
        );
    }

    await ENTITY_MANAGER.flush();
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

function runMusicalFeaturesWorker(
    filePath: string,
): Promise<MusicalFeaturesWorkerOutput> {
    return WORKER_POOL.run<
        MusicalFeaturesWorkerInput,
        MusicalFeaturesWorkerOutput
    >(
        FILE_MUSICAL_FEATURES_WORKER,
        { filePath },
    );
}

async function updateScanState(
    repositoryID: number,
    scanState: RepositoryScanStates,
) {
    await ENTITY_MANAGER.nativeUpdate(
        ENTITY_REPOSITORY,
        { repositoryID },
        { scanState },
    );
    EVENT_REPOSITORIES_MUTATED.dispatch();
}

const stepCollectFiles = (async (context) => {
    await updateScanState(
        context.repositoryID,
        REPOSITORY_SCAN_STATES.scanningDirectory,
    );

    context.repositoryFiles = await collectRepositoryFiles(
        context.repositoryID,
    );

    return context.repositoryFiles.length !== 0;
}) satisfies ScanPipelineStep;

const stepDetermineJobs = (async (context) => {
    context.jobs = await determineExtractionJobs(
        context.repositoryID,
        context.repositoryFiles,
    );

    return context.jobs.length !== 0;
}) satisfies ScanPipelineStep;

const stepHashFiles = (async (context) => {
    await updateScanState(
        context.repositoryID,
        REPOSITORY_SCAN_STATES.processingFiles,
    );

    context.hashResults = await hashFiles(context.jobs);

    return context.hashResults.some((result) => result.success);
}) satisfies ScanPipelineStep;

const stepCheckExistingFeatures = (async (context) => {
    context.existingHashes = await fetchExistingHashes(context.hashResults);
}) satisfies ScanPipelineStep;

const stepExtractFeatures = (async (context) => {
    context.extractionResults = await extractFeatures(
        context.hashResults,
        context.existingHashes,
    );
}) satisfies ScanPipelineStep;

const stepSaveResults = (async (context) => {
    await processExtractionResults(
        context.repositoryID,
        context.extractionResults,
    );
}) satisfies ScanPipelineStep;

export async function scanRepository(repositoryID: number): Promise<boolean> {
    let hasError = false;

    const pipeline = makePipeline<ScanPipelineContext>({
        repositoryID,
        existingHashes: new Set(),
        extractionResults: [],
        hashResults: [],
        jobs: [],
        repositoryFiles: [],
    })
        .addStep(stepCollectFiles)
        .addStep(stepDetermineJobs)
        .addStep(stepHashFiles)
        .addStep(stepCheckExistingFeatures)
        .addStep(stepExtractFeatures)
        .addStep(stepSaveResults);

    try {
        await pipeline.execute();
    } catch (error) {
        console.error(
            `bad dispatch to 'processRepository' (failed to scan repository '${repositoryID}'):`,
        );
        console.error(error);

        hasError = true;
    } finally {
        const scanState = hasError
            ? REPOSITORY_SCAN_STATES.badScan
            : REPOSITORY_SCAN_STATES.notScanning;

        await updateScanState(repositoryID, scanState);
    }

    return !hasError;
}
