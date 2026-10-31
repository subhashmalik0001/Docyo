import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { DOWNLOAD_CONFIG, SITE_CONFIG } from "@/config/site";
import { SmoothScroll } from "@/components/SmoothScroll";

const satoshi = localFont({
  src: [
    {
      path: "../fonts/satoshi-400.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/satoshi-500.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/satoshi-700.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-satoshi",
  display: "swap",
});

const clashDisplay = localFont({
  src: [
    {
      path: "../fonts/clash-display-500.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/clash-display-600.woff2",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-clash",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0A0A0B",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  title: {
    default: `${SITE_CONFIG.name} — ${SITE_CONFIG.tagline} Private, Offline File Converter`,
    template: `%s · ${SITE_CONFIG.name}`,
  },
  description: SITE_CONFIG.description,
  applicationName: SITE_CONFIG.name,
  authors: [{ name: SITE_CONFIG.author.name, url: SITE_CONFIG.author.github }],
  creator: SITE_CONFIG.author.name,
  keywords: [
    "Docyo",
    "offline file converter",
    "macOS radial wheel converter",
    "local PDF toolkit",
    "HEIC to PNG offline",
    "MacBook notch companion",
    "private media converter",
    "open source file converter",
    "Windows portable file converter",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: SITE_CONFIG.url,
    siteName: SITE_CONFIG.name,
    title: `${SITE_CONFIG.name} — ${SITE_CONFIG.tagline}`,
    description: SITE_CONFIG.description,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Docyo — Drag. Hold Shift. Convert. Private offline file converter and 25-tool document toolkit.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_CONFIG.name} — ${SITE_CONFIG.tagline}`,
    description: SITE_CONFIG.description,
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_CONFIG.name,
    headline: SITE_CONFIG.tagline,
    description: SITE_CONFIG.description,
    image: `${SITE_CONFIG.url}/docyo-logo-512.png`,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "macOS 26.0+, Windows 10/11 x64, Ubuntu 24.04+ x64",
    softwareVersion: DOWNLOAD_CONFIG.version,
    downloadUrl: DOWNLOAD_CONFIG.releasesLatestUrl,
    license: SITE_CONFIG.licenseUrl,
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    author: {
      "@type": "Person",
      name: SITE_CONFIG.author.name,
      url: SITE_CONFIG.author.github,
    },
    codeRepository: SITE_CONFIG.repoUrl,
  };

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${satoshi.variable} ${clashDisplay.variable} ${GeistMono.variable}`}
    >
      <body
        suppressHydrationWarning
        className="bg-[#0A0A0B] text-white antialiased"
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
