"use client";

import { useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { DOWNLOAD_CONFIG } from "@/config/site";
import { useDetectedOS } from "@/lib/useOs";
import { AppleIcon, WindowsIcon } from "@/components/Icons";
import { Magnetic } from "@/components/MagneticButton";

const EASE = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  const os = useDetectedOS();
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  const isWindows = os === "windows";
  const macPrimary = !isWindows;

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const node = sectionRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    node.style.setProperty("--hero-x", `${e.clientX - rect.left}px`);
    node.style.setProperty("--hero-y", `${e.clientY - rect.top}px`);
  };

  const headlineSegments = [
    { text: "Drag.", accent: false },
    { text: "Hold Shift.", accent: true },
    { text: "Convert.", accent: false },
  ];

  return (
    <section
      id="top"
      ref={sectionRef}
      onPointerMove={handlePointerMove}
      className="hero-spotlight relative overflow-hidden pt-12 pb-12 sm:pt-20 sm:pb-16 lg:pt-24"
    >
      {/* Subtle architectural coordinate hairlines */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_75%_60%_at_50%_25%,#000_35%,transparent_100%)]"
      />

      <div className="relative mx-auto max-w-[1280px] px-5 sm:px-8">
        {/* Eyebrow technical tag */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE }}
          className="mb-7 inline-flex flex-wrap items-center gap-2.5 rounded-full border border-white/[0.09] bg-[#111114]/90 px-3.5 py-1.5"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" />
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/75">
            Local-first file converter &amp; document toolkit
          </span>
          <span className="hidden sm:inline text-white/25">·</span>
          <span className="hidden sm:inline font-mono text-[11px] text-[#A78BFA]">
            GPL-3.0 · v{DOWNLOAD_CONFIG.version}
          </span>
        </motion.div>

        {/* Asymmetric editorial headline block */}
        <h1 className="font-display text-[clamp(3.1rem,8.2vw,7.6rem)] font-semibold leading-[0.94] tracking-[-0.035em] text-white">
          {headlineSegments.map((seg, idx) => (
            <span
              key={seg.text}
              className="mr-[0.22em] inline-block overflow-hidden align-bottom pb-1"
            >
              <motion.span
                initial={reduced ? false : { y: "105%", opacity: 0 }}
                animate={{ y: "0%", opacity: 1 }}
                transition={{
                  duration: 0.65,
                  delay: idx * 0.09,
                  ease: EASE,
                }}
                className={`inline-block ${
                  seg.accent ? "text-[#A78BFA]" : "text-white"
                }`}
              >
                {seg.text}
              </motion.span>
            </span>
          ))}
        </h1>

        <div className="mt-7 grid gap-8 lg:grid-cols-12 lg:items-end">
          <motion.p
            initial={reduced ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.24, ease: EASE }}
            className="max-w-[640px] text-[17px] leading-[1.6] text-white/60 sm:text-[19px] lg:col-span-7"
          >
            Convert across 176 routes and run 25 built-in media &amp; PDF tools
            offline on your own machine — zero uploads, zero accounts, originals
            never modified.
          </motion.p>

          <motion.div
            initial={reduced ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.32, ease: EASE }}
            className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:col-span-5 lg:justify-end"
          >
            <Magnetic strength={0.18}>
              <a
                href={DOWNLOAD_CONFIG.platforms.macos.downloadUrl}
                className={`group inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2.5 rounded-xl px-5 text-[14px] font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A78BFA] ${
                  macPrimary
                    ? "bg-[#7C3AED] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] hover:bg-[#6D28D9]"
                    : "border border-white/[0.12] bg-[#111114] text-white/85 hover:border-white/25 hover:bg-[#17171B] hover:text-white"
                }`}
              >
                <AppleIcon size={17} />
                <span>Download for macOS</span>
                {os === "macos" && (
                  <span className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-[10px] text-[#A78BFA]">
                    Detected
                  </span>
                )}
              </a>
            </Magnetic>

            <Magnetic strength={0.18}>
              <a
                href={DOWNLOAD_CONFIG.platforms.windows.downloadUrl}
                className={`group inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2.5 rounded-xl px-5 text-[14px] font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A78BFA] ${
                  isWindows
                    ? "bg-[#7C3AED] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] hover:bg-[#6D28D9]"
                    : "border border-white/[0.12] bg-[#111114] text-white/85 hover:border-white/25 hover:bg-[#17171B] hover:text-white"
                }`}
              >
                <WindowsIcon size={16} />
                <span>Download for Windows</span>
                {os === "windows" && (
                  <span className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-[10px] text-[#A78BFA]">
                    Detected
                  </span>
                )}
              </a>
            </Magnetic>
          </motion.div>
        </div>

        {/* Secondary metadata rail */}
        <motion.div
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4, ease: EASE }}
          className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.08] pt-4 font-mono text-[12px] text-white/40"
        >
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
            <span>
              <kbd className="rounded border border-white/[0.12] bg-[#111114] px-1.5 py-0.5 text-[11px] text-white/75">
                ⇧ Shift
              </kbd>{" "}
              Convert wheel
            </span>
            <span>
              <kbd className="rounded border border-white/[0.12] bg-[#111114] px-1.5 py-0.5 text-[11px] text-white/75">
                ⌥⇧ Opt+Shift
              </kbd>{" "}
              Tools wheel
            </span>
            <span>
              <kbd className="rounded border border-white/[0.12] bg-[#111114] px-1.5 py-0.5 text-[11px] text-white/75">
                ⌃ Ctrl
              </kbd>{" "}
              File actions
            </span>
          </div>
          <a
            href="#download"
            className="nav-underline text-white/60 transition-colors hover:text-white"
          >
            {os === "linux"
              ? "Linux x64 detected — jump to Linux tar.gz ↓"
              : "Install notes, Linux x64 & SHA-256 checksums ↓"}
          </a>
        </motion.div>
      </div>
    </section>
  );
}

