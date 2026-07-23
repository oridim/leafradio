import type { AudioProperties } from '@/lib/playlist-packer/mod.ts';
import type { MusicalFeatures } from '@/lib/music/mod.ts';

export interface ProcessedMetadata {
    readonly pcmHash: string;

    readonly audioProperties: AudioProperties;

    readonly musicalFeatures: MusicalFeatures;
}
