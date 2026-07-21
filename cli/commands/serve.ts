import { boolean, command, number, string } from '@drizzle-team/brocli';
import defer * as datastarServe from '@oridim/datastar-serve';
import defer * as webUI from '@webui/deno-webui';

import {
    translateBindingHostnames,
    translateBrowserHostnames,
} from '@/lib/utilities/url.ts';

import defer * as UI_ROUTER from '@/ui/router.ts';
import defer * as uiEntryPoint from '@/ui/mod.ts';
import defer * as webviewUtilities from '@/ui/utilities/webview.ts';

const COMMAND_OPTIONS = {
    hostname: string().desc(
        'sets the hostname used for the HTTP web application server',
    ).default('127.0.0.1'),

    isWorker: boolean('is-worker').desc(
        'enables communication with parent process via IPC',
    ).default(false).hidden(),

    openBrowser: boolean('open-browser').desc(
        'enables the browser being opened automatically',
    ).default(false),

    port: number().desc(
        'sets the port used for the HTTP web application server',
    ).default(27015),

    webviewPort: number('webview-port').desc(
        'sets the port used to load the webview Javascript payload',
    ).default(27016).hidden(),
} as const;

export default command({
    name: 'serve',
    desc: 'Starts the Leaf Radio HTTP web application server.',
    options: COMMAND_OPTIONS,

    handler: async ({
        hostname,
        isWorker,
        openBrowser,
        port,
        webviewPort,
    }) => {
        console.log('[LeafRadio] Initializing backend...');
        await uiEntryPoint.default();

        console.log('[LeafRadio] Initializing HTTP server...');
        datastarServe.serve({
            router: UI_ROUTER.default,
            serve: {
                hostname: translateBindingHostnames(hostname),
                port,

                onListen() {
                    const url = `http://${
                        translateBrowserHostnames(hostname)
                    }:${port}`;

                    if (isWorker) {
                        webviewUtilities.default.setWebviewPort(webviewPort);

                        console.log('SERVER_READY');
                        return;
                    }

                    console.log(`[LeafRadio] Listening on ${url}...`);

                    if (openBrowser) {
                        webUI.WebUI.openUrl(url);
                        console.log(`[LeafRadio] Opened URL in browser!`);
                    }
                },
            },
        });
    },
});
