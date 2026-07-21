import type { JSX } from '@oridim/datastar-serve';

export type HTMLTags = keyof JSX.IntrinsicElements;

export type PolymorphicProps<T extends HTMLTags, U = T> = T extends unknown
    ? [U] extends [T] ? JSX.IntrinsicElements[T]
    : { readonly as?: T } & JSX.IntrinsicElements[T]
    : never;

// **HACK:** Re-export `SignalLike` from Preact to replace `unknown`.

export function cls(
    ...classNames: (string | undefined | Record<string, boolean> | unknown)[]
): string {
    return classNames.flatMap((classConditionals) => {
        if (!classConditionals) {
            return [];
        }

        if (typeof classConditionals === 'string') {
            return classConditionals;
        }

        return Object.entries(classConditionals)
            .filter(([_, conditional]) => conditional)
            .map(([className, _]) => className);
    }).join(' ');
}
