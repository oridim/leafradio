import APPLICATION_MANIFEST from '@/deno.json' with { type: 'json' };

export const APPLICATION_IDENTIFIER = APPLICATION_MANIFEST.name;

export const APPLICATION_VERSION = APPLICATION_MANIFEST.version;
