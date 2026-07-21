import { command } from '@drizzle-team/brocli';

import COMMAND_RADIOS_ADD from '@/cli/commands/radios/add.ts';
import COMMAND_RADIOS_DELETE from '@/cli/commands/radios/delete.ts';
import COMMAND_RADIOS_DELETE_PARAMETERS from '@/cli/commands/radios/delete-parameters.ts';
import COMMAND_RADIOS_GET_PARAMETERS from '@/cli/commands/radios/get-parameters.ts';
import COMMAND_RADIOS_LINK from '@/cli/commands/radios/link.ts';
import COMMAND_RADIOS_SET_PROFILE from '@/cli/commands/radios/set-profile.ts';
import COMMAND_RADIOS_SET_PARAMETERS from '@/cli/commands/radios/set-parameters.ts';
import COMMAND_RADIOS_UNLINK from '@/cli/commands/radios/unlink.ts';

export default command({
    name: 'radios',
    desc: 'Handles radios database management.',

    subcommands: [
        COMMAND_RADIOS_ADD,
        COMMAND_RADIOS_DELETE,
        COMMAND_RADIOS_DELETE_PARAMETERS,
        COMMAND_RADIOS_GET_PARAMETERS,
        COMMAND_RADIOS_LINK,
        COMMAND_RADIOS_SET_PROFILE,
        COMMAND_RADIOS_SET_PARAMETERS,
        COMMAND_RADIOS_UNLINK,
    ],
});
