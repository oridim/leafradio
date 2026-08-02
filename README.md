![](./.assets/logo-github.webp)

> Algorithmic playlist generator with support for different internet radio broadcasting software.

> [!WARNING]
> This software is a personal project that is in development for powering the track selection of my private internet radios. LeafRadio is not a harden battle-tested software package that can be deployed in production without elbow grease.

## Usage

LeafRadio is a simple-to-use CLI software written in TypeScript for the Deno runtime. It is _not_ a daemon nor server that you program other software like internet radios to communicate with. Everything happens through standard input and output pipes. You will need to integrate LeafRadio manually with your choice of internet radio package. For this run through we will be using the [Liquidsoap](https://www.liquidsoap.info) scriptable internet radio as the integration target of choice. As that is what is currently powering my private internet radios.

> [!CAUTION]
> This is not a guide in how to use Liquidsoap. Please see [Liquidsoap's documentation](https://www.liquidsoap.info/doc.html) for help in using Liquidsoap.

### 1. Install LeafRadio

Download the [latest release CLI executable](https://github.com/oridim/leafradio/releases/latest) from GitHub Releases for your platform. The CLI will need to be available globally on computer that scans your library and the computer that runs Liquidsoap.

> [!TIP]
> The computer that scans your library and runs Liquidsoap can be the same machine. I typically scan my audio library on my laptop as it is CPU intensive. And my server VPSes are much weaker. However you handle that will be dependent on your infrastructure.

### 2. Scan Your Library

...

### 3. Deploy Your Manifest

...

### 4. Dynamically Request a Track

...

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
