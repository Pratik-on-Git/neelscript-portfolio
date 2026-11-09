"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import "./scene.css";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export type Fact = { label: string; value: string };

/** Edit these to your own details. */
const DEFAULT_FACTS: readonly Fact[] = [
  { label: "Location", value: "India · Worldwide" },
  { label: "Field", value: "Design & Development" },
  { label: "Approach", value: "Less but better" },
  { label: "Clients", value: "Startups & creative brands" },
];

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789&/#*+<>";

/** types `text` into `el` left to right through random glyphs */
function scramble(el: HTMLElement, text: string, duration = 0.7, delay = 0) {
  const state = { p: 0 };
  return gsap.to(state, {
    p: 1,
    duration,
    delay,
    ease: "none",
    onUpdate: () => {
      const shown = Math.floor(state.p * text.length);
      let out = text.slice(0, shown);
      for (let i = shown; i < text.length; i++) {
        const ch = text[i];
        out += ch === " " ? " " : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
    },
    onComplete: () => {
      el.textContent = text;
    },
  });
}

/**
 * The section the hero dissolves into, on the hero's paper: a full-bleed
 * facts grid: four columns whose hairline dividers run the section's full
 * height, hairlines above and below the row reaching the screen edges, and
 * "+" marks where the outer columns cross them. Values type themselves in
 * as it enters and re-scramble on hover.
 */
export function AboutIntro({
  label = "About us",
  facts = DEFAULT_FACTS,
}: {
  label?: string;
  facts?: readonly Fact[];
}) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // the section rises a touch as the hero peels away above it
        gsap.fromTo(
          ".ns-about__inner",
          { yPercent: 4 },
          {
            yPercent: 0,
            ease: "none",
            scrollTrigger: { trigger: el, start: "top bottom", end: "top top", scrub: 0.6 },
          },
        );

        // facts grid
        const values = gsap.utils.toArray<HTMLElement>(".ns-fact__value");
        values.forEach((v) => (v.textContent = ""));
        gsap
          .timeline({ scrollTrigger: { trigger: ".ns-facts", start: "top 85%", once: true } })
          .from(".ns-facts__guide", {
            scaleY: 0,
            duration: 1.3,
            ease: "expo.inOut",
            stagger: 0.07,
          })
          .from(
            ".ns-facts__line",
            { scaleX: 0, duration: 1.2, ease: "expo.inOut", stagger: 0.1 },
            0.15,
          )
          .from(
            ".ns-facts__cross",
            { scale: 0, rotate: -90, duration: 0.8, ease: "back.out(2)", stagger: 0.06 },
            0.7,
          )
          .from(
            ".ns-fact__label",
            { yPercent: 110, duration: 0.8, ease: "expo.out", stagger: 0.08 },
            0.75,
          )
          .add(() => {
            values.forEach((v, i) =>
              scramble(v, v.dataset.text ?? "", 0.55 + (v.dataset.text ?? "").length * 0.02, i * 0.12),
            );
          }, 0.95);

        // hover / focus: re-scramble that column's value
        const cells = gsap.utils.toArray<HTMLElement>(".ns-fact");
        const running = new WeakMap<HTMLElement, gsap.core.Tween>();
        const onEnter = (ev: Event) => {
          const v = (ev.currentTarget as HTMLElement).querySelector<HTMLElement>(".ns-fact__value");
          if (!v || running.get(v)?.isActive()) return;
          running.set(v, scramble(v, v.dataset.text ?? "", 0.45));
        };
        cells.forEach((c) => {
          c.addEventListener("pointerenter", onEnter);
          c.addEventListener("focus", onEnter);
        });
        return () => {
          cells.forEach((c) => {
            c.removeEventListener("pointerenter", onEnter);
            c.removeEventListener("focus", onEnter);
          });
          values.forEach((v) => (v.textContent = v.dataset.text ?? ""));
        };
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <section ref={ref} id="about" className="ns-about" aria-labelledby="ns-about-label">
      <div className="ns-about__inner">
        <h2 id="ns-about-label" className="ns-hero__sr">
          {label}
        </h2>

        <div className="ns-facts">
          {/* column guides: run the section's full height */}
          <div className="ns-facts__guides" aria-hidden="true">
            {facts.map((f) => (
              <span key={f.label} className="ns-facts__guide" />
            ))}
            <span className="ns-facts__guide ns-facts__guide--end" />
          </div>

          <div className="ns-facts__band">
            <span className="ns-facts__line ns-facts__line--top" aria-hidden="true" />
            <span className="ns-facts__line ns-facts__line--bottom" aria-hidden="true" />
            <span className="ns-facts__cross ns-facts__cross--tl" aria-hidden="true" />
            <span className="ns-facts__cross ns-facts__cross--tr" aria-hidden="true" />
            <span className="ns-facts__cross ns-facts__cross--bl" aria-hidden="true" />
            <span className="ns-facts__cross ns-facts__cross--br" aria-hidden="true" />

            <dl className="ns-facts__row">
              {facts.map((f) => (
                <div key={f.label} className="ns-fact" tabIndex={0}>
                  <dt className="ns-fact__label-wrap">
                    <span className="ns-fact__label">{f.label}</span>
                  </dt>
                  <dd className="ns-fact__value-wrap">
                    <span className="ns-fact__value" data-text={f.value} aria-hidden="true">
                      {f.value}
                    </span>
                    <span className="ns-hero__sr">{f.value}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
