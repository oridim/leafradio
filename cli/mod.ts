import { run } from '@drizzle-team/brocli';

import {
    APPLICATION_VERSION,
    initFilesystem,
} from '@/shared/configuration/mod.ts';
import { initDatabase } from '@/shared/database/mod.ts';

import COMMAND_PLAYLISTS from '@/cli/commands/playlists.ts';
import COMMAND_SCAN from '@/cli/commands/scan.ts';

await initFilesystem();
await initDatabase();

run(
    [
        COMMAND_PLAYLISTS,
        COMMAND_SCAN,
    ],
    {
        name: 'leafradio',
        version: `v${APPLICATION_VERSION}`,
        description: 'Leaf Radio application CLI.',
    },
);
