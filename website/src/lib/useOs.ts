"use client";

import { useEffect, useState } from "react";
import type { PlatformKey } from "@/config/site";

export type DetectedOS = PlatformKey | "unknown";

export function detectClientOS(): DetectedOS {
  if (typeof window === "undefined") return "unknown";

  const uaData = (
    navigator as Navigator & { userAgentData?: { platform?: string } }
  ).userAgentData;
  const raw = `${uaData?.platform ?? ""} ${navigator.platform ?? ""} ${navigator.userAgent ?? ""}`.toLowerCase();

  if (raw.includes("win")) return "windows";
  if (raw.includes("mac") || raw.includes("iphone") || raw.includes("ipad")) {
    return "macos";
  }
  if (raw.includes("linux")) return "linux";
  return "unknown";
}

export function useDetectedOS(): DetectedOS {
  const [os, setOs] = useState<DetectedOS>("unknown");

  useEffect(() => {
    setOs(detectClientOS());
  }, []);

  return os;
}

