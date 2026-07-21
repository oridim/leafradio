import { CircleStop } from 'lucide-preact';

import type { PolymorphicProps } from '@/lib/utilities/jsx.ts';
import { cls } from '@/lib/utilities/jsx.ts';

export type NavbarProps = {} & PolymorphicProps<'a'>;

export default function NowPlayingWidget(props: NavbarProps) {
    const { className, ...rest } = props;

    return (
        <a {...rest} className={cls('now-playing-widget', className)} href='/'>
            <div class='now-playing-widget--cover'>
                <CircleStop />
            </div>

            <div className='now-playing-widget--details'>
                <span class='now-playing-widget--title'>
                    No Radio Playing
                </span>

                <span class='now-playing-widget--indicator'>
                    --:-- / --:--
                </span>
            </div>
        </a>
    );
}
