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

### 2. Scan Your Audio Library

This part is pretty simple. Once you have LeafRadio installed you will need to point it at your audio library to scan it:

```sh
leafradio scan directory /path/to/audio/library
```

This will create an "audio data file" manifest which will be located at the directory you provided as `.leafradio.audio-data.json` by default:

```jsonc
{
    "audioFiles": [
        {
            "filePath": "Alistair Lindsay - DEFCON Soundtrack/01-01 Track1.mp3",
            "lastModified": 1785464323594,
            "pcmHash": "71e80d99209883eec842859e0d816b36cd4414b9434025be9a385c29bda0a64f"
        },
        {
            "filePath": "Alistair Lindsay - DEFCON Soundtrack/01-02 Track2.mp3",
            "lastModified": 1785464323609,
            "pcmHash": "369d69d808d5433613cae3e3fd0368e3d04ebed673035adb149db9e40bb06f82"
        }
        // ...
    ],
    "processedMetadata": [
        {
            "audioProperties": { "duration": 217459.2970521542 },
            "musicalFeatures": {
                "arousal": 0.2939820356380652,
                "bpm": 118,
                "key": "B♭m",
                "valence": 0.4704486425316841
            },
            "pcmHash": "369d69d808d5433613cae3e3fd0368e3d04ebed673035adb149db9e40bb06f82"
        },
        {
            "audioProperties": { "duration": 153437.21088435373 },
            "musicalFeatures": {
                "arousal": 0.36856818748502745,
                "bpm": 132,
                "key": "G♭m",
                "valence": 0.46221832796328194
            },
            "pcmHash": "71e80d99209883eec842859e0d816b36cd4414b9434025be9a385c29bda0a64f"
        }
        // ...
    ]
}
```

The directory you provided will be scanned recursive with symlinks being followed for every audio file within it. From there, a files are hashed by their raw decoded PCM data to create a look up of their processed features (duration in seconds, arousal (energy), beats-per-minute (BPM), musical key, and valance (mood) values).

This is to help with deduplication and stable identification through metadata changes. But _more importantly_, this structure of pre-scanning your library makes playlist generation later extremely fast.

> [!TIP]
> It is highly recommended that you keep all of your audio files that you will deploy as radios in a single directory. You can use symlinks or other similar methods to create views into your library. Because files are stored in the manifest at relative to library directory this allows you to focus on only needing to handle a singular manifest file to deploy.

> [!TIP]
> It is highly recommended that you **DO NOT** have your audio files mounted as a network share when you scan them. Otherwise, the scanning process with be _much slower_ than it already is.

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
