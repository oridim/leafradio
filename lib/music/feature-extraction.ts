export const DEFAULT_FEATURE_EXTRACTION_OPTIONS = {
    bufferSize: 2048,
} satisfies Required<
    FeatureExtractionOptions
>;

export interface FeatureExtractionOptions {
    readonly bufferSize?: number;
}
