# Third-Party Notices

Docyo utilizes standard system frameworks and external open-source libraries under their respective licenses:

## Apple Frameworks

AppKit, SwiftUI, ImageIO, PDFKit, AVFoundation, CoreImage, CryptoKit, and related system frameworks are provided by macOS and are not redistributed separately.

---

## External Tools

- **FFmpeg:** FFmpeg is discovered on the user's local machine and executed as an external subprocess when needed. It is not bundled with Docyo. When installed, its build-specific LGPL or GPL licensing obligations apply.

---

## Windows & Linux Desktop Edition

The cross-platform Python and Qt desktop edition utilizes:
- **Pillow:** HPND license
- **pypdf:** BSD-3-Clause license
- **PySide6 / Shiboken6 / Qt:** LGPLv3 / GPLv3
- **Python:** PSF License
- **PyInstaller:** GPL with bootloader distribution exception

Exact version pins are recorded in `Desktop/requirements.txt`. Portable release packages include dependency license texts under `licenses/` and the exact corresponding application source under `source/`. Qt libraries remain dynamically linked.
