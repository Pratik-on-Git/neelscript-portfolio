"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

/* =============================================================================
   Trail pointer: a "you are here" pointer that flies in along a dashed trail,
   taps the D, lifts off, and then roams the whole hero like a real hand on a
   mouse: free, curving routes through random waypoints, quick in the middle,
   careful on landing, approaching each letter from whichever side is open
   (top, corners, bottom, the D's left, the r's right) and tapping it. Every
   tap fires that letter's jump in the wordmark, so the pointer and the
   letters read as one system.

   The dashed trail is the path its tip has travelled: a fixed, smooth line
   (written once, never re-fitted, so it never shimmers) that fades and
   tapers toward its oldest end, keeps flowing into the pointer, and
   retracts whenever it rests. It never taps the same letter twice in a row.

   Everything is in design px (1920 x 1080 frame).
   ========================================================================== */

type Pt = readonly [number, number];

/** pointer outline, local to its pivot: tip, left wing, notch, tail */
const VERTS: readonly Pt[] = [
  [58.7, -56],
  [-59.3, -8],
  [-10.3, 9],
  [15.7, 56],
];
const RADIUS = 8.48;
/** rendered size of the pointer (outline, halo and shadow scale with it) */
const SIZE = 0.6;
/** where the trail plugs into the pointer (local, tucked under the halo) */
const ATTACH: Pt = [-18, 30];
const TIP = VERTS[0];
const TIP_ANGLE = Math.atan2(TIP[1], TIP[0]); // radians
const DEG = 180 / Math.PI;

/** rotation (deg) that makes the tip point along `angleDeg` */
const rotFor = (angleDeg: number) => angleDeg - TIP_ANGLE * DEG;

/** pivot that puts the tip on `tip` at rotation `rotDeg` */
function pivotFor(tip: Pt, rotDeg: number): Pt {
  const r = rotDeg / DEG;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [
    tip[0] - (TIP[0] * c - TIP[1] * s) * SIZE,
    tip[1] - (TIP[0] * s + TIP[1] * c) * SIZE,
  ];
}

/** a local point of the pointer, in the frame */
function toFrame(pivot: Pt, rotDeg: number, local: Pt, scale = SIZE): Pt {
  const r = rotDeg / DEG;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [
    pivot[0] + (local[0] * c - local[1] * s) * scale,
    pivot[1] + (local[0] * s + local[1] * c) * scale,
  ];
}

/** Where letters can be tapped: the edge of the letter facing the open side
    and the direction the tip points to tap into it. Measured off the artwork;
    spots whose approach would cross another letter, the tagline, the menu,
    the Neelscript tag or the chips are left out. */
const ANCHORS: readonly { i: number; tip: Pt; angle: number }[] = [
  { i: 0, tip: [369.5, 683.5], angle: -45 }, // D lower-left (design rest)
  { i: 0, tip: [471, 301], angle: 90 }, // D top
  { i: 0, tip: [633.5, 359], angle: 135 }, // D upper-right
  { i: 0, tip: [362, 339], angle: 45 }, // D upper-left
  { i: 0, tip: [460, 717.5], angle: -90 }, // D bottom
  { i: 0, tip: [636.5, 640.5], angle: -135 }, // D lower-right
  { i: 0, tip: [328, 414], angle: 0 }, // D left
  { i: 1, tip: [737.5, 424.5], angle: 90 }, // e top
  { i: 1, tip: [726.5, 669.5], angle: -90 }, // e bottom
  { i: 1, tip: [782.5, 646], angle: -135 }, // e lower-right
  { i: 1, tip: [665, 642.5], angle: -45 }, // e lower-left
  { i: 2, tip: [889, 390], angle: 90 }, // v top
  { i: 2, tip: [911, 397], angle: 135 }, // v upper-right
  { i: 2, tip: [787, 412], angle: 45 }, // v upper-left
  { i: 2, tip: [838, 673], angle: -90 }, // v bottom
  { i: 2, tip: [868, 660], angle: -135 }, // v lower-right
  { i: 2, tip: [818, 663.5], angle: -45 }, // v lower-left
  { i: 3, tip: [964, 438], angle: 90 }, // e top
  { i: 3, tip: [948, 682], angle: -90 }, // e bottom
  { i: 3, tip: [1008.5, 657.5], angle: -135 }, // e lower-right
  { i: 3, tip: [902, 657.5], angle: -45 }, // e lower-left
  { i: 4, tip: [1024.5, 310], angle: 45 }, // l upper-left
  { i: 4, tip: [1054, 680], angle: -90 }, // l bottom
  { i: 4, tip: [1115, 649], angle: -135 }, // l lower-right
  { i: 4, tip: [1021, 662], angle: -45 }, // l lower-left
  { i: 5, tip: [1153.5, 664.5], angle: -90 }, // o bottom
  { i: 5, tip: [1124.5, 649.5], angle: -45 }, // o lower-left
  { i: 6, tip: [1295, 710.5], angle: -135 }, // p lower-right
  { i: 6, tip: [1231, 705.5], angle: -45 }, // p lower-left
  { i: 7, tip: [1403, 682], angle: -90 }, // e bottom
  { i: 7, tip: [1461, 656], angle: -135 }, // e lower-right
  { i: 8, tip: [1591.5, 470.5], angle: 180 }, // r right
  { i: 8, tip: [1578, 437.5], angle: 135 }, // r upper-right
  { i: 8, tip: [1528, 696], angle: -90 }, // r bottom
  { i: 8, tip: [1555.5, 686], angle: -135 }, // r lower-right
  { i: 8, tip: [1486, 674.5], angle: -45 }, // r lower-left
];

