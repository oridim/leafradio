import { MikroORM, RequestContext } from '@mikro-orm/sql';

import { isAsyncGenerator, isSyncGenerator } from '@/lib/utilities/types.ts';

import makeDatabaseConfiguration from '@/shared/configuration/database.ts';

import { Migration20260719164007 } from '@/shared/database/migrations/Migration20260719164007.ts';

const DATABASE_CONFIGURATION = await makeDatabaseConfiguration();

export type DatabaseWrapped<T> = T extends
    AsyncGenerator<infer Yield, infer Return, infer Next>
    ? AsyncGenerator<Yield, Return, Next>
    : T extends Generator<infer Yield, infer Return, infer Next>
        ? AsyncGenerator<Yield, Return, Next>
    : Promise<Awaited<T>>;

export const DATABASE = await MikroORM.init({
    ...DATABASE_CONFIGURATION,

    migrations: {
        migrationsList: [
            Migration20260719164007,
        ],
    },
});

export const { em: ENTITY_MANAGER } = DATABASE;

export type EntityManager = typeof ENTITY_MANAGER;

export function withEntityManager<Args extends unknown[], Return>(
    callback: (...args: Args) => Return,
): (...args: Args) => DatabaseWrapped<Return> {
    return function (...args: Args) {
        const fork = ENTITY_MANAGER.fork();
        const run = <T>(runCallback: () => T) =>
            RequestContext.create(fork, runCallback);

        let result!: Return;
        run(() => {
            result = callback(...args);
        });

        const isAsyncIterable = isAsyncGenerator(result);
        const isSyncIterable = isSyncGenerator(result);

        if (isAsyncIterable || isSyncIterable) {
            const iterator = isAsyncIterable
                ? (result as AsyncGenerator)[Symbol.asyncIterator]()
                : (result as Generator)[Symbol.iterator]();

            return (async function* () {
                try {
                    let iteratorResult = await run(() => iterator.next());

                    while (!iteratorResult.done) {
                        const nextValue =
                            // @ts-expect-error - **HACK:** We explictly do not know this value.
                            yield iteratorResult.value;

                        iteratorResult = await run(() =>
                            iterator.next(nextValue)
                        );
                    }

                    return iteratorResult.value;
                } finally {
                    if (iterator.return) {
                        await run(() => iterator.return!(undefined));
                    }
                }
            })();
        }

        return run(async () => await result);
    } as (...args: Args) => DatabaseWrapped<Return>;
}
