import { Hero } from "@/components/hero/hero";
import { HeroScene } from "@/components/scene/hero-scene";
import { AboutIntro } from "@/components/scene/about-intro";

export default function Home() {
  return (
    // paper + grain behind everything: the hero dissolves into this
    <main className="ns-page flex flex-1 flex-col bg-[#f2f0eb]">
      {/* the hero's grain, carried across the page */}
      <div className="ns-page-grain" aria-hidden="true" />
      <HeroScene>
        <Hero />
      </HeroScene>
      <AboutIntro />
    </main>
  );
}
