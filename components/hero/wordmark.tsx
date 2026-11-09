"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { LETTERS } from "./letters";
import { GLYPHS_ID } from "./wordmark-path";

gsap.registerPlugin(useGSAP);

/* =============================================================================
   "Developer": soft-body balloon type.

   Every letter is its own SVG path. Its transform is composed every frame
   from four independent layers, each driven by its own GSAP tweens:

     enter  inflate from a small blob below the baseline (elastic landing)
     float  idle breathing: slow, out-of-phase sine drift, never in sync
     field  pointer proximity: swell + lean away, like pressing into jelly
     boing  squash & stretch: wobble on hover, jump + domino ripple on click

   Letters are complete shapes (hidden parts reconstructed, see letters.ts),
   stacked back to front. Each one is masked by its front neighbour's
   occluder (silhouette + outline gap), which moves with that neighbour:
   at rest it is the artwork exactly; in motion every letter is whole and
   keeps a real, see-through outline wherever letters overlap.
   ========================================================================== */

type Layer = { x: number; y: number; r: number; sx: number; sy: number };
type LetterState = Record<"enter" | "float" | "field" | "boing", Layer>;

const layer = (): Layer => ({ x: 0, y: 0, r: 0, sx: 1, sy: 1 });
const RAD = Math.PI / 180;

/** Pointer field radius and response (design px / degrees). */
const FIELD = { radius: 300, push: 16, lift: 10, lean: 6, swell: 0.075 };

