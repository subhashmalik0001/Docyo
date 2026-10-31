export type PlatformKey = "macos" | "windows" | "linux";

export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function assetUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_PATH}${normalized}`;
}

function resolveSiteUrl(): string {
  const candidate =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "") ||
    process.env.URL ||
    process.env.CF_PAGES_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    (process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://subhashmalik0001.github.io/Docyo");

  const withProtocol = /^https?:\/\//i.test(candidate)
    ? candidate
    : `https://${candidate}`;
  return withProtocol.replace(/\/+$/, "");
}

const RESOLVED_SITE_URL = resolveSiteUrl();

export const SITE_CONFIG = {
  name: "Docyo",
  tagline: "Drag. Hold Shift. Convert.",
  url: RESOLVED_SITE_URL,
  ogImageUrl: `${RESOLVED_SITE_URL}/og-image.png?v=0.2.0`,
  description:
    "Private, offline file converter, media processor, and 25-tool document toolkit for macOS, with an early Windows and Linux desktop edition. Zero cloud uploads, zero accounts, zero telemetry.",
  author: {
    name: "Subhash Malik",
    github: "https://github.com/subhashmalik0001",
  },
  repoUrl: "https://github.com/subhashmalik0001/Docyo",
  license: "GPL-3.0",
  licenseUrl: "https://github.com/subhashmalik0001/Docyo/blob/main/LICENSE",
} as const;

/**
 * Single configuration object for version numbers, release URLs, and asset filenames.
 * Update version, sizes, or direct asset URLs here when publishing a new release.
 */
export const DOWNLOAD_CONFIG = {
  version: "0.2.0",
  launchVideoUrl: assetUrl("/docyo-launch.mp4"),
  launchVideoFilename: "Docyo-Launch-Video.mp4",
  releasesLatestUrl: "https://github.com/subhashmalik0001/Docyo/releases/latest",
  allReleasesUrl: "https://github.com/subhashmalik0001/Docyo/releases",
  ffmpegCommand: "brew install ffmpeg",
  macQuarantineCommand: "xattr -cr /Applications/Docyo.app",
  platforms: {
    macos: {
      key: "macos" as const,
      name: "macOS",
      edition: "Native Menu-Bar & Notch App",
      badge: "Apple Silicon & Intel",
      osRequirement: "macOS 26.0+",
      assetName: "Docyo-macOS.dmg",
      size: "5.4 MB",
      downloadUrl: assetUrl("/downloads/Docyo-macOS.dmg"),
      steps: [
        "Open Docyo-macOS.dmg and drag Docyo.app into Applications.",
        "Open Docyo from Applications — if macOS says “Apple could not verify Docyo”, click Done (not Move to Trash).",
        "Go to System Settings → Privacy & Security, scroll down, and click Open Anyway once.",
        "Docyo now launches cleanly and stays ready in your menu bar.",
      ],
    },
    windows: {
      key: "windows" as const,
      name: "Windows",
      edition: "Portable Desktop & Tray Edition",
      badge: "Windows 10 / 11 x64",
      osRequirement: "64-bit Windows 10 or 11",
      assetName: "Docyo-0.2.0-Windows-x64.zip",
      size: "53.7 MB",
      downloadUrl:
        "https://github.com/subhashmalik0001/Docyo/releases/download/desktop-v0.2.0/Docyo-0.2.0-Windows-x64.zip",
      steps: [
        "Extract the entire ZIP archive to a local folder (keep _internal beside Docyo.exe).",
        "Run Docyo.exe — no administrator installer required.",
        "Docyo stays ready in the system tray for instant wheel or batch conversions.",
      ],
    },
    linux: {
      key: "linux" as const,
      name: "Linux x64",
      edition: "Portable Desktop Archive",
      badge: "Ubuntu 24.04+ · glibc 2.39+",
      osRequirement: "x64 Linux with X11 / Wayland",
      assetName: "Docyo-0.2.0-Linux-x64.tar.gz",
      size: "77.7 MB",
      downloadUrl:
        "https://github.com/subhashmalik0001/Docyo/releases/download/desktop-v0.2.0/Docyo-0.2.0-Linux-x64.tar.gz",
      steps: [
        "Extract Docyo-0.2.0-Linux-x64.tar.gz and run ./Docyo.",
      ],
    },
  },
} as const;

