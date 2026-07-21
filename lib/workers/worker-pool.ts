import { serialize } from 'ohash';

import type {
    WorkerErrorResponse,
    WorkerObject,
    WorkerOutputResponse,
    WorkerRequest,
} from '@/lib/workers/types.ts';

const FILE_WORKER_RUNNER = new URL('./worker-runner.ts', import.meta.url);

interface WorkerRun<
    Input extends WorkerObject<unknown> = WorkerObject,
    Output extends WorkerObject<unknown> = WorkerObject,
> {
    readonly id: string;

    readonly input: Input;

    readonly output: Promise<Output>;

    readonly reject: (error: unknown) => void;

    readonly resolve: (value: Output) => void;

    readonly url: URL;
}

export interface WorkerPool extends Disposable {
    run<
        Input extends WorkerObject<unknown> = WorkerObject,
        Output extends WorkerObject<unknown> = WorkerObject,
    >(url: URL, input: Input): Promise<Output>;
}

export interface WorkerPoolOptions {
    readonly maximumWorkers: number;
}

function generateID(url: URL, value: unknown): string {
    return `${url.href}_${serialize(value)}`;
}

export function makeWorkerPool(options: WorkerPoolOptions): WorkerPool {
    const { maximumWorkers } = options;

    const queuedRuns: Map<string, WorkerRun> = new Map();
    const pendingRuns: Map<string, WorkerRun> = new Map();

    const activeWorkers: Set<Worker> = new Set();
    const idleWorkers: Worker[] = [];

    function spawnWorker(): void {
        const worker = new Worker(FILE_WORKER_RUNNER, { type: 'module' });
        activeWorkers.add(worker);

        worker.addEventListener('message', (event) => {
            const { data } = event;

            if (data === null) {
                if (queuedRuns.size > 0) {
                    idleWorkers.push(worker);
                    unqueueRun();
                } else {
                    worker.terminate();
                    activeWorkers.delete(worker);
                }

                return;
            }

            const { id, type, ...response } = data as
                | WorkerErrorResponse
                | WorkerOutputResponse;
            const workerRun = pendingRuns.get(id);

            if (!workerRun) {
                throw new Error(
                    `bad event 'WorkerPool.Worker.onmessage' (no runs associated with id '${id}')`,
                );
            }

            switch (type) {
                case 'error': {
                    const {
                        error: {
                            message,
                            name,
                            stack,
                        },
                    } = response as WorkerErrorResponse;

                    const error = new Error(message);
                    error.name = name;
                    error.stack = stack;

                    workerRun.reject(error);
                    break;
                }

                case 'output': {
                    const { output } = response as WorkerOutputResponse;

                    workerRun.resolve(output);
                    break;
                }
            }

            pendingRuns.delete(id);

            if (queuedRuns.size === 0) {
                worker.terminate();
                activeWorkers.delete(worker);
            } else {
                idleWorkers.push(worker);
                unqueueRun();
            }
        });
    }

    function queueRun(
        id: string,
        url: URL,
        input: WorkerObject,
    ): Promise<WorkerObject> {
        const { promise: output, resolve, reject } = Promise.withResolvers<
            WorkerObject
        >();

        queuedRuns.set(id, {
            id,
            input,
            reject,
            resolve,
            output,
            url,
        });

        return output;
    }

    function unqueueRun(): void {
        if (queuedRuns.size === 0) {
            return;
        }

        const worker = idleWorkers.shift();

        if (!worker) {
            if (activeWorkers.size < maximumWorkers) {
                spawnWorker();
            }

            return;
        }

        const { value: workerRun } = queuedRuns.values().next();

        if (!workerRun) {
            idleWorkers.push(worker);
            return;
        }

        const { id, input, url } = workerRun;

        queuedRuns.delete(id);
        pendingRuns.set(id, workerRun);

        worker.postMessage(
            {
                id,
                input,
                url: url.href,
            } satisfies WorkerRequest,
        );
    }

    return {
        [Symbol.dispose]() {
            for (const worker of activeWorkers) {
                worker.terminate();
            }

            activeWorkers.clear();
            idleWorkers.length = 0;
        },

        run<
            Input extends WorkerObject<unknown> = WorkerObject,
            Output extends WorkerObject<unknown> = WorkerObject,
        >(url: URL, input: Input): Promise<Output> {
            const id = generateID(url, input);

            if (pendingRuns.has(id)) {
                return pendingRuns.get(id)!.output as Promise<Output>;
            }

            if (queuedRuns.has(id)) {
                return queuedRuns.get(id)!.output as Promise<Output>;
            }

            const output = queueRun(id, url, input);

            unqueueRun();
            return output! as Promise<Output>;
        },
    };
}
