# Docyo — Windows and Linux Desktop 0.2.0

This is the local-first cross-platform desktop edition of **Docyo**, featuring the **Interactive Radial Converter Wheel**, **Floating Companion Wheel**, and the **3D Grape Penguin Vinyl Toy Avatar**.
No account required, no telemetry, no cloud uploads, no background daemons.

## Install & Run on Windows

1. Download `Docyo-0.2.0-Windows-x64.zip`.
2. Extract the entire ZIP into a folder of your choice.
3. Double-click `Docyo.exe`.
   - **Windows SmartScreen Security Note:** Because this open-source build is unsigned, Windows may display *"Windows protected your PC"* or *"Unknown publisher"*.
   - Click **More info** → **Run anyway**.
   - Docyo runs 100% locally on your machine with zero cloud connectivity.
4. Keep the `_internal/` directory alongside `Docyo.exe`.
5. To uninstall, simply delete the extracted folder.

## Opening & Converting Files on Windows

You can open files with Docyo in any of these quick ways:
- **Drag onto Docyo.exe:** Drag any file or group of files directly onto the `Docyo.exe` icon in Windows File Explorer. Docyo launches immediately with the **Radial Converter Wheel** loaded and ready.
- **Right-Click "Open With":** Right-click any file in Windows Explorer → **Open with** → Choose **Docyo.exe**.
- **Windows Explorer Right-Click Menu:** Click **📌 Explorer Menu** in the Docyo header to add *"Convert with Docyo Wheel"* and *"Send to → Docyo"* to your Windows right-click menu.
- **In-App Drag & Drop:** Drop files directly onto the wheel inside the app, or onto the **🎡 Floating Wheel** anywhere on your desktop.
- **⚡ Instant Conversion:** With your file loaded, simply click any format wedge on the wheel (`PNG`, `JPEG`, `WEBP`, `PDF`, `Merge PDFs`, `MP4`, `MP3`, `Extract text`) to instantly convert it to that format!

## Key Features

- **Interactive Radial Converter Wheel:** Drop files directly onto any format wedge (PNG, JPEG, WEBP, PDF, Merge PDFs, MP4, MP3, Extract text) for instant conversion, or click any wedge to select that target format.
- **Floating Companion Wheel:** Click **🎡 Floating Wheel** in the header to summon a transparent, always-on-top desktop companion wheel. Move it anywhere on your desktop and drag files from File Explorer directly onto it.
- **3D Avatar Studio:** Click **🌟 3D Avatar** in the header or the center avatar disc to launch the hardware-accelerated 3D Grape Penguin Vinyl Toy studio in your default browser with real-time 360° mouse tracking.
- **Batch Queue View:** Switch to the **📋 Batch Queue** tab for detailed file lists, output destination tracking, and batch status.
- **Images:** PNG, JPEG, WebP, TIFF, and BMP output; PNG, JPEG, WebP, TIFF, BMP, and AVIF input. JPEG transparency is flattened against white. Supports maximum-dimension resizing and rotation. Animated images and multipage files are safely rejected instead of corrupting frames.
- **PDFs:** Image to PDF, merge multiple PDFs, split into single-page documents, and extract text.
- **Media:** Transcode MP4, WebM, MP3, WAV, FLAC, and OGG using a local, user-provided FFmpeg executable.
- **Utilities:** SRT to VTT and VTT to SRT subtitle conversion; SHA-256 cryptographic file checksums.

## Limits and Safety

- 100 files per batch, 100 MiB per input, 40 megapixels per image, 200 pages per PDF/merged result.
- Each conversion runs in an isolated subprocess worker with a hard execution timeout.
- Non-destructive processing: original input files are never overwritten or altered. Unique collision-resistant filenames are generated for all outputs.
- Atomic publication on the same filesystem ensures partially written files never overwrite existing files.

## Build and Test Locally

Python 3.12+ recommended:

```sh
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
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
