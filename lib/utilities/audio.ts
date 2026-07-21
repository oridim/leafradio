import { typeByExtension } from '@std/media-types';
import { toBytes } from '@std/streams';

export interface BiquadFilterOptions {
    readonly frequency: number;

    readonly q: number;
}

export interface DecodedAudioData extends ProbedAudioData {
    readonly audioData: Float32Array<ArrayBuffer>;
}

export interface ProbedAudioData {
    readonly duration: number;

    readonly format: string;

    readonly numberOfChannels: number;

    readonly sampleRate: number;
}

export interface StreamAudioFileOptions {
    readonly seek?: number;
}

export interface StreamedAudioData {
    readonly mimeType: string;

    readonly stream: ReadableStream<Uint8Array>;
}

function runFFMPEGCommand(
    binaryPath: string,
    args: string[],
    stdin: Uint8Array,
): Promise<Deno.CommandOutput> {
    const command = new Deno.Command(binaryPath, {
        args,
        stdin: 'piped',
        stdout: 'piped',
        stderr: 'piped',
    });

    const childProcess = command.spawn();

    new ReadableStream({
        start(controller) {
            controller.enqueue(stdin);
            controller.close();
        },
    })
        .pipeTo(childProcess.stdin)
        .catch(() => {});

    return childProcess.output();
}

export async function applyHighPassFilter(
    decodedAudioData: DecodedAudioData,
    options: BiquadFilterOptions,
): Promise<DecodedAudioData> {
    const { audioData, numberOfChannels, sampleRate } = decodedAudioData;
    const { frequency, q } = options;

    const bytes = new Uint8Array(
        audioData.buffer,
        audioData.byteOffset,
        audioData.byteLength,
    );

    const { stderr, stdout, success } = await runFFMPEGCommand(
        'ffmpeg',
        [
            '-loglevel',
            'error',
            '-f',
            'f32le',
            '-ar',
            sampleRate.toString(),
            '-ac',
            numberOfChannels.toString(),
            '-i',
            'pipe:0',
            '-filter:a',
            `highpass=frequency=${frequency}:width_type=q:width=${q}`,
            '-f',
            'f32le',
            '-codec:a',
            'pcm_f32le',
            'pipe:1',
        ],
        bytes,
    );

    if (!success) {
        const error = new TextDecoder().decode(stderr);

        throw new Error(
            `bad argument #0 to 'applyHighPassFilter' (failed to apply filter):\n${error}`,
        );
    }

    return {
        ...decodedAudioData,

        audioData: new Float32Array(
            stdout.buffer,
            stdout.byteOffset,
            stdout.byteLength / 4,
        ),
    };
}

export async function applyLowPassFilter(
    decodedAudioData: DecodedAudioData,
    options: BiquadFilterOptions,
): Promise<DecodedAudioData> {
    const { audioData, numberOfChannels, sampleRate } = decodedAudioData;
    const { frequency, q } = options;

    const bytes = new Uint8Array(
        audioData.buffer,
        audioData.byteOffset,
        audioData.byteLength,
    );

    const { stderr, stdout, success } = await runFFMPEGCommand(
        'ffmpeg',
        [
            '-loglevel',
            'error',
            '-f',
            'f32le',
            '-ar',
            sampleRate.toString(),
            '-ac',
            numberOfChannels.toString(),
            '-i',
            'pipe:0',
            '-filter:a',
            `lowpass=frequency=${frequency}:width_type=q:width=${q}`,
            '-f',
            'f32le',
            '-codec:a',
            'pcm_f32le',
            'pipe:1',
        ],
        bytes,
    );

    if (!success) {
        const error = new TextDecoder().decode(stderr);

        throw new Error(
            `bad argument #0 to 'applyLowPassFilter' (failed to apply filter):\n${error}`,
        );
    }

    return {
        ...decodedAudioData,

        audioData: new Float32Array(
            stdout.buffer,
            stdout.byteOffset,
            stdout.byteLength / 4,
        ),
    };
}

export function* chunkAudioData(
    audioData: Float32Array<ArrayBuffer>,
    bufferSize: number,
    hopSize: number = bufferSize,
): Generator<Float32Array<ArrayBuffer>> {
    const frameMaximumIndex = audioData.length - bufferSize;

    for (
        let frameStartIndex = 0;
        frameStartIndex <= frameMaximumIndex;
        frameStartIndex += hopSize
    ) {
        yield audioData.slice(
            frameStartIndex,
            frameStartIndex + bufferSize,
        );
    }
}

export async function downmixToMono(
    decodedAudioData: DecodedAudioData,
): Promise<DecodedAudioData> {
    const { audioData, numberOfChannels, sampleRate } = decodedAudioData;

    if (numberOfChannels === 1) {
        return decodedAudioData;
    }

    const bytes = new Uint8Array(
        audioData.buffer,
        audioData.byteOffset,
        audioData.byteLength,
    );

    const { stderr, stdout, success } = await runFFMPEGCommand(
        'ffmpeg',
        [
            '-loglevel',
            'error',
            '-f',
            'f32le',
            '-ar',
            sampleRate.toString(),
            '-ac',
            numberOfChannels.toString(),
            '-i',
            'pipe:0',
            '-ac',
            '1',
            '-f',
            'f32le',
            '-codec:a',
            'pcm_f32le',
            'pipe:1',
        ],
        bytes,
    );

    if (!success) {
        const error = new TextDecoder().decode(stderr);

        throw new Error(
            `bad argument #0 to 'downmixAudioDataToMono' (failed to downmix audio data):\n${error}`,
        );
    }

    return {
        ...decodedAudioData,

        numberOfChannels: 1,
        audioData: new Float32Array(
            stdout.buffer,
            stdout.byteOffset,
            stdout.byteLength / 4,
        ),
    };
}

