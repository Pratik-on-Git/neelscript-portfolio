import type { CSSProperties } from "react";
import { WORDMARK_PATH } from "./wordmark-path";
import "./hero.css";

/**
 * Hero: "Your Friendly Neighbourhood Developer".
 *
 * Built 1:1 from the 1920 x 1080 design frame. Every measurement below is a
 * design pixel; the stylesheet maps design pixels onto the viewport through a
 * single unit (--u), so the composition stays pixel-exact at 1920 x 1080 and
 * scales without distortion everywhere else. Portrait viewports switch to a
 * dedicated 1080 x 1600 composition (see hero.css).
 */

const GLYPHS_ID = "neelscript-developer-glyphs";
const BLUR_ID = "neelscript-developer-blur";

/* ---------------------------------------------------------------- grid --- */

/** Grid pitch and phase, measured from the design (lines are 0.5px, 20% ink). */
const GRID = {
  step: 68.7,
  x0: 68.88,
  y0: 62,
  /** Drawn well past the frame so wide / tall viewports never see an edge. */
  minX: -2400,
  maxX: 4320,
  minY: -1800,
  maxY: 2880,
} as const;

const r2 = (n: number) => Math.round(n * 100) / 100;

function buildGridPath() {
  const { step, x0, y0, minX, maxX, minY, maxY } = GRID;
  let d = "";
  for (let k = Math.ceil((minX - x0) / step); x0 + k * step <= maxX; k++) {
    d += `M${r2(x0 + k * step)} ${minY}V${maxY}`;
  }
  for (let k = Math.ceil((minY - y0) / step); y0 + k * step <= maxY; k++) {
    d += `M${minX} ${r2(y0 + k * step)}H${maxX}`;
  }
  return d;
}

const GRID_PATH = buildGridPath();
const GRID_VIEWBOX = `${GRID.minX} ${GRID.minY} ${GRID.maxX - GRID.minX} ${
  GRID.maxY - GRID.minY
}`;

/* ------------------------------------------------------------- content --- */

/**
 * Pill widths are fixed in the design. "Full Stack Web Development" is wider
 * than its pill's content box, and Figma resolves that overflow 0.5px further
 * left than CSS centring does, hence the nudge (dx, design px).
 */
const SERVICES = [
  { label: "Full Stack Web Development", width: 350, dx: -0.5 },
  { label: "Graphic & Visual Designing", width: 326, dx: 0 },
  { label: "Web Designing", width: 209, dx: 0 },
] as const;

/**
 * Background echo of the wordmark: the same glyphs at 1.964399x
 * (2483 / 2528 * 2), offset (-729, -520.774) from the wordmark's own frame,
 * Gaussian-blurred by 3.5 design px. 3.5 / 1.964399 = 1.7817 in glyph units.
 */
const BLOB_BLUR = 1.7817;

type Vars = CSSProperties & Record<`--${string}`, string | number>;

export function Hero() {
  return (
    <section className="ns-hero" aria-labelledby="hero-title">
      <h1 id="hero-title" className="ns-hero__sr">
        Neelscript, your friendly neighbourhood developer
      </h1>

      {/* Shared glyph geometry: defined once, drawn twice (echo + wordmark). */}
      <svg className="ns-hero__defs" aria-hidden="true" focusable="false">
        <defs>
          <path id={GLYPHS_ID} d={WORDMARK_PATH} fillRule="evenodd" />
          <filter
            id={BLUR_ID}
            x="-4%"
            y="-4%"
            width="108%"
            height="108%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur stdDeviation={BLOB_BLUR} />
          </filter>
        </defs>
      </svg>

      <div className="ns-hero__stage">
        {/* 1 · blurred echo of the wordmark */}
        <svg
          className="ns-hero__echo"
          viewBox="-16 -16 1296 1112"
          aria-hidden="true"
          focusable="false"
        >
          <use href={`#${GLYPHS_ID}`} filter={`url(#${BLUR_ID})`} />
        </svg>

        {/* 2 · drafting grid */}
        <svg
          className="ns-hero__grid"
          viewBox={GRID_VIEWBOX}
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          <path d={GRID_PATH} />
        </svg>

        {/* 3 · footer line (sits under the echo layer in the design stack) */}
        <p className="ns-hero__text ns-hero__footer">
          Designs &amp; Dev | 2026
        </p>

        {/* 4 · services */}
        <ul className="ns-hero__services" aria-label="Services">
          {SERVICES.map(({ label, width, dx }, i) => (
            <li
              key={label}
              className="ns-hero__chip"
              style={{ "--w": width, "--dx": dx, "--i": i } as Vars}
            >
              <span className="ns-hero__chip-label">{label}</span>
            </li>
          ))}
        </ul>

        {/* 5 · tagline */}
        <p className="ns-hero__text ns-hero__tagline" aria-hidden="true">
          Your Friendly Neighbourhood
        </p>

        {/* 6 · lockup: wordmark + "Neelscript" multiplayer cursor */}
        <div className="ns-hero__lockup" aria-hidden="true">
          <svg
            className="ns-hero__wordmark"
            viewBox="-8 290 1280 442"
            focusable="false"
          >
            <use href={`#${GLYPHS_ID}`} />
          </svg>

          <div className="ns-hero__presence">
            <svg
              className="ns-hero__cursor"
              viewBox="0 0 46 54"
              focusable="false"
            >
              <path d="M10.4 0 21.25 23.3 46 27 0 54Z" />
            </svg>
            <div className="ns-hero__label">
              <span className="ns-hero__label-text">Neelscript</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
