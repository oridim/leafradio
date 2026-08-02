![](./.assets/logo-github.webp)

> Algorithmic playlist generator with support for different internet radio broadcasting software.

> [!WARNING]
> This software is a personal project that is in development for powering the track selection of my private internet radios. LeafRadio is not a harden battle-tested software package that can be deployed in production without elbow grease.

## CLI Reference

**`leafradio --help`**

```
LeafRadio application CLI.

Usage:
  leafradio [command]

Available Commands:
  playlists   Handles playlist generation.
  scan        Handles music scanning into audio data cache.

Flags:
  -h, --help                                                                 help for leafradio
  -v, --version                                                              version for leafradio
      --log-format [ human | jsonl ]                                         sets the logging format
      --log-level [ debug | error | fatal | info | silent | trace | warn ]   sets the logging level
      --quiet                                                                suppresses non-essential log output
      --verbose                                                              enables detailed debug log output
```

**`leafradio playlists --help`**

```
Handles playlist generation.

Usage:
  leafradio playlists [command]

Available Commands:
  generate      Generates a playlist out of audio files in a directory.
  now-playing   Determines the currently playing track and seek position based on the time of day.

Flags:
      --log-format [ human | jsonl ]                                         sets the logging format
      --log-level [ debug | error | fatal | info | silent | trace | warn ]   sets the logging level
      --quiet                                                                suppresses non-essential log output
      --verbose                                                              enables detailed debug log output
  -h, --help                                                                 help for playlists
  -v, --version                                                              version for leafradio

Use "leafradio playlists [command] --help" for more information about a command.
```

**`leafradio scan --help`**

```
Handles music scanning into audio data cache.

Usage:
  leafradio scan [command]

Available Commands:
  clean-dataset   Purges stale entries from a directory's audio data file and sorts it.
  directory       Scans a directory of audio files to preprocess them.

Flags:
      --log-format [ human | jsonl ]                                         sets the logging format
      --log-level [ debug | error | fatal | info | silent | trace | warn ]   sets the logging level
      --quiet                                                                suppresses non-essential log output
      --verbose                                                              enables detailed debug log output
  -h, --help                                                                 help for scan
  -v, --version                                                              version for leafradio

Use "leafradio scan [command] --help" for more information about a command.
```

## License

LeafRadio is licensed under the [MIT license](./LICENSE).
