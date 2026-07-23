export interface AudioFile {
    readonly filePath: string;

    readonly lastModified: number;

    readonly pcmHash: string;
}
