"use client";

import { motion } from "motion/react";
import { SITE_CONFIG } from "@/config/site";
import { useHydratedReducedMotion } from "@/lib/useHydratedReducedMotion";
import { ArrowUpRightIcon, GitHubIcon } from "@/components/Icons";

const EASE = [0.22, 1, 0.36, 1] as const;

export function OpenSourceSection() {
  const reduced = useHydratedReducedMotion();

  return (
    <section
      id="open-source"
      className="border-t border-white/[0.08] py-24 sm:py-28"
    >
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: EASE }}
          className="relative overflow-hidden rounded-2xl border border-white/[0.09] bg-[#111114] p-7 sm:p-11"
        >
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-[#0A0A0B] px-3 py-1 font-mono text-[11px] text-[#A78BFA]">
                <span>07 / Open Source</span>
                <span className="text-white/25">·</span>
                <span className="text-white/75">{SITE_CONFIG.license}</span>
              </div>

              <h2 className="mt-4 font-display text-[clamp(1.95rem,4vw,3.25rem)] font-semibold leading-[1.04] tracking-[-0.03em] text-white">
                Don&apos;t trust a privacy claim
                <br />
                you cannot read.
              </h2>

              <p className="mt-4 max-w-[560px] text-[15.5px] leading-[1.6] text-white/60">
                Every radial gesture monitor, PDF worker, WebP encoder, and Notch
                HUD animation is public under{" "}
                <a
                  href={SITE_CONFIG.licenseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white underline decoration-white/30 underline-offset-4 hover:decoration-[#A78BFA]"
                >
                  {SITE_CONFIG.license}
                </a>
                . Designed and engineered by{" "}
                <a
                  href={SITE_CONFIG.author.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white underline decoration-white/30 underline-offset-4 hover:decoration-[#A78BFA]"
                >
                  {SITE_CONFIG.author.name}
                </a>
                .
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <a
                  href={SITE_CONFIG.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center gap-2.5 rounded-xl bg-white px-5 text-[14px] font-medium text-[#0A0A0B] transition-colors hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7C3AED]"
                >
                  <GitHubIcon size={17} />
                  <span>subhashmalik0001/Docyo</span>
                  <ArrowUpRightIcon size={15} />
                </a>

                <a
                  href={`${SITE_CONFIG.repoUrl}/issues`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/[0.1] bg-[#0A0A0B] px-4 text-[13.5px] font-medium text-white/75 transition-colors hover:border-white/25 hover:text-white focus-visible:outline-2 focus-visible:outline-[#7C3AED]"
                >
                  <span>Report an issue</span>
                </a>
              </div>
            </div>

            {/* Build from source card */}
            <div className="rounded-xl border border-white/[0.08] bg-[#0A0A0B] p-5 lg:col-span-5">
              <div className="mb-3 flex items-center justify-between border-b border-white/[0.07] pb-2.5 font-mono text-[11px] text-white/40">
                <span>BUILD FROM SOURCE (macOS)</span>
                <span className="text-[#A78BFA]">Swift 6 · AppKit</span>
              </div>
              <pre className="overflow-x-auto font-mono text-[12.5px] leading-[1.7] text-white/80">
                <code>{`git clone https://github.com/subhashmalik0001/Docyo.git
cd Docyo
./scripts/build-app.sh
open build/Docyo.app`}</code>
              </pre>
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/[0.07] pt-3 font-mono text-[11px]">
                <div>
                  <div className="text-white/35">License</div>
                  <div className="mt-0.5 text-white/85">GPL-3.0</div>
                </div>
                <div>
                  <div className="text-white/35">Telemetry</div>
                  <div className="mt-0.5 text-white/85">0 dependencies</div>
                </div>
                <div>
                  <div className="text-white/35">Desktop</div>
                  <div className="mt-0.5 text-white/85">PySide6 / Qt6</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

