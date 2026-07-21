export type BuiltinTypes =
    | Date
    | ((...args: unknown[]) => unknown)
    | Uint8Array
    | string
    | number
    | boolean
    | undefined
    | null;

export type DeepPartial<T> = T extends BuiltinTypes ? T
    : T extends Array<infer U> ? Array<DeepPartial<U>>
    : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>>
    : T extends Map<infer K, infer V> ? Map<DeepPartial<K>, DeepPartial<V>>
    : T extends Set<infer U> ? Set<DeepPartial<U>>
    : T extends Promise<infer U> ? Promise<DeepPartial<U>>
    : T extends object ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

export type DeepRequired<T> = T extends BuiltinTypes ? T
    : T extends Array<infer U> ? Array<DeepRequired<U>>
    : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepRequired<U>>
    : T extends Map<infer K, infer V> ? Map<DeepRequired<K>, DeepRequired<V>>
    : T extends Set<infer U> ? Set<DeepRequired<U>>
    : T extends Promise<infer U> ? Promise<DeepRequired<U>>
    : T extends object ? { [K in keyof T]-?: DeepRequired<T[K]> }
    : T;

export function isAsyncGenerator(value: unknown): value is AsyncGenerator {
    return (
        value != null &&
        typeof (value as Record<symbol, unknown>)[Symbol.asyncIterator] ===
            'function' &&
        typeof (value as Record<string, unknown>)['next'] === 'function'
    );
}

export function isSyncGenerator(value: unknown): value is Generator {
    return (
        value != null &&
        typeof (value as Record<symbol, unknown>)[Symbol.iterator] ===
            'function' &&
        typeof (value as Record<string, unknown>)['next'] === 'function'
    );
}
