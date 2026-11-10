import type { CSSProperties } from "react";

/**
 * Menubar: three links in a frosted-glass bar, with a glass tab
 * that rests on the current page and glides to whichever item is hovered.
 * Pure markup + CSS (hero.css, "menubar" section); no client JS.
 */

export const NAV_ITEMS = [
  { label: "Home", href: "#top" },
  { label: "Portfolio", href: "#portfolio" },
  { label: "About", href: "#about" },
] as const;

type Vars = CSSProperties & Record<`--${string}`, string | number>;

export function Menubar({ current = "Home" }: { current?: string }) {
  return (
    <nav className="ns-nav" aria-label="Primary">
      {/* glass tab: rests on the current page, glides to the hovered item */}
      <span className="ns-nav__tab" aria-hidden="true" />
      <ul className="ns-nav__list">
        {NAV_ITEMS.map(({ label, href }, i) => (
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
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
