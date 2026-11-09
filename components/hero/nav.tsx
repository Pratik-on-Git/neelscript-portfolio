import type { CSSProperties } from "react";

/**
 * Menubar: four numbered links, set straight on the hero's paper.
 * Pure markup + CSS (hero.css, "menubar" section); no client JS.
 */

const ITEMS = [
  { label: "Home", href: "#top", n: "01" },
  { label: "Portfolio", href: "#portfolio", n: "02" },
  { label: "About", href: "#about", n: "03" },
  { label: "Contact", href: "#contact", n: "04" },
] as const;

type Vars = CSSProperties & Record<`--${string}`, string | number>;

export function Menubar({ current = "Home" }: { current?: string }) {
  return (
    <nav className="ns-nav" aria-label="Primary">
      <ul className="ns-nav__list">
        {ITEMS.map(({ label, href, n }, i) => (
          <li key={label} className="ns-nav__item" style={{ "--i": i } as Vars}>
            <a
              className="ns-nav__link"
              href={href}
              aria-current={label === current ? "page" : undefined}
            >
              <span className="ns-nav__label">
                {/* each letter rolls up (text-shadow copy), staggered */}
                <span className="ns-nav__roll" aria-hidden="true">
                  {Array.from(label).map((ch, c) => (
                    <span
                      key={c}
                      className="ns-nav__ch"
                      style={{ "--c": c } as Vars}
                    >
                      {ch}
                    </span>
                  ))}
                </span>
                <span className="ns-hero__sr">{label}</span>
              </span>
              <sup className="ns-nav__num" aria-hidden="true">
                {n}
              </sup>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
