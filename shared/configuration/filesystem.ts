import { join } from '@std/path';

import { Adapt } from '@404wolf/xdg-portable';

import { APPLICATION_IDENTIFIER } from '@/shared/configuration/application.ts';

const { data } = Adapt();

const XDG_DATA_HOME = data();

export const DIRECTORY_DATA = join(XDG_DATA_HOME, APPLICATION_IDENTIFIER);

export const FILE_DATABASE = join(DIRECTORY_DATA, 'database.sqlite');

export async function initFilesystem(): Promise<void> {
    await Promise.all([]);
}
