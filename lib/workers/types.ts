export type WorkerObject<T = unknown> = { [K in keyof T]: WorkerValue };

export type WorkerRunFunction<
    Input extends WorkerObject = WorkerObject,
    Output extends WorkerObject = WorkerObject,
> = (
    input: Input,
) => Promise<Output> | Output;

export type WorkerValue =
    | boolean
    | null
    | number
    | string
    | WorkerValue[]
    | { [key: string]: WorkerValue };

export interface WorkerErrorResponse extends WorkerResponse {
    readonly type: 'error';

    readonly error: {
        readonly message: string;

        readonly name: string;

        readonly stack?: string;
    };
}

export interface WorkerRequest {
    readonly id: string;

    readonly input: WorkerObject;

    readonly url: string;
}

export interface WorkerResponse {
    readonly id: string;
}

export interface WorkerOutputResponse extends WorkerResponse {
    readonly type: 'output';

    readonly output: WorkerObject;
}
