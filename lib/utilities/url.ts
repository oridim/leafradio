export function translateBindingHostnames(hostname: string): string {
    switch (hostname) {
        case 'localhost':
            // **NOTE:** We want to support end-users being able to supply `localhost`
            // as a bindable hostname.
            return '127.0.0.1';
    }

    return hostname;
}

export function translateBrowserHostnames(hostname: string): string {
    switch (hostname) {
        case '127.0.0.1':
            // **NOTE:** Browsers give `localhost` access to secure JavaScript APIs
            // while they do not with `127.0.0.1`.
            return 'localhost';
    }

    return hostname;
}
