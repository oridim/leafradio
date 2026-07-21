import { command } from '@drizzle-team/brocli';

import COMMAND_SCAN_DIRECTORY from '@/cli/commands/scan/directory.ts';

export default command({
    name: 'scan',
    desc: 'Handles music repository database management.',

    subcommands: [
        COMMAND_SCAN_DIRECTORY,
    ],
});