export async function decodeAudioBytes(
    bytes:
        | ArrayBuffer
        | ReadableStream<Uint8Array>
        | Uint8Array,
): Promise<DecodedAudioData> {
    if (bytes instanceof ReadableStream) {
        bytes = await toBytes(bytes);
    } else {
        bytes = new Uint8Array(bytes);
    }

    if (!(bytes.buffer instanceof ArrayBuffer)) {
        throw new Error(
            "bad argument #0 to 'decodeAudioBytes' (expected 'ArrayBuffer', got 'SharedArrayBuffer')",
        );
    }
    const probedAudioData = await probeAudioBytes(bytes);

    const { stderr, stdout, success } = await runFFMPEGCommand(
        'ffmpeg',
        [
            '-loglevel',
            'error',
            '-f',
            probedAudioData.format,
            '-i',
            'pipe:0',
            '-f',
            'f32le',
            '-codec:a',
            'pcm_f32le',
            'pipe:1',
        ],
        bytes,
    );

    if (!success) {
        const error = new TextDecoder().decode(stderr);

        throw new Error(
            `bad argument #0 to 'decodeAudioBytes' (failed to decode audio bytes):\n${error}`,
        );
    }

    return {
        ...probedAudioData,

        audioData: new Float32Array(
            stdout.buffer,
            stdout.byteOffset,
            stdout.byteLength / 4,
        ),
    };
}

export async function decodeAudioFile(
    filePath: URL | string,
): Promise<DecodedAudioData> {
    const file = await Deno.open(filePath);

    return decodeAudioBytes(file.readable);
}

export async function probeAudioBytes(
    bytes: ArrayBuffer | ReadableStream<Uint8Array> | Uint8Array,
): Promise<ProbedAudioData> {
    if (bytes instanceof ReadableStream) {
        bytes = await toBytes(bytes);
    } else {
        bytes = new Uint8Array(bytes);
    }

    if (!(bytes.buffer instanceof ArrayBuffer)) {
        throw new Error(
            "bad argument #0 to 'probeAudioBytes' (expected 'ArrayBuffer', got 'SharedArrayBuffer')",
        );
    }

    const { stderr, stdout, success } = await runFFMPEGCommand(
        'ffprobe',
        [
            '-loglevel',
            'error',
            '-select_streams',
            'a:0',
            '-show_entries',
            'stream=channels,sample_rate,duration:format=duration,format_name',
            '-print_format',
            'json',
            '-i',
            'pipe:0',
        ],
        bytes,
    );

    if (!success) {
        const error = new TextDecoder().decode(stderr);

        throw new Error(
            `bad argument #0 to 'probeAudioBytes' (failed to probe audio bytes):\n${error}`,
        );
    }

    const probedText = new TextDecoder().decode(stdout);
    const probedJSON = JSON.parse(probedText);

    const formatInfo = probedJSON.format ?? {};
    const streamInfo = probedJSON.streams?.[0] ?? {};

    const numberOfChannels = parseInt(streamInfo.channels, 10);
    const probedFormatName = formatInfo.format_name;
    const probedDuration = formatInfo.duration ?? streamInfo.duration;
    const sampleRate = parseInt(streamInfo.sample_rate, 10);

    if (
        isNaN(numberOfChannels) || isNaN(sampleRate) ||
        typeof probedFormatName !== 'string' || probedFormatName.trim() === ''
    ) {
        throw new Error(
            "bad argument #0 to 'probeAudioBytes' (failed to extract channel count, format name, or sample rate from audio bytes)",
        );
    }

    return {
        duration: probedDuration ? parseFloat(probedDuration) * 1000 : 0,
        format: probedFormatName.split(',')[0],
        numberOfChannels,
        sampleRate,
    };
}

export async function probeAudioFile(
    filePath: URL | string,
): Promise<ProbedAudioData> {
    const file = await Deno.open(filePath);

    return probeAudioBytes(file.readable);
}

export async function streamAudioFile(
    filePath: URL | string,
    options: StreamAudioFileOptions = {},
): Promise<StreamedAudioData> {
    const { seek = 0 } = options;

    const { format } = await probeAudioFile(filePath);

    const mimeType = typeByExtension(`.${format}`) ?? `audio/${format}`;

    if (seek <= 0) {
        const file = await Deno.open(filePath, { read: true });

        return {
            mimeType,
            stream: file.readable,
        };
    }

    const command = new Deno.Command('ffmpeg', {
        args: [
            '-loglevel',
            'error',
            '-ss',
            seek.toString(),
            '-i',
            filePath.toString(),
            '-codec:a',
            'copy',
            '-f',
            format,
            'pipe:1',
        ],
        stdout: 'piped',
        stderr: 'null',
    });

    const childProcess = command.spawn();

    return {
        mimeType,
        stream: childProcess.stdout,
    };
}
