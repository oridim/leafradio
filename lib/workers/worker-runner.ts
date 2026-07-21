/// <reference no-default-lib="true" />
/// <reference lib="deno.worker" />

import {
    WorkerErrorResponse,
    WorkerObject,
    WorkerOutputResponse,
    WorkerRequest,
    WorkerRunFunction,
} from '@/lib/workers/types.ts';

self.addEventListener('message', async (event) => {
    const { id, input, url } = event.data as WorkerRequest;

    let output: WorkerObject;

    try {
        const { default: run }: { default: WorkerRunFunction } = await import(
            url
        );

        output = await run(input);
    } catch (error) {
        const { message, name, stack } = error instanceof Error
            ? error
            : new Error(String(error));

        self.postMessage(
            {
                error: {
                    message,
                    name,
                    stack,
                },

                id,
                type: 'error',
            } satisfies WorkerErrorResponse,
        );

        return;
    }

    self.postMessage(
        {
            id,
            output,
            type: 'output',
        } satisfies WorkerOutputResponse,
    );
});

self.postMessage(null);