export function Wordmark() {
  const svgRef = useRef<SVGSVGElement>(null);

  useGSAP(
    () => {
      const svg = svgRef.current;
      if (!svg) return;
      const paths = Array.from(
        svg.querySelectorAll<SVGPathElement>(".ns-hero__glyph"),
      ).sort((a, b) => Number(a.dataset.i) - Number(b.dataset.i));
      // occluders[i] travels with letter i (cut out of letter i + 1)
      const occluders = LETTERS.map((_, i) =>
        svg.querySelector<SVGPathElement>(`#ns-occluder-${i}`),
      );

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const hero = svg.closest<HTMLElement>(".ns-hero");
        const echo = hero?.querySelector<SVGSVGElement>(".ns-hero__echo");

        /* --- state ---------------------------------------------------- */
        const states: LetterState[] = LETTERS.map(() => ({
          enter: layer(),
          float: layer(),
          field: layer(),
          boing: layer(),
        }));
        const pivots = LETTERS.map(
          (l) => [l.centroid[0], l.box[3]] as const, // base-centre
        );
        const last: string[] = LETTERS.map(() => "");
        const parallax = { x: 0, y: 0 };

        /* --- render: compose layers → one matrix per letter ----------- */
        let visible = true;
        const render = () => {
          if (!visible) return;
          for (let i = 0; i < paths.length; i++) {
            const { enter: e, float: f, field: p, boing: b } = states[i];
            const tx = e.x + f.x + p.x + b.x;
            const ty = e.y + f.y + p.y + b.y;
            const rot = (e.r + f.r + p.r + b.r) * RAD;
            const sx = e.sx * f.sx * p.sx * b.sx;
            const sy = e.sy * f.sy * p.sx * b.sy; // field swell is uniform
            const [px, py] = pivots[i];
            const cos = Math.cos(rot);
            const sin = Math.sin(rot);
            const a = cos * sx;
            const bb = sin * sx;
            const c = -sin * sy;
            const d = cos * sy;
            const ex = px + tx - (a * px + c * py);
            const ey = py + ty - (bb * px + d * py);
            const m = `matrix(${a.toFixed(5)} ${bb.toFixed(5)} ${c.toFixed(
              5,
            )} ${d.toFixed(5)} ${ex.toFixed(3)} ${ey.toFixed(3)})`;
            if (m !== last[i]) {
              paths[i].setAttribute("transform", m);
              occluders[i]?.setAttribute("transform", m);
              last[i] = m;
            }
          }
          if (echo) {
            echo.style.setProperty("--ex", parallax.x.toFixed(2));
            echo.style.setProperty("--ey", parallax.y.toFixed(2));
          }
        };
        gsap.ticker.add(render);

        /* only animate while the hero is on screen */
        const io = new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
        });
        io.observe(svg);

        /* --- 1 · entrance: inflate ------------------------------------ */
        // Hydrated late (slow device)? The CSS fallback has already shown
        // the letters, so skip the entrance rather than pop them out again.
        const late = performance.now() > 1400;
        svg.setAttribute("data-live", "");
        const entranceEnd = late ? 0 : 0.2 + LETTERS.length * 0.065 + 1.1;

        if (!late) {
          states.forEach((s, i) => {
            const delay = 0.2 + i * 0.065;
            Object.assign(s.enter, {
              y: 70,
              sx: 0.4,
              sy: 0.4,
              r: gsap.utils.random(-16, 16),
            });
            gsap.set(paths[i], { opacity: 0 });
            gsap.to(paths[i], { opacity: 1, duration: 0.3, delay });
            gsap.to(s.enter, {
              y: 0,
              r: 0,
              duration: 1.1,
              delay,
              ease: "back.out(1.6)",
            });
            gsap.to(s.enter, {
              sx: 1,
              sy: 1,
              duration: 1.5,
              delay,
              ease: "elastic.out(1, 0.6)", // one soft overshoot, ~8%
            });
          });
          // parallax echo settles in with the letters
          gsap.from(parallax, { y: 24, duration: 2.2, ease: "expo.out" });
        }

        /* --- 2 · idle: out-of-phase breathing ------------------------- */
        states.forEach((s, i) => {
          const dir = i % 2 ? -1 : 1;
          const amp = gsap.utils.random(2.2, 3.6) * dir;
          const rAmp = gsap.utils.random(0.6, 1.2) * -dir;
          const period = gsap.utils.random(2.6, 3.8);
          const start = entranceEnd - 0.4 + i * 0.12;
          const breathe = (prop: keyof Layer, to: number, p: number) =>
            gsap
              .timeline({ delay: start })
              .to(s.float, { [prop]: to, duration: p / 2, ease: "sine.out" })
              .to(s.float, {
                [prop]: prop === "sx" || prop === "sy" ? 2 - to : -to,
                duration: p,
                ease: "sine.inOut",
                repeat: -1,
                yoyo: true,
              });
          breathe("y", amp, period);
          breathe("r", rAmp, period * 1.37);
          const swell = 1 + gsap.utils.random(0.006, 0.012);
          breathe("sx", swell, period * 0.83);
          breathe("sy", swell, period * 0.83);
        });

        /* --- 3 · pointer field ---------------------------------------- */
        const fieldTo = states.map((s) => ({
          x: gsap.quickTo(s.field, "x", { duration: 0.9, ease: "power3.out" }),
          y: gsap.quickTo(s.field, "y", { duration: 0.9, ease: "power3.out" }),
          r: gsap.quickTo(s.field, "r", {
            duration: 1.2,
            ease: "elastic.out(1, 0.4)",
          }),
          s: gsap.quickTo(s.field, "sx", {
            duration: 1.1,
            ease: "elastic.out(1, 0.35)",
          }),
        }));
        const parX = gsap.quickTo(parallax, "x", {
          duration: 1.4,
          ease: "power3.out",
        });
        const parY = gsap.quickTo(parallax, "y", {
          duration: 1.4,
          ease: "power3.out",
        });

        const pt = new DOMPoint();
        let speed = 0;
        let lastX = 0;
        let lastY = 0;
        let lastT = 0;

        const onMove = (ev: PointerEvent) => {
          const ctm = svg.getScreenCTM();
          if (!ctm || !visible) return;
          pt.x = ev.clientX;
          pt.y = ev.clientY;
          const p = pt.matrixTransform(ctm.inverse());

          // speed in design px / ms, smoothed
          const now = ev.timeStamp;
          const dt = Math.max(now - lastT, 8);
          const v = Math.hypot(p.x - lastX, p.y - lastY) / dt;
          speed = speed * 0.7 + Math.min(v, 6) * 0.3;
          lastX = p.x;
          lastY = p.y;
          lastT = now;

          for (let i = 0; i < LETTERS.length; i++) {
            const [cx, cy] = LETTERS[i].centroid;
            const dx = cx - p.x;
            const dy = cy - p.y;
            const dist = Math.max(Math.hypot(dx, dy), 1);
            const k = Math.max(0, 1 - dist / FIELD.radius) ** 2;
            const nx = dx / dist;
            const ny = dy / dist;
            fieldTo[i].x(nx * FIELD.push * k);
            fieldTo[i].y(ny * FIELD.lift * k);
            fieldTo[i].r(nx * FIELD.lean * k);
            fieldTo[i].s(1 + FIELD.swell * k);
          }

          // echo drifts the other way, a little: depth
          const rect = hero?.getBoundingClientRect();
          if (rect) {
            const ux = (ev.clientX - rect.left) / rect.width - 0.5;
            const uy = (ev.clientY - rect.top) / rect.height - 0.5;
            parX(-ux * 28);
            parY(-uy * 18);
          }
        };

        const onLeave = () => {
          for (const f of fieldTo) {
            f.x(0);
            f.y(0);
            f.r(0);
            f.s(1);
          }
          parX(0);
          parY(0);
        };

        /* --- 4 · squash & stretch ------------------------------------- */
        const wobble = (i: number, power: number) => {
          const b = states[i].boing;
          if (gsap.isTweening(b)) return;
          const p = gsap.utils.clamp(0.35, 1, power);
          const side = gsap.utils.random([-1, 1]);
          gsap
            .timeline()
            .to(b, {
              sx: 1 + 0.16 * p,
              sy: 1 - 0.13 * p,
              r: 3 * p * side,
              duration: 0.12,
              ease: "power2.out",
            })
            .to(b, {
              sx: 1,
              sy: 1,
              r: 0,
              duration: 1.3,
              ease: "elastic.out(1.1, 0.25)",
            });
        };

        const jump = (i: number, scale: number, delay: number) => {
          const b = states[i].boing;
          gsap.killTweensOf(b);
          const h = 46 * scale;
          gsap
            .timeline({ delay })
            // anticipation
            .to(b, {
              sx: 1 + 0.14 * scale,
              sy: 1 - 0.18 * scale,
              y: 0,
              r: 0,
              duration: 0.1,
              ease: "power2.out",
            })
            // take-off: stretch
            .to(b, {
              y: -h,
              sx: 1 - 0.1 * scale,
              sy: 1 + 0.14 * scale,
              duration: 0.26,
              ease: "power3.out",
            })
            .to(b, { sx: 1, sy: 1, duration: 0.12, ease: "sine.inOut" }, "<0.12")
            // fall
            .to(b, { y: 0, duration: 0.24, ease: "power2.in" })
            // landing squash
            .to(b, {
              sx: 1 + 0.16 * scale,
              sy: 1 - 0.16 * scale,
              duration: 0.08,
              ease: "power2.out",
            })
            .to(b, {
              sx: 1,
              sy: 1,
              duration: 1.1,
              ease: "elastic.out(1.2, 0.3)",
            });
        };

        const onEnter = (ev: PointerEvent) => {
          const i = Number((ev.currentTarget as SVGPathElement).dataset.i);
          wobble(i, 0.35 + speed * 0.5);
        };

        const onDown = (ev: PointerEvent) => {
          const i = Number((ev.currentTarget as SVGPathElement).dataset.i);
          // domino ripple: the hit letter jumps, neighbours answer smaller
          for (let j = 0; j < LETTERS.length; j++) {
            const n = Math.abs(j - i);
            if (n > 4) continue;
            jump(j, 0.72 ** n, n * 0.07);
          }
        };

        window.addEventListener("pointermove", onMove, { passive: true });
        document.documentElement.addEventListener("pointerleave", onLeave);
        hero?.addEventListener("pointerleave", onLeave);
        paths.forEach((p) => {
          p.addEventListener("pointerenter", onEnter);
          p.addEventListener("pointerdown", onDown);
        });

        return () => {
          gsap.ticker.remove(render);
          io.disconnect();
          window.removeEventListener("pointermove", onMove);
          document.documentElement.removeEventListener("pointerleave", onLeave);
          hero?.removeEventListener("pointerleave", onLeave);
          paths.forEach((p) => {
            p.removeEventListener("pointerenter", onEnter);
            p.removeEventListener("pointerdown", onDown);
            p.removeAttribute("transform");
          });
          occluders.forEach((o) => o?.removeAttribute("transform"));
          echo?.style.removeProperty("--ex");
          echo?.style.removeProperty("--ey");
          svg.removeAttribute("data-live");
        };
      });

      return () => mm.revert();
    },
    { scope: svgRef },
  );

  // Back-to-front: r … D. Each letter (except D, which nothing covers) is
  // masked by its front neighbour's occluder. Masks sit on an untransformed
  // <g>, so the occluder's own transform is read in wordmark space.
  const order = LETTERS.map((_, i) => LETTERS.length - 1 - i);
  const PAD = 90; // room for jumps (46) + pushes (16) + swell, per mask

  return (
    <svg
      ref={svgRef}
      className="ns-hero__wordmark"
      viewBox="-8 290 1280 442"
      focusable="false"
      aria-hidden="true"
    >
      <defs>
        {LETTERS.map((l, i) =>
          l.occluder ? (
            <path
              key={`o${i}`}
              id={`ns-occluder-${i}`}
              d={l.occluder}
              fillRule="evenodd"
            />
          ) : null,
        )}
        {LETTERS.map((l, i) => {
          if (i === 0) return null;
          const [x0, y0, x1, y1] = l.box;
          const box = {
            x: x0 - PAD,
            y: y0 - PAD,
            width: x1 - x0 + PAD * 2,
            height: y1 - y0 + PAD * 2,
          };
          return (
            <mask
              key={`m${i}`}
              id={`ns-letter-mask-${i}`}
              maskUnits="userSpaceOnUse"
              {...box}
            >
              <rect {...box} fill="#fff" />
              <use href={`#ns-occluder-${i - 1}`} fill="#000" />
            </mask>
          );
        })}
      </defs>

      {/* Static views (reduced motion, no JS, before hydration): the exact
          single-piece artwork. */}
      <use href={`#${GLYPHS_ID}`} className="ns-hero__wordmark-art" />

      {/* Live: nine complete letters, swapped in once the animation runs. */}
      <g className="ns-hero__letters">
        {order.map((i) => (
          <g key={i} mask={i > 0 ? `url(#ns-letter-mask-${i})` : undefined}>
            <path
              id={`ns-letter-${i}`}
              className="ns-hero__glyph"
              data-i={i}
              d={LETTERS[i].d}
              fillRule="evenodd"
            />
          </g>
        ))}
      </g>
    </svg>
  );
}
