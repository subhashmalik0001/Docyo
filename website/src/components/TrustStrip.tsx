"use client";

import { motion } from "motion/react";
import { TRUST_ITEMS } from "@/config/site";
import { useHydratedReducedMotion } from "@/lib/useHydratedReducedMotion";
import { TrustGlyph } from "@/components/Icons";

const EASE = [0.22, 1, 0.36, 1] as const;

export function TrustStrip() {
  const reduced = useHydratedReducedMotion();

  return (
    <section
      aria-label="Privacy and safety guarantees"
      className="border-y border-white/[0.08] bg-[#0A0A0B]"
    >
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        <div className="grid divide-y divide-white/[0.08] sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
          {TRUST_ITEMS.map((item, idx) => (
            <motion.div
              key={item.title}
              initial={reduced ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: idx * 0.06, ease: EASE }}
              className={`py-7 ${
                idx === 0
                  ? "lg:pr-7"
                  : idx === TRUST_ITEMS.length - 1
                  ? "lg:pl-7 sm:pl-6 lg:pl-7"
                  : "lg:px-7"
              } ${idx % 2 === 1 ? "sm:pl-6 lg:pl-7" : "sm:pr-6 lg:pr-7"} ${
                idx >= 2 ? "sm:border-t sm:border-white/[0.08] lg:border-t-0" : ""
              }`}
            >
              <div className="flex items-center gap-2.5 text-[#A78BFA]">
                <TrustGlyph kind={item.icon} size={18} />
                <span className="font-display text-[17px] font-medium tracking-[-0.02em] text-white">
                  {item.title}
                </span>
              </div>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/55">
                {item.detail}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

