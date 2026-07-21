import type { JSX } from '@oridim/datastar-serve';
import type { LucideIcon } from 'lucide-preact';

import type { PolymorphicProps } from '@/lib/utilities/jsx.ts';
import { cls } from '@/lib/utilities/jsx.ts';

export type NavSectionProps = {
    readonly action?: JSX.Element;
    readonly icon?: LucideIcon;
    readonly text: string;
} & PolymorphicProps<'div'>;

export default function NavSection(props: NavSectionProps) {
    const {
        action,
        children,
        className,
        icon: Icon,
        text,
        ...rest
    } = props;

    return (
        <div {...rest} className={cls('nav-section', className)}>
            <div className='nav-section--details'>
                <div className='nav-section--label'>
                    {Icon ? <Icon /> : <></>}
                    {text}
                </div>

                {action ? action : <></>}
            </div>

            {children}
        </div>
    );
}
