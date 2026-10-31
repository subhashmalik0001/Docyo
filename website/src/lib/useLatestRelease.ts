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

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return DEFAULT_MAC.size;
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

async function fetchLatestMacAsset(): Promise<ResolvedMacRelease> {
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
      const assets: Array<{
        name?: string;
        size?: number;
        state?: string;
        browser_download_url?: string;
      }> = Array.isArray(data.assets) ? data.assets : [];

      const macZip =
        assets.find(
          (a) =>
            a.state === "uploaded" &&
            typeof a.name === "string" &&
            /macOS\.zip$/i.test(a.name) &&
            typeof a.browser_download_url === "string" &&
            a.browser_download_url.startsWith(
              "https://github.com/subhashmalik0001/Docyo/releases/download/"
            )
        ) ?? null;

      if (!macZip || !macZip.browser_download_url || !macZip.name) {
        return DEFAULT_MAC;
      }

      const resolved: ResolvedMacRelease = {
        version: cleanVersion || DEFAULT_MAC.version,
        assetName: macZip.name,
        size: typeof macZip.size === "number" ? formatBytes(macZip.size) : DEFAULT_MAC.size,
        downloadUrl: macZip.browser_download_url,
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
 * Provides a direct binary `.zip` download URL immediately on initial render,
 * and upgrades automatically if a newer macOS release is published on GitHub.
 */
export function useLatestMacRelease(): ResolvedMacRelease {
  const [release, setRelease] = useState<ResolvedMacRelease>(
    cachedRelease ?? DEFAULT_MAC
  );

  useEffect(() => {
    let active = true;
    fetchLatestMacAsset().then((resolved) => {
      if (active) setRelease(resolved);
    });
    return () => {
      active = false;
    };
  }, []);

  return release;
}

