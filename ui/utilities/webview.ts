let WEBVIEW_PORT = -1;

function setWebviewPort(port: number): void {
    WEBVIEW_PORT = port;
}

export default {
    setWebviewPort,

    get IS_WEBVIEW() {
        return WEBVIEW_PORT > -1;
    },

    get URL_WEBVIEW_JAVASCRIPT() {
        return `http://localhost:${WEBVIEW_PORT}/webui.js`;
    },

    get WEBVIEW_PORT() {
        return WEBVIEW_PORT;
    },
};
