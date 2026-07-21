import { PolymorphicProps } from '@/lib/utilities/jsx.ts';
import { cls } from '@/lib/utilities/jsx.ts';

import type { ModifierColorSchemes } from '@/ui/utilities/styles.ts';
import { applyColorScheme } from '@/ui/utilities/styles.ts';

export type BadgeProps = {
    readonly colorScheme?: ModifierColorSchemes;
} & PolymorphicProps<'span'>;

export default function Badge(props: BadgeProps) {
    const { className, colorScheme, ...rest } = props;

    return (
        <span
            {...(rest as any)}
            className={cls(
                'badge',
                applyColorScheme(colorScheme),
                className,
            )}
        />
    );
}
