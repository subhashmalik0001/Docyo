# Contributing to Docyo

Thank you for your interest in contributing to **Docyo**! We welcome bug fixes, format enhancements, performance optimizations, and documentation improvements.

---

## Development Environment

### Native macOS Edition
- **OS:** macOS 26 or later
- **Toolchain:** Xcode 26 or compatible Apple Command Line Tools (`swiftc`, `codesign`, `plutil`)
- **Dependencies:** Direct Swift compilation (no SPM or external package dependencies required)
- **Optional Tools:** FFmpeg (`brew install ffmpeg`) for media transcoding validation

### Desktop Edition (Windows / Linux)
- **Runtime:** Python 3.12+
- **Libraries:** `PySide6`, `Pillow`, `pypdf`, `pyinstaller` (see `Desktop/requirements.txt`)

---

## Build and Test Workflow

Before opening a pull request, run the test suites to ensure zero regressions:

### 1. Native macOS Edition
```sh
# Run all Swift test suites
./scripts/test.sh

# Build the release app bundle
./scripts/build-app.sh
```

### 2. Desktop Edition (Python / Qt)
```sh
cd Desktop
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m unittest discover -s tests -v
```

### 3. Website & Documentation Validation
```sh
node scripts/test-site.cjs
node scripts/test-desktop-site.cjs
node scripts/test-demo.cjs
node scripts/test-analytics.cjs
```

---

## Engineering Guidelines

1. **Local-First & Privacy First:**
   - Never add cloud dependencies, external telemetry, network tracking, or account requirements.
   - Do not make external network requests without transparent user intent (e.g. checking manual updates).
2. **Non-Destructive File Operations:**
   - Always treat user inputs as immutable.
   - Always publish outputs using collision-avoiding atomic publication.
   - Stage intermediate results in temporary directories and ensure cleanup on failure or cancellation.
3. **UI Responsiveness & Thread Safety:**
   - Keep all heavy conversions, file I/O, and image decodes off the main UI thread.
   - Use structured concurrency (`Task.detached` with cancellation handling on macOS, QThread / worker subprocesses on Desktop).
4. **Security & Input Validation:**
   - Validate file paths, disallow unauthorized symlink escapes or directory traversals.
   - Pass literal argument arrays to child processes (`Process` / `subprocess.run`); never invoke shell string interpreters (`sh -c`).
5. **Licensing & Provenance:**
   - All code contributions are licensed under GNU General Public License v3.0 (GPL-3.0-only).
   - Use the Developer Certificate of Origin (`git commit -s`).

---

## Pull Request Process

1. Fork `https://github.com/subhashmalik0001/Docyo.git`.
2. Create a topic branch: `git checkout -b feature/my-feature`.
3. Add automated tests for any new conversion routes, tools, or bug fixes.
4. Verify all tests pass locally.
5. Push to your fork and submit a Pull Request to `main`.
