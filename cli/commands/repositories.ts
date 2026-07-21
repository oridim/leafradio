import { command } from '@drizzle-team/brocli';

import COMMAND_REPOSITORIES_ADD from '@/cli/commands/repositories/add.ts';
import COMMAND_REPOSITORIES_DELETE from '@/cli/commands/repositories/delete.ts';

export default command({
    name: 'repositories',
    desc: 'Handles music repository database management.',

    subcommands: [
        COMMAND_REPOSITORIES_ADD,
        COMMAND_REPOSITORIES_DELETE,
    ],
});
