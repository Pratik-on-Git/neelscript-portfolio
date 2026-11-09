"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import "./scene.css";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Wraps the hero so it leaves on a diagonal: as the page scrolls, its bottom
 * edge is cut by a polygon whose right side lifts faster than its left (the
 * cut rises and steepens), while the hero's content drifts down a little
 * (parallax), uncovering the next section beneath a soft shadow.
 *
 * Progress (0 → 1, hero top at the viewport top → hero bottom at the top)
 * is written to `--p` on the wrapper; the geometry lives in scene.css.
 */
export function HeroScene({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        el.setAttribute("data-live", "");
        const state = { p: 0 };
        const write = () => el.style.setProperty("--p", state.p.toFixed(4));
        gsap.to(state, {
          p: 1,
          ease: "none",
          onUpdate: write,
          scrollTrigger: {
            trigger: el,
            start: "top top",
            end: "bottom top",
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        });
        return () => {
          el.removeAttribute("data-live");
          el.style.removeProperty("--p");
        };
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className="ns-scene">
      <div className="ns-scene__clip">
        <div className="ns-scene__drift">{children}</div>
      </div>
    </div>
  );
}
