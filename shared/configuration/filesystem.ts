import { join } from '@std/path';

import { Adapt } from '@404wolf/xdg-portable';

import { APPLICATION_IDENTIFIER } from '@/shared/configuration/application.ts';

const { cache } = Adapt();

const XDG_CACHE_HOME = cache();

export const DIRECTORY_DATA = join(XDG_CACHE_HOME, APPLICATION_IDENTIFIER);

export const FILE_AUDIO_DATA = join(DIRECTORY_DATA, 'audio-data.json');
