import type { StreamRouteCallback } from '@oridim/datastar-serve';
import { withMiddleware } from '@oridim/datastar-serve';

import {
    ENTITY_MANAGER,
    ENTITY_RADIO,
    withEntityManager,
} from '@/shared/database/mod.ts';

export const deleteRadio = withMiddleware<
    StreamRouteCallback<'/radios/:radioID'>
>(
    [withEntityManager],
    async function* ({ params, request }) {
        const { headers, method } = request;

        if (method !== 'DELETE') {
            return;
        }

        const { radioID } = params;
        const { pathname } = headers.has('referer')
            ? new URL(headers.get('referer')!)
            : {};

        const radio = await ENTITY_MANAGER.findOne(
            ENTITY_RADIO,
            { radioID: parseInt(radioID) },
        );

        if (!radio) {
            return;
        }

        ENTITY_MANAGER.remove(radio);
        await ENTITY_MANAGER.flush();

        if (pathname?.startsWith(`/radios/${radioID}/`)) {
            yield {
                executeScript: {
                    script: `datastarHijack.navigate("/");`,
                },
            };
        }

        // **TODO:** Stop radio stream if one is playing.
    },
);

export const postRadio = withMiddleware<StreamRouteCallback<'/radios'>>(
    [withEntityManager],
    async ({ request }) => {
        if (request.method !== 'POST') {
            return;
        }

        const radio = ENTITY_MANAGER.create(ENTITY_RADIO, {
            name: 'New Radio',
        });

        ENTITY_MANAGER.persist(radio);
        await ENTITY_MANAGER.flush();

        return {
            executeScript: {
                script:
                    `datastarHijack.navigate("/radios/${radio.radioID}/edit/repositories");`,
            },
        };
    },
);
