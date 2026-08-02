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

### 3. Deploy Your Audio Files + Manifest

You will need to deploy your audio files and audio data file manifest on the same computer that is running Liquidsoap. As that computer will be the one that is generating your playlists and serving up your audio. Both the audio files and the manifest can both be network shared to this computer as all audio processing is complete. I typically just keep the manifest in the same directory as the audio files but this of course can be customized to your needs.

### 4. Generate Your First Playlist

Let's next try generating a test playlist. To do so, you simply point LeafRadio at your audio library again:

```sh
leafradio playlists generate /path/to/audio/library
```

LeafRadio will then algorithmically generate you a playlist using the date of the current day as the seed:

```
ℹ '10144' audio files were filtered for possible playlist inclusion.
ℹ '457' audio files included in the playlist.
┌───────────┬──────────┬─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Bucket ID │ Duration │ Absolute File Path                                                                                                          │
├───────────┼──────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 1         │ 0:03:16  │ /var/home/novacbn/Music/Library/Mega Drive - 199XAD/01-08 H.exe.mp3                                                         │
├───────────┼──────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 1         │ 0:01:31  │ /var/home/novacbn/Music/Library/Ape Inc. - MOTHER/01-24 Wisdom of the World (Queen Mary's Castle).flac                      │
├───────────┼──────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 1         │ 0:02:41  │ /var/home/novacbn/Music/Library/Dennaton Games - Hotline Miami/01-16 Daisuke.flac
# ...
```

It should be noted here that LeafRadio is going to recursively scan your audio library for files and then pull their processed metadata from the manifest file. LeafRadio will not just blindly think that all the files in your manifest file is what's available to it.

You can also use LeafRadio to generate playlists of different machine-readable formats:

```
❯ leafradio playlists generate --output-format json ~/Music/Library
ℹ '10144' audio files were filtered for possible playlist inclusion.
ℹ '457' audio files included in the playlist.
[{"bucketID":1,"duration":196468.0045351474,"filePath":"/var/home/novacbn/Music/Library/Mega Drive - 199XAD/01-08 H.exe.mp3"},{"bucketID":1,"duration":91998.48072562358,"filePath":"/var/home/novacbn/Music/Library/Ape Inc. - MOTHER/01-24 Wisdom of the World (Queen Mary's Castle).flac"},{"bucketID":1,"duration":161973.3106575964,"filePath":"/var/home/novacbn/Music/Library/Dennaton Games - Hotline Miami/01-16 Daisuke.flac"}, ...]
```

```
❯ leafradio playlists generate --output-format csv ~/Music/Library
ℹ '10144' audio files were filtered for possible playlist inclusion.
ℹ '457' audio files included in the playlist.
bucketID,duration,filePath
1,196468.0045351474,/var/home/novacbn/Music/Library/Mega Drive - 199XAD/01-08 H.exe.mp3
1,91998.48072562358,/var/home/novacbn/Music/Library/Ape Inc. - MOTHER/01-24 Wisdom of the World (Queen Mary's Castle).flac
1,161973.3106575964,/var/home/novacbn/Music/Library/Dennaton Games - Hotline Miami/01-16 Daisuke.flac
...
```

```
❯ leafradio playlists generate --output-format m3u ~/Music/Library
[LeafRadio] ℹ '10144' audio files were filtered for possible playlist inclusion.
[LeafRadio] ℹ '457' audio files included in the playlist.
#EXTM3U
#EXTINF:196,
#EXTGRP:Bucket 1
/var/home/novacbn/Music/Library/Mega Drive - 199XAD/01-08 H.exe.mp3
#EXTINF:91,
#EXTGRP:Bucket 1
/var/home/novacbn/Music/Library/Ape Inc. - MOTHER/01-24 Wisdom of the World (Queen Mary's Castle).flac
#EXTINF:161,
#EXTGRP:Bucket 1
/var/home/novacbn/Music/Library/Dennaton Games - Hotline Miami/01-16 Daisuke.flac
...
```

> [!TIP]
> The M3U format is a standard format that most music tools dealing in playlists conventionally support.

### 5. Tuning Playlist Generation

...

### 6. Dynamically Request a Track

...

### 7. (Optional) Cleaning Your Manifest

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
