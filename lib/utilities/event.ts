export type EventCallback<T> = (
    ...args: T extends void ? [] : [details: T]
) => void;

export interface EventSubscription<T = void> extends Disposable {
    readonly callback: EventCallback<T>;
}

export interface ReadonlyEvent<T = void> {
    subscribe: (callback: EventCallback<T>) => EventSubscription<T>;
}

export interface WritableEvent<T = void> extends ReadonlyEvent<T> {
    dispatch: (...args: T extends void ? [] : [details: T]) => void;
}

export function makeEvent<T = void>(): WritableEvent<T> {
    const subscribers: Set<EventCallback<T>> = new Set();

    return {
        dispatch(...args) {
            for (const callback of subscribers) callback(...args);
        },

        subscribe(callback) {
            subscribers.add(callback);

            return {
                [Symbol.dispose]() {
                    subscribers.delete(callback);
                },

                callback,
            };
        },
    };
}