/** where the pointer may roam (design px) */
const BOUNDS = { x0: 70, x1: 1850, y0: 150, y1: 1000 };
/** keep-out boxes for free waypoints: tagline, menu, tag, chips, footer */
const KEEP_OUT = [
  [640, 160, 1280, 232],
  [560, 30, 1360, 130],
  [1060, 200, 1520, 430],
  [470, 775, 1450, 845],
  [840, 950, 1080, 995],
] as const;

/* --- the design's rest pose and trail --------------------------------- */

const REST_ANGLE = TIP_ANGLE * DEG; // the design's pointer angle
const REST_TIP: Pt = [371.7, 683];
const REST_ROT = rotFor(REST_ANGLE);
const REST_PIVOT = pivotFor(REST_TIP, REST_ROT);
const REST_TAIL = toFrame(REST_PIVOT, REST_ROT, ATTACH);

/** the design's trail, measured off the Figma frame: it comes in from
    off-frame, crests softly near x 48, dips into a round trough near x 155,
    then climbs steeply into the pointer's tail */
const TRAIL_POINTS: readonly Pt[] = [
  [-99, 852],
  [0, 844],
  [48, 840],
  [100, 851],
  [155, 864],
  [205, 849],
  [250, 812],
  [290, 772],
  REST_TAIL,
];

/** smooth Catmull-Rom spline through points → SVG cubic segments */
function splineD(p: readonly Pt[], from = 0, to = p.length - 1, lead = true) {
  const f = (x: number) => x.toFixed(1);
  const at = (i: number): Pt => {
    if (i < 0) return [2 * p[0][0] - p[1][0], 2 * p[0][1] - p[1][1]];
    if (i >= p.length) {
      const n = p.length - 1;
      return [2 * p[n][0] - p[n - 1][0], 2 * p[n][1] - p[n - 1][1]];
    }
    return p[i];
  };
  let d = lead ? `M${f(p[from][0])} ${f(p[from][1])}` : "";
  for (let i = from; i < to; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(
      p2[0] - (p3[0] - p1[0]) / 6,
    )} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}

const TRAIL_REST = `M-1700 ${TRAIL_POINTS[0][1]}L${TRAIL_POINTS[0][0]} ${TRAIL_POINTS[0][1]}${splineD(
  [[-199, TRAIL_POINTS[0][1]], ...TRAIL_POINTS],
  1,
  TRAIL_POINTS.length,
  false,
)}`;

/** polygon with every corner rounded (quadratic fillets) */
function roundedPolygon(v: readonly Pt[], r: number) {
  const n = v.length;
  const near = (a: Pt, b: Pt, d: number): Pt => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy);
    const k = Math.min(d, l / 2) / l;
    return [a[0] + dx * k, a[1] + dy * k];
  };
  const f = (x: number) => Math.round(x * 100) / 100;
  let d = "";
  for (let i = 0; i <= n; i++) {
    const cur = v[i % n];
    const a = near(cur, v[(i - 1 + n) % n], r);
    const b = near(cur, v[(i + 1) % n], r);
    d +=
      i === 0
        ? `M${f(b[0])} ${f(b[1])}`
        : `L${f(a[0])} ${f(a[1])}Q${f(cur[0])} ${f(cur[1])} ${f(b[0])} ${f(b[1])}`;
  }
  return `${d}Z`;
}

const POINTER_D = roundedPolygon(VERTS, RADIUS);
const restTransform = `translate(${REST_PIVOT[0].toFixed(2)} ${REST_PIVOT[1].toFixed(
  2,
)}) rotate(${REST_ROT.toFixed(3)}) scale(${SIZE})`;

