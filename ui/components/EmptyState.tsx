import { LucideIcon } from 'lucide-preact';

import type { PolymorphicProps } from '@/lib/utilities/jsx.ts';
import { cls } from '@/lib/utilities/jsx.ts';

export type EmptyStateProps = {
    readonly icon: LucideIcon;

    readonly subText: string;

    readonly text: string;
} & PolymorphicProps<'div'>;

export default function EmptyState(props: EmptyStateProps) {
    const { className, icon: Icon, subText, text, ...rest } = props;

    return (
        <div {...rest} className={cls('empty-state', className)}>
            <Icon className='empty-state--icon' />

            <div className='empty-state--details'>
                <span className='empty-state--text'>{text}</span>
                <span className='empty-state--sub-text'>{subText}</span>
            </div>
        </div>
    );
}
