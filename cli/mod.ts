import { run } from '@drizzle-team/brocli';

import {
    APPLICATION_VERSION,
    initFilesystem,
} from '@/shared/configuration/mod.ts';
import { initDatabase } from '@/shared/database/mod.ts';

import COMMAND_PLAYLISTS from '@/cli/commands/playlists.ts';
import COMMAND_RADIOS from '@/cli/commands/radios.ts';
import COMMAND_REPOSITORIES from '@/cli/commands/repositories.ts';
import COMMAND_SCAN from '@/cli/commands/scan.ts';
import COMMAND_SERVE from '@/cli/commands/serve.ts';
import COMMAND_UI from '@/cli/commands/ui.ts';

await initFilesystem();
await initDatabase();

run(
    [
        COMMAND_PLAYLISTS,
        COMMAND_RADIOS,
        COMMAND_REPOSITORIES,
        COMMAND_SCAN,
        COMMAND_SERVE,
        COMMAND_UI,
    ],
    {
        name: 'leafradio',
        version: `v${APPLICATION_VERSION}`,
        description: 'Leaf Radio application CLI.',
    },
);
