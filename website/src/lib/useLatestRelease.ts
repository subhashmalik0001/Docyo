"use client";

import { useEffect, useState } from "react";
import { DOWNLOAD_CONFIG } from "@/config/site";

interface ResolvedMacRelease {
  version: string;
  assetName: string;
  size: string;
  downloadUrl: string;
}

const DEFAULT_MAC: ResolvedMacRelease = {
  version: DOWNLOAD_CONFIG.version,
  assetName: DOWNLOAD_CONFIG.platforms.macos.assetName,
  size: DOWNLOAD_CONFIG.platforms.macos.size,
  downloadUrl: DOWNLOAD_CONFIG.platforms.macos.downloadUrl,
};

let cachedRelease: ResolvedMacRelease | null = null;
let inflightPromise: Promise<ResolvedMacRelease> | null = null;

function parseSemver(v: string): [number, number, number] | null {
  const m = v.replace(/^v/, "").match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function isNewerVersion(candidate: string, baseline: string): boolean {
  const a = parseSemver(candidate);
  const b = parseSemver(baseline);
  if (!a || !b) return false;
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] > b[i];
  }
  return false;
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return DEFAULT_MAC.size;
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

async function fetchLatestMacDmg(): Promise<ResolvedMacRelease> {
  if (cachedRelease) return cachedRelease;
  if (inflightPromise) return inflightPromise;

  inflightPromise = (async () => {
    try {
      const res = await fetch(
        "https://api.github.com/repos/subhashmalik0001/Docyo/releases/latest",
        { headers: { Accept: "application/vnd.github+json" } }
      );
      if (!res.ok) return DEFAULT_MAC;
      const data = await res.json();
      if (!data || data.draft || data.prerelease || typeof data.tag_name !== "string") {
        return DEFAULT_MAC;
      }
      const cleanVersion = data.tag_name.replace(/^v/, "");
      if (!isNewerVersion(cleanVersion, DEFAULT_MAC.version)) {
        return DEFAULT_MAC;
      }

      const assets: Array<{
        name?: string;
        size?: number;
        state?: string;
        browser_download_url?: string;
      }> = Array.isArray(data.assets) ? data.assets : [];

      const macDmg =
        assets.find(
          (a) =>
            a.state === "uploaded" &&
            typeof a.name === "string" &&
            /\.dmg$/i.test(a.name) &&
            typeof a.browser_download_url === "string" &&
            a.browser_download_url.startsWith(
              "https://github.com/subhashmalik0001/Docyo/releases/download/"
            )
        ) ?? null;

      if (!macDmg || !macDmg.browser_download_url || !macDmg.name) {
        return DEFAULT_MAC;
      }

      const resolved: ResolvedMacRelease = {
        version: cleanVersion,
        assetName: macDmg.name,
        size: typeof macDmg.size === "number" ? formatBytes(macDmg.size) : DEFAULT_MAC.size,
        downloadUrl: macDmg.browser_download_url,
      };
      cachedRelease = resolved;
      return resolved;
    } catch {
      return DEFAULT_MAC;
    }
  })();

  return inflightPromise;
}

/**
 * Serves the direct `Docyo-macOS.dmg` disk image immediately on render,
 * and upgrades automatically only if a newer `.dmg` release is published on GitHub.
 */
export function useLatestMacRelease(): ResolvedMacRelease {
  const [release, setRelease] = useState<ResolvedMacRelease>(DEFAULT_MAC);

  useEffect(() => {
    let active = true;
    fetchLatestMacDmg().then((resolved) => {
      if (active) setRelease(resolved);
    });
    return () => {
      active = false;
    };
  }, []);

  return release;
}
