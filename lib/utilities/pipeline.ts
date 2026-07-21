export type PipelineStep<T> = (
    context: T,
) => Promise<boolean | void> | boolean | void;

export function makePipeline<T>(initialContext: T) {
    const context = initialContext;
    const steps: PipelineStep<T>[] = [];

    return {
        addStep(step: PipelineStep<T>) {
            steps.push(step);

            return this;
        },

        async execute() {
            for (const step of steps) {
                const result = await step(context);

                if (result === false) {
                    break;
                }
            }

            return context;
        },
    };
}