export const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Formats", href: "#formats" },
  { label: "Tools", href: "#tools" },
  { label: "Privacy", href: "#privacy" },
  { label: "Download", href: "#download" },
] as const;

export type CompanionPhase =
  | "watching"
  | "received"
  | "processing"
  | "delivering"
  | "success"
  | "failed"
  | "cancelled";

export const COMPANION_CAPTIONS: Record<CompanionPhase, string> = {
  watching: "Choose a format — I’m ready",
  received: "Got it!",
  processing: "Making it happen…",
  delivering: "Here you go…",
  success: "Done. Your file is ready.",
  failed: "Something needs a look.",
  cancelled: "Stopped. Your original is safe.",
};

export type WheelMode = "convert" | "tools" | "actions";

export interface DemoFileSpec {
  id: "photo" | "report" | "clip";
  name: string;
  stem: string;
  ext: string;
  size: string;
  meta: string;
  kind: "image" | "pdf" | "video";
  convertTargets: { label: string; ext: string; outSize: string }[];
  toolTargets: { label: string; detail: string; suffix: string; ext: string }[];
}

export const DEMO_FILES: DemoFileSpec[] = [
  {
    id: "photo",
    name: "photo.heic",
    stem: "photo",
    ext: "HEIC",
    size: "4.2 MB",
    meta: "4032 × 3024",
    kind: "image",
    convertTargets: [
      { label: "PNG", ext: "png", outSize: "6.1 MB" },
      { label: "JPEG", ext: "jpg", outSize: "1.8 MB" },
      { label: "WEBP", ext: "webp", outSize: "1.1 MB" },
      { label: "AVIF", ext: "avif", outSize: "890 KB" },
      { label: "PDF", ext: "pdf", outSize: "2.4 MB" },
      { label: "TIFF", ext: "tiff", outSize: "9.4 MB" },
    ],
    toolTargets: [
      { label: "RESIZE", detail: "Resize images", suffix: "resized", ext: "heic" },
      { label: "CROP", detail: "Crop image", suffix: "cropped", ext: "heic" },
      { label: "COMPRESS", detail: "Compress", suffix: "compressed", ext: "jpg" },
      { label: "REDACT", detail: "Redact photo", suffix: "redacted", ext: "png" },
      { label: "ROTATE", detail: "Rotate & flip", suffix: "rotated", ext: "heic" },
      { label: "METADATA", detail: "Edit metadata", suffix: "clean", ext: "heic" },
    ],
  },
  {
    id: "report",
    name: "report.pdf",
    stem: "report",
    ext: "PDF",
    size: "12.8 MB",
    meta: "18 pages",
    kind: "pdf",
    convertTargets: [
      { label: "DOCX", ext: "docx", outSize: "3.4 MB" },
      { label: "PNG", ext: "png", outSize: "5.2 MB" },
      { label: "JPEG", ext: "jpg", outSize: "2.9 MB" },
      { label: "TXT", ext: "txt", outSize: "84 KB" },
    ],
    toolTargets: [
      { label: "COMPRESS", detail: "Compress PDF", suffix: "compressed", ext: "pdf" },
      { label: "SPLIT", detail: "Split PDF", suffix: "p1-6", ext: "pdf" },
      { label: "MERGE", detail: "Merge PDFs", suffix: "merged", ext: "pdf" },
      { label: "ORGANIZE", detail: "Organize pages", suffix: "ordered", ext: "pdf" },
      { label: "METADATA", detail: "Strip metadata", suffix: "clean", ext: "pdf" },
    ],
  },
  {
    id: "clip",
    name: "clip.mov",
    stem: "clip",
    ext: "MOV",
    size: "38.4 MB",
    meta: "00:24 · 60fps",
    kind: "video",
    convertTargets: [
      { label: "MP4", ext: "mp4", outSize: "14.2 MB" },
      { label: "WEBM", ext: "webm", outSize: "11.6 MB" },
      { label: "MP3", ext: "mp3", outSize: "640 KB" },
      { label: "GIF", ext: "gif", outSize: "4.8 MB" },
      { label: "WAV", ext: "wav", outSize: "4.1 MB" },
    ],
    toolTargets: [
      { label: "TRIM", detail: "Trim video", suffix: "trimmed", ext: "mov" },
      { label: "CROP", detail: "Crop video", suffix: "cropped", ext: "mp4" },
      { label: "SPEED", detail: "Change speed", suffix: "2x", ext: "mp4" },
      { label: "FRAMES", detail: "Save snapshots", suffix: "frame-01", ext: "png" },
      { label: "COMPRESS", detail: "Compress video", suffix: "compressed", ext: "mp4" },
      { label: "REDACT", detail: "Redact video", suffix: "redacted", ext: "mp4" },
    ],
  },
];