/** the comet trail is drawn in this many pieces, fading toward the tail */
const SEGMENTS = 10;

/* --- routes ------------------------------------------------------------ */

type Route = { xs: Float64Array; ys: Float64Array; cum: Float64Array; len: number };

/** position + heading (deg) at arc length s */
function sampleRoute(r: Route, s: number): [number, number, number] {
  const n = r.cum.length;
  s = Math.max(0, Math.min(r.len, s));
  let lo = 0;
  let hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (r.cum[mid] < s) lo = mid;
    else hi = mid;
  }
  const seg = r.cum[hi] - r.cum[lo] || 1;
  const k = (s - r.cum[lo]) / seg;
  const x = r.xs[lo] + (r.xs[hi] - r.xs[lo]) * k;
  const y = r.ys[lo] + (r.ys[hi] - r.ys[lo]) * k;
  // heading over a short window, so tiny kinks never jerk the rotation
  const a = Math.max(0, lo - 3);
  const b = Math.min(n - 1, hi + 3);
  const h = Math.atan2(r.ys[b] - r.ys[a], r.xs[b] - r.xs[a]) * DEG;
  return [x, y, h];
}

/* --- rounded legs: biarcs ------------------------------------------------
   Every leg is built from circular arcs. A biarc joins two points with
   given directions using two arcs that meet smoothly, so the pointer leaves
   a letter in one direction, sweeps round, and arrives already pointing
   into the next letter, along parts of circles. */

const norm = (x: number, y: number): Pt => {
  const l = Math.hypot(x, y) || 1;
  return [x / l, y / l];
};

/** points along the circular arc from P (heading T) to Q */
function arcTo(P: Pt, T: Pt, Q: Pt, out: number[]) {
  const cx = Q[0] - P[0];
  const cy = Q[1] - P[1];
  const nx = -T[1];
  const ny = T[0];
  const den = 2 * (nx * cx + ny * cy);
  const chord = Math.hypot(cx, cy);
  if (Math.abs(den) < 1e-6 * Math.max(chord, 1) || chord < 0.5) {
    const steps = Math.max(2, Math.ceil(chord / 6));
    for (let k = 1; k <= steps; k++) out.push(P[0] + (cx * k) / steps, P[1] + (cy * k) / steps);
    return;
  }
  const r = (cx * cx + cy * cy) / den; // signed radius
  const C: Pt = [P[0] + nx * r, P[1] + ny * r];
  const a0 = Math.atan2(P[1] - C[1], P[0] - C[0]);
  const a1 = Math.atan2(Q[1] - C[1], Q[0] - C[0]);
  // sweep in the direction the tangent says
  const s = (P[0] - C[0]) * T[1] - (P[1] - C[1]) * T[0] > 0 ? 1 : -1;
  let d = a1 - a0;
  if (s > 0 && d < 0) d += Math.PI * 2;
  if (s < 0 && d > 0) d -= Math.PI * 2;
  const R = Math.abs(r);
  const steps = Math.max(2, Math.ceil((Math.abs(d) * R) / 6));
  for (let k = 1; k <= steps; k++) {
    const a = a0 + (d * k) / steps;
    out.push(C[0] + Math.cos(a) * R, C[1] + Math.sin(a) * R);
  }
}

/** biarc from (P0, T0) to (P1, T1) → flat [x, y, ...] list (P0 excluded) */
function biarc(P0: Pt, T0: Pt, P1: Pt, T1: Pt, out: number[]) {
  const vx = P1[0] - P0[0];
  const vy = P1[1] - P0[1];
  const tx = T0[0] + T1[0];
  const ty = T0[1] + T1[1];
  const vt = vx * tx + vy * ty;
  const vv = vx * vx + vy * vy;
  const den = 2 * (1 - (T0[0] * T1[0] + T0[1] * T1[1]));
  let d: number;
  if (den < 1e-6) {
    const vT = vx * T1[0] + vy * T1[1];
    if (vT <= 1e-6) {
      arcTo(P0, T0, P1, out); // degenerate: single arc
      return;
    }
    d = vv / (4 * vT);
  } else {
    d = (-vt + Math.sqrt(vt * vt + den * vv)) / den;
  }
  const A: Pt = [P0[0] + T0[0] * d, P0[1] + T0[1] * d];
  const B: Pt = [P1[0] - T1[0] * d, P1[1] - T1[1] * d];
  const J: Pt = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
  const TJ = norm(B[0] - A[0], B[1] - A[1]);
  arcTo(P0, T0, J, out);
  arcTo(J, TJ, P1, out);
}

