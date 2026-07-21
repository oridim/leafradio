import type { PolymorphicProps } from '@/lib/utilities/jsx.ts';
import { cls } from '@/lib/utilities/jsx.ts';

export const STACK_ALIGNEDS = {
    center: 'center',

    end: 'end',

    start: 'start',
} as const;

export type StackAligneds = typeof STACK_ALIGNEDS[keyof typeof STACK_ALIGNEDS];

export const STACK_JUSTIFIEDS = {
    center: 'center',

    end: 'end',

    start: 'start',
} as const;

export type StackJustifieds =
    typeof STACK_JUSTIFIEDS[keyof typeof STACK_JUSTIFIEDS];

export const STACK_SPACEDS = {
    between: 'between',

    expand: 'expand',

    evenly: 'evenly',

    reduce: 'reduce',
} as const;

export type StackSpaceds = typeof STACK_SPACEDS[keyof typeof STACK_SPACEDS];

export type StackProps = {
    readonly aligned?: StackAligneds;

    readonly isFullBlockSize?: boolean;

    readonly isFullInlineSize?: boolean;

    readonly isHorizontal?: boolean;

    readonly isWrapped?: boolean;

    readonly justified?: StackJustifieds;

    readonly spaced?: StackSpaceds;
} & PolymorphicProps<'div'>;

export default function Stack(props: StackProps) {
    const {
        aligned,
        className,
        isFullBlockSize,
        isFullInlineSize,
        isHorizontal,
        isWrapped,
        justified,
        spaced,
        ...rest
    } = props;

    return (
        <div
            {...rest}
            className={cls(
                'stack',
                className,
                {
                    'is-aligned-center': aligned === STACK_ALIGNEDS.center,
                    'is-aligned-end': aligned === STACK_ALIGNEDS.end,
                    'is-aligned-start': aligned === STACK_ALIGNEDS.start,
                    'is-full-block-size': isFullBlockSize,
                    'is-full-inline-size': isFullInlineSize,
                    'is-horizontal': isHorizontal,
                    'is-justified-center':
                        justified === STACK_JUSTIFIEDS.center,
                    'is-justified-end': justified === STACK_JUSTIFIEDS.end,
                    'is-justified-start': justified === STACK_JUSTIFIEDS.start,
                    'is-spaced-between': spaced === STACK_SPACEDS.between,
                    'is-spaced-expand': spaced === STACK_SPACEDS.expand,
                    'is-spaced-evenly': spaced === STACK_SPACEDS.evenly,
                    'is-spaced-reduce': spaced === STACK_SPACEDS.reduce,
                    'is-wrapped': isWrapped,
                },
            )}
        />
    );
}