export const FILE_ACTION_TARGETS = [
  { label: "DUPLICATE", detail: "Duplicate beside original", resultSuffix: "copy" },
  { label: "COPY PATH", detail: "Copy POSIX path", resultSuffix: "path copied" },
  { label: "SHA-256", detail: "Compute cryptographic hash", resultSuffix: "e3b0c44…98fc" },
  { label: "COPY FILE", detail: "Copy file to clipboard", resultSuffix: "in clipboard" },
  { label: "REVEAL", detail: "Reveal in Finder", resultSuffix: "revealed" },
] as const;

export const TRUST_ITEMS = [
  {
    icon: "userOff" as const,
    title: "No accounts.",
    detail: "No sign-up wall, license key, or trial countdown.",
  },
  {
    icon: "cloudOff" as const,
    title: "No uploads.",
    detail: "Every byte is decoded and written on your own disk.",
  },
  {
    icon: "eyeOff" as const,
    title: "No telemetry.",
    detail: "Zero analytics SDKs, crash beacons, or usage pings.",
  },
  {
    icon: "shieldLock" as const,
    title: "Originals never touched.",
    detail: "Source files stay read-only; outputs get collision-safe names.",
  },
] as const;

export interface FormatCategorySpec {
  id: "images" | "documents" | "audio" | "video" | "subtitles";
  label: string;
  engineNote: string;
  routeCount: number;
  inputs: string[];
  outputs: string[];
  operations: string[];
  routes: Record<string, string[]>;
}

