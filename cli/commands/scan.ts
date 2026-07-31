import { command } from '@drizzle-team/brocli';

import COMMAND_SCAN_CLEAN_DATASET from '@/cli/commands/scan/clean-dataset.ts';
import COMMAND_SCAN_DIRECTORY from '@/cli/commands/scan/directory.ts';

export default command({
    name: 'scan',
    desc: 'Handles music scanning into audio data cache.',

    subcommands: [
        COMMAND_SCAN_CLEAN_DATASET,
        COMMAND_SCAN_DIRECTORY,
    ],
});
