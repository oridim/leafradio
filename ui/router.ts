import type {
    RouteCallback,
    StreamRouteCallback,
} from '@oridim/datastar-serve';
import {
    defineGroup,
    defineRoute,
    defineRouter,
    defineStaticDirectory,
    defineStream,
    defineStreamChannel,
    defineView,
} from '@oridim/datastar-serve';

import { synchronizeSidebar } from '@/ui/components/Sidebar.tsx';

import { deleteRadio, postRadio } from '@/ui/routes/radios.ts';
import {
    deleteRepository,
    postRepository,
    postRepositoryScan,
} from '@/ui/routes/repositories.ts';

import HomeView from '@/ui/views/HomeView.tsx';
import RadioEditBucketsView from '@/ui/views/RadioEditBucketsView.tsx';
import RadioEditDetailssView from '@/ui/views/RadioEditDetailsView.tsx';
import RadioPlayView from '@/ui/views/RadioPlayView.tsx';

export default defineRouter([
    defineView('/', HomeView),

    defineGroup('/radios', [
        defineStream('/', postRadio as StreamRouteCallback),

        defineGroup('/:radioID', [
            defineGroup('/edit', [
                defineView('/buckets', RadioEditBucketsView),
                defineView('/details', RadioEditDetailssView),
            ]),

            defineStream('/', deleteRadio as StreamRouteCallback),
            defineView('/play', RadioPlayView),
        ]),
    ]),

    defineGroup('/repositories', [
        defineRoute('/', postRepository as RouteCallback),

        defineGroup('/:repositoryID', [
            defineRoute('/', deleteRepository as RouteCallback),
            defineRoute('/scan', postRepositoryScan as RouteCallback),
        ]),
    ]),

    defineGroup('/synchronize', [
        defineStreamChannel('/sidebar', synchronizeSidebar, {
            keepalive: true,
        }),
    ]),

    defineStaticDirectory('/', new URL('./public', import.meta.url)),
]);