/** a leg through optional pass-through points, all arcs, smooth throughout */
function legRoute(P0: Pt, T0: Pt, via: readonly Pt[], P1: Pt, T1: Pt): Route {
  const stops: Pt[] = [P0, ...via, P1];
  const dirs: Pt[] = [T0];
  for (let i = 1; i < stops.length - 1; i++) {
    const a = norm(stops[i][0] - stops[i - 1][0], stops[i][1] - stops[i - 1][1]);
    const b = norm(stops[i + 1][0] - stops[i][0], stops[i + 1][1] - stops[i][1]);
    dirs.push(norm(a[0] + b[0], a[1] + b[1]));
  }
  dirs.push(T1);
  const flat: number[] = [P0[0], P0[1]];
  for (let i = 0; i < stops.length - 1; i++) {
    biarc(stops[i], dirs[i], stops[i + 1], dirs[i + 1], flat);
  }
  const n = flat.length / 2;
  const xs = new Float64Array(n);
  const ys = new Float64Array(n);
  const cum = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    xs[i] = flat[i * 2];
    ys[i] = flat[i * 2 + 1];
    if (i) cum[i] = cum[i - 1] + Math.hypot(xs[i] - xs[i - 1], ys[i] - ys[i - 1]);
  }
  return { xs, ys, cum, len: cum[n - 1] };
}

/** total turning along a route (degrees): tight loops score high */
function turning(r: Route) {
  let sum = 0;
  let prev: number | null = null;
  for (let i = 3; i < r.xs.length; i += 3) {
    const h = Math.atan2(r.ys[i] - r.ys[i - 3], r.xs[i] - r.xs[i - 3]) * DEG;
    if (prev !== null) sum += Math.abs(((h - prev + 540) % 360) - 180);
    prev = h;
  }
  return sum;
}

/** how far a route strays outside the roaming area (px, summed) */
function straying(r: Route) {
  let s = 0;
  for (let i = 0; i < r.xs.length; i += 3) {
    s += Math.max(0, BOUNDS.x0 - r.xs[i]) + Math.max(0, r.xs[i] - BOUNDS.x1);
    s += Math.max(0, BOUNDS.y0 - r.ys[i]) + Math.max(0, r.ys[i] - BOUNDS.y1);
  }
  return s;
}

const clampPt = (p: Pt): Pt => [
  Math.max(BOUNDS.x0, Math.min(BOUNDS.x1, p[0])),
  Math.max(BOUNDS.y0, Math.min(BOUNDS.y1, p[1])),
];
const inKeepOut = (p: Pt) =>
  KEEP_OUT.some(([a, b, c, d]) => p[0] >= a && p[0] <= c && p[1] >= b && p[1] <= d);
const shortest = (from: number, to: number) => ((to - from + 540) % 360) - 180;
const rand = gsap.utils.random;

