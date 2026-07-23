export interface AudioFile {
    readonly absoluteFilePath: string;

    readonly lastModified: number;

    readonly pcmHash: string;
}
