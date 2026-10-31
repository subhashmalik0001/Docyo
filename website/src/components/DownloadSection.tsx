"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { DOWNLOAD_CONFIG } from "@/config/site";
import { useDetectedOS } from "@/lib/useOs";
import { useLatestMacRelease } from "@/lib/useLatestRelease";
import { useHydratedReducedMotion } from "@/lib/useHydratedReducedMotion";
import {
  AppleIcon,
  ArrowUpRightIcon,
  CheckIcon,
  CopyIcon,
  DocyoMark,
  DownloadIcon,
  TerminalIcon,
  WindowsIcon,
} from "@/components/Icons";
import { Magnetic } from "@/components/MagneticButton";
import { SpotlightCard } from "@/components/Spotlight";

const EASE = [0.22, 1, 0.36, 1] as const;

export function DownloadSection() {
  const os = useDetectedOS();
  const macRelease = useLatestMacRelease();
  const reduced = useHydratedReducedMotion();
  const [copiedFfmpeg, setCopiedFfmpeg] = useState(false);
  const [copiedQuarantine, setCopiedQuarantine] = useState(false);

  const mac = DOWNLOAD_CONFIG.platforms.macos;
  const win = DOWNLOAD_CONFIG.platforms.windows;
  const linux = DOWNLOAD_CONFIG.platforms.linux;

  const highlightWindows = os === "windows";
  const highlightLinux = os === "linux";
  const highlightMac = !highlightWindows && !highlightLinux;

  const copyText = async (
    text: string,
    onDone: (v: boolean) => void
  ) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const input = document.createElement("textarea");
      input.value = text;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    onDone(true);
    window.setTimeout(() => onDone(false), 2000);
  };

  const copyFfmpeg = () => copyText(DOWNLOAD_CONFIG.ffmpegCommand, setCopiedFfmpeg);
  const copyQuarantine = () =>
    copyText(DOWNLOAD_CONFIG.macQuarantineCommand, setCopiedQuarantine);

  return (
    <section
      id="download"
      className="border-t border-white/[0.08] py-24 sm:py-32"
    >
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        {/* Header */}
        <div className="mb-12 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#A78BFA]">
              06 / Download
            </p>
            <div className="mt-3 flex items-center gap-4">
              <span className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[#7C3AED]/45 bg-[#111114] p-2 shadow-[0_10px_30px_rgba(124,58,237,0.18)]">
                <DocyoMark size={48} alt="Docyo app icon" />
              </span>
              <h2 className="font-display text-[clamp(2.2rem,4.8vw,4rem)] font-semibold leading-[1.0] tracking-[-0.035em] text-white">
                Install once.
                <br />
                Own your workflow.
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-[#111114] px-3.5 py-1.5 font-mono text-[12px] text-white/75">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" />
              Current release: v{macRelease.version}
            </span>
            <a
              href={DOWNLOAD_CONFIG.allReleasesUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="nav-underline inline-flex items-center gap-1.5 text-[14px] font-medium text-white/70 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7C3AED]"
            >
              <span>View all releases</span>
              <ArrowUpRightIcon size={15} className="text-[#A78BFA]" />
            </a>
          </div>
        </div>

        {/* Two Primary OS Cards */}
        <div className="grid gap-5 lg:grid-cols-2">
          {/* macOS Card */}
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <SpotlightCard
              intensity={highlightMac ? "medium" : "subtle"}
              className={`flex h-full flex-col justify-between rounded-2xl border p-6 sm:p-8 transition-colors ${
                highlightMac
                  ? "border-[#7C3AED]/65 bg-[#111114] shadow-[0_0_0_1px_rgba(124,58,237,0.2)]"
                  : "border-white/[0.09] bg-[#111114] hover:border-white/[0.18]"
              }`}
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border ${
                        highlightMac
                          ? "border-[#7C3AED]/50 bg-[#7C3AED]/18 text-white"
                          : "border-white/[0.1] bg-[#17171B] text-white/80"
                      }`}
                    >
                      <AppleIcon size={22} />
                    </span>
                    <div>
                      <h3 className="font-display text-[24px] font-semibold tracking-[-0.025em] text-white">
                        {mac.name}
                      </h3>
                      <p className="text-[13px] text-white/55">{mac.edition}</p>
                    </div>
                  </div>

                  {os === "macos" ? (
                    <span className="rounded-full border border-[#7C3AED]/50 bg-[#7C3AED]/18 px-3 py-1 font-mono text-[11px] text-[#A78BFA]">
                      Detected for your Mac
                    </span>
                  ) : (
                    <span className="rounded-full border border-white/[0.09] bg-[#0A0A0B] px-3 py-1 font-mono text-[11px] text-white/55">
                      Flagship Build
                    </span>
                  )}
                </div>

                {/* Spec chips */}
                <div className="mt-6 flex flex-wrap items-center gap-2 font-mono text-[11.5px]">
                  <span className="rounded-md border border-white/[0.08] bg-[#0A0A0B] px-2.5 py-1 text-white/80">
                    {mac.badge}
                  </span>
                  <span className="rounded-md border border-white/[0.08] bg-[#0A0A0B] px-2.5 py-1 text-white/60">
                    {mac.osRequirement}
                  </span>
                  <span className="rounded-md border border-white/[0.08] bg-[#0A0A0B] px-2.5 py-1 text-[#A78BFA]">
                    v{macRelease.version} · {macRelease.size}
                  </span>
                </div>

                {/* CTA */}
                <div className="mt-6">
                  <Magnetic strength={0.12} className="w-full">
                    <a
                      href={macRelease.downloadUrl}
                      download={macRelease.assetName}
                      className={`flex h-13 w-full items-center justify-center sm:justify-between rounded-xl px-5 text-[14.5px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A78BFA] ${
                        highlightMac
                          ? "bg-[#7C3AED] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] hover:bg-[#6D28D9]"
                          : "border border-white/[0.14] bg-[#17171B] text-white hover:border-white/30 hover:bg-[#1E1E24]"
                      }`}
                    >
                      <span className="inline-flex items-center gap-2.5">
                        <DownloadIcon size={18} />
                        <span>Download for macOS</span>
                      </span>
                      <span className="hidden sm:inline font-mono text-[12px] text-white/75">
                        {macRelease.assetName}
                      </span>
                    </a>
                  </Magnetic>
                  <div className="mt-2 font-mono text-[11px] text-white/45 sm:hidden">
                    Asset: {macRelease.assetName}
                  </div>
                </div>

                {/* Numbered Install Steps */}
                <div className="mt-7 border-t border-white/[0.08] pt-6">
                  <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.12em] text-white/40">
                    First-run install (30 seconds)
                  </div>
                  <ol className="space-y-2.5">
                    {mac.steps.map((step, i) => (
                      <li
                        key={step}
                        className="flex items-start gap-3 text-[13.5px] leading-relaxed text-white/70"
                      >
                        <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border border-white/[0.1] bg-[#0A0A0B] font-mono text-[10.5px] text-[#A78BFA]">
                          {i + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </SpotlightCard>
          </motion.div>

          {/* Windows Card */}
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.08, ease: EASE }}
          >
            <SpotlightCard
              intensity={highlightWindows ? "medium" : "subtle"}
              className={`flex h-full flex-col justify-between rounded-2xl border p-6 sm:p-8 transition-colors ${
                highlightWindows
                  ? "border-[#7C3AED]/65 bg-[#111114] shadow-[0_0_0_1px_rgba(124,58,237,0.2)]"
                  : "border-white/[0.09] bg-[#111114] hover:border-white/[0.18]"
              }`}
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border ${
                        highlightWindows
                          ? "border-[#7C3AED]/50 bg-[#7C3AED]/18 text-white"
                          : "border-white/[0.1] bg-[#17171B] text-white/80"
                      }`}
                    >
                      <WindowsIcon size={20} />
                    </span>
                    <div>
                      <h3 className="font-display text-[24px] font-semibold tracking-[-0.025em] text-white">
                        {win.name}
                      </h3>
                      <p className="text-[13px] text-white/55">{win.edition}</p>
                    </div>
                  </div>

                  {highlightWindows ? (
                    <span className="rounded-full border border-[#7C3AED]/50 bg-[#7C3AED]/18 px-3 py-1 font-mono text-[11px] text-[#A78BFA]">
                      Detected for your PC
                    </span>
                  ) : (
                    <span className="rounded-full border border-white/[0.09] bg-[#0A0A0B] px-3 py-1 font-mono text-[11px] text-white/55">
                      Early Desktop
                    </span>
                  )}
                </div>

                {/* Spec chips */}
                <div className="mt-6 flex flex-wrap items-center gap-2 font-mono text-[11.5px]">
                  <span className="rounded-md border border-white/[0.08] bg-[#0A0A0B] px-2.5 py-1 text-white/80">
                    {win.badge}
                  </span>
                  <span className="rounded-md border border-white/[0.08] bg-[#0A0A0B] px-2.5 py-1 text-white/60">
                    Portable ZIP
                  </span>
                  <span className="rounded-md border border-white/[0.08] bg-[#0A0A0B] px-2.5 py-1 text-[#A78BFA]">
                    v{DOWNLOAD_CONFIG.version} · {win.size}
                  </span>
                </div>

                {/* CTA */}
                <div className="mt-6">
                  <Magnetic strength={0.12} className="w-full">
                    <a
                      href={win.downloadUrl}
                      download={win.assetName}
                      className={`flex h-13 w-full items-center justify-center sm:justify-between rounded-xl px-5 text-[14.5px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A78BFA] ${
                        highlightWindows
                          ? "bg-[#7C3AED] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] hover:bg-[#6D28D9]"
                          : "border border-white/[0.14] bg-[#17171B] text-white hover:border-white/30 hover:bg-[#1E1E24]"
                      }`}
                    >
                      <span className="inline-flex items-center gap-2.5">
                        <DownloadIcon size={18} />
                        <span>Download for Windows</span>
                      </span>
                      <span className="hidden sm:inline truncate pl-2 font-mono text-[12px] text-white/75">
                        {win.assetName}
                      </span>
                    </a>
                  </Magnetic>
                  <div className="mt-2 font-mono text-[11px] text-white/45 sm:hidden">
                    Asset: {win.assetName}
                  </div>
                </div>

                {/* Numbered Install Steps */}
                <div className="mt-7 border-t border-white/[0.08] pt-6">
                  <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.12em] text-white/40">
                    Portable setup (no admin installer)
                  </div>
                  <ol className="space-y-2.5">
                    {win.steps.map((step, i) => (
                      <li
                        key={step}
                        className="flex items-start gap-3 text-[13.5px] leading-relaxed text-white/70"
                      >
                        <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border border-white/[0.1] bg-[#0A0A0B] font-mono text-[10.5px] text-[#A78BFA]">
                          {i + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </SpotlightCard>
          </motion.div>
        </div>

        {/* Secondary Linux x64 Strip */}
        <div
          className={`mt-5 flex flex-col justify-between gap-4 rounded-xl border p-5 sm:flex-row sm:items-center ${
            highlightLinux
              ? "border-[#7C3AED]/65 bg-[#111114]"
              : "border-white/[0.08] bg-[#111114]/75"
          }`}
        >
          <div className="flex items-start gap-3.5 sm:items-center">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.1] bg-[#0A0A0B] text-[#A78BFA]">
              <TerminalIcon size={17} />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display text-[16px] font-medium text-white">
                  {linux.name}
                </span>
                <span className="font-mono text-[11.5px] text-white/45">
                  {linux.badge} · {linux.size}
                </span>
                {highlightLinux && (
                  <span className="rounded bg-[#7C3AED]/20 px-2 py-0.5 font-mono text-[10px] text-[#A78BFA]">
                    Detected
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[13px] text-white/55">
                {linux.steps[0]}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={linux.downloadUrl}
              download={linux.assetName}
              className={`inline-flex h-10 items-center gap-2 rounded-lg px-4 font-mono text-[12px] transition-colors focus-visible:outline-2 focus-visible:outline-[#7C3AED] ${
                highlightLinux
                  ? "bg-[#7C3AED] text-white hover:bg-[#6D28D9]"
                  : "border border-white/[0.12] bg-[#17171B] text-white/85 hover:border-white/25 hover:text-white"
              }`}
            >
              <DownloadIcon size={15} />
              <span>{linux.assetName}</span>
            </a>
          </div>
        </div>

        {/* Optional FFmpeg + Honest Signing / Gatekeeper Notes */}
        <div className="mt-5 grid gap-5 lg:grid-cols-12">
          {/* Optional FFmpeg box */}
          <div className="flex flex-col justify-between rounded-xl border border-white/[0.08] bg-[#111114]/65 p-5 sm:p-6 lg:col-span-6">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#A78BFA]">
                  Optional Extended Codecs
                </span>
                <span className="font-mono text-[11px] text-white/40">
                  WebM · MKV · OGG · Opus
                </span>
              </div>
              <p className="mt-2 text-[14px] leading-relaxed text-white/65">
                Images, PDFs, subtitles, and Apple-native media work out of the
                box with zero dependencies. Install local FFmpeg anytime to
                unlock non-Apple containers and advanced audio/video filters:
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-white/[0.09] bg-[#0A0A0B] px-3.5 py-2.5">
              <code className="font-mono text-[13px] text-white/90">
                <span className="select-none text-[#A78BFA]">$ </span>
                {DOWNLOAD_CONFIG.ffmpegCommand}
              </code>
              <button
                type="button"
                onClick={copyFfmpeg}
                aria-label="Copy brew install ffmpeg command"
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-white/[0.1] bg-[#111114] px-2.5 font-mono text-[11.5px] text-white/80 transition-colors hover:border-[#7C3AED]/60 hover:text-white focus-visible:outline-2 focus-visible:outline-[#7C3AED]"
              >
                {copiedFfmpeg ? (
                  <>
                    <CheckIcon size={14} className="text-[#A78BFA]" />
                    <span className="text-[#A78BFA]">Copied</span>
                  </>
                ) : (
                  <>
                    <CopyIcon size={14} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Honest Gatekeeper & Code Signing note */}
          <div className="flex flex-col justify-between rounded-xl border border-white/[0.08] bg-[#111114]/65 p-5 sm:p-6 lg:col-span-6">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/50">
                  Gatekeeper &amp; Code Signing
                </span>
                <span className="font-mono text-[11px] text-white/40">
                  Ad-hoc signed · Open source
                </span>
              </div>
              <p className="mt-2 text-[14px] leading-relaxed text-white/65">
                Because Docyo is free, independent GPL-3.0 software without a paid
                Apple Developer ID certificate, macOS shows{" "}
                <strong className="font-medium text-white">
                  &ldquo;Apple could not verify Docyo&rdquo;
                </strong>{" "}
                on first launch. Click <strong className="font-medium text-white">Done</strong>{" "}
                and allow it in{" "}
                <span className="font-mono text-[12px] text-white/85">
                  System Settings → Privacy &amp; Security → Open Anyway
                </span>
                , or clear the quarantine flag in Terminal:
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-white/[0.09] bg-[#0A0A0B] px-3.5 py-2.5">
              <code className="truncate font-mono text-[12.5px] text-white/90 sm:text-[13px]">
                <span className="select-none text-[#A78BFA]">$ </span>
                {DOWNLOAD_CONFIG.macQuarantineCommand}
              </code>
              <button
                type="button"
                onClick={copyQuarantine}
                aria-label="Copy xattr quarantine bypass command"
                className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-white/[0.1] bg-[#111114] px-2.5 font-mono text-[11.5px] text-white/80 transition-colors hover:border-[#7C3AED]/60 hover:text-white focus-visible:outline-2 focus-visible:outline-[#7C3AED]"
              >
                {copiedQuarantine ? (
                  <>
                    <CheckIcon size={14} className="text-[#A78BFA]" />
                    <span className="text-[#A78BFA]">Copied</span>
                  </>
                ) : (
                  <>
                    <CopyIcon size={14} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