export const FORMAT_CATEGORIES: FormatCategorySpec[] = [
  {
    id: "images",
    label: "Images",
    engineNote: "CoreGraphics / ImageIO + built-in lossless WebP encoder",
    routeCount: 65,
    inputs: ["HEIC", "PNG", "JPEG", "WEBP", "AVIF", "TIFF", "BMP", "SVG"],
    outputs: ["PNG", "JPEG", "WEBP", "HEIC", "AVIF", "TIFF", "BMP", "PDF", "DOCX"],
    operations: ["Resize", "Aspect frame", "Rotate & flip", "Crop", "Redact", "Collage"],
    routes: {
      HEIC: ["PNG", "JPEG", "WEBP", "AVIF", "TIFF", "BMP", "PDF"],
      PNG: ["JPEG", "WEBP", "HEIC", "AVIF", "TIFF", "BMP", "PDF", "DOCX"],
      JPEG: ["PNG", "WEBP", "HEIC", "AVIF", "TIFF", "BMP", "PDF", "DOCX"],
      WEBP: ["PNG", "JPEG", "HEIC", "AVIF", "TIFF", "BMP", "PDF"],
      AVIF: ["PNG", "JPEG", "WEBP", "HEIC", "TIFF", "BMP", "PDF"],
      TIFF: ["PNG", "JPEG", "WEBP", "HEIC", "AVIF", "BMP", "PDF"],
      BMP: ["PNG", "JPEG", "WEBP", "HEIC", "AVIF", "TIFF", "PDF"],
      SVG: ["PNG", "JPEG", "WEBP", "HEIC", "AVIF", "TIFF", "BMP", "PDF"],
    },
  },
  {
    id: "documents",
    label: "Documents",
    engineNote: "PDFKit + native document & OCR text pipeline",
    routeCount: 14,
    inputs: ["PDF", "TXT", "PNG", "JPEG"],
    outputs: ["PDF", "DOCX", "TXT", "PNG", "JPEG"],
    operations: ["Merge PDFs", "Split by page or range", "Compress", "OCR & text extract", "Export to DOCX"],
    routes: {
      PDF: ["DOCX", "PNG", "JPEG", "TXT"],
      TXT: ["PDF", "PNG", "JPEG"],
      PNG: ["PDF", "DOCX"],
      JPEG: ["PDF", "DOCX"],
    },
  },
  {
    id: "video",
    label: "Video",
    engineNote: "Apple AVFoundation + optional local FFmpeg",
    routeCount: 41,
    inputs: ["MOV", "MP4", "WEBM", "MKV", "AVI", "WMV", "GIF"],
    outputs: ["MP4", "WEBM", "MOV", "MKV", "GIF", "MP3", "WAV"],
    operations: ["Frame-accurate trim", "Crop viewport", "Speed", "Join clips", "Save frames", "Redact"],
    routes: {
      MOV: ["MP4", "WEBM", "MKV", "GIF", "MP3", "WAV"],
      MP4: ["WEBM", "MOV", "MKV", "GIF", "MP3", "WAV"],
      WEBM: ["MP4", "MOV", "MKV", "GIF", "MP3"],
      MKV: ["MP4", "WEBM", "MOV", "GIF", "MP3"],
      AVI: ["MP4", "WEBM", "MOV", "GIF", "MP3"],
      WMV: ["MP4", "WEBM", "MOV", "GIF", "MP3"],
      GIF: ["MP4", "WEBM", "MOV"],
    },
  },
  {
    id: "audio",
    label: "Audio",
    engineNote: "AVAudioEngine + optional local FFmpeg codecs",
    routeCount: 52,
    inputs: ["MP3", "WAV", "FLAC", "OGG", "M4A", "OPUS", "AIFF", "WMA"],
    outputs: ["MP3", "WAV", "FLAC", "OGG", "M4A", "OPUS", "AIFF"],
    operations: ["Normalize loudness", "Trim waveform", "Stereo / Mono", "Bleep span", "Waveform video"],
    routes: {
      MP3: ["WAV", "FLAC", "OGG", "M4A", "OPUS", "AIFF"],
      WAV: ["MP3", "FLAC", "OGG", "M4A", "OPUS", "AIFF"],
      FLAC: ["MP3", "WAV", "OGG", "M4A", "OPUS", "AIFF"],
      OGG: ["MP3", "WAV", "FLAC", "M4A", "OPUS", "AIFF"],
      M4A: ["MP3", "WAV", "FLAC", "OGG", "OPUS", "AIFF"],
      OPUS: ["MP3", "WAV", "FLAC", "OGG", "M4A", "AIFF"],
      AIFF: ["MP3", "WAV", "FLAC", "OGG", "M4A", "OPUS"],
      WMA: ["MP3", "WAV", "FLAC", "OGG", "M4A", "OPUS"],
    },
  },
  {
    id: "subtitles",
    label: "Subtitles",
    engineNote: "Deterministic cue parser with timestamp validation",
    routeCount: 4,
    inputs: ["SRT", "VTT"],
    outputs: ["VTT", "SRT", "TXT"],
    operations: ["SRT ↔ VTT conversion", "Cue timing preservation", "Plain-text transcript strip"],
    routes: {
      SRT: ["VTT", "TXT"],
      VTT: ["SRT", "TXT"],
    },
  },
];

export type ToolGroupKey = "all" | "image" | "pdf" | "video" | "audio" | "utilities";

export interface ToolSpec {
  id: string;
  title: string;
  wheelTag: string;
  group: Exclude<ToolGroupKey, "all">;
  description: string;
  arity: "Single" | "Batch" | "Multi-file";
}

