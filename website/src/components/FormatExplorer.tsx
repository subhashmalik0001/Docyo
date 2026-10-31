"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { FORMAT_CATEGORIES, type FormatCategorySpec } from "@/config/site";

const EASE = [0.22, 1, 0.36, 1] as const;

export function FormatExplorer() {
  const reduced = useReducedMotion();
  const [activeCatId, setActiveCatId] =
    useState<FormatCategorySpec["id"]>("images");
  const [selectedInput, setSelectedInput] = useState<string>("HEIC");

  const category =
    FORMAT_CATEGORIES.find((c) => c.id === activeCatId) ?? FORMAT_CATEGORIES[0];

  const handleCategoryChange = (cat: FormatCategorySpec) => {
    setActiveCatId(cat.id);
    setSelectedInput(cat.inputs[0]);
  };

  const isAllInputs = selectedInput === "ALL";
  const activeOutputs = isAllInputs
    ? category.outputs
    : category.routes[selectedInput] ?? category.outputs;

  const totalRoutes = FORMAT_CATEGORIES.reduce(
    (sum, item) => sum + item.routeCount,
    0
  );

  return (
    <section
      id="formats"
      className="border-t border-white/[0.08] py-24 sm:py-32"
    >
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        {/* Header */}
        <div className="mb-12 grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#A78BFA]">
              02 / Format Matrix
            </p>
            <h2 className="mt-3 font-display text-[clamp(2.1rem,4.5vw,3.75rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-white">
              {totalRoutes} conversion routes.
              <br />
              Every codec runs locally.
            </h2>
          </div>
          <p className="text-[16px] leading-[1.6] text-white/60 lg:col-span-5">
            Select a media family and click any source extension to inspect its
            exact output targets. No quality-destroying cloud re-uploads.
          </p>
        </div>

        {/* Interactive Explorer Console */}
        <div className="overflow-hidden rounded-2xl border border-white/[0.09] bg-[#111114]">
          {/* Category tab bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] bg-[#0A0A0B]/60 px-4 py-3 sm:px-6">
            <div
              role="tablist"
              aria-label="Format categories"
              className="flex flex-wrap items-center gap-1.5"
            >
              {FORMAT_CATEGORIES.map((cat) => {
                const active = cat.id === category.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    aria-controls={`format-panel-${cat.id}`}
                    id={`format-tab-${cat.id}`}
                    onClick={() => handleCategoryChange(cat)}
                    className={`relative rounded-lg px-3.5 py-2 text-[13.5px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7C3AED] ${
                      active
                        ? "text-white"
                        : "text-white/55 hover:text-white/85"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="formatCategoryPill"
                        transition={{
                          duration: reduced ? 0 : 0.35,
                          ease: EASE,
                        }}
                        className="absolute inset-0 rounded-lg border border-[#7C3AED]/50 bg-[#7C3AED]/18"
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      <span>{cat.label}</span>
                      <span
                        className={`font-mono text-[11px] ${
                          active ? "text-[#A78BFA]" : "text-white/35"
                        }`}
                      >
                        {cat.routeCount}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="hidden sm:flex items-center gap-2 font-mono text-[11.5px] text-white/45">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" />
              <span>
                {isAllInputs
                  ? `${category.routeCount} active routes in ${category.label}`
                  : `.${selectedInput.toLowerCase()} → ${activeOutputs.length} direct targets`}
              </span>
            </div>
          </div>

          {/* Routing board */}
          <div
            role="tabpanel"
            id={`format-panel-${category.id}`}
            aria-labelledby={`format-tab-${category.id}`}
            className="p-5 sm:p-8"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={category.id}
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? undefined : { opacity: 0, y: -6 }}
                transition={{ duration: 0.28, ease: EASE }}
                className="grid gap-8 lg:grid-cols-12 lg:items-center"
              >
                {/* Left column: Input extensions */}
                <div className="lg:col-span-5">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/40">
                      Source format (click to trace)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedInput(
                          isAllInputs ? category.inputs[0] : "ALL"
                        )
                      }
                      className={`rounded border px-2 py-0.5 font-mono text-[10.5px] transition-colors focus-visible:outline-2 focus-visible:outline-[#7C3AED] ${
                        isAllInputs
                          ? "border-[#7C3AED] bg-[#7C3AED]/20 text-white"
                          : "border-white/[0.1] bg-[#0A0A0B] text-white/55 hover:border-white/25 hover:text-white"
                      }`}
                    >
                      {isAllInputs ? "Showing all inputs" : "Show all"}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {category.inputs.map((ext, i) => {
                      const selected = isAllInputs || selectedInput === ext;
                      const isPrimarySelected = selectedInput === ext;
                      return (
                        <motion.button
                          key={ext}
                          type="button"
                          initial={reduced ? false : { opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{
                            duration: 0.25,
                            delay: i * 0.025,
                            ease: EASE,
                          }}
                          onClick={() => setSelectedInput(ext)}
                          className={`group inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 font-mono text-[13px] tracking-tight transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7C3AED] ${
                            isPrimarySelected
                              ? "border-[#7C3AED] bg-[#7C3AED] text-white shadow-[0_0_24px_rgba(124,58,237,0.32)]"
                              : selected
                              ? "border-white/20 bg-[#17171B] text-white hover:border-[#A78BFA]/60"
                              : "border-white/[0.08] bg-[#0A0A0B] text-white/50 hover:border-white/20 hover:text-white"
                          }`}
                        >
                          <span
                            className={
                              isPrimarySelected
                                ? "text-white/75"
                                : "text-[#A78BFA]"
                            }
                          >
                            .
                          </span>
                          <span>{ext}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Middle column: Conduit indicator */}
                <div className="flex items-center justify-center lg:col-span-2">
                  <div className="flex w-full items-center gap-3 lg:flex-col lg:gap-2">
                    <div className="h-px flex-1 bg-white/[0.1] lg:h-8 lg:w-px" />
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#7C3AED]/40 bg-[#0A0A0B] px-3 py-1.5 font-mono text-[11px] text-[#A78BFA]">
                      <span>{isAllInputs ? "ANY" : `.${selectedInput}`}</span>
                      <span aria-hidden="true">→</span>
                      <span className="text-white">{activeOutputs.length}</span>
                    </div>
                    <div className="h-px flex-1 bg-white/[0.1] lg:h-8 lg:w-px" />
                  </div>
                </div>

                {/* Right column: Output targets */}
                <div className="lg:col-span-5">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/40">
                      Output targets
                    </span>
                    <span className="font-mono text-[11px] text-white/40">
                      Atomic sibling write
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {category.outputs.map((outExt, i) => {
                      const enabled = activeOutputs.includes(outExt);
                      const sameFormat =
                        !isAllInputs && selectedInput === outExt;
                      return (
                        <motion.div
                          key={`${category.id}-out-${outExt}`}
                          initial={reduced ? false : { opacity: 0, y: 6 }}
                          animate={{
                            opacity: enabled ? 1 : 0.28,
                            y: 0,
                          }}
                          transition={{
                            duration: 0.28,
                            delay: i * 0.025,
                            ease: EASE,
                          }}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 font-mono text-[13px] tracking-tight transition-colors ${
                            enabled
                              ? "border-[#A78BFA]/40 bg-[#17171B] text-white"
                              : "border-white/[0.06] bg-[#0A0A0B]/60 text-white/40"
                          }`}
                        >
                          <span
                            className={
                              enabled ? "text-[#A78BFA]" : "text-white/25"
                            }
                          >
                            .
                          </span>
                          <span>{outExt}</span>
                          {sameFormat && (
                            <span className="ml-1 text-[10px] text-white/35">
                              source
                            </span>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Footer bar: engine & extra operations */}
            <div className="mt-8 flex flex-col justify-between gap-4 border-t border-white/[0.08] pt-5 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2.5 text-[13px] text-white/55">
                <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-white/35">
                  Pipeline
                </span>
                <span className="text-white/20">/</span>
                <span className="font-mono text-[12px] text-white/75">
                  {category.engineNote}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {category.operations.map((op) => (
                  <span
                    key={op}
                    className="rounded-md border border-white/[0.07] bg-[#0A0A0B] px-2.5 py-1 text-[12px] text-white/60"
                  >
                    {op}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

