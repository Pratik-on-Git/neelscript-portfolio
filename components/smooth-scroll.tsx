"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "lenis/dist/lenis.css";

gsap.registerPlugin(ScrollTrigger);

let instance: Lenis | null = null;

/**
 * Freeze / release page scrolling (e.g. while the mobile menu is open).
 * Stops Lenis (its stylesheet then clips the root, which also blocks native
 * touch scrolling); without Lenis it falls back to clipping the root itself.
 * Call it synchronously before an in-page link's click reaches Lenis so the
 * anchor glide isn't swallowed by a stopped instance.
 */
export function setScrollLocked(locked: boolean) {
  if (instance) {
    if (locked) instance.stop();
    else instance.start();
    return;
  }
  document.documentElement.style.overflow = locked ? "hidden" : "";
}

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
    instance = lenis;

    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
      if (instance === lenis) instance = null;
    };
  }, []);

  return null;
}
