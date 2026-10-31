"use client";

import { useEffect, useState } from "react";

/**
 * Hydration-safe reduced-motion hook.
 * Always returns `false` on SSR and during initial client hydration so server
 * and client inline styles match 1:1, then syncs with the user's OS
 * `prefers-reduced-motion` media query immediately after mount.
 */
export function useHydratedReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);

    const handleChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, []);

  return reduced;
}

