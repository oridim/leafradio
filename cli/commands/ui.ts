import { boolean, command } from '@drizzle-team/brocli';
import defer * as webUI from '@webui/deno-webui';

import { forkChildProcess } from '@/lib/utilities/child-process.ts';
import { waitForSignal } from '@/lib/utilities/streams.ts';

// **TODO:** Close if child process closes early.

const COMMAND_OPTIONS = {
    noWebviewOpen: boolean('no-webview-open').desc(
        'Enables the browser being opened automatically.',
    ).default(false),
} as const;

export default command({
    name: 'ui',
    desc:
        'Starts the Leaf Radio HTTP web application server and opens a webview.',
    options: COMMAND_OPTIONS,

    handler: async ({ noWebviewOpen }) => {
        const servePort = webUI.WebUI.getFreePort();
        const webviewPort = webUI.WebUI.getFreePort();

        console.log('[LeafRadio] Initializing webview...');
        const window = new webUI.WebUI();

        console.log('[LeafRadio] Initializing child process...');
        const childProcess = forkChildProcess(
            [
                'serve',
                '--hostname',
                '127.0.0.1',
                '--port',
                servePort.toString(),
                '--webview-port',
                webviewPort.toString(),
                '--is-worker',
            ],
            [
                '--allow-read',
                '--allow-write',
                '--allow-net',
                '--allow-run',
                '--allow-env',
                '--allow-ffi',
            ],
            {
                stderr: 'inherit',
                stdout: 'piped',
            },
        );

        window.setCloseHandlerWv(() => {
            Deno.exit(0);
        });

        console.log('[LeafRadio] Waiting on child process....');
        await waitForSignal(childProcess.stdout, 'SERVER_READY', (error) => {
            console.error('error occured while waiting for IPC signal:');
            console.error(error);

            Deno.exit(1);
        });

        window.setPort(webviewPort);

        console.log('[LeafRadio] Acquiring webview....');

        if (noWebviewOpen) {
            window.show(`http://localhost:${servePort}`);
        } else {
            window.showWebView(`http://localhost:${servePort}`);
        }

        console.log('[LeafRadio] Running!');
        await webUI.WebUI.wait();
    },
});
