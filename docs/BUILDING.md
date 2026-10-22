# Building and Packaging Docyo

This guide covers building, testing, and packaging **Docyo** for macOS, Windows, and Linux.

---

## 1. Native macOS Edition

### Prerequisites
- macOS 26.0 or later (Apple Silicon or Intel)
- Xcode 26.0 or Apple Command Line Tools
- `git`
- *(Optional)* FFmpeg: `brew install ffmpeg`

### Building from Source

The native macOS application is compiled directly using Apple's Swift compiler (`swiftc`) without external package managers:

```bash
# Clone the repository
git clone https://github.com/subhashmalik0001/Docyo.git
cd Docyo

# Compile and package Docyo.app into dist/
./scripts/build-app.sh

# Launch the built application
open "dist/Docyo.app"
```

The build script performs the following steps:
1. Compiles all Swift source files under `NativeApp/Sources/` with `-O -parse-as-library`.
2. Generates the application `Info.plist` with bundle ID `com.docyo.app`.
3. Compiles `BrandArtwork.swift` and `scripts/make-icon.swift` to render multi-resolution PNGs into `.build/AppIcon.iconset`.
4. Packages the icons into `AppIcon.icns` via `scripts/package-icon.py`.
5. Embeds required open-source license notices into `Contents/Resources/`.
6. Ad-hoc codesigns the `.app` bundle and verifies bundle structure using `codesign --verify` and `plutil -lint`.

### Running Tests

```bash
# Runs all 8 macOS Swift test suites
./scripts/test.sh
```

---

## 2. Desktop Edition (Windows & Linux)

### Prerequisites
- Python 3.12 or later
- `pip`
- On Linux (Ubuntu 24.04+): `sudo apt-get install libegl1 libopengl0 libxcb-cursor0 libxkbcommon-x11-0 ffmpeg`
- On Windows: Python 3.12+ (64-bit)

### Setup & Running Locally

```bash
cd Desktop

# Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate       # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the test suite
python -m unittest discover -s tests -v

# Launch the desktop UI
python app.py
```

### Packaging Standalone Binaries

Docyo uses PyInstaller to generate portable, single-folder application bundles:

```bash
cd Desktop
pip install pyinstaller==6.22.3

# Build standalone distribution
python package.py

# Run packaged smoke test
python smoke_package.py
```

This creates:
- `dist/Docyo/`: Extracted portable application folder.
- `dist/Docyo-0.2.0-[Platform]-x64.zip` (or `.tar.gz` on Linux).
- `dist/Docyo-0.2.0-[Platform]-x64.[ext].sha256`: Cryptographic checksum file.

---

## 3. Website & Documentation Tests

Validate documentation links, release asset paths, and canonical schemas:

```bash
node scripts/test-site.cjs
node scripts/test-desktop-site.cjs
node scripts/test-demo.cjs
node scripts/test-analytics.cjs
```
