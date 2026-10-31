import { DOWNLOAD_CONFIG, NAV_LINKS, SITE_CONFIG } from "@/config/site";
import { DocyoMark } from "@/components/Icons";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#0A0A0B] py-14">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        <div className="flex flex-col justify-between gap-10 md:flex-row md:items-center">
          <div>
            <a
              href="#top"
              className="inline-flex items-center gap-2.5 text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7C3AED] rounded-md"
            >
              <DocyoMark size={28} />
              <span className="font-display text-[18px] font-semibold tracking-[-0.025em]">
                {SITE_CONFIG.name}
              </span>
            </a>
            <p className="mt-2 font-mono text-[12px] text-white/45">
              {SITE_CONFIG.tagline} Private, offline, non-destructive.
            </p>
          </div>

          <nav
            aria-label="Footer"
            className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13.5px] text-white/60"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="nav-underline transition-colors hover:text-white"
              >
                {link.label}
              </a>
            ))}
            <a
              href={DOWNLOAD_CONFIG.allReleasesUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="nav-underline transition-colors hover:text-white"
            >
              Releases
            </a>
            <a
              href={SITE_CONFIG.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="nav-underline transition-colors hover:text-white"
            >
              GitHub
            </a>
          </nav>
        </div>

        <div className="mt-10 flex flex-col justify-between gap-3 border-t border-white/[0.07] pt-6 font-mono text-[12px] text-white/40 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>
              Licensed under{" "}
              <a
                href={SITE_CONFIG.licenseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/65 hover:text-white"
              >
                {SITE_CONFIG.license}
              </a>
            </span>
            <span className="text-white/20">·</span>
            <span>v{DOWNLOAD_CONFIG.version}</span>
          </div>

          <div>
            Made by{" "}
            <a
              href={SITE_CONFIG.author.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/75 transition-colors hover:text-[#A78BFA]"
            >
              {SITE_CONFIG.author.name}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
