import { TextLineStream } from '@std/streams';

export async function waitForSignal(
    stdout: ReadableStream<Uint8Array>,
    signal: string,
    errorCallback: (reason?: unknown) => Promise<void> | void,
) {
    const [loggingStream, signalStream] = stdout.tee();

    loggingStream
        .pipeTo(Deno.stdout.writable)
        .catch(errorCallback);

    const lines = signalStream
        .pipeThrough(
            new TextDecoderStream() as TransformStream<Uint8Array, string>,
        )
        .pipeThrough(new TextLineStream());

    for await (const line of lines) {
        if (line === signal) {
            return;
        }
    }
}