export function TrailCursor() {
  const svgRef = useRef<SVGSVGElement>(null); // trail layer (under the text)
  const topRef = useRef<SVGSVGElement>(null); // pointer layer (over everything)

  useGSAP(
    () => {
      const svg = svgRef.current;
      const top = topRef.current;
      if (!svg || !top) return;
      const guide = svg.querySelector<SVGPathElement>(".ns-trail__guide")!;
      const segs = Array.from(
        svg.querySelectorAll<SVGPathElement>(".ns-trail__seg"),
      );
      const pointer = top.querySelector<SVGGElement>(".ns-trail__pointer")!;
      const hit = top.querySelector<SVGGElement>(".ns-trail__hit")!;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        svg.setAttribute("data-ready", "");
        top.setAttribute("data-ready", "");

        /* --- state ----------------------------------------------------- */
        const tip = { x: REST_TIP[0], y: REST_TIP[1] }; // where the tip is
        let rot = REST_ROT; // drawn rotation (deg), springs toward rotTarget
        let rotTarget = REST_ROT;
        const bob = { y: 0, r: 0 }; // idle breathing
        const press = { s: 1, x: 0, y: 0 }; // taps
        const hover = { s: 1 };
        let moving = false;
        let tapping = false;
        let recordTip = true; // false while flying in along the design curve
        let visible = true;
        let alive = true;
        let atLetter = 0; // letter it is resting on (-1 = none)
        let lastTapped = 0; // never tap the same letter twice in a row
        const live: gsap.core.Animation[] = [];
        const keep = <T extends gsap.core.Animation>(a: T) => {
          live.push(a);
          return a;
        };

        /* --- trail: the path the tip has travelled ------------------------
           A fixed polyline (points never move once written), so it never
           shimmers. Trimmed from the oldest end; dashes stay put in space. */
        const hx: number[] = [];
        const hy: number[] = [];
        let total = 0; // length of the polyline
        let trimmed = 0; // length removed from the oldest end so far
        let flow = 0; // dashes drift toward the pointer
        let maxLen = 1e9; // design trail stays until the tour begins
        const pushPt = (x: number, y: number) => {
          const n = hx.length;
          if (n) {
            const d = Math.hypot(x - hx[n - 1], y - hy[n - 1]);
            if (d < 4) return;
            total += d;
          }
          hx.push(x);
          hy.push(y);
        };
        const trimFront = (amount: number) => {
          while (amount > 0 && hx.length > 2) {
            const d = Math.hypot(hx[1] - hx[0], hy[1] - hy[0]);
            if (d <= amount) {
              hx.shift();
              hy.shift();
              total -= d;
              trimmed += d;
              amount -= d;
            } else {
              const k = amount / d;
              hx[0] += (hx[1] - hx[0]) * k;
              hy[0] += (hy[1] - hy[0]) * k;
              total -= amount;
              trimmed += amount;
              amount = 0;
            }
          }
        };
        // seed: the design trail (into the tail), then on under the pointer
        // to the tip, so the first live frame is the design
        {
          const len = guide.getTotalLength();
          for (let l = 0; l <= len; l += 4) {
            const p = guide.getPointAtLength(l);
            pushPt(p.x, p.y);
          }
          pushPt(REST_TAIL[0], REST_TAIL[1]);
          pushPt(REST_TIP[0], REST_TIP[1]);
        }

        /* --- render ----------------------------------------------------- */
        const BANDS = 10; // the trail fades toward its oldest end
        const cum: number[] = [];
        let lastT = "";
        const f1 = (n: number) => n.toFixed(1);
        const render = (_time: number, dt: number) => {
          if (!visible) return;
          const sec = Math.min(dt, 64) / 1000;

          // rotation: critically-damped spring with a turning-speed cap
          const want = shortest(rot, rotTarget);
          const step = want * (1 - Math.exp(-sec * 8));
          const cap = 230 * sec;
          rot += Math.max(-cap, Math.min(cap, step));

          const pivot = pivotFor([tip.x, tip.y], rot);
          const s = SIZE * hover.s * press.s;
          const t = `translate(${(pivot[0] + press.x).toFixed(2)} ${(
            pivot[1] +
            press.y +
            bob.y
          ).toFixed(2)}) rotate(${(rot + bob.r).toFixed(3)}) scale(${s.toFixed(4)})`;
          if (t !== lastT) {
            pointer.setAttribute("transform", t);
            lastT = t;
          }

          // trail bookkeeping
          if (recordTip) pushPt(tip.x, tip.y);
          // only the oldest end is trimmed, and only past the comet length,
          // so the trail never shrinks into stray stubs while it pauses
          if (total > maxLen) trimFront(Math.min(total - maxLen, sec * 700));

          // cumulative lengths (+ the live tip as the final point)
          const n = hx.length;
          cum.length = n + 1;
          cum[0] = 0;
          for (let i = 1; i < n; i++) {
            cum[i] = cum[i - 1] + Math.hypot(hx[i] - hx[i - 1], hy[i] - hy[i - 1]);
          }
          const lx = tip.x;
          const ly = tip.y;
          cum[n] = cum[n - 1] + Math.hypot(lx - hx[n - 1], ly - hy[n - 1]);
          const L = cum[n];
          const px = (i: number) => (i < n ? hx[i] : lx);
          const py = (i: number) => (i < n ? hy[i] : ly);
          const pointAt = (d: number): [number, number, number] => {
            // returns x, y and the index of the first point after d
            let i = 1;
            while (i <= n && cum[i] < d) i++;
            if (i > n) return [lx, ly, n + 1];
            const seg = cum[i] - cum[i - 1] || 1;
            const k = (d - cum[i - 1]) / seg;
            return [
              px(i - 1) + (px(i) - px(i - 1)) * k,
              py(i - 1) + (py(i) - py(i - 1)) * k,
              i,
            ];
          };

          flow += sec * 26;
          for (let j = 0; j < BANDS; j++) {
            const el = segs[j];
            const d0 = (L * j) / BANDS;
            const d1 = (L * (j + 1)) / BANDS;
            if (L < 1 || d1 - d0 < 0.5) {
              el.setAttribute("d", "");
              continue;
            }
            const [ax, ay, ai] = pointAt(d0);
            const [bx, by] = pointAt(d1);
            let d = `M${f1(ax)} ${f1(ay)}`;
            for (let i = ai; i <= n && cum[i] < d1; i++) d += `L${f1(px(i))} ${f1(py(i))}`;
            d += `L${f1(bx)} ${f1(by)}`;
            el.setAttribute("d", d);
            const k = (j + 0.5) / BANDS;
            el.style.opacity = (0.05 + 0.95 * k ** 1.5).toFixed(3);
            el.style.strokeWidth = (5.83 * (0.4 + 0.6 * k)).toFixed(2);
            el.style.strokeDashoffset = (trimmed + d0 - flow).toFixed(2);
          }
        };
        gsap.ticker.add(render);

        const io = new IntersectionObserver(([e]) => {
          visible = e.isIntersecting;
          live.forEach((a) => (visible ? a.resume() : a.pause()));
        });
        io.observe(svg);


        /* --- travel ----------------------------------------------------------
           Moves the tip along a prepared rounded route at an even, eased
           pace. It turns to face its way only as it picks up speed (so it
           peels off a letter instead of spinning), and lines up the tap on
           the final stretch, where the arc already points into the letter. */
        const travel = (route: Route, finalRot: number | null, speed = 560) =>
          new Promise<void>((done) => {
            if (route.len < 2) {
              if (finalRot !== null) rotTarget = finalRot;
              done();
              return;
            }
            const prog = { s: 0 };
            let prevS = 0;
            let prevT = performance.now();
            let vel = 0;
            moving = true;
            keep(
              gsap.to(prog, {
                s: route.len,
                duration: gsap.utils.clamp(0.9, 3.4, route.len / speed),
                ease: "sine.inOut",
                onUpdate: () => {
                  const [x, y, h] = sampleRoute(route, prog.s);
                  tip.x = x;
                  tip.y = y;
                  const now = performance.now();
                  const dt = Math.max(now - prevT, 1) / 1000;
                  vel = vel * 0.7 + ((prog.s - prevS) / dt) * 0.3;
                  prevS = prog.s;
                  prevT = now;
                  const t = prog.s / route.len;
                  // face the way it is going, in proportion to speed
                  const fly = rotFor(h);
                  const w = gsap.utils.clamp(0, 1, (vel - 40) / 180);
                  let target = rot + shortest(rot, fly) * w;
                  if (finalRot !== null && t > 0.8) {
                    const k = gsap.parseEase("sine.inOut")((t - 0.8) / 0.2);
                    target = target + shortest(target, finalRot) * k;
                  }
                  rotTarget = target;
                },
                onComplete: () => {
                  moving = false;
                  if (finalRot !== null) rotTarget = finalRot;
                  done();
                },
              }),
            );
          });

        const wait = (sec: number) =>
          new Promise<void>((done) => keep(gsap.delayedCall(sec, done)));

        /* --- taps ----------------------------------------------------------
           Resolves just after the press lands, so the next leg can begin
           while the pointer is still springing back: no parking. */
        const tap = (index: number) =>
          new Promise<void>((done) => {
            if (tapping) {
              done();
              return;
            }
            tapping = true;
            lastTapped = index;
            const dir = rotTarget / DEG + TIP_ANGLE;
            const ux = Math.cos(dir);
            const uy = Math.sin(dir);
            keep(
              gsap
                .timeline({ onComplete: () => void (tapping = false) })
                .to(press, { x: -ux * 10, y: -uy * 10, duration: 0.22, ease: "power2.out" })
                .to(press, {
                  x: ux * 3,
                  y: uy * 3,
                  s: 0.85,
                  duration: 0.1,
                  ease: "power3.in",
                  onComplete: () =>
                    window.dispatchEvent(
                      new CustomEvent("ns:poke", {
                        detail: { index, strength: 1, jump: true, spread: 2 },
                      }),
                    ),
                })
                .add(() => done(), "+=0.16")
                .to(press, { x: 0, y: 0, s: 1, duration: 0.8, ease: "elastic.out(1, 0.5)" }, "<-0.16"),
            );
          });

        /* --- where next -------------------------------------------------- */
        // an open spot to sweep through, preferring ones far from here
        const freeSpot = (): Pt => {
          let best: Pt = clampPt([tip.x, tip.y - 160]);
          let bestD = -1;
          for (let k = 0, found = 0; k < 80 && found < 5; k++) {
            const p: Pt = [rand(BOUNDS.x0 + 80, BOUNDS.x1 - 80), rand(BOUNDS.y0 + 40, BOUNDS.y1 - 60)];
            if (inKeepOut(p)) continue;
            found++;
            const d = Math.hypot(p[0] - tip.x, p[1] - tip.y);
            if (d > bestD) {
              bestD = d;
              best = p;
            }
          }
          return best;
        };

        // tops and outer sides are rarer than bottoms: weight them up so it
        // visits the whole word, not just its underside
        const weight = (a: (typeof ANCHORS)[number]) =>
          a.angle > 0 || a.angle === 0 || Math.abs(a.angle) === 180 ? 3 : 1;
        const pickAnchor = () => {
          const pool = ANCHORS.filter((a) => a.i !== lastTapped);
          const sum = pool.reduce((t, a) => t + weight(a), 0);
          let r = Math.random() * sum;
          for (const a of pool) {
            r -= weight(a);
            if (r <= 0) return a;
          }
          return pool[pool.length - 1];
        };

        /** plan one rounded leg from here to an anchor: leave sideways
            (peeling off the letter, never reversing on the spot), maybe sweep
            through an open spot, and arrive pointing into the letter. Tries
            both sides and keeps the tidiest. */
        const planLeg = (a: (typeof ANCHORS)[number], sweep: boolean): Route => {
          const here: Pt = [tip.x, tip.y];
          const face = rotTarget / DEG + TIP_ANGLE; // where the tip points now
          const fx = Math.cos(face);
          const fy = Math.sin(face);
          const arrive = norm(Math.cos(a.angle / DEG), Math.sin(a.angle / DEG));
          const via = sweep ? [freeSpot()] : [];
          let best: Route | null = null;
          let bestScore = Infinity;
          for (const side of [1, -1]) {
            for (const back of [0.2, 0.55, 1]) {
              // sideways and a little back from the letter it is on
              const leave = norm(-fy * side - fx * back, fx * side - fy * back);
              const r = legRoute(here, leave, via, a.tip, arrive);
              // short, inside the frame, and sweeping rather than looping
              const score = r.len + straying(r) * 4 + turning(r) * 1.4;
              if (score < bestScore) {
                bestScore = score;
                best = r;
              }
            }
          }
          return best!;
        };

        const tour = async () => {
          maxLen = 640; // from now on the trail is a comet tail
          while (alive) {
            const a = pickAnchor();
            const route = planLeg(a, Math.random() < 0.35);
            atLetter = -1;
            await travel(route, rotFor(a.angle));
            if (!alive) return;
            atLetter = a.i;
            await tap(a.i);
            if (!alive) return;
            // let the click land: rest on the letter while it jumps, then go
            await wait(rand(1.5, 2.3));
            if (!alive) return;
          }
        };

        /* --- idle breathing --------------------------------------------- */
        keep(gsap.to(bob, { y: 2.2, duration: 2.4, ease: "sine.inOut", yoyo: true, repeat: -1 }));
        keep(
          gsap.fromTo(
            bob,
            { r: -1.4 },
            { r: 1.4, duration: 3.1, ease: "sine.inOut", yoyo: true, repeat: -1 },
          ),
        );

        /* --- hover / click ---------------------------------------------- */
        const hoverS = gsap.quickTo(hover, "s", { duration: 0.6, ease: "elastic.out(1, 0.5)" });
        const onEnter = () => hoverS(1.15);
        const onOut = () => hoverS(1);
        const onDown = (ev: PointerEvent) => {
          ev.preventDefault();
          // a click while it rests on a letter taps that letter again on
          // purpose (the visitor asked); the automatic tour never repeats
          if (!moving && !tapping && atLetter >= 0) void tap(atLetter);
        };
        hit.addEventListener("pointerenter", onEnter);
        hit.addEventListener("pointerleave", onOut);
        hit.addEventListener("pointerdown", onDown);

        /* --- 1 · fly in along the design trail, tap the D, then roam ----- */
        const late = performance.now() > 1400;
        if (late) {
          void tour();
        } else {
          const len = guide.getTotalLength();
          const hero = svg.closest<HTMLElement>(".ns-hero");
          const ctm = svg.getScreenCTM();
          let startLen = 0;
          if (hero && ctm) {
            const edge =
              new DOMPoint(hero.getBoundingClientRect().left, 0).matrixTransform(ctm.inverse()).x -
              70;
            let lo = 0;
            let hi = len;
            for (let i = 0; i < 24; i++) {
              const mid = (lo + hi) / 2;
              if (guide.getPointAtLength(mid).x < edge) lo = mid;
              else hi = mid;
            }
            startLen = lo;
          }
          // the flight writes the trail itself (tail rides the design curve)
          hx.length = 0;
          hy.length = 0;
          total = 0;
          const end = guide.getPointAtLength(len);
          const endBack = guide.getPointAtLength(len - 14); // same window as place()
          const endHeading = Math.atan2(end.y - endBack.y, end.x - endBack.x) * DEG;
          const prog = { l: startLen };
          const place = () => {
            const a = guide.getPointAtLength(prog.l);
            // a wide window keeps the bank smooth through the tight trough
            const b = guide.getPointAtLength(Math.min(prog.l + 14, len));
            const c = guide.getPointAtLength(Math.max(prog.l - 14, 0));
            const heading = Math.atan2(b.y - c.y, b.x - c.x) * DEG;
            const k = gsap.parseEase("power3.in")((prog.l - startLen) / (len - startLen));
            // the spring turns it (no snapping); the tail sits on the curve at
            // the rotation actually drawn
            rotTarget = rotFor(heading) + shortest(rotFor(endHeading), REST_ROT) * k;
            const tailOff = toFrame([0, 0], rot, ATTACH);
            const tp = toFrame([a.x - tailOff[0], a.y - tailOff[1]], rot, TIP);
            tip.x = tp[0];
            tip.y = tp[1];
            if (!recordTip) pushPt(a.x, a.y); // record the design curve itself
          };
          recordTip = false;
          {
            const a0 = guide.getPointAtLength(startLen);
            const b0 = guide.getPointAtLength(Math.min(startLen + 14, len));
            rot = rotTarget = rotFor(Math.atan2(b0.y - a0.y, b0.x - a0.x) * DEG);
          }
          place();
          moving = true;
          keep(
            gsap
              .timeline({ delay: 1.05 })
              .to(prog, { l: len, duration: 1.7, ease: "power2.inOut", onUpdate: place })
              .add(() => {
                moving = false;
                tip.x = REST_TIP[0];
                tip.y = REST_TIP[1];
                rotTarget = REST_ROT; // the spring settles it into the pose
                pushPt(REST_TAIL[0], REST_TAIL[1]);
                pushPt(REST_TIP[0], REST_TIP[1]);
                recordTip = true;
              })
              .to(press, { s: 0.88, duration: 0.09, ease: "power2.out" })
              .to(press, { s: 1, duration: 0.7, ease: "elastic.out(1, 0.4)" })
              .add(() => {
                void tap(0)
                  .then(() => wait(rand(1.5, 2.3)))
                  .then(() => tour());
              }, "-=0.35"),
          );
        }

        return () => {
          alive = false;
          gsap.ticker.remove(render);
          io.disconnect();
          live.forEach((a) => a.kill());
          hit.removeEventListener("pointerenter", onEnter);
          hit.removeEventListener("pointerleave", onOut);
          hit.removeEventListener("pointerdown", onDown);
          svg.removeAttribute("data-ready");
          top.removeAttribute("data-ready");
          pointer.setAttribute("transform", restTransform);
          segs.forEach((el) => {
            el.setAttribute("d", "");
            el.removeAttribute("style");
          });
        };
      });

      return () => mm.revert();
    },
    { dependencies: [] },
  );

  return (
    <>
      {/* the trail: part of the canvas, under all text and letters */}
      <svg
        ref={svgRef}
        className="ns-trail ns-trail--path"
        viewBox="-1700 0 3700 1080"
        aria-hidden="true"
        focusable="false"
      >
        {/* geometry of the design trail (used to fly in along it); not painted */}
        <path className="ns-trail__guide" d={TRAIL_REST} />

        {/* static design trail (server render, no JS, reduced motion) */}
        <path className="ns-trail__path" d={TRAIL_REST} />

        {/* live comet trail, in pieces that fade toward the tail */}
        {Array.from({ length: SEGMENTS }, (_, j) => (
          <path key={j} className="ns-trail__path ns-trail__seg" />
        ))}
      </svg>

      {/* the pointer: above everything */}
      <svg
        ref={topRef}
        className="ns-trail ns-trail--pointer"
        viewBox="-1700 0 3700 1080"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <filter
            id="ns-pointer-shadow"
            x="-80%"
            y="-80%"
            width="260%"
            height="260%"
            colorInterpolationFilters="sRGB"
          >
            <feDropShadow
              dx="0"
              dy="0"
              stdDeviation="15"
              floodColor="#000"
              floodOpacity="0.55"
            />
          </filter>
        </defs>
        <g className="ns-trail__pointer" transform={restTransform}>
          <g className="ns-trail__hit">
            <path
              className="ns-trail__halo"
              d={POINTER_D}
              filter="url(#ns-pointer-shadow)"
            />
            <path className="ns-trail__body" d={POINTER_D} />
          </g>
        </g>
      </svg>
    </>
  );
}
