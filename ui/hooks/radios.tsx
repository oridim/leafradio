import type { ViewCallback } from '@oridim/datastar-serve';
import { makeContext, useContext } from '@oridim/datastar-serve';

import type { RadioEntity } from '@/shared/database/mod.ts';
import { ENTITY_MANAGER, ENTITY_RADIO } from '@/shared/database/mod.ts';

const RADIOS_CONTEXT = makeContext<
    RadioEntity[] | null
>(null);

export default function useRadios(): RadioEntity[] {
    const radios = useContext(RADIOS_CONTEXT);

    if (!radios) {
        throw new Error(
            "bad dispatch to 'useRadios' (cannot use context outside of 'useRadios')",
        );
    }

    return radios;
}

export function withRadios<T extends string>(
    callback: ViewCallback<T>,
): ViewCallback<T> {
    return async (request) => {
        const [element, radios] = await Promise.all([
            callback(request),
            ENTITY_MANAGER.findAll(ENTITY_RADIO),
        ]);

        return (
            <RADIOS_CONTEXT.Provider value={radios}>
                {element}
            </RADIOS_CONTEXT.Provider>
        );
    };
}
