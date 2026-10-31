"use client";

import { useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  FILE_ACTION_TARGETS,
  TOOLS_LIST,
  type ToolGroupKey,
} from "@/config/site";
import { ToolCategoryGlyph } from "@/components/Icons";
import { SpotlightCard } from "@/components/Spotlight";

const EASE = [0.22, 1, 0.36, 1] as const;

const GROUPS: { key: ToolGroupKey; label: string; count: number }[] = [
  { key: "all", label: "All tools", count: TOOLS_LIST.length },
  {
    key: "image",
    label: "Image",
    count: TOOLS_LIST.filter((t) => t.group === "image").length,
  },
  {
    key: "pdf",
    label: "PDF",
    count: TOOLS_LIST.filter((t) => t.group === "pdf").length,
  },
  {
    key: "video",
    label: "Video",
    count: TOOLS_LIST.filter((t) => t.group === "video").length,
  },
  {
    key: "audio",
    label: "Audio",
    count: TOOLS_LIST.filter((t) => t.group === "audio").length,
  },
  {
    key: "utilities",
    label: "Utilities",
    count: TOOLS_LIST.filter((t) => t.group === "utilities").length,
  },
];

export function ToolsShowcase() {
  const reduced = useReducedMotion();
  const [activeGroup, setActiveGroup] = useState<ToolGroupKey>("all");
  const railRef = useRef<HTMLDivElement>(null);

  const filteredTools =
    activeGroup === "all"
      ? TOOLS_LIST
      : TOOLS_LIST.filter((t) => t.group === activeGroup);

  const scrollRail = (dir: -1 | 1) => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({
      left: dir * Math.min(620, el.clientWidth * 0.82),
      behavior: reduced ? "auto" : "smooth",
    });
  };

  const isHorizontalAll = activeGroup === "all";

  return (
    <section
      id="tools"
      className="border-t border-white/[0.08] py-24 sm:py-32"
    >
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        {/* Section header */}
        <div className="mb-10 grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#A78BFA]">
              03 / Built-in Toolkit
            </p>
            <h2 className="mt-3 font-display text-[clamp(2.1rem,4.5vw,3.75rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-white">
              25 focused tools.
              <br />
              One Option+Shift drag.
            </h2>
          </div>
          <p className="text-[16px] leading-[1.6] text-white/60 lg:col-span-5">
            Drop files onto a tool wedge to open a dedicated native sheet — trim
            a recording, redact sensitive lines, organize PDF pages, or strip
            GPS metadata in seconds.
          </p>
        </div>

        {/* Filter bar + horizontal scroll controls */}
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div
            role="tablist"
            aria-label="Tool categories"
            className="flex flex-wrap items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#111114] p-1.5"
          >
            {GROUPS.map((grp) => {
              const active = activeGroup === grp.key;
              return (
                <button
                  key={grp.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setActiveGroup(grp.key);
                    if (railRef.current) railRef.current.scrollLeft = 0;
                  }}
                  className={`relative rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7C3AED] ${
                    active ? "text-white" : "text-white/55 hover:text-white/85"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="toolsGroupPill"
                      transition={{
                        duration: reduced ? 0 : 0.32,
                        ease: EASE,
                      }}
                      className="absolute inset-0 rounded-lg bg-[#7C3AED]"
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <span>{grp.label}</span>
                    <span
                      className={`font-mono text-[11px] ${
                        active ? "text-white/80" : "text-white/35"
                      }`}
                    >
                      {grp.count}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {isHorizontalAll && (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline font-mono text-[11.5px] text-white/40 mr-1">
                Scroll or filter
              </span>
              <button
                type="button"
                onClick={() => scrollRail(-1)}
                aria-label="Scroll tools left"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.1] bg-[#111114] text-white/75 transition-colors hover:border-white/25 hover:bg-[#17171B] hover:text-white focus-visible:outline-2 focus-visible:outline-[#7C3AED]"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M12.25 5.25 7.5 10l4.75 4.75"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => scrollRail(1)}
                aria-label="Scroll tools right"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.1] bg-[#111114] text-white/75 transition-colors hover:border-white/25 hover:bg-[#17171B] hover:text-white focus-visible:outline-2 focus-visible:outline-[#7C3AED]"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M7.75 5.25 12.5 10l-4.75 4.75"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Tools rail (2-row horizontal scroll for All 25, responsive grid for filtered groups) */}
        <div
          ref={railRef}
          tabIndex={isHorizontalAll ? 0 : undefined}
          aria-label={isHorizontalAll ? "25 built-in tools" : `${activeGroup} tools`}
          className={
            isHorizontalAll
              ? "no-scrollbar -mx-5 grid snap-x snap-mandatory grid-flow-col grid-rows-2 gap-3.5 overflow-x-auto px-5 pb-3 sm:mx-0 sm:px-0 auto-cols-[276px] sm:auto-cols-[304px] focus-visible:outline-2 focus-visible:outline-[#7C3AED] rounded-xl"
              : "grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4"
          }
        >
          {filteredTools.map((tool, idx) => (
            <motion.div
              key={tool.id}
              initial={reduced ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.3,
                delay: Math.min(idx * 0.02, 0.25),
                ease: EASE,
              }}
              className={isHorizontalAll ? "snap-start" : ""}
            >
              <SpotlightCard className="group flex h-full flex-col justify-between rounded-xl border border-white/[0.08] bg-[#111114] p-5 transition-colors hover:border-white/[0.18] hover:bg-[#141418]">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[#A78BFA]">
                      <ToolCategoryGlyph group={tool.group} size={15} />
                      <span className="font-mono text-[11px] font-medium tracking-[0.08em]">
                        {tool.wheelTag}
                      </span>
                    </span>
                    <span className="rounded border border-white/[0.08] bg-[#0A0A0B] px-2 py-0.5 font-mono text-[10px] text-white/45">
                      {tool.arity}
                    </span>
                  </div>

                  <h3 className="mt-3.5 font-display text-[18px] font-medium tracking-[-0.02em] text-white">
                    {tool.title}
                  </h3>
                  <p className="mt-1.5 text-[13.5px] leading-[1.55] text-white/55">
                    {tool.description}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3 font-mono text-[10.5px] text-white/35">
                  <span className="uppercase">{tool.group}</span>
                  <span className="text-white/50 transition-colors group-hover:text-[#A78BFA]">
                    ⌥⇧ Wheel →
                  </span>
                </div>
              </SpotlightCard>
            </motion.div>
          ))}
        </div>

        {/* Companion Ctrl File Actions rail */}
        <div className="mt-8 flex flex-col justify-between gap-4 rounded-xl border border-white/[0.08] bg-[#111114]/70 px-5 py-4 lg:flex-row lg:items-center">
          <div className="flex items-center gap-3">
            <kbd className="rounded-md border border-[#7C3AED]/45 bg-[#7C3AED]/15 px-2 py-1 font-mono text-[11px] text-[#A78BFA]">
              ⌃ Ctrl + Drag
            </kbd>
            <span className="text-[13.5px] text-white/75">
              Plus 5 instant file actions without opening a window:
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {FILE_ACTION_TARGETS.map((action) => (
              <span
                key={action.label}
                className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-[#0A0A0B] px-2.5 py-1 font-mono text-[11px] text-white/70"
              >
                <span className="h-1 w-1 rounded-full bg-[#A78BFA]" />
                {action.detail}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