export const TOOLS_LIST: ToolSpec[] = [
  // Image (8)
  {
    id: "editImage",
    title: "Edit photo",
    wheelTag: "EDIT",
    group: "image",
    description: "Tune exposure, contrast, saturation, and temperature with live preview.",
    arity: "Single",
  },
  {
    id: "cropImage",
    title: "Crop image",
    wheelTag: "CROP",
    group: "image",
    description: "Cut to fixed aspect presets or pixel-exact bounds without re-encoding loss.",
    arity: "Single",
  },
  {
    id: "resizeImage",
    title: "Resize images",
    wheelTag: "RESIZE",
    group: "image",
    description: "Scale whole batches by longest edge, exact width, or percentage.",
    arity: "Batch",
  },
  {
    id: "rotateImage",
    title: "Rotate & flip",
    wheelTag: "ROTATE",
    group: "image",
    description: "Apply 90° steps and horizontal or vertical flips across selected photos.",
    arity: "Batch",
  },
  {
    id: "redactImage",
    title: "Redact photo",
    wheelTag: "REDACT",
    group: "image",
    description: "Burn irreversible blackouts or pixelation over private text and faces.",
    arity: "Single",
  },
  {
    id: "frameImage",
    title: "Add a background",
    wheelTag: "ADD BG",
    group: "image",
    description: "Place transparent PNGs or screenshots onto clean padded canvases.",
    arity: "Batch",
  },
  {
    id: "createCollage",
    title: "Create a collage",
    wheelTag: "COLLAGE",
    group: "image",
    description: "Compose multiple stills into an aligned contact sheet or grid.",
    arity: "Multi-file",
  },
  {
    id: "createPDF",
    title: "Create a PDF",
    wheelTag: "PDF",
    group: "image",
    description: "Compile dropped images into a single ordered PDF file.",
    arity: "Multi-file",
  },
  // PDF (3)
  {
    id: "mergePDF",
    title: "Merge PDFs",
    wheelTag: "MERGE",
    group: "pdf",
    description: "Combine separate PDF packets into one clean file in drag order.",
    arity: "Multi-file",
  },
  {
    id: "splitPDF",
    title: "Split PDF",
    wheelTag: "SPLIT",
    group: "pdf",
    description: "Break documents into individual pages or exact page-range slices.",
    arity: "Single",
  },
  {
    id: "organizePDF",
    title: "Organize PDF pages",
    wheelTag: "ORGANIZE",
    group: "pdf",
    description: "Reorder, rotate, or remove specific pages from a visual thumbnail sheet.",
    arity: "Single",
  },
  // Video (7)
  {
    id: "trimVideo",
    title: "Trim video",
    wheelTag: "TRIM",
    group: "video",
    description: "Set in and out points with frame-level accuracy and fast export.",
    arity: "Single",
  },
  {
    id: "cropVideo",
    title: "Crop video",
    wheelTag: "CROP",
    group: "video",
    description: "Reframe screen recordings or clips to 16:9, 1:1, or 9:16.",
    arity: "Single",
  },
  {
    id: "changeVideoSpeed",
    title: "Change video speed",
    wheelTag: "SPEED",
    group: "video",
    description: "Retiming from 0.25× slow motion up to 4× walkthrough speed.",
    arity: "Single",
  },
  {
    id: "joinVideos",
    title: "Join videos",
    wheelTag: "JOIN",
    group: "video",
    description: "Stitch multiple clips sequentially into a single timeline.",
    arity: "Multi-file",
  },
  {
    id: "videoSnapshots",
    title: "Save video frames",
    wheelTag: "FRAMES",
    group: "video",
    description: "Capture full-resolution PNG or JPEG stills from any timestamp.",
    arity: "Single",
  },
  {
    id: "splitVideo",
    title: "Split video",
    wheelTag: "SPLIT",
    group: "video",
    description: "Cut a recording at chosen markers into numbered chapter files.",
    arity: "Single",
  },
  {
    id: "redactVideo",
    title: "Redact video",
    wheelTag: "REDACT",
    group: "video",
    description: "Mask sensitive regions across video duration before sharing.",
    arity: "Single",
  },
  // Audio (5)
  {
    id: "normalizeAudio",
    title: "Normalize volume",
    wheelTag: "NORMALIZE",
    group: "audio",
    description: "Level uneven voice recordings and tracks to consistent loudness.",
    arity: "Batch",
  },
  {
    id: "trimAudio",
    title: "Trim audio",
    wheelTag: "TRIM",
    group: "audio",
    description: "Scrub the waveform and export only the segment you need.",
    arity: "Single",
  },
  {
    id: "audioChannels",
    title: "Audio channels",
    wheelTag: "CHANNELS",
    group: "audio",
    description: "Fold stereo recordings to mono or duplicate mono across channels.",
    arity: "Batch",
  },
  {
    id: "redactAudio",
    title: "Bleep audio",
    wheelTag: "BLEEP",
    group: "audio",
    description: "Mute or tone-bleep confidential names and numbers in recordings.",
    arity: "Single",
  },
  {
    id: "audioToVideo",
    title: "Audio visualizer",
    wheelTag: "VISUALIZE",
    group: "audio",
    description: "Turn an audio clip into an MP4 video with a live reactive waveform.",
    arity: "Single",
  },
  // Utilities (2)
  {
    id: "compress",
    title: "Compress",
    wheelTag: "COMPRESS",
    group: "utilities",
    description: "Reduce image, PDF, or video file size with predictable quality targets.",
    arity: "Batch",
  },
  {
    id: "editMetadata",
    title: "Edit metadata",
    wheelTag: "METADATA",
    group: "utilities",
    description: "View, edit, or strip camera EXIF, GPS coordinates, and PDF tags.",
    arity: "Batch",
  },
];

