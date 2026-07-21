export const PATH_EXECUTABLE = Deno.execPath();

export function forkChildProcess(
    appArgs: string[] = [],
    denoFlags: string[] = [],
    options: Omit<Deno.CommandOptions, 'args'> = {},
): Deno.ChildProcess {
    const args = Deno.build.standalone
        ? appArgs
        : ['run', ...denoFlags, Deno.mainModule, ...appArgs];

    const command = new Deno.Command(
        PATH_EXECUTABLE,
        {
            ...options,
            args,
        },
    );

    return command.spawn();
}
