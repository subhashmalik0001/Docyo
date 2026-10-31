import { assetUrl, DOWNLOAD_CONFIG, NAV_LINKS, SITE_CONFIG } from "@/config/site";
import { DocyoMark, GitHubIcon } from "@/components/Icons";

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/[0.12] bg-[#0A0A0B] pt-20 pb-16 sm:pt-28 sm:pb-24">
      {/* Footer Alpine Landscape Background Image - High Visibility */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={assetUrl("/fotter.png")}
          alt=""
          className="h-full w-full object-cover object-[center_40%] opacity-90 scale-105"
        />
        {/* Smooth top fade blending from the previous dark section into the landscape */}
        <div className="absolute top-0 inset-x-0 h-36 bg-gradient-to-b from-[#0A0A0B] via-[#0A0A0B]/60 to-transparent" />
        {/* Subtle bottom edge grounding */}
        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-[#0A0A0B] to-transparent" />
        {/* Very subtle ambient purple tone to tie into the brand palette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(124,58,237,0.12),transparent_75%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1280px] px-5 sm:px-8">
        {/* Ultra-Glassmorphic Master Card */}
        <div className="relative overflow-hidden rounded-3xl border border-white/25 bg-[#0A0A0B]/45 p-6 backdrop-blur-2xl shadow-[0_32px_80px_rgba(0,0,0,0.65),inset_0_1.5px_1px_rgba(255,255,255,0.35),inset_0_-1px_1px_rgba(0,0,0,0.4)] sm:p-10 lg:p-12">
          {/* Glass chromatic accent flares */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-20 -left-20 h-56 w-56 rounded-full bg-[#7C3AED]/25 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-[#A78BFA]/20 blur-3xl"
          />

          {/* Top section: Brand Identity & Quick Navigation */}
          <div className="relative z-10 flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
            <div>
              <a
                href="#top"
                className="group inline-flex items-center gap-3 text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7C3AED] rounded-lg"
              >
                <div className="rounded-xl border border-white/20 bg-black/40 p-1.5 backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.3)]">
                  <DocyoMark
                    size={32}
                    className="transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                  />
                </div>
                <div className="flex items-center">
                  <span className="font-display text-[22px] font-semibold tracking-[-0.03em] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
                    {SITE_CONFIG.name}
                  </span>
                  <span className="ml-2.5 rounded-full border border-white/25 bg-black/40 px-2.5 py-0.5 font-mono text-[10.5px] font-medium text-[#A78BFA] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
                    v{DOWNLOAD_CONFIG.version}
                  </span>
                </div>
              </a>
              <p className="mt-3 max-w-md text-[14.5px] leading-relaxed text-white/80 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
                {SITE_CONFIG.tagline} Private, offline, non-destructive file conversion
                and document toolkit. Zero cloud uploads, zero telemetry.
              </p>
            </div>

            {/* Navigation links styled as glassy frosted pills */}
            <nav
              aria-label="Footer"
              className="flex flex-wrap items-center gap-2.5 text-[13.5px]"
            >
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-xl border border-white/20 bg-white/10 px-4 py-1.5 font-medium text-white/90 backdrop-blur-xl shadow-[0_4px_14px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.25)] transition-all duration-200 hover:border-white/40 hover:bg-white/20 hover:text-white hover:scale-105 focus-visible:outline-2 focus-visible:outline-[#7C3AED]"
                >
                  {link.label}
                </a>
              ))}
              <a
                href={DOWNLOAD_CONFIG.allReleasesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-1.5 font-medium text-white/90 backdrop-blur-xl shadow-[0_4px_14px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.25)] transition-all duration-200 hover:border-white/40 hover:bg-white/20 hover:text-white hover:scale-105 focus-visible:outline-2 focus-visible:outline-[#7C3AED]"
              >
                Releases
              </a>
              <a
                href={SITE_CONFIG.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#A78BFA]/50 bg-[#7C3AED]/35 px-4 py-1.5 font-medium text-white backdrop-blur-xl shadow-[0_4px_20px_rgba(124,58,237,0.35),inset_0_1px_0_rgba(255,255,255,0.4)] transition-all duration-200 hover:bg-[#7C3AED]/60 hover:scale-105 focus-visible:outline-2 focus-visible:outline-[#7C3AED]"
              >
                <GitHubIcon size={14} />
                <span>GitHub</span>
              </a>
            </nav>
          </div>

          {/* Middle technical capabilities rail in frosted glass panels */}
          <div className="relative z-10 mt-8 grid gap-4 border-t border-white/15 pt-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/15 bg-black/40 p-4.5 backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.2)]">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#A78BFA]">
                176 Codec Routes
              </span>
              <p className="mt-1 text-[13px] leading-normal text-white/75 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                Native CoreGraphics, ImageIO, PDFKit &amp; AVFoundation hardware acceleration.
              </p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-black/40 p-4.5 backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.2)]">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#A78BFA]">
                25 Focused Tools
              </span>
              <p className="mt-1 text-[13px] leading-normal text-white/75 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                Multi-page PDF merge, frame-accurate video trim, local OCR &amp; EXIF stripper.
              </p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-black/40 p-4.5 backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.2)]">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#A78BFA]">
                Air-Gapped Privacy
              </span>
              <p className="mt-1 text-[13px] leading-normal text-white/75 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                0.0 KB leaves your device. No analytics SDKs, accounts, or telemetry pings.
              </p>
            </div>
          </div>

          {/* Bottom metadata bar */}
          <div className="relative z-10 mt-8 flex flex-col justify-between gap-4 border-t border-white/15 pt-6 font-mono text-[12px] text-white/60 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>
                Licensed under{" "}
                <a
                  href={SITE_CONFIG.licenseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/90 underline decoration-white/30 underline-offset-4 transition-colors hover:text-white"
                >
                  {SITE_CONFIG.license}
                </a>
              </span>
              <span className="text-white/30">·</span>
              <span>Open Source Software</span>
              <span className="text-white/30">·</span>
              <span>v{DOWNLOAD_CONFIG.version}</span>
            </div>

            <div className="flex items-center gap-2">
              <span>Architected &amp; Built by</span>
              <a
                href={SITE_CONFIG.author.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-1 font-medium text-white shadow-[0_4px_12px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.3)] backdrop-blur-xl transition-all hover:border-[#7C3AED]/60 hover:bg-[#7C3AED]/30 hover:scale-105"
              >
                <span>{SITE_CONFIG.author.name}</span>
                <span className="text-[#A78BFA]">↗</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
