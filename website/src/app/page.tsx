import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { InteractiveStage } from "@/components/InteractiveStage";
import { TrustStrip } from "@/components/TrustStrip";
import { FeaturesBento } from "@/components/FeaturesBento";
import { FormatExplorer } from "@/components/FormatExplorer";
import { ToolsShowcase } from "@/components/ToolsShowcase";
import { PrivacySection } from "@/components/PrivacySection";
import { PlatformTable } from "@/components/PlatformTable";
import { DownloadSection } from "@/components/DownloadSection";
import { OpenSourceSection } from "@/components/OpenSourceSection";
import { FaqSection } from "@/components/FaqSection";
import { Footer } from "@/components/Footer";

export default function HomePage() {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-lg focus:bg-[#7C3AED] focus:px-4 focus:py-2 focus:font-mono focus:text-[13px] focus:text-white"
      >
        Skip to content
      </a>

      <Navbar />

      <main id="main-content">
        <Hero />
        <InteractiveStage />
        <TrustStrip />
        <FeaturesBento />
        <FormatExplorer />
        <ToolsShowcase />
        <PrivacySection />
        <PlatformTable />
        <DownloadSection />
        <OpenSourceSection />
        <FaqSection />
      </main>

      <Footer />
    </>
  );
}

