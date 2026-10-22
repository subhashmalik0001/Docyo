# Docyo Architecture & System Design

## 1. Overview

**Docyo** is a local-first, privacy-respecting file converter and productivity utility. It provides two complementary implementations:

1. **Native macOS Application (`NativeApp/`):** A gesture-driven menu-bar and radial HUD utility written in Swift, utilizing AppKit, SwiftUI, CoreGraphics, ImageIO, PDFKit, AVFoundation, and Vision.
2. **Cross-Platform Desktop Application (`Desktop/`):** A window-based batch converter implemented in Python using PySide6 (Qt 6), Pillow, and pypdf.

Both editions share identical core design values: **local-only processing, non-destructive file operations, collision-resistant output generation, and zero background telemetry.**

---

## 2. macOS Native Architecture

```
                      +-------------------+
                      |   DocyoApp (@main)|
                      +---------+---------+
                                |
                    +-----------v-----------+
                    |      AppDelegate      |
                    +-----+-----------+-----+
                          |           |
            +-------------v-+       +-v-------------+
            |  DragMonitor  |       | NSStatusItem  |
            +-------+-------+       +---------------+
                    | (global Shift-drag / hotkey)
            +-------v----------+
            | RadialController |
            +-------+----------+
                    |
      +-------------v-------------+
      | RadialPanel / RadialView  |  (Vector-rendered circular HUD)
      +-------------+-------------+
                    | (Format selection / action)
            +-------v-------+
            |   JobRunner   |  (Asynchronous queue & detached tasks)
            +-------+-------+
                    |
     +--------------+--------------+---------------+
     |              |              |               |
+----v-----+  +-----v------+ +-----v------+ +------v-----+
|ImageEngine| |DocumentEngine| |AVExporter | |ArchiveEngine|
+----+-----+  +-----+------+ +-----+------+ +------+-----+
     |              |              |               |
+----v-----+  +-----v------+ +-----v------+ +------v-----+
| ImageIO  |  |   PDFKit   | |AVFoundation| | FileManager|
|CoreImage |  | Vision OCR | |  (FFmpeg)  | |  (Unzip)   |
+----+-----+  +-----+------+ +-----+------+ +------+-----+
     |              |              |               |
     +--------------+--------------+---------------+
                            |
                 +----------v----------+
                 |   Atomic Publish    |  (Output destination)
                 +---------------------+
```

### 2.1 Core Subsystems

- **App Lifecycle & Settings (`NativeApp/Sources/App/`):**
  - `AppDelegate.swift`: Coordinates accessory app launch, menu bar item, settings window, and file-open events.
  - `AppSettings.swift`: Observable settings manager storing user preferences (`UserDefaults`), login items registration (`SMAppService`), and appearance modes.
  - `SettingsView.swift`: Modern SwiftUI navigation sidebar for General settings, Appearance, Formats, and About info.
  - `UpdateChecker.swift`: Performs polite, on-demand or periodic release checks against GitHub without transmitting user identifiers or document data.

- **Gesture & Radial Controller (`NativeApp/Sources/Radial/`):**
  - `DragMonitor.swift`: Monitors global mouse drags and Shift-key holds using `NSEvent.addGlobalMonitorForEvents` and local monitors.
  - `RadialController.swift`: Positions and activates the HUD overlay on the screen containing the mouse cursor.
  - `RadialView.swift`: Custom vector-drawn circular menu presenting available target formats for dropped files. Constrains hit-testing to the wheel radius to avoid intercepting external clicks.

- **Asynchronous Execution & Concurrency (`NativeApp/Sources/Core/`):**
  - `JobRunner.swift`: Manages batch queues. Conversions execute inside `Task.detached(priority: .userInitiated)` with cooperative cancellation handlers. This guarantees the main thread and AppKit run loop remain fluid even when processing massive images or encoding video.
  - `DiagnosticLog.swift`: Thread-safe, opt-in diagnostic logger enabled via `DOCYO_DEBUG=1`.

- **Processing Engines (`NativeApp/Sources/Engines/`):**
  - `ImageEngine.swift`: High-performance image conversion using `CGImageSource` and `CGImageDestination`. Includes built-in lossless WebP fallback (`WebPLossless.swift`) when system encoders lack WebP support.
  - `DocumentEngine.swift`: PDF operations, text extraction, page splitting, merging, and Vision-based OCR.
  - `DocxWriter.swift`: Native XML generator producing OpenXML `.docx` files without external office suites.
  - `AVExporter.swift`: Audio and video transcoding via `AVAssetExportSession` and sample buffer writers.
  - `FFmpeg.swift`: Safe external CLI wrapper executing locally installed FFmpeg with argument vectors (no shell execution).
  - `ArchiveEngine.swift`: Zip archive extraction with strict path-traversal sanitization.

- **Operations & Interactive Tools (`NativeApp/Sources/Operations/` & `NativeApp/Sources/Tools/`):**
  - Redaction, cropping, framing, color adjustment, metadata stripping, collage creation, and audio trimming.

---

## 3. Cross-Platform Desktop Architecture

```
+-----------------------------------------------------------+
|                      PySide6 Window                       |
|   - DropList (drag & drop queue)                          |
|   - Format / Option Selectors (width, rotation, output)   |
|   - Progress Bar & Watchdog Timer                         |
+-----------------------------+-----------------------------+
                              |
                     +--------v--------+
                     |  Batch QThread  |
                     +--------+--------+
                              |
                    +---------v---------+
                    |     runner.py     | (Subprocess worker wrapper)
                    +---------+---------+
                              |
                    +---------v---------+
                    |     engine.py     |
                    +---------+---------+
                              |
         +--------------------+--------------------+
         |                    |                    |
   +-----v------+       +-----v------+       +-----v------+
   |   Pillow   |       |   pypdf    |       |   FFmpeg   |
   |  (Images)  |       |   (PDFs)   |       |  (Media)   |
   +------------+       +------------+       +------------+
```

### 3.1 Design Principles in Desktop Edition

- **UI Isolation:** Long-running conversions run inside a background `QThread`. A watchdog timer monitors process health to prevent UI deadlocks.
- **Worker Subprocesses:** Conversions invoke `python -m runner` or worker CLI commands with structured JSON input/output, ensuring memory leaks or worker crashes cannot crash the main application.
- **Safe Path Publishing:** Output files are staged into temporary directories (`.docyo-*`) and published atomically using exclusive filesystem operations.

---

## 4. Safety & Privacy Architecture

1. **No External Network Calls for Processing:** File data never leaves the local machine.
2. **Immutable Inputs:** Input files are opened read-only.
3. **Collision Resistance:** Target filenames are dynamically generated (`base-converted.ext`, `base-converted-2.ext`) to avoid accidental overwrites.
4. **Shell Injection Prevention:** All subprocesses are invoked with vector arguments (`[executable, arg1, arg2]`), never through shell string interpreters (`/bin/sh -c`).
5. **Path Traversal Guards:** Archives and output targets are verified against `canonicalPath` / `resolve()` to ensure outputs cannot escape the specified directory.
