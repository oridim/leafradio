import { basename, isAbsolute, join, relative, SEPARATOR } from '@std/path';

const UNIX_HOME = Deno.env.get('HOME');

const UNIX_USER = Deno.env.get('USER');

const WINDOWS_HOME = Deno.env.get('USERPROFILE');
const WINDOWS_USER = WINDOWS_HOME ? basename(WINDOWS_HOME) : undefined;

const LINUX_MOUNT_DIRECTORY_PATHS = UNIX_USER
    ? [`/run/media/${UNIX_USER}`, `/media/${UNIX_USER}`, '/mnt']
    : ['/mnt'];

const { os: OPERATING_SYSTEM } = Deno.build;

export const homifyPath = (() => {
    switch (OPERATING_SYSTEM) {
        case 'darwin':
        case 'linux':
            return UNIX_HOME
                ? homifyPathUnix
                : (absolutePath: string) => absolutePath;
        case 'windows':
            return WINDOWS_HOME
                ? homifyPathWindows
                : (absolutePath: string) => absolutePath;
    }

    return (absolutePath: string) => absolutePath;
})();

export const volumnifyPath = (() => {
    switch (OPERATING_SYSTEM) {
        case 'darwin':
            return (absolutePath: string) =>
                volumnifyPathUnix(absolutePath, '/Volumes');
        case 'linux':
            return volumnifyPathLinux;
    }

    return (absolutePath: string) => absolutePath;
})();

function homifyPathUnix(absolutePath: string): string {
    if (absolutePath === UNIX_HOME) {
        return '~';
    }

    const relativePath = relative(UNIX_HOME!, absolutePath);

    if (relativePath.startsWith('..') || isAbsolute(relativePath)) {
        return absolutePath;
    }

    return join('~', relativePath);
}

function homifyPathWindows(absolutePath: string): string {
    if (absolutePath === WINDOWS_HOME) {
        return WINDOWS_USER!;
    }

    const relativePath = relative(WINDOWS_HOME!, absolutePath);

    if (relativePath.startsWith('..') || isAbsolute(relativePath)) {
        return absolutePath;
    }

    return join(WINDOWS_USER!, relativePath);
}

function volumnifyPathLinux(absolutePath: string): string {
    for (const mountDirectoryPath of LINUX_MOUNT_DIRECTORY_PATHS) {
        const volumifiedPath = volumnifyPathUnix(
            absolutePath,
            mountDirectoryPath,
        );

        if (absolutePath !== volumifiedPath) {
            return volumifiedPath;
        }
    }

    return absolutePath;
}

function volumnifyPathUnix(
    absolutePath: string,
    rootDirectory: string,
): string {
    const relativePath = relative(rootDirectory, absolutePath);

    if (
        relativePath.startsWith('..') || isAbsolute(relativePath) ||
        relativePath === ''
    ) {
        return absolutePath;
    }

    const [volumeName, ...rest] = relativePath.split(SEPARATOR);

    return join(`${volumeName}:`, ...rest);
}

export function humanifyPath(absolutePath: string): string {
    const homified = homifyPath(absolutePath);

    if (homified !== absolutePath) {
        return homified;
    }

    return volumnifyPath(absolutePath);
}
