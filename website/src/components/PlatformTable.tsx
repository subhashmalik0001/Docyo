"use client";

import { motion } from "motion/react";
import { PLATFORM_COMPARISON } from "@/config/site";
import { useHydratedReducedMotion } from "@/lib/useHydratedReducedMotion";
import { AppleIcon, WindowsIcon } from "@/components/Icons";

const EASE = [0.22, 1, 0.36, 1] as const;

export function PlatformTable() {
  const reduced = useHydratedReducedMotion();

  return (
    <section
      id="platforms"
      className="border-t border-white/[0.08] py-24 sm:py-32"
    >
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        <div className="mb-12 grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#A78BFA]">
              05 / Platform Comparison
            </p>
            <h2 className="mt-3 font-display text-[clamp(2.1rem,4.5vw,3.75rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-white">
              Flagship on macOS.
              <br />
              Early desktop on Windows &amp; Linux.
            </h2>
          </div>
          <p className="text-[16px] leading-[1.6] text-white/60 lg:col-span-5">
            Transparent parity notes across both codebases so you know exactly
            what ships on your operating system today.
          </p>
        </div>

        <motion.div
          initial={reduced ? false : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: EASE }}
          className="overflow-x-auto"
        >
          <table className="w-full min-w-[680px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/[0.12]">
                <th
                  scope="col"
                  className="w-[22%] pb-5 pr-6 font-mono text-[11px] font-normal uppercase tracking-[0.12em] text-white/40"
                >
                  Capability
                </th>
                <th scope="col" className="w-[39%] pb-5 pr-8">
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[#7C3AED]/45 bg-[#7C3AED]/15 text-[#A78BFA]">
                      <AppleIcon size={15} />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-[17px] font-medium text-white">
                          macOS Native
                        </span>
                        <span className="rounded border border-[#7C3AED]/40 bg-[#7C3AED]/15 px-1.5 py-0.5 font-mono text-[10px] text-[#A78BFA]">
                          Swift
                        </span>
                      </div>
                    </div>
                  </div>
                </th>
                <th scope="col" className="w-[39%] pb-5">
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.1] bg-[#111114] text-white/75">
                      <WindowsIcon size={14} />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-[17px] font-medium text-white">
                          Windows &amp; Linux Desktop
                        </span>
                        <span className="rounded border border-white/[0.1] bg-[#111114] px-1.5 py-0.5 font-mono text-[10px] text-white/55">
                          Early Edition
                        </span>
                      </div>
                    </div>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.08]">
              {PLATFORM_COMPARISON.map((row) => (
                <tr
                  key={row.dimension}
                  className="transition-colors hover:bg-white/[0.015]"
                >
                  <th
                    scope="row"
                    className="py-5 pr-6 align-top font-mono text-[12px] font-normal text-white/50"
                  >
                    {row.dimension}
                  </th>
                  <td className="py-5 pr-8 align-top text-[14.5px] leading-relaxed text-white/90">
                    {row.macos}
                  </td>
                  <td className="py-5 align-top text-[14.5px] leading-relaxed text-white/65">
                    {row.desktop}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </section>
  );
}

