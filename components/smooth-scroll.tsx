"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "lenis/dist/lenis.css";

gsap.registerPlugin(ScrollTrigger);

/**
 * Page-wide smooth scrolling (Lenis), driven by GSAP's ticker so every
 * ScrollTrigger reads the same smoothed position on the same frame.
 *
 * In-page links (#top, #about, …) glide to their target; under
 * prefers-reduced-motion Lenis stops smoothing and anchors jump instantly.
 */
export function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      anchors: true,
      stopInertiaOnNavigate: true,
    });

    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
    };
  }, []);

  return null;
}
