"use client";

import {
  useEffect,
  useRef,
  type CSSProperties,
  type KeyboardEvent,
  type RefObject,
} from "react";
import { NAV_ITEMS } from "../hero/nav";
import { CeoCard } from "../hero/ceo-card";
import { setScrollLocked } from "../smooth-scroll";

type Vars = CSSProperties & Record<`--${string}`, string | number>;

/** Letters that roll up on hover / focus (same effect as the menubar). */
function Roll({ text }: { text: string }) {
  return (
    <span className="ns-nav__label">
      <span className="ns-nav__roll" aria-hidden="true">
        {Array.from(text).map((ch, c) => (
          <span key={c} className="ns-nav__ch" style={{ "--c": c } as Vars}>
            {ch}
          </span>
        ))}
      </span>
      <span className="ns-hero__sr">{text}</span>
    </span>
  );
}

/**
 * The mobile header's "Menu" button (shown below 768px, header.css).
 * Two lines that fold into an × while the sidebar is open.
 */
export function MenuToggle({
  open,
  onToggle,
  buttonRef,
}: {
  open: boolean;
  onToggle: () => void;
  buttonRef: RefObject<HTMLButtonElement | null>;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      className="ns-menu-toggle"
      aria-expanded={open}
      aria-controls="ns-mobile-menu"
      aria-label={open ? "Close menu" : "Open menu"}
      onClick={onToggle}
    >
      <span className="ns-menu-toggle__text" aria-hidden="true">
        Menu
      </span>
      <span className="ns-menu-toggle__icon" aria-hidden="true">
        <span />
        <span />
      </span>
    </button>
  );
}

const FOCUSABLE =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Mobile sidebar: slides in from the right over a dimmed, blurred page.
 * Brand + close on top, the three pages as large numbered links, and the
 * CEO / Contact card at the foot. Esc, the scrim, the close button or any
 * link closes it; focus is trapped inside while open and handed back to
 * the Menu button afterwards. Page scrolling is frozen while it is open.
 */
export function MobileMenu({
  open,
  onClose,
  current = "Home",
  returnFocusRef,
}: {
  open: boolean;
  onClose: () => void;
  current?: string;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  // lock scrolling, move focus in on open and back out on close
  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      setScrollLocked(true);
      closeRef.current?.focus({ preventScroll: true });
      return () => setScrollLocked(false);
    }
    if (wasOpen.current) {
      wasOpen.current = false;
      returnFocusRef.current?.focus({ preventScroll: true });
    }
  }, [open, returnFocusRef]);

  // grown past the mobile layout (rotation, resize): just close
  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => mq.matches && onClose();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [open, onClose]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== "Tab" || !panelRef.current) return;
    const items = Array.from(
      panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
    );
    if (!items.length) return;
    const first = items[0]!;
    const last = items[items.length - 1]!;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  // Any link: release scrolling *now*, before the click reaches Lenis on
  // window, so its anchor glide runs; then close.
  const onLinkClick = () => {
    setScrollLocked(false);
    onClose();
  };

  return (
    <div
      className="ns-drawer"
      data-open={open ? "" : undefined}
      inert={!open}
      onKeyDown={onKeyDown}
    >
      <div className="ns-drawer__scrim" aria-hidden="true" onClick={onClose} />

      <div
        ref={panelRef}
        id="ns-mobile-menu"
        className="ns-drawer__panel"
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        data-lenis-prevent
      >
        <div className="ns-drawer__head">
          <a
            className="ns-drawer__brand"
            href="#top"
            aria-label="NeelScript, home"
            onClick={onLinkClick}
          >
            <span className="ns-brand__mark" aria-hidden="true" />
            NeelScript
          </a>
          <button
            ref={closeRef}
            type="button"
            className="ns-drawer__close"
            aria-label="Close menu"
            onClick={onClose}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
            </svg>
          </button>
        </div>

        <p className="ns-drawer__eyebrow" aria-hidden="true">
          Menu
        </p>

        <nav className="ns-drawer__nav" aria-label="Primary">
          <ol className="ns-drawer__list">
            {NAV_ITEMS.map(({ label, href }, i) => (
              <li
                key={label}
                className="ns-drawer__item"
                style={{ "--i": i } as Vars}
              >
                <a
                  className="ns-drawer__link"
                  href={href}
                  aria-current={label === current ? "page" : undefined}
                  onClick={onLinkClick}
                >
                  <span className="ns-drawer__num" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <Roll text={label} />
                  <svg
                    className="ns-drawer__go"
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path d="M3 8h10M9 4l4 4-4 4" />
                  </svg>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div
          className="ns-drawer__foot"
          style={{ "--i": NAV_ITEMS.length } as Vars}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a")) onLinkClick();
          }}
        >
          <CeoCard />
        </div>
      </div>
    </div>
  );
}
