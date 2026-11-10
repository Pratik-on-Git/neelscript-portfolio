/**
 * The NS logo (same artwork as public/logo.svg), inlined so it paints with
 * the first frame and needs no extra request. Decorative: the link around it
 * carries the accessible name.
 */
export function BrandMark() {
  return (
    <svg
      className="ns-brand__mark"
      viewBox="0 0 500 500"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="250" cy="250" r="250" fill="var(--royal, #005bff)" />
      <path
        fill="var(--paper, #f2f0eb)"
        d="M99 137.21L144.18 137.2L254 302.44C278.12 338.73 345.54 342.18 358.03 308.5C360.23 302.58 360.43 295.8 358.69 289.76C348.54 254.41 262.18 267.19 248.33 211.26C245.65 200.46 246.18 189.27 249.03 178.53C265.07 118.06 358.44 120.92 385.7 167.79C391.67 178.05 393.6 188.39 394.73 200.12L355.26 200.12C353.92 193.06 351.84 185.97 347.1 180.4C332.5 163.24 289.95 164.65 287.07 189.54C281.9 234.35 379.15 214.5 396.95 275.52C401.02 289.46 400.5 303.51 395.75 317.25C386.82 343.06 366.61 357.04 340.9 363.29C293.54 374.8 245.47 359.76 218.03 318.41L138.29 198.25L138.31 360.01L99 360.02Z"
      />
    </svg>
  );
}
