"use client";

import { motion, useReducedMotion } from "motion/react";

const EASE = [0.22, 1, 0.36, 1] as const;

export function PrivacySection() {
  const reduced = useReducedMotion();

  return (
    <section
      id="privacy"
      aria-labelledby="privacy-heading"
      className="relative bg-white py-24 text-[#0A0A0B] sm:py-32"
    >
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        {/* Editorial header */}
        <div className="mb-14 grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-[#7C3AED]">
              04 / Data Sovereignty
            </p>
            <h2
              id="privacy-heading"
              className="mt-3 font-display text-[clamp(2.2rem,4.8vw,4rem)] font-semibold leading-[0.98] tracking-[-0.035em] text-[#0A0A0B]"
            >
              Your files never
              <br />
              take a round-trip.
            </h2>
          </div>
          <p className="text-[16.5px] leading-[1.6] text-[#0A0A0B]/65 lg:col-span-5">
            Online converters ask you to upload tax returns, Passport scans, NDAs,
            and raw client footage to a stranger&apos;s bucket just to change four
            letters after a dot. Docyo keeps every byte inside your kernel.
          </p>
        </div>

        {/* Striking Two-Lane Architectural Comparison Diagram */}
        <div className="overflow-hidden rounded-2xl border border-[#0A0A0B]/12 bg-white">
          {/* Lane 1: Other converters */}
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, ease: EASE }}
            className="border-b border-[#0A0A0B]/10 p-6 sm:p-9"
          >
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="inline-block h-2 w-2 rounded-full bg-[#0A0A0B]/30" />
                <span className="font-mono text-[11.5px] font-medium uppercase tracking-[0.12em] text-[#0A0A0B]/55">
                  Other converters — Your file → their server
                </span>
              </div>
              <span className="rounded border border-[#0A0A0B]/12 px-2.5 py-0.5 font-mono text-[11px] text-[#0A0A0B]/55">
                2× network transfer · third-party storage
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_auto_1.15fr_auto_1fr] md:items-center">
              {/* Node A */}
              <div className="rounded-xl border border-[#0A0A0B]/12 bg-[#0A0A0B]/[0.02] p-4">
                <div className="font-mono text-[10.5px] uppercase tracking-wider text-[#0A0A0B]/45">
                  Your Machine
                </div>
                <div className="mt-1 font-mono text-[13.5px] font-medium text-[#0A0A0B]/75">
                  board-deck.pdf
                </div>
                <div className="mt-1 text-[12px] text-[#0A0A0B]/50">
                  Leaves disk over HTTPS
                </div>
              </div>

              {/* Arrow 1 */}
              <div className="flex items-center justify-center py-1 md:flex-col md:px-1">
                <span className="font-mono text-[10px] uppercase text-[#0A0A0B]/40">
                  upload
                </span>
                <svg
                  width="44"
                  height="14"
                  viewBox="0 0 44 14"
                  fill="none"
                  aria-hidden="true"
                  className="rotate-90 md:rotate-0 text-[#0A0A0B]/35"
                >
                  <path
                    d="M1 7h40m0 0-4.5-4.5M41 7l-4.5 4.5"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeDasharray="3 3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* Node B: Remote cloud */}
              <div className="rounded-xl border border-dashed border-[#0A0A0B]/25 bg-[#0A0A0B]/[0.03] p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10.5px] uppercase tracking-wider text-[#0A0A0B]/50">
                    Their Cloud Bucket
                  </span>
                  <span className="font-mono text-[10px] text-[#0A0A0B]/45">
                    REMOTE
                  </span>
                </div>
                <div className="mt-1 font-display text-[15px] font-medium text-[#0A0A0B]/80">
                  Remote worker &amp; cache
                </div>
                <div className="mt-1 text-[12px] text-[#0A0A0B]/50">
                  Retention policy · size paywalls · IP logs
                </div>
              </div>

              {/* Arrow 2 */}
              <div className="flex items-center justify-center py-1 md:flex-col md:px-1">
                <span className="font-mono text-[10px] uppercase text-[#0A0A0B]/40">
                  fetch
                </span>
                <svg
                  width="44"
                  height="14"
                  viewBox="0 0 44 14"
                  fill="none"
                  aria-hidden="true"
                  className="rotate-90 md:rotate-0 text-[#0A0A0B]/35"
                >
                  <path
                    d="M1 7h40m0 0-4.5-4.5M41 7l-4.5 4.5"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeDasharray="3 3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* Node C */}
              <div className="rounded-xl border border-[#0A0A0B]/12 bg-[#0A0A0B]/[0.02] p-4">
                <div className="font-mono text-[10.5px] uppercase tracking-wider text-[#0A0A0B]/45">
                  Downloads Folder
                </div>
                <div className="mt-1 font-mono text-[13.5px] font-medium text-[#0A0A0B]/75">
                  board-deck (1).docx
                </div>
                <div className="mt-1 text-[12px] text-[#0A0A0B]/50">
                  Manual move back to project
                </div>
              </div>
            </div>
          </motion.div>

          {/* Lane 2: Docyo */}
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
            className="relative bg-[#0A0A0B]/[0.015] p-6 sm:p-9"
          >
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#7C3AED]" />
                <span className="font-mono text-[11.5px] font-semibold uppercase tracking-[0.12em] text-[#4C1D95]">
                  Docyo — Your file stays here
                </span>
              </div>
              <span className="rounded-full border border-[#7C3AED]/30 bg-[#7C3AED]/10 px-3 py-0.5 font-mono text-[11px] font-medium text-[#4C1D95]">
                0 bytes cross network · Air-gap safe
              </span>
            </div>

            <div className="grid gap-4 lg:grid-cols-12 lg:items-stretch">
              {/* Closed local enclosure */}
              <div className="rounded-2xl border-2 border-[#0A0A0B] bg-white p-5 sm:p-6 lg:col-span-9">
                <div className="mb-4 flex items-center justify-between border-b border-[#0A0A0B]/10 pb-3">
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0A0A0B]">
                    Your Local Volume (/Users/you/…)
                  </span>
                  <span className="font-mono text-[11px] text-[#7C3AED]">
                    In-memory + temp atomic rename
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-[1fr_auto_1.15fr_auto_1fr] sm:items-center">
                  <div className="rounded-xl border border-[#0A0A0B]/12 bg-[#0A0A0B]/[0.025] p-3.5">
                    <div className="font-mono text-[10px] uppercase text-[#0A0A0B]/50">
                      Read-only input
                    </div>
                    <div className="mt-1 font-mono text-[13px] font-semibold text-[#0A0A0B]">
                      board-deck.pdf
                    </div>
                    <div className="mt-0.5 text-[11.5px] text-[#0A0A0B]/60">
                      Untouched original
                    </div>
                  </div>

                  <div className="flex items-center justify-center sm:px-0.5">
                    <svg
                      width="36"
                      height="14"
                      viewBox="0 0 36 14"
                      fill="none"
                      aria-hidden="true"
                      className="rotate-90 sm:rotate-0 text-[#7C3AED]"
                    >
                      <path
                        d="M1 7h32m0 0-4.5-4.5M33 7l-4.5 4.5"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  <div className="rounded-xl border border-[#7C3AED]/45 bg-[#7C3AED]/[0.07] p-3.5">
                    <div className="font-mono text-[10px] font-medium uppercase text-[#4C1D95]">
                      Apple Silicon / x64
                    </div>
                    <div className="mt-1 font-display text-[14.5px] font-semibold text-[#0A0A0B]">
                      Docyo Native Engine
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-[#4C1D95]">
                      .docyo-stage → commit
                    </div>
                  </div>

                  <div className="flex items-center justify-center sm:px-0.5">
                    <svg
                      width="36"
                      height="14"
                      viewBox="0 0 36 14"
                      fill="none"
                      aria-hidden="true"
                      className="rotate-90 sm:rotate-0 text-[#7C3AED]"
                    >
                      <path
                        d="M1 7h32m0 0-4.5-4.5M33 7l-4.5 4.5"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  <div className="rounded-xl border border-[#0A0A0B] bg-[#0A0A0B] p-3.5 text-white min-w-0">
                    <div className="font-mono text-[10px] uppercase text-[#A78BFA]">
                      Sibling output
                    </div>
                    <div className="mt-1 truncate font-mono text-[13px] font-semibold">
                      board-deck.docx
                    </div>
                    <div className="mt-0.5 text-[11.5px] text-white/65">
                      Ready in same folder
                    </div>
                  </div>
                </div>
              </div>

              {/* Hard air-gap boundary */}
              <div className="flex flex-col justify-between rounded-2xl border border-[#0A0A0B]/12 bg-white p-5 lg:col-span-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10.5px] font-semibold uppercase tracking-wider text-[#0A0A0B]/45">
                    External Network
                  </span>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 20 20"
                    fill="none"
                    aria-hidden="true"
                    className="text-[#7C3AED]"
                  >
                    <rect
                      x="4.5"
                      y="9"
                      width="11"
                      height="8"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                    <path
                      d="M7 9V6.5a3 3 0 0 1 6 0V9"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <div className="my-4 border-l-2 border-[#7C3AED] pl-3">
                  <div className="font-display text-[26px] font-semibold leading-none tracking-[-0.03em] text-[#0A0A0B]">
                    0.0 KB
                  </div>
                  <div className="mt-1 text-[12.5px] text-[#0A0A0B]/60">
                    Works on an airplane with Wi-Fi disabled.
                  </div>
                </div>

                <div className="font-mono text-[10.5px] text-[#0A0A0B]/45">
                  No accounts · No telemetry
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 4 Engineering Safety Guarantees */}
        <div className="mt-10 grid gap-6 border-t border-[#0A0A0B]/12 pt-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              tag: "READ_ONLY_FD",
              title: "Originals never touched",
              body: "Input paths are opened strictly read-only. Docyo never mutates or deletes a dropped file.",
            },
            {
              tag: "ATOMIC_COMMIT",
              title: "Atomic output writing",
              body: "Bytes write into a temporary .docyo-* sibling file and swap into place only when encoding succeeds.",
            },
            {
              tag: "COLLISION_SAFE",
              title: "Deterministic naming",
              body: "Existing files are never clobbered — outputs automatically increment (report 2.pdf, report 3.pdf).",
            },
            {
              tag: "ARGV_EXEC",
              title: "Shell-safe execution",
              body: "External codecs run via direct executable argument arrays — immune to filename shell injection.",
            },
          ].map((item) => (
            <div key={item.tag}>
              <span className="font-mono text-[10.5px] font-semibold tracking-[0.1em] text-[#7C3AED]">
                {item.tag}
              </span>
              <h3 className="mt-2 font-display text-[18px] font-semibold tracking-[-0.02em] text-[#0A0A0B]">
                {item.title}
              </h3>
              <p className="mt-1.5 text-[13.5px] leading-[1.55] text-[#0A0A0B]/65">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
