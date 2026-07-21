import type { PolymorphicProps } from '@/lib/utilities/jsx.ts';
import { cls } from '@/lib/utilities/jsx.ts';

export type SurfaceProps = {
    readonly isPadded?: boolean;
} & PolymorphicProps<'div'>;

export default function Surface(props: SurfaceProps) {
    const { className, isPadded, ...rest } = props;

    return (
        <div
            {...rest}
            className={cls(
                'surface',
                className,
                {
                    'is-padded': isPadded,
                },
            )}
        />
    );
}
