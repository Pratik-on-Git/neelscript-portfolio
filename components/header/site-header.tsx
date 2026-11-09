"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { Menubar } from "../hero/nav";
import { CeoCard } from "../hero/ceo-card";
import "../hero/hero.css";
import "./header.css";

type Vars = CSSProperties & Record<`--${string}`, string | number>;

/**
 * Smart sticky header: the brand, the menu and the Contact button.
 *
 * At the top of the page it sits exactly where the hero design puts it.
 * Scrolling down slides it away; scrolling up brings it straight back,
 * docked near the top over a soft progressive blur. Small jitters are
 * ignored, and keyboard focus inside it always keeps it on screen.
 */
export function SiteHeader() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const TOP = 4; // px from the top that still counts as "at the top"
    const JITTER = 6; // px of movement needed to change direction
    let last = window.scrollY;
    let anchor = last; // where the current direction of travel began
    let dir = 0; // 1 down, -1 up
    let frame = 0;

    const set = (floating: boolean, hidden: boolean) => {
      el.toggleAttribute("data-float", floating);
      el.toggleAttribute("data-hidden", hidden && !el.contains(document.activeElement));
    };

    const update = () => {
      frame = 0;
      const y = Math.max(0, window.scrollY);
      if (y <= TOP) {
        set(false, false);
      } else {
        const d = y > last ? 1 : y < last ? -1 : dir;
        if (d !== dir) {
          dir = d;
          anchor = last;
        }
        if (Math.abs(y - anchor) >= JITTER) set(true, dir === 1);
        else el.toggleAttribute("data-float", true);
      }
      last = y;
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const onFocus = () => el.removeAttribute("data-hidden");

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("focusin", onFocus);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      el.removeEventListener("focusin", onFocus);
    };
  }, []);

  return (
    <header ref={ref} className="ns-header">
      <div className="ns-header__frame">
        <span className="ns-header__veil" aria-hidden="true" />
        <div className="ns-header__row">
          <a className="ns-brand" href="#top" aria-label="NeelScript, home">
            <span className="ns-brand__mark" aria-hidden="true" />
            <span className="ns-nav__label" aria-hidden="true">
              <span className="ns-nav__roll">
                {Array.from("NeelScript").map((ch, c) => (
                  <span key={c} className="ns-nav__ch" style={{ "--c": c } as Vars}>
                    {ch}
                  </span>
                ))}
              </span>
            </span>
          </a>
          <Menubar />
          <CeoCard />
        </div>
      </div>
    </header>
  );
}
