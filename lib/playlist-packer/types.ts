import { MusicalFeatures } from '@/lib/music/musical-features.ts';

export interface AudioProperties {
    readonly duration: number;
}

export interface Bucket {
    readonly id: number;

    readonly targetArousal: number;

    readonly targetDuration: number;

    readonly targetValence: number;

    readonly totalDuration: number;

    readonly tracks: Track[];
}

export interface PackedBuckets {
    readonly buckets: Bucket[];

    readonly leftovers: Track[];
}

export interface Track {
    readonly audioProperties: AudioProperties;

    readonly groupId?: string;

    readonly id: string;

    readonly musicalFeatures: MusicalFeatures;

    readonly weight?: number;
}
