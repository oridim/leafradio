import type { PolymorphicProps } from '@/lib/utilities/jsx.ts';
import { cls } from '@/lib/utilities/jsx.ts';

export type ButtonGroupProps = PolymorphicProps<'div'>;

export default function ButtonGroup(props: ButtonGroupProps) {
    const { className, ...rest } = props;

    return <div {...rest} className={cls('button-group', className)} />;
}
