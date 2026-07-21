import type { RouteCallback } from '@oridim/datastar-serve';
import { withMiddleware } from '@oridim/datastar-serve';
import { FileDialog } from '@miyauci/rfd/deno';

import {
    ENTITY_MANAGER,
    ENTITY_REPOSITORY,
    REPOSITORY_SCAN_STATES,
    withEntityManager,
} from '@/shared/database/mod.ts';

import { scanRepository } from '@/shared/pipelines/mod.ts';

export const deleteRepository = withMiddleware<
    RouteCallback<'/repositories/:repositoryID'>
>(
    [withEntityManager],
    async ({ params, request }) => {
        if (request.method !== 'DELETE') {
            return;
        }

        const { repositoryID } = params;

        const repository = await ENTITY_MANAGER.findOne(
            ENTITY_REPOSITORY,
            { repositoryID: parseInt(repositoryID) },
        );

        if (!repository) {
            return;
        }

        ENTITY_MANAGER.remove(repository);
        ENTITY_MANAGER.flush();

        return null;
    },
);

export const postRepository = withMiddleware<RouteCallback<'/repositories'>>(
    [withEntityManager],
    async ({ request }) => {
        if (request.method !== 'POST') {
            return;
        }

        using dialog = new FileDialog();
        dialog.setTitle('Pick a folder to link...');

        const directoryPath = dialog.pickFolder();

        if (!directoryPath) {
            return null;
        }

        ENTITY_MANAGER.persist(
            await ENTITY_MANAGER.upsert(ENTITY_REPOSITORY, {
                directoryPath,
            }),
        );

        await ENTITY_MANAGER.flush();
        return null;
    },
);

export const postRepositoryScan = withMiddleware<
    RouteCallback<'/repositories/:repositoryID/scan'>
>(
    [withEntityManager],
    async ({ params, request }) => {
        if (request.method !== 'POST') {
            return;
        }

        const { repositoryID } = params;
        const parsedRepositoryID = parseInt(repositoryID);

        const repository = await ENTITY_MANAGER.findOne(
            ENTITY_REPOSITORY,
            { repositoryID: parsedRepositoryID },
        );

        if (!repository) {
            return;
        }

        if (
            ([
                REPOSITORY_SCAN_STATES.processingFiles,
                REPOSITORY_SCAN_STATES.scanningDirectory,
            ] as string[]).includes(repository.scanState)
        ) {
            return null;
        }

        scanRepository(parsedRepositoryID);
        return null;
    },
);
