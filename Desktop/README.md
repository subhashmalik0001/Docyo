# Docyo — Windows and Linux Desktop 0.2.0

This is a local-first cross-platform desktop edition of Docyo.
No account required, no telemetry, no cloud uploads, no background daemons.

## Install

- **Windows 10/11 x64:** Extract the entire Windows ZIP into a local folder. Run `Docyo.exe` inside it. Keep `_internal` alongside it. This trial build is unsigned; Windows SmartScreen may present an unknown publisher warning.
- **Linux x64:** Ubuntu 24.04 or compatible glibc 2.39+ desktop. Extract the `.tar.gz`, then execute `Docyo`. Standard desktop libraries (X11/Wayland, libegl1, libopengl0) are required. No root installation is needed.
- To uninstall, simply delete the extracted folder.
- You can verify package integrity with the companion `.sha256` checksum file.

## Features

Drop local files **into the app window**, or click **Add files**. Choose a target format and click **Convert files**. Files are processed sequentially; a failure on one item does not block other files.

- **Images:** PNG, JPEG, WebP, TIFF, and BMP output; PNG, JPEG, WebP, TIFF, BMP, and AVIF input. JPEG transparency is flattened against white. Supports maximum-dimension resizing and rotation. Animated images and multipage files are safely rejected instead of corrupting frames.
- **PDFs:** Image to PDF, merge multiple PDFs, split into single-page documents, and extract text.
- **Media:** Transcode MP4, WebM, MP3, WAV, FLAC, and OGG using a local, user-provided FFmpeg executable.
- **Utilities:** SRT to VTT and VTT to SRT subtitle conversion; SHA-256 cryptographic file checksums.

## Limits and Safety

- 100 files per batch, 100 MiB per input, 40 megapixels per image, 200 pages per PDF/merged result.
- Each conversion runs in an isolated subprocess worker with a hard execution timeout.
- Non-destructive processing: original input files are never overwritten or altered. Unique collision-resistant filenames are generated for all outputs.
- Atomic publication on the same filesystem ensures partially written files never overwrite existing files.

## Build and Test

Python 3.12+ recommended:

```sh
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m unittest discover -s tests -v
python app.py
```

Packaging:

```sh
python -m pip install pyinstaller==6.22.3
python package.py
```

Source: https://github.com/subhashmalik0001/Docyo/tree/main/Desktop  
License: GNU General Public License v3.0 (GPL-3.0-only). Dependencies retain their respective licenses.
