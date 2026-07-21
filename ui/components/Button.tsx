import { PolymorphicProps } from '@/lib/utilities/jsx.ts';
import { cls } from '@/lib/utilities/jsx.ts';

import type { ModifierColorSchemes } from '@/ui/utilities/styles.ts';
import { applyColorScheme } from '@/ui/utilities/styles.ts';

export const BUTTON_VARIANTS = {
    bordered: 'bordered',

    subtle: 'subtle',
} as const;

export type ButtonVariants =
    typeof BUTTON_VARIANTS[keyof typeof BUTTON_VARIANTS];

export type ButtonProps = {
    readonly colorScheme?: ModifierColorSchemes;

    readonly disabled?: boolean;

    readonly isActive?: boolean;

    readonly isIcon?: boolean;

    readonly variant?: ButtonVariants;
} & PolymorphicProps<'a' | 'button'>;

export default function Button(props: ButtonProps) {
    const {
        as: Component = 'button',
        className,
        colorScheme,
        disabled,
        isActive = false,
        isIcon = false,
        variant,
        ...rest
    } = props;

    return (
        <Component
            {...(rest as any)}
            className={cls(
                'button',
                {
                    'is-active': isActive,
                    'is-bordered': variant === BUTTON_VARIANTS.bordered,
                    'is-icon': isIcon,
                    'is-subtle': variant === BUTTON_VARIANTS.subtle,
                },
                applyColorScheme(colorScheme),
                className,
            )}
            {...(disabled ? { 'aria-disabled': disabled } : {})}
        />
    );
}
