# Docyo

A fast, local-first file converter, media processor, and document toolkit for **macOS**, with an early **Windows/Linux desktop edition**.

Private, offline, non-destructive file conversions right where your files live. No accounts, no cloud uploads, no subscriptions.

[![macOS build and tests](https://github.com/subhashmalik0001/Docyo/actions/workflows/build.yml/badge.svg)](https://github.com/subhashmalik0001/Docyo/actions/workflows/build.yml)
[![Windows and Linux desktop](https://github.com/subhashmalik0001/Docyo/actions/workflows/desktop.yml/badge.svg)](https://github.com/subhashmalik0001/Docyo/actions/workflows/desktop.yml)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)

---

## Key Features

- **Gesture-Driven Radial Menu (macOS):** Select files, hold `Shift` while dragging, and drop onto the radial wheel to convert instantly.
- **Notch Companion & Progress HUD:** Subtle, unobtrusive progress indicator expanding from your MacBook notch or menu bar. Pure black or native macOS glass material.
- **Broad Format Conversion:**
  - **Images:** PNG, JPEG, WebP, HEIC, AVIF, TIFF, BMP (with resizing, aspect-ratio framing, and rotation). Built-in lossless WebP engine without external library requirements.
  - **Documents & PDFs:** PDF merge, split by page or range, compress, OCR text extraction, and export to DOCX.
  - **Audio & Video:** Transcode MP4, WebM, MP3, WAV, FLAC, OGG, and trim media clips with frame accuracy using optional local FFmpeg.
  - **Subtitles:** Bidirectional SRT ↔ VTT parsing and timing adjustment.
- **Local-First & Privacy Guaranteed:** All files stay on your machine. Zero cloud processing, zero telemetry, zero trackers.
- **Non-Destructive Batch Operations:** Originals are never modified or deleted. Collision-resistant unique filenames are generated automatically (`image-converted-1.jpg`).
- **Cross-Platform Desktop Edition:** Lightweight Qt-based desktop converter for Windows and Linux with process-isolated workers.

---

## Platform Support

| Feature | macOS Native (`NativeApp/`) | Windows & Linux Desktop (`Desktop/`) |
| :--- | :--- | :--- |
| **Operating System** | macOS 26.0+ (Apple Silicon & Intel) | Windows 10/11 x64, Ubuntu 24.04+ (glibc 2.39+) |
| **Interface** | Menu-bar status item, global Shift-drag radial HUD | Batch file-drop window & progress panel |
| **Image Conversion** | PNG, JPEG, WebP, HEIC, AVIF, TIFF, BMP | PNG, JPEG, WebP, TIFF, BMP |
| **PDF Operations** | Merge, split, compress, Vision OCR, DOCX | Merge, split, text extraction, images-to-PDF |
| **Media Transcoding**| AVFoundation native + optional FFmpeg | Optional local FFmpeg |
| **Subtitles & Hash** | SRT ↔ VTT, SHA-256 | SRT ↔ VTT, SHA-256 |
| **System Notch HUD** | Yes (Pure Black & Glass styles) | N/A (in-window progress) |

---

## Installation

### macOS
1. Download `Docyo-macOS.zip` from [GitHub Releases](https://github.com/subhashmalik0001/Docyo/releases).
2. Unzip and drag `Docyo.app` into your `/Applications` folder.
3. Open `Docyo`. The app runs quietly in your menu bar.
4. *(Optional)* To enable media transcoding routes (e.g. WebM, OGG), install FFmpeg via Homebrew:
   ```bash
   brew install ffmpeg
   ```
   *Note: Because pre-built binaries are currently ad-hoc signed, macOS Gatekeeper may prompt you on first launch. See [System Settings → Privacy & Security] to approve.*

### Windows & Linux Portable Desktop
1. Download `Docyo-0.2.0-Windows-x64.zip` or `Docyo-0.2.0-Linux-x64.tar.gz` from [GitHub Releases](https://github.com/subhashmalik0001/Docyo/releases).
2. Extract the archive into any local folder.
3. Run `Docyo.exe` (Windows) or `./Docyo` (Linux).
4. Drag files into the window, pick a destination format, and click **Convert files**.

---

## Building from Source

### macOS Native Application
Requires macOS 26.0+ with Xcode 26 or compatible Command Line Tools. Builds with Apple's Swift compiler directly (no package manager dependencies):

```bash
git clone https://github.com/subhashmalik0001/Docyo.git
cd Docyo

# Compile and package Docyo.app into dist/
./scripts/build-app.sh

# Run the compiled application
open "dist/Docyo.app"
```

### Desktop Python Application
Requires Python 3.12+:

```bash
cd Desktop
python3 -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

See [docs/BUILDING.md](docs/BUILDING.md) for packaging instructions.

---

## Testing

```bash
# Run all 8 macOS Swift test suites (Image, PDF, Document, Batch, Interaction, Tools)
./scripts/test.sh

# Run Desktop Python unit tests
cd Desktop && python -m unittest discover -s tests -v

# Run documentation, link, and website test scripts
node scripts/test-site.cjs
node scripts/test-desktop-site.cjs
node scripts/test-demo.cjs
node scripts/test-analytics.cjs
```

---

## Architecture

Docyo decouples user interactions from computational workloads to ensure smooth UI responsiveness:
- **Detached Concurrency:** File transformations execute in `Task.detached` background workers off the main AppKit thread.
- **Process Isolation:** The Desktop edition executes jobs in isolated subprocess workers with hard execution deadlines and timeouts.
- **Atomic File Publication:** All outputs stage in temporary folders before moving atomically to destination folders, preventing incomplete file generation.

Read the detailed design in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## Privacy & Security Guarantees

- **100% Local:** No cloud servers, no account logins, no document uploads.
- **Non-Destructive:** Original files are never modified in place or deleted.
- **No Telemetry:** The application contains zero trackers, crash uploaders, or advertising libraries.
- **Shell-Safe:** External binaries (like FFmpeg) are executed with explicit argument arrays—never shell commands.
- **Safe Archives:** Path-traversal checks prevent zip-slip vulnerabilities during archive processing.

Review our full [SECURITY.md](SECURITY.md) policy.

---

## Known Limitations

- **Apple Notarization:** Current developer builds are ad-hoc signed and require first-time manual launch authorization in macOS Privacy & Security.
- **FFmpeg Integration:** Certain audio/video codecs (e.g. FLAC, WebM, OGG) require a user-provided FFmpeg installation in PATH or configured in Settings.
- **Office Files:** Word support is currently limited to DOCX export from images and PDFs, not two-way document editing.

---

## License & Provenance

Docyo is licensed under the **GNU General Public License v3.0 (GPL-3.0-only)**. See [LICENSE](LICENSE).

- **Third-Party Libraries:** See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for licensing information for external dependencies.

Authored and maintained by **Subhash Malik** ([@subhashmalik0001](https://github.com/subhashmalik0001)).
