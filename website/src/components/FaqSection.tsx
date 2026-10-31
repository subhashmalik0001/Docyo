"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { FAQ_ITEMS } from "@/config/site";
import { ChevronDownIcon } from "@/components/Icons";

const EASE = [0.22, 1, 0.36, 1] as const;

export function FaqSection() {
  const reduced = useReducedMotion();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="border-t border-white/[0.08] py-24 sm:py-32">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-12">
          {/* Left Sticky Title */}
          <div className="lg:col-span-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#A78BFA]">
              08 / FAQ
            </p>
            <h2 className="mt-3 font-display text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-[1.04] tracking-[-0.03em] text-white">
              Direct answers.
              <br />
              No fine print.
            </h2>
            <p className="mt-4 max-w-[380px] text-[15px] leading-[1.6] text-white/55">
              Everything about offline behavior, original file safety, optional
              FFmpeg codecs, and macOS permissions.
            </p>
          </div>

          {/* Right Accordion */}
          <div className="divide-y divide-white/[0.09] border-y border-white/[0.09] lg:col-span-7">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openIndex === idx;
              const panelId = `faq-panel-${idx}`;
              const buttonId = `faq-button-${idx}`;

              return (
                <div key={item.question}>
                  <h3>
                    <button
                      id={buttonId}
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setOpenIndex(isOpen ? null : idx)}
                      className="group flex w-full items-center justify-between gap-4 py-6 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7C3AED] rounded-sm"
                    >
                      <span className="font-display text-[18px] font-medium tracking-[-0.02em] text-white transition-colors group-hover:text-[#A78BFA] sm:text-[19px]">
                        {item.question}
                      </span>
                      <span
                        className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                          isOpen
                            ? "rotate-180 border-[#7C3AED] bg-[#7C3AED]/20 text-[#A78BFA]"
                            : "border-white/[0.12] bg-[#111114] text-white/60 group-hover:border-white/30 group-hover:text-white"
                        }`}
                      >
                        <ChevronDownIcon size={15} />
                      </span>
                    </button>
                  </h3>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={panelId}
                        role="region"
                        aria-labelledby={buttonId}
                        initial={
                          reduced ? false : { height: 0, opacity: 0 }
                        }
                        animate={{ height: "auto", opacity: 1 }}
                        exit={
                          reduced ? undefined : { height: 0, opacity: 0 }
                        }
                        transition={{ duration: 0.3, ease: EASE }}
                        className="overflow-hidden"
                      >
                        <p className="pb-6 pr-8 text-[15px] leading-[1.68] text-white/60">
                          {item.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

