import type { ViewCallback } from '@oridim/datastar-serve';
import { makeContext, useContext } from '@oridim/datastar-serve';

import type { RepositoryEntity } from '@/shared/database/mod.ts';
import { ENTITY_MANAGER, ENTITY_REPOSITORY } from '@/shared/database/mod.ts';

export const RepositoriesContext = makeContext<
    RepositoryEntity[] | null
>(null);

export default function useRepositories(): RepositoryEntity[] {
    const repositories = useContext(RepositoriesContext);

    if (!repositories) {
        throw new Error(
            "bad dispatch to 'useRepositories' (cannot use context outside of 'useRepositories')",
        );
    }

    return repositories;
}

export function withRepositories<T extends string>(
    callback: ViewCallback<T>,
): ViewCallback<T> {
    return async (request) => {
        const [element, repositories] = await Promise.all([
            callback(request),
            ENTITY_MANAGER.findAll(ENTITY_REPOSITORY),
        ]);

        return (
            <RepositoriesContext.Provider value={repositories}>
                {element}
            </RepositoriesContext.Provider>
        );
    };
}
