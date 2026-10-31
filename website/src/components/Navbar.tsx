"use client";

import { useEffect, useState } from "react";
import { NAV_LINKS, SITE_CONFIG } from "@/config/site";
import { DocyoMark, GitHubIcon, StarIcon } from "@/components/Icons";
import { Magnetic } from "@/components/MagneticButton";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        scrolled || menuOpen
          ? "bg-[#0A0A0B]/84 backdrop-blur-xl border-b border-white/[0.08]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-5 sm:px-8">
        <a
          href="#top"
          className="group inline-flex items-center gap-2.5 text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7C3AED] rounded-md"
        >
          <DocyoMark
            size={30}
            className="transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
          />
          <span className="font-display text-[19px] font-semibold tracking-[-0.025em]">
            {SITE_CONFIG.name}
          </span>
          <span className="hidden sm:inline-flex items-center rounded border border-white/[0.1] bg-[#111114] px-1.5 py-0.5 font-mono text-[10px] tracking-wider text-white/60">
            v0.2
          </span>
        </a>

        <nav aria-label="Primary" className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="nav-underline text-[14px] font-medium text-white/60 transition-colors duration-200 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7C3AED] rounded-sm"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <a
            href={SITE_CONFIG.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/[0.09] bg-[#111114] px-3 text-[13px] font-medium text-white/75 transition-all duration-200 hover:border-white/20 hover:bg-[#17171B] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7C3AED]"
          >
            <GitHubIcon size={15} />
            <span>Star</span>
            <StarIcon size={13} className="text-[#A78BFA]" />
          </a>

          <Magnetic strength={0.2}>
            <a
              href="#download"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-[#7C3AED] px-4 text-[13px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] transition-colors duration-200 hover:bg-[#6D28D9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A78BFA]"
            >
              Download
            </a>
          </Magnetic>
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center gap-2.5 md:hidden">
          <a
            href="#download"
            className="inline-flex h-8 items-center justify-center rounded-md bg-[#7C3AED] px-3 text-[12px] font-medium text-white"
          >
            Download
          </a>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.1] bg-[#111114] text-white focus-visible:outline-2 focus-visible:outline-[#7C3AED]"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              {menuOpen ? (
                <path
                  d="M5 5l10 10M15 5 5 15"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M3.5 6.5h13M3.5 13.5h13"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="border-t border-white/[0.08] bg-[#0A0A0B] px-5 py-4 md:hidden"
        >
          <div className="flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="py-1.5 text-[15px] font-medium text-white/75 hover:text-white"
              >
                {link.label}
              </a>
            ))}
            <a
              href={SITE_CONFIG.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-2 border-t border-white/[0.08] pt-3 text-[14px] font-medium text-white/75 hover:text-white"
            >
              <GitHubIcon size={16} />
              <span>Star on GitHub</span>
              <StarIcon size={14} className="text-[#A78BFA]" />
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
