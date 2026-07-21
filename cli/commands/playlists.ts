import { command } from '@drizzle-team/brocli';

import COMMAND_PLAYLISTS_GENERATE from '@/cli/commands/playlists/generate.ts';

export default command({
    name: 'playlists',
    desc: 'Handles playlist generation.',

    subcommands: [
        COMMAND_PLAYLISTS_GENERATE,
    ],
});
