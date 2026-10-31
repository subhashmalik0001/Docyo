"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { assetUrl } from "@/config/site";
import { useHydratedReducedMotion } from "@/lib/useHydratedReducedMotion";
import { SpotlightCard } from "@/components/Spotlight";
import { NotchMascot } from "@/components/Icons";

const EASE = [0.22, 1, 0.36, 1] as const;

export function FeaturesBento() {
  const reduced = useHydratedReducedMotion();
  const [notchHovered, setNotchHovered] = useState(false);
  const [activeKeycap, setActiveKeycap] = useState<0 | 1 | 2>(0);

  return (
    <section id="features" className="py-24 sm:py-32">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        {/* Asymmetric section header */}
        <div className="mb-14 grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#A78BFA]">
              01 / Architecture
            </p>
            <h2 className="mt-3 font-display text-[clamp(2.1rem,4.5vw,3.75rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-white">
              Built into your cursor,
              <br />
              not another browser tab.
            </h2>
          </div>
          <p className="text-[16px] leading-[1.6] text-white/60 lg:col-span-5">
            Docyo stays dormant in your menu bar at near-zero memory until the
            instant you modify a drag from Finder — then runs native workers on
            your local disk.
          </p>
        </div>

        {/* Asymmetric 12-col Bento Grid: 7/5, 5/7, 4/8 */}
        <div className="grid gap-4 lg:grid-cols-12">
          {/* Cell 1 (7 cols): Gesture-Driven Radial Wheel */}
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, ease: EASE }}
            className="lg:col-span-7"
          >
            <SpotlightCard
              onMouseEnter={() => setActiveKeycap((v) => ((v + 1) % 3) as 0 | 1 | 2)}
              className="group flex h-full flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#111114] p-6 sm:p-8 transition-colors hover:border-white/[0.16]"
            >
              <div>
                <div className="flex items-center justify-between gap-4">
                  <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/40">
                    Global Finder Gesture
                  </span>
                  <span className="rounded border border-[#7C3AED]/40 bg-[#7C3AED]/10 px-2 py-0.5 font-mono text-[10px] text-[#A78BFA]">
                    160ms summon
                  </span>
                </div>
                <h3 className="mt-3 font-display text-[24px] font-medium tracking-[-0.025em] text-white sm:text-[28px]">
                  Three modifier rings under one drag
                </h3>
                <p className="mt-2 max-w-[520px] text-[15px] leading-relaxed text-white/60">
                  Hold <code className="font-mono text-white/85">Shift</code> while
                  dragging files from Finder to summon format targets. Switch mid-drag
                  with <code className="font-mono text-white/85">Option+Shift</code>{" "}
                  for tools or <code className="font-mono text-white/85">Ctrl</code>{" "}
                  for instant file actions.
                </p>
              </div>

              {/* Micro-interaction: Interactive modifier keycaps + live radial arc */}
              <div className="mt-8 grid gap-4 sm:grid-cols-12 sm:items-center rounded-xl border border-white/[0.07] bg-[#0A0A0B]/80 p-4">
                <div className="space-y-2 sm:col-span-7">
                  {(
                    [
                      { kbd: "⇧ Shift", desc: "Convert format (PNG, PDF, MP4…)" },
                      { kbd: "⌥⇧ Opt+Shift", desc: "Open 25 tools (Trim, Merge, Crop…)" },
                      { kbd: "⌃ Control", desc: "Duplicate, Copy path, SHA-256" },
                    ] as const
                  ).map((row, idx) => {
                    const active = activeKeycap === idx;
                    return (
                      <button
                        key={row.kbd}
                        type="button"
                        onMouseEnter={() => setActiveKeycap(idx as 0 | 1 | 2)}
                        onClick={() => setActiveKeycap(idx as 0 | 1 | 2)}
                        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-all ${
                          active
                            ? "border-[#7C3AED]/55 bg-[#7C3AED]/15 text-white"
                            : "border-white/[0.06] bg-[#111114] text-white/55 hover:text-white"
                        }`}
                      >
                        <kbd className="font-mono text-[11.5px] font-medium text-[#A78BFA]">
                          {row.kbd}
                        </kbd>
                        <span className="text-[12px]">{row.desc}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-center sm:col-span-5">
                  <svg
                    width="124"
                    height="124"
                    viewBox="0 0 124 124"
                    aria-hidden="true"
                    className="transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                  >
                    <circle
                      cx="62"
                      cy="62"
                      r="52"
                      fill="none"
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="16"
                      strokeDasharray="46 8"
                    />
                    <circle
                      cx="62"
                      cy="62"
                      r="52"
                      fill="none"
                      stroke="#7C3AED"
                      strokeWidth="16"
                      strokeDasharray="46 280"
                      transform={`rotate(${-90 + activeKeycap * 110} 62 62)`}
                      className="transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    />
                    <circle
                      cx="62"
                      cy="62"
                      r="28"
                      fill="#111114"
                      stroke="rgba(255,255,255,0.14)"
                    />
                    <image
                      href={assetUrl("/docyo-logo.webp")}
                      x="50"
                      y="43"
                      width="24"
                      height="24"
                      preserveAspectRatio="xMidYMid meet"
                    />
                    <text
                      x="62"
                      y="77"
                      textAnchor="middle"
                      fill="#FFFFFF"
                      className="font-mono text-[8.5px] font-semibold"
                    >
                      {activeKeycap === 0
                        ? "CONVERT"
                        : activeKeycap === 1
                        ? "TOOLS"
                        : "ACTIONS"}
                    </text>
                  </svg>
                </div>
              </div>
            </SpotlightCard>
          </motion.div>

          {/* Cell 2 (5 cols): Notch Companion */}
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.06, ease: EASE }}
            className="lg:col-span-5"
          >
            <SpotlightCard
              onMouseEnter={() => setNotchHovered(true)}
              onMouseLeave={() => setNotchHovered(false)}
              className="group flex h-full flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#111114] p-6 sm:p-8 transition-colors hover:border-white/[0.16]"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/40">
                    Notch Companion HUD
                  </span>
                  <span className="font-mono text-[11px] text-white/40">
                    Pure Black · Glass
                  </span>
                </div>
                <h3 className="mt-3 font-display text-[24px] font-medium tracking-[-0.025em] text-white sm:text-[26px]">
                  Progress that lives in the notch
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-white/60">
                  Expands smoothly from the MacBook camera housing with an
                  expressive mascot across 7 states: watching, received,
                  processing, delivering, success, failed, and cancelled.
                </p>
              </div>

              {/* Micro-interaction: Simulated top bezel expanding on hover */}
              <div className="mt-8 overflow-hidden rounded-xl border border-white/[0.08] bg-[#0A0A0B] pt-0 pb-6 px-4">
                <div className="flex justify-center">
                  <div
                    className={`flex items-center gap-3 rounded-b-2xl border-x border-b border-white/[0.14] bg-black px-4 py-2.5 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      notchHovered ? "w-full max-w-[300px]" : "w-[210px]"
                    }`}
                  >
                    <NotchMascot
                      phase={notchHovered ? "success" : "watching"}
                      gazeX={notchHovered ? 0 : 0.4}
                      size={30}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-[10px] uppercase tracking-wider text-[#A78BFA]">
                        {notchHovered ? "success" : "watching"}
                      </div>
                      <div className="truncate text-[11.5px] text-white/85">
                        {notchHovered
                          ? "Done. Your file is ready."
                          : "Hover card to expand HUD"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap justify-center gap-1.5 font-mono text-[10px] text-white/45">
                  {[
                    "watching",
                    "received",
                    "processing",
                    "delivering",
                    "success",
                  ].map((s) => (
                    <span
                      key={s}
                      className={`rounded border px-2 py-0.5 transition-colors ${
                        (notchHovered && s === "success") ||
                        (!notchHovered && s === "watching")
                          ? "border-[#7C3AED]/50 bg-[#7C3AED]/15 text-[#A78BFA]"
                          : "border-white/[0.06] bg-[#111114]"
                      }`}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </SpotlightCard>
          </motion.div>

          {/* Cell 3 (5 cols): 176 Conversion Routes */}
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.08, ease: EASE }}
            className="lg:col-span-5"
          >
            <SpotlightCard className="group flex h-full flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#111114] p-6 sm:p-8 transition-colors hover:border-white/[0.16]">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/40">
                  Direct Codec Matrix
                </span>
                <div className="mt-3 flex items-baseline gap-3">
                  <span className="font-display text-[56px] font-semibold leading-none tracking-[-0.04em] text-white">
                    176
                  </span>
                  <span className="font-mono text-[13px] text-[#A78BFA]">
                    conversion routes
                  </span>
                </div>
                <p className="mt-3 text-[15px] leading-relaxed text-white/60">
                  Built-in lossless WebP encoder, CoreGraphics/ImageIO for HEIC
                  &amp; AVIF, PDFKit + DOCX writer, and optional local FFmpeg for
                  audio &amp; video containers.
                </p>
              </div>

              {/* Micro-interaction: Route nodes light up on hover */}
              <div className="mt-7 space-y-2 rounded-xl border border-white/[0.07] bg-[#0A0A0B]/85 p-3.5 font-mono text-[11.5px]">
                {[
                  ["HEIC · AVIF · TIFF", "PNG · WEBP · PDF"],
                  ["PDF · IMAGES", "DOCX · OCR · TXT"],
                  ["MOV · MKV · FLAC", "MP4 · WEBM · MP3"],
                ].map(([src, dst]) => (
                  <div
                    key={src}
                    className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-[#111114] px-3 py-2 transition-colors group-hover:border-[#7C3AED]/35"
                  >
                    <span className="text-white/65">{src}</span>
                    <span className="text-[#7C3AED] transition-transform duration-300 group-hover:translate-x-1 group-hover:text-[#A78BFA]">
                      →
                    </span>
                    <span className="text-white">{dst}</span>
                  </div>
                ))}
              </div>
            </SpotlightCard>
          </motion.div>

          {/* Cell 4 (7 cols): 25 Built-In Tools */}
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.12, ease: EASE }}
            className="lg:col-span-7"
          >
            <SpotlightCard className="group flex h-full flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#111114] p-6 sm:p-8 transition-colors hover:border-white/[0.16]">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/40">
                    Focused Utility Windows
                  </span>
                  <span className="font-mono text-[11px] text-[#A78BFA]">
                    Image · PDF · Video · Audio
                  </span>
                </div>
                <h3 className="mt-3 font-display text-[24px] font-medium tracking-[-0.025em] text-white sm:text-[28px]">
                  25 single-purpose tools. Zero timeline bloat.
                </h3>
                <p className="mt-2 max-w-[540px] text-[15px] leading-relaxed text-white/60">
                  Trim a screen recording, redact an invoice screenshot, merge
                  tax PDFs, normalize podcast audio, or strip GPS EXIF in two
                  seconds without launching a 4 GB creative suite.
                </p>
              </div>

              {/* Micro-interaction: Waveform trim + crop reticle tightening on hover */}
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/[0.07] bg-[#0A0A0B]/90 p-4">
                  <div className="mb-2.5 flex items-center justify-between font-mono text-[10.5px] text-white/50">
                    <span>TRIM · clip.mov</span>
                    <span className="text-[#A78BFA]">00:04.12 — 00:14.00</span>
                  </div>
                  <div className="relative flex h-12 items-center gap-[3px] overflow-hidden rounded-lg bg-[#111114] px-3">
                    {[35, 62, 48, 84, 70, 52, 90, 64, 42, 78, 88, 55, 74, 46, 82, 60, 38, 66, 44, 30].map(
                      (h, i) => (
                        <span
                          key={i}
                          style={{ height: `${h}%` }}
                          className={`flex-1 rounded-full transition-colors duration-300 ${
                            i >= 4 && i <= 15
                              ? "bg-[#7C3AED] group-hover:bg-[#A78BFA]"
                              : "bg-white/15"
                          }`}
                        />
                      )
                    )}
                    {/* Animated trim bracket */}
                    <div className="pointer-events-none absolute inset-y-1.5 left-[20%] right-[20%] rounded border-x-2 border-y border-[#A78BFA] bg-[#7C3AED]/10 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:left-[24%] group-hover:right-[24%]" />
                  </div>
                </div>

                <div className="rounded-xl border border-white/[0.07] bg-[#0A0A0B]/90 p-4">
                  <div className="mb-2.5 flex items-center justify-between font-mono text-[10.5px] text-white/50">
                    <span>REDACT &amp; STRIP EXIF</span>
                    <span className="text-white/60">GPSRemoved</span>
                  </div>
                  <div className="relative flex h-12 flex-col justify-center gap-1.5 rounded-lg bg-[#111114] px-3.5">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-16 rounded-sm bg-white/20" />
                      <span className="h-2.5 w-24 rounded-sm bg-[#7C3AED]/80 transition-all duration-300 group-hover:bg-[#7C3AED]" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-24 rounded-sm bg-white/15" />
                      <span className="h-2 w-12 rounded-sm bg-white/25" />
                    </div>
                  </div>
                </div>
              </div>
            </SpotlightCard>
          </motion.div>

          {/* Cell 5 (4 cols): Non-Destructive Batch */}
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.14, ease: EASE }}
            className="lg:col-span-4"
          >
            <SpotlightCard className="group flex h-full flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#111114] p-6 sm:p-8 transition-colors hover:border-white/[0.16]">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/40">
                  Collision-Safe Naming
                </span>
                <h3 className="mt-3 font-display text-[23px] font-medium tracking-[-0.025em] text-white">
                  Non-destructive batch
                </h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-white/60">
                  Originals are never altered or deleted. Existing files are
                  never overwritten — duplicates step cleanly to{" "}
                  <code className="font-mono text-white/85">shot 2.png</code>.
                </p>
              </div>

              {/* Micro-interaction: Fanning file stack */}
              <div className="mt-7 space-y-2 font-mono text-[11.5px]">
                <div className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-[#0A0A0B] px-3 py-2 text-white/60">
                  <span>shot.heic</span>
                  <span className="text-[10px] text-white/40">LOCKED</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-[#7C3AED]/40 bg-[#7C3AED]/10 px-3 py-2 text-white transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1.5">
                  <span>shot.png</span>
                  <span className="text-[10px] text-[#A78BFA]">NEW · 1</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-white/[0.1] bg-[#17171B] px-3 py-2 text-white/85 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-3">
                  <span>shot 2.png</span>
                  <span className="text-[10px] text-[#A78BFA]">NEW · 2</span>
                </div>
              </div>
            </SpotlightCard>
          </motion.div>

          {/* Cell 6 (8 cols): Atomic Writes & Shell-Safe Execution */}
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.18, ease: EASE }}
            className="lg:col-span-8"
          >
            <SpotlightCard className="group flex h-full flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#111114] p-6 sm:p-8 transition-colors hover:border-white/[0.16]">
              <div className="grid gap-6 md:grid-cols-12 md:items-start">
                <div className="md:col-span-7">
                  <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/40">
                    Systems Engineering
                  </span>
                  <h3 className="mt-3 font-display text-[24px] font-medium tracking-[-0.025em] text-white">
                    Atomic writes &amp; shell-safe workers
                  </h3>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-white/60">
                    Outputs render into an isolated{" "}
                    <code className="font-mono text-white/85">.docyo-</code>{" "}
                    staging file and publish atomically only after verification.
                    Subprocesses execute with explicit argument arrays — never a
                    shell string — eliminating filename injection even on
                    untrusted filenames.
                  </p>
                </div>
                <div className="md:col-span-5 flex flex-col gap-2 rounded-xl border border-white/[0.07] bg-[#0A0A0B] p-3.5 font-mono text-[11px]">
                  <div className="flex items-center justify-between text-white/50">
                    <span>1. read-only fd</span>
                    <span className="text-white/80">input.pdf</span>
                  </div>
                  <div className="flex items-center justify-between text-white/50 transition-colors group-hover:text-[#A78BFA]">
                    <span>2. stage write</span>
                    <span>.docyo-8a3f.tmp</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-white/[0.07] pt-2 text-white">
                    <span>3. atomic link</span>
                    <span className="rounded bg-[#7C3AED]/20 px-1.5 py-0.5 text-[#A78BFA]">
                      input.docx ✓
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/[0.07] pt-4 font-mono text-[11.5px] text-white/45">
                <span>Detached cooperative cancellation</span>
                <span>·</span>
                <span>100 MiB / 40 MP bomb guard</span>
                <span>·</span>
                <span>Symlink &amp; traversal protection</span>
              </div>
            </SpotlightCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
