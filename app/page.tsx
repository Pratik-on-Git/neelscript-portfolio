import { Hero } from "@/components/hero/hero";
import { HeroScene } from "@/components/scene/hero-scene";
import { AboutIntro } from "@/components/scene/about-intro";

export default function Home() {
  return (
    // paper behind everything: the hero's diagonal cut reveals this
    <main className="flex flex-1 flex-col bg-[#f2f0eb]">
      <HeroScene>
        <Hero />
      </HeroScene>
      <AboutIntro />
    </main>
  );
}
