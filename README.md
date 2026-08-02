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
│ 1         │ 0:03:16  │ /var/home/oridim/Music/Library/Mega Drive - 199XAD/01-08 H.exe.mp3                                                         │
├───────────┼──────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 1         │ 0:01:31  │ /var/home/oridim/Music/Library/Ape Inc. - MOTHER/01-24 Wisdom of the World (Queen Mary's Castle).flac                      │
├───────────┼──────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 1         │ 0:02:41  │ /var/home/oridim/Music/Library/Dennaton Games - Hotline Miami/01-16 Daisuke.flac
# ...
```

It should be noted here that LeafRadio is going to recursively scan your audio library for files and then pull their processed metadata from the manifest file. LeafRadio will not just blindly think that all the files in your manifest file is what's available to it.

You can also use LeafRadio to generate playlists of different machine-readable formats:

```
❯ leafradio playlists generate --output-format json ~/Music/Library
ℹ '10144' audio files were filtered for possible playlist inclusion.
ℹ '457' audio files included in the playlist.
[{"bucketID":1,"duration":196468.0045351474,"filePath":"/var/home/oridim/Music/Library/Mega Drive - 199XAD/01-08 H.exe.mp3"},{"bucketID":1,"duration":91998.48072562358,"filePath":"/var/home/oridim/Music/Library/Ape Inc. - MOTHER/01-24 Wisdom of the World (Queen Mary's Castle).flac"},{"bucketID":1,"duration":161973.3106575964,"filePath":"/var/home/oridim/Music/Library/Dennaton Games - Hotline Miami/01-16 Daisuke.flac"}, ...]
```

```
❯ leafradio playlists generate --output-format csv ~/Music/Library
ℹ '10144' audio files were filtered for possible playlist inclusion.
ℹ '457' audio files included in the playlist.
bucketID,duration,filePath
1,196468.0045351474,/var/home/oridim/Music/Library/Mega Drive - 199XAD/01-08 H.exe.mp3
1,91998.48072562358,/var/home/oridim/Music/Library/Ape Inc. - MOTHER/01-24 Wisdom of the World (Queen Mary's Castle).flac
1,161973.3106575964,/var/home/oridim/Music/Library/Dennaton Games - Hotline Miami/01-16 Daisuke.flac
...
```

```
❯ leafradio playlists generate --output-format m3u ~/Music/Library
[LeafRadio] ℹ '10144' audio files were filtered for possible playlist inclusion.
[LeafRadio] ℹ '457' audio files included in the playlist.
#EXTM3U
#EXTINF:196,
#EXTGRP:Bucket 1
/var/home/oridim/Music/Library/Mega Drive - 199XAD/01-08 H.exe.mp3
#EXTINF:91,
#EXTGRP:Bucket 1
/var/home/oridim/Music/Library/Ape Inc. - MOTHER/01-24 Wisdom of the World (Queen Mary's Castle).flac
#EXTINF:161,
#EXTGRP:Bucket 1
/var/home/oridim/Music/Library/Dennaton Games - Hotline Miami/01-16 Daisuke.flac
...
```

> [!TIP]
> The M3U format is a standard format that most music tools dealing in playlists conventionally support.

### 5. Tuning Playlist Generation

By default, LeafRadio's algorithm parameters are not configured do too much. However, there are a plethora of things for you to customize:

```
❯ leafradio playlists generate --help

Generates a playlist out of audio files in a directory.

Usage:
  leafradio playlists generate <directory-path> [flags]

Flags:
      --allowed-tracks string
      sets a file (.csv, .json, .m3u, .m3u8) containing tracks to exclusively allow

      --audio-data-file string
      sets the file to use as the audio data lookup

      --disallowed-tracks string
      sets a file (.csv, .json, .m3u, .m3u8) containing tracks to exclude

      --output-file string
      sets the file to output the playlist to
      
      --output-format [ csv | human | json | m3u ]
      sets the format to output the playlist as (default: "human")

      --profile [ aggressiveRelease | cinematicJourney | deepFocus | eclecticDiscovery | euphoricPeak | exerciseClimb | melancholicDrift | nostalgicChill | partyFlow | steadyDrive | windDown ]
      sets the a preset profile's to use as a baseline

      --energy-curve [ bellEnergyCurve | climbEnergyCurve | descentEnergyCurve | steadyEnergyCurve | valleyEnergyCurve | waveEnergyCurve ]
      sets the distribution curve forumla to determine track inclusion in a bucket

      --group-decay-factor number
      sets the decay multiplier applied to a track's score for each time its directory is used

      --max-tracks-per-bucket number
      sets the maximum amount of tracks per bucket
      
      --minimum-duration number
      sets the minimum duration (in milliseconds) a track requires to be included (default: 0)

      --mixing-rule [ energyBuildUpMixingRule | harmonicMixingRule | strictTempoMixingRule | vibeTransitionMixingRule ]
      sets the sorting algorithm used to determine track distribution inside of buckets

      --number-of-buckets number
      sets how many buckets the linked repositories of tracks are split into

      --pacing-strictness-arousal number
      sets how closely the track distribution must follow the energy curve

      --pacing-strictness-valence number
      sets how closely the track distribution must follow the vibe target

      --score-fuzziness number
      sets how exacting a track's scoring must match for inclusion by introducing randomness

      --seed string
      sets the seed used for the random number generator (default: "1785643200000")

      --target-duration-per-bucket number
      sets the max possible cumulative duration of individual buckets

      --track-spacing number
      sets how much time (in milliseconds) is padded between each track in a bucket

      --vibe-target number
      sets how weighted tracks included from linked repositories towards positive or negative vibes are

      --log-format [ human | jsonl ]
      sets the logging format

      --log-level [ debug | error | fatal | info | silent | trace | warn ]
      sets the logging level

      --quiet
      suppresses non-essential log output

      --verbose
      enables detailed debug log output

  -h, --help
  help for playlists generate

  -v, --version
  version for leafradio
```

Most of I highly recommend that you use a preset baseline profile to then customize with the algorithm parameters in the CLI options above as-needed. That way you can slowly ease yourself into customizing your playlists to your tastes. Each profile's settings can be found in [`lib/shared/playlist-packer/profiles.ts`](./lib/playlist-packer/profiles.ts) source code file along with their descriptions as comments. I highly recommend the Party Flow profile as a good starting point. It tries to create a dancable playlist that ebbs and flows throughout and uses harmonic mixing to create smooth key transitions over time.

Aside from mixing your playlists to taste, there are two other algorithm parameters I highly recommend you take a look at: number of buckets and target duration per-bucket. These two parameters _heavily_ affect how LeafRadio sorts through your tracks. Let's start with the number of buckets parameter as that is at the core of how LeafRadio handles playlist generation.

LeafRadio generates a single playlist as its final output artifact. However, the way that LeafRadio's algorithm sees it is that it generates a "macro playlist" made up of "micro playlists," or "buckets." The macro playlist is sorted through a macro energy (that is, arousal) curve that the buckets follow in their placement. Tracks are then pulled from your audio library and scored based on their suitability to the overall pacing of energy and mood (that is, valance). Along with the overall mood target and the bucket's computed mood target that influence that score. By controlling the number of bucket, you can create many independent windows along the macro energy curve to get a greater assortment of track selection that will have their own unique feel.

You can greatly tune that further by specifying the target duration per-bucket. This tells LeafRadio to try to greedily fill up individual buckets from the available track selection to that duration without going over. Again, greatly affects the generated playlist as now LeafRadio cannot just pick audio files without considering their impact on the bucket's duration.

> [!TIP]
> LeafRadio was inspired by me playing Animal Crossing. And in Animal Crossing each hour of the day has its own unique background music. The impetus of LeafRadio was to make this happen:
>
> ```
> leafradio playlists generate --number-of-buckets 24 --target-duration-per-bucket 3600000 /path/to/audio/library
> ```
>
> You can generate your own playlists where every hour has its own unique feel!

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
