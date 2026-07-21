import { command } from '@drizzle-team/brocli';

import COMMAND_SCAN_REPOSITORY from '@/cli/commands/scan/repository.ts';

export default command({
    name: 'scan',
    desc: 'Handles music repository database management.',

    subcommands: [
        COMMAND_SCAN_REPOSITORY,
    ],
});
