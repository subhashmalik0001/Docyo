# Changelog

All notable changes to **Docyo** are documented in this file.
This project follows [Semantic Versioning](https://semver.org/).

---

## [0.2.0] - 2026-10-22

### Rebranding & Identity
- **Product Identity:** Rebranded project from Open Tangerine to **Docyo** (`https://github.com/subhashmalik0001/Docyo.git`).
- **Design System:** Introduced Docyo cobalt-indigo design aesthetic, updated brand mark, vector AppIcon, and template menu-bar iconography.
- **Bundle ID:** Updated to `com.docyo.app`.

### Performance & Stability
- **Detached Background Execution:** Offloaded long-running conversion jobs in `JobRunner` to `Task.detached(priority: .userInitiated)` with cooperative cancellation handlers. Resolves main-thread lockups and UI/mouse freezing during intensive file processing.
- **Radial Hit-Testing:** Constrained `RadialView` hit-testing to the circular geometry radius, preventing full-screen click interception.
- **Outside Click Handling:** Added local and global mouse monitors in `RadialController` for immediate dismissal on outside clicks.
- **Desktop Watchdog:** Added recovery watchdog timer in `Desktop/app.py` to ensure UI state cleanly recovers if worker threads terminate unexpectedly.

### Cross-Platform Desktop
- **Standalone Packaging:** Enhanced PyInstaller packaging script in `Desktop/package.py` to generate portable zip and tar.gz distributions with full source and licenses embedded.
- **Temporary File Sanitization:** Replaced working directory prefix with `.docyo-` for atomic staging and cleanup.

### Licensing & Documentation
- Consolidated project licensing under GPL-3.0-only.
- Added comprehensive documentation: `docs/ARCHITECTURE.md`, `docs/BUILDING.md`, `SECURITY.md`, and updated `CONTRIBUTING.md`.

---

## [0.1.9] - 2026-10-20
- Added per-application exclusions in Settings to disable drag shortcuts in specified apps (e.g. CorelDRAW).
- Added continuous hover highlighting on radial wheel segments.
- Improved notch result dismissal: successful jobs dismiss after 2 seconds even while hovered.

---

## [0.1.8] - 2026-10-18
- Added optional **Glass** notch material alongside default Pure Black.
- Added spring animations for wheel selection, respecting macOS Reduce Motion settings.
- Added "Show in Finder" and "Open" actions for completed job results.

---

## [0.1.7] - 2026-10-16
- Refined notch panel layout with solid backing.
- Reopening interrupted dismissals safely.

---

## [0.1.6] - 2026-10-14
- Built-in lossless WebP fallback for systems lacking `libwebp` in FFmpeg.
- Collision resistance across overlapping batch conversion requests.
- Fixed PDF/DOCX page ordering and rotation preservation.
