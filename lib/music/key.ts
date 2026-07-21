import _determineKey from '@/vendor/pitch-detection/key.ts';

// **NOTE:** Was shuffling between a bunch of different libraries. So, wanted to
// just alias this here.

export function determineKey(chroma: readonly number[]): string {
    return _determineKey(chroma).label;
}
