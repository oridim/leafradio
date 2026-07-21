import type { JSX } from '@oridim/datastar-serve';

import type { PolymorphicProps } from '@/lib/utilities/jsx.ts';
import { cls } from '@/lib/utilities/jsx.ts';

export type NavEntryProps = {
    readonly actions?: JSX.Element;
    readonly badge?: JSX.Element;
    readonly subText?: string;
    readonly text: string;
} & PolymorphicProps<'div'>;

export default function NavEntry(props: NavEntryProps) {
    const { actions, badge, className, subText, text, ...rest } = props;

    return (
        <div
            {...rest}
            className={cls('nav-entry', className)}
        >
            <div className='nav-entry--details'>
                <div className='nav-entry--text'>
                    {badge ? badge : <></>}
                    <span className='nav-entry--text--label'>{text}</span>
                </div>

                {subText
                    ? (
                        <span className='nav-entry--sub-text'>
                            {subText}
                        </span>
                    )
                    : <></>}
            </div>

            <div className='nav-entry--actions'>
                {actions}
            </div>
        </div>
    );
}