export const PLATFORM_COMPARISON = [
  {
    dimension: "Operating system",
    macos: "macOS 26.0+ (Apple Silicon & Intel)",
    desktop: "Windows 10/11 x64 · Ubuntu 24.04+ (glibc 2.39+)",
  },
  {
    dimension: "Interface",
    macos: "Menu-bar resident + global Shift, Option+Shift & Ctrl radial wheels",
    desktop: "In-app radial wheel, batch queue & Windows system tray resident",
  },
  {
    dimension: "Image formats",
    macos: "PNG, JPEG, WebP (built-in lossless), HEIC, AVIF, TIFF, BMP, SVG input",
    desktop: "PNG, JPEG, WebP, TIFF, BMP (plus AVIF input)",
  },
  {
    dimension: "PDF operations",
    macos: "Merge, split, organize pages, compress, OCR & text extract, DOCX export",
    desktop: "Merge, split, extract text, images to PDF",
  },
  {
    dimension: "Media transcoding",
    macos: "Native AVFoundation + optional local FFmpeg (MP4, WebM, MP3, WAV, FLAC, OGG)",
    desktop: "Optional user-selected local FFmpeg (MP4, WebM, MP3, WAV, FLAC, OGG)",
  },
  {
    dimension: "Notch HUD",
    macos: "Animated Notch Companion (Pure Black & Glass styles, 7 mascot states)",
    desktop: "In-window progress bar & tray status notifications",
  },
] as const;

export const FAQ_ITEMS = [
  {
    question: "Is Docyo really offline?",
    answer:
      "Yes. Every conversion, PDF operation, and media edit executes locally on your CPU and GPU. Your files never leave your disk and there is zero telemetry. The only network request the macOS app can make is checking GitHub Releases once a day to tell you if a new version is out — no file names, usage counts, or identifiers are ever sent.",
  },
  {
    question: "Does it modify or overwrite my original files?",
    answer:
      "Never. Source files are opened read-only. Outputs are staged into a temporary .docyo- file on the same volume and atomically committed beside your original using collision-safe names (such as photo 2.png). If you cancel mid-batch or power drops, neither your original nor existing files are corrupted.",
  },
  {
    question: "Do I need to install FFmpeg?",
    answer:
      "Not for images, PDFs, subtitles, checksums, or Apple-native media formats on macOS. You only need FFmpeg for codecs outside the OS media stack — such as WebM, MKV, OGG, Opus, or advanced audio/video filters. Install it anytime with brew install ffmpeg on macOS or point the Windows/Linux app to a local ffmpeg binary.",
  },
  {
    question: "Why does macOS ask for permission or show a Gatekeeper prompt?",
    answer:
      "Two separate reasons. First, pre-built releases are currently ad-hoc signed rather than Apple-notarized, so macOS Gatekeeper asks you to confirm first launch in System Settings → Privacy & Security → Open Anyway. Second, on macOS, detecting global Shift-drags from Finder uses standard input/accessibility event monitoring so the radial wheel can appear right under your cursor.",
  },
  {
    question: "What is the difference between the macOS app and the Windows/Linux edition?",
    answer:
      "macOS is the flagship native Swift build featuring the global Finder Shift-drag wheel, the 25 interactive tool windows, and the MacBook Notch Companion HUD. The Windows and Linux edition is an early portable PySide6 desktop app with an in-window and floating radial wheel, Windows Explorer right-click & system tray residency, process-isolated batch workers, and core image, PDF, subtitle, SHA-256, and FFmpeg workflows.",
  },
] as const;
