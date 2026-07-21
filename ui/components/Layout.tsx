import { FrameworkHead } from '@oridim/datastar-serve';

import type { PolymorphicProps } from '@/lib/utilities/jsx.ts';

import DEFAULT_SIGNALS from '@/ui/signals.ts';
import webview from '@/ui/utilities/webview.ts';

import Sidebar from '@/ui/components/Sidebar.tsx';

export type LayoutProps = {} & PolymorphicProps<'body'>;

export default function Layout(props: LayoutProps) {
    const { children, ...rest } = props;

    return (
        <html lang='en'>
            <head>
                <meta charset='UTF-8' />
                <title>Leaf Radio</title>

                {webview.IS_WEBVIEW
                    ? (
                        <script
                            type='application/javascript'
                            src={webview.URL_WEBVIEW_JAVASCRIPT}
                        >
                        </script>
                    )
                    : <></>}

                <FrameworkHead />

                <link rel='stylesheet' href='/styles/styles.css' />
            </head>

            <body
                {...rest}
                className='layout'
                data-signals={JSON.stringify(DEFAULT_SIGNALS)}
            >
                <Sidebar />

                <main className='layout--content'>
                    {children}
                </main>
            </body>
        </html>
    );
}
