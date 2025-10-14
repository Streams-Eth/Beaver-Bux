import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { AboutSection } from "@/components/about-section"
import { HowToBuySection } from "@/components/how-to-buy-section"
import { TokenomicsSection } from "@/components/tokenomics-section"
import { RoadmapSection } from "@/components/roadmap-section"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <HeroSection />
      <AboutSection />
      <HowToBuySection />
      <TokenomicsSection />
      <RoadmapSection />
      <Footer />
    </main>
  )
}
