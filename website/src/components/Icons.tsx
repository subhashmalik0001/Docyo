import React from "react";
import { assetUrl, type CompanionPhase } from "@/config/site";

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export interface BrandMarkProps {
  size?: number;
  className?: string;
  alt?: string;
}

/**
 * Official Docyo brand logo mark (the 3D Purple Scholar Penguin from BrandArtwork).
 */
export function DocyoMark({
  size = 28,
  className = "",
  alt = "",
}: BrandMarkProps) {
  return (
    <picture
      className={`inline-flex shrink-0 select-none items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <source srcSet={assetUrl("/docyo-logo.webp")} type="image/webp" />
      <img
        src={assetUrl("/docyo-logo.png")}
        alt={alt}
        width={size}
        height={size}
        decoding="async"
        draggable={false}
        aria-hidden={alt === "" ? true : undefined}
        className="h-full w-full object-contain drop-shadow-[0_2px_6px_rgba(124,58,237,0.28)]"
      />
    </picture>
  );
}

interface NotchMascotProps {
  phase: CompanionPhase;
  gazeX?: number; // -1 to 1
  gazeY?: number; // -1 to 1
  size?: number;
}

/**
 * Official Docyo Purple Penguin companion inside the MacBook Notch HUD,
 * mirroring NotchCompanion.swift across all 7 CompanionState phases.
 */
export function NotchMascot({
  phase,
  gazeX = 0,
  gazeY = 0,
  size = 32,
}: NotchMascotProps) {
  const gx = Math.max(-1, Math.min(1, gazeX));
  const gy = Math.max(-1, Math.min(1, gazeY));

  const tx = phase === "watching" ? gx * 2.2 : 0;
  const ty =
    phase === "received"
      ? -3
      : phase === "delivering" || phase === "success"
      ? -2
      : phase === "watching"
      ? gy * 1.4
      : 0;
  const rot =
    phase === "watching"
      ? gx * 5
      : phase === "received"
      ? -6
      : phase === "delivering"
      ? 6
      : phase === "failed"
      ? -8
      : 0;

  return (
    <span
      aria-hidden="true"
      className="relative inline-flex shrink-0 select-none items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Soft purple ground halo beneath penguin (mirrors NotchCompanion.swift) */}
      <span
        className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full bg-[#7C3AED]/35 blur-[2px]"
        style={{ width: Math.round(size * 0.72), height: Math.max(4, Math.round(size * 0.16)) }}
      />

      {/* Official Docyo Penguin Avatar with reactive motion */}
      <span
        className={`inline-flex h-full w-full items-center justify-center transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          phase === "processing" ? "animate-pulse" : ""
        } ${phase === "cancelled" ? "opacity-65 grayscale-[30%]" : ""}`}
        style={{
          transform: `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) rotate(${rot.toFixed(1)}deg)`,
        }}
      >
        <picture className="h-full w-full">
          <source srcSet={assetUrl("/docyo-logo.webp")} type="image/webp" />
          <img
            src={assetUrl("/docyo-logo.png")}
            alt=""
            width={size}
            height={size}
            decoding="async"
            draggable={false}
            className="h-full w-full object-contain drop-shadow-[0_3px_8px_rgba(124,58,237,0.35)]"
          />
        </picture>
      </span>

      {/* Floating incoming/outgoing mini-file badge for received / delivering */}
      {(phase === "received" || phase === "delivering") && (
        <span
          className={`pointer-events-none absolute top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-[#7C3AED]/60 bg-[#0A0A0B] text-[#A78BFA] ${
            phase === "received" ? "-left-1" : "-right-1"
          }`}
        >
          <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
            <rect
              x="2.5"
              y="1.5"
              width="7"
              height="9"
              rx="1.2"
              stroke="currentColor"
              strokeWidth="1.4"
            />
          </svg>
        </span>
      )}

      {/* Processing gear overlay (mirrors NotchCompanion.swift) */}
      {phase === "processing" && (
        <span className="pointer-events-none absolute -right-1 -bottom-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-[#7C3AED]/60 bg-[#0A0A0B] text-[#A78BFA]">
          <svg
            width="10"
            height="10"
            viewBox="0 0 16 16"
            fill="none"
            className="animate-spin"
          >
            <circle cx="8" cy="8" r="2.4" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M8 1.75v1.8M8 12.45v1.8M1.75 8h1.8M12.45 8h1.8M3.58 3.58l1.27 1.27M11.15 11.15l1.27 1.27M12.42 3.58l-1.27 1.27M4.85 11.15l-1.27 1.27"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        </span>
      )}

      {/* Success sparkle badge */}
      {phase === "success" && (
        <span className="pointer-events-none absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border border-[#A78BFA]/60 bg-[#7C3AED] text-white">
          <svg width="9" height="9" viewBox="0 0 14 14" fill="none">
            <path
              d="M7 1.5 8.3 5.7 12.5 7 8.3 8.3 7 12.5 5.7 8.3 1.5 7 5.7 5.7 7 1.5Z"
              fill="currentColor"
            />
          </svg>
        </span>
      )}

      {/* Failed badge */}
      {phase === "failed" && (
        <span className="pointer-events-none absolute -right-1 -bottom-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-white/40 bg-[#0A0A0B] font-mono text-[9px] font-bold text-white">
          !
        </span>
      )}

      {/* Cancelled badge */}
      {phase === "cancelled" && (
        <span className="pointer-events-none absolute -right-1 -bottom-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-white/25 bg-[#0A0A0B] text-white/75">
          <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
            <path
              d="M3.2 3.2 8.8 8.8M8.8 3.2 3.2 8.8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </span>
      )}
    </span>
  );
}

export function AppleIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path
        d="M13.35 10.58c.02 1.98 1.72 2.65 1.74 2.66-.01.05-.27.94-.9 1.86-.54.79-1.11 1.58-2 1.6-.87.02-1.15-.52-2.15-.52-1 0-1.31.5-2.13.54-.86.03-1.51-.86-2.06-1.64-1.12-1.62-1.98-4.58-.83-6.58.57-.99 1.59-1.62 2.7-1.64.84-.02 1.64.57 2.15.57.51 0 1.48-.7 2.49-.6.42.02 1.62.17 2.38 1.29-.06.04-1.42.83-1.39 2.46ZM11.74 5.18c.46-.55.76-1.32.68-2.08-.66.03-1.46.44-1.93.99-.42.49-.79 1.27-.69 2.02.74.06 1.49-.37 1.94-.93Z"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function WindowsIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <rect x="3.25" y="3.25" width="5.75" height="5.75" rx="0.9" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="3.25" width="5.75" height="5.75" rx="0.9" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3.25" y="11" width="5.75" height="5.75" rx="0.9" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="11" width="5.75" height="5.75" rx="0.9" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function TerminalIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <rect x="2.75" y="3.5" width="14.5" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6.25 8l2.5 2-2.5 2M10.5 12h3.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function GitHubIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path
        d="M7.75 15.8c-3.2.95-3.2-1.6-4.5-2m9 3.3v-2.45c0-.72.08-1.08-.38-1.56 2.28-.26 4.63-1.12 4.63-5.08 0-1.12-.4-2.05-1.07-2.77.1-.27.47-1.36-.11-2.79 0 0-.87-.28-2.82 1.06a9.7 9.7 0 0 0-5 0C5.55 2.17 4.68 2.45 4.68 2.45c-.58 1.43-.21 2.52-.11 2.79-.67.72-1.07 1.65-1.07 2.77 0 3.95 2.35 4.82 4.63 5.08-.45.47-.44 1.02-.38 1.56v2.45"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StarIcon({ size = 15, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path
        d="M10 2.9l2.14 4.34 4.79.7-3.46 3.37.82 4.77L10 13.83l-4.29 2.25.82-4.77L3.07 7.94l4.79-.7L10 2.9Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DownloadIcon({ size = 17, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path
        d="M10 3.25v9.25m0 0 3.5-3.5M10 12.5 6.5 9M4 15.75h12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ArrowUpRightIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path
        d="M6 14 14 6m0 0H7.5M14 6v6.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CopyIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <rect x="7" y="7" width="9.5" height="9.5" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M13 7V5.25A1.75 1.75 0 0 0 11.25 3.5h-6A1.75 1.75 0 0 0 3.5 5.25v6A1.75 1.75 0 0 0 5.25 13H7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CheckIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4.5 10.5 8.2 14.2 15.5 6.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronDownIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path
        d="M5.25 7.75 10 12.5l4.75-4.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TrustGlyph({
  kind,
  size = 18,
}: {
  kind: "userOff" | "cloudOff" | "eyeOff" | "shieldLock";
  size?: number;
}) {
  switch (kind) {
    case "userOff":
      return (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="10" cy="6.75" r="2.75" stroke="currentColor" strokeWidth="1.5" />
          <path d="M4.75 16.25c.8-2.6 2.8-3.9 5.25-3.9 1.2 0 2.3.3 3.2.9M3.5 3.5l13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "cloudOff":
      return (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M6.2 15.25h7.9a3.15 3.15 0 0 0 .6-6.24A4.4 4.4 0 0 0 6.3 7.4M3.5 3.5l13 13M4.8 9.6a3 3 0 0 0 1.4 5.65" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "eyeOff":
      return (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M2.75 10s2.6-4.5 7.25-4.5c4.65 0 7.25 4.5 7.25 4.5a13.1 13.1 0 0 1-2.55 2.95M8.2 14.2c.57.19 1.18.3 1.8.3 4.65 0 7.25-4.5 7.25-4.5M3.5 3.5l13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "shieldLock":
      return (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M10 2.75 15.75 5v4.7c0 3.7-2.45 6.36-5.75 7.55-3.3-1.19-5.75-3.85-5.75-7.55V5L10 2.75Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <rect x="8" y="9.25" width="4" height="3.25" rx="0.8" stroke="currentColor" strokeWidth="1.4" />
          <path d="M8.85 9.25V8.1a1.15 1.15 0 0 1 2.3 0v1.15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
  }
}

export function FileKindIcon({
  kind,
  size = 18,
}: {
  kind: "image" | "pdf" | "video";
  size?: number;
}) {
  if (kind === "image") {
    return (
      <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <rect x="3" y="3.5" width="14" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="7.25" cy="7.75" r="1.25" stroke="currentColor" strokeWidth="1.4" />
        <path d="m4.5 14.5 3.6-3.4 2.6 2.4 2.1-1.9 2.7 2.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (kind === "pdf") {
    return (
      <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M5.25 2.75h6.5L15.5 6.5v10a1.75 1.75 0 0 1-1.75 1.75h-8.5A1.75 1.75 0 0 1 3.5 16.5v-12A1.75 1.75 0 0 1 5.25 2.75Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M11.5 3v3.75h3.75M6.75 10.5h6.5M6.75 13.5h4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="2.75" y="4" width="14.5" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="m8.5 7.5 4.25 2.5-4.25 2.5V7.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export function ToolCategoryGlyph({
  group,
  size = 18,
}: {
  group: "image" | "pdf" | "video" | "audio" | "utilities";
  size?: number;
}) {
  switch (group) {
    case "image":
      return (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M6 3v11h11M3 6h11v11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "pdf":
      return (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <rect x="3.5" y="3" width="9" height="11.5" rx="1.8" stroke="currentColor" strokeWidth="1.5" />
          <path d="M7.5 17h7.25a1.75 1.75 0 0 0 1.75-1.75V6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "video":
      return (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <rect x="2.75" y="4.25" width="14.5" height="11.5" rx="2.2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M6.5 4.5v11M13.5 4.5v11" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case "audio":
      return (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M3.5 10v0M6.75 6.75v6.5M10 4v12M13.25 7.25v5.5M16.5 9v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "utilities":
      return (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M4 6.5h12M4 13.5h12M7.5 4v5M12.5 11v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
  }
}
