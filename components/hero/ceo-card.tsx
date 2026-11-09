import type { CSSProperties } from "react";

/**
 * Header action: one glass component that merges the CEO portrait and the
 * Contact button. The portrait links to the about section (its label reads
 * "Meet the CEO: name, role"); a bright inner Contact pill links to contact.
 * It sits on the menubar's line, right edge on the site gutter.
 *
 * Pass `photo` (a path in /public, e.g. "/ceo.jpg") to show a portrait;
 * until then a hand-made ember avatar with the person's initials is drawn.
 */
type Props = {
  title?: string;
  name?: string;
  role?: string;
  photo?: string;
  href?: string;
  contactLabel?: string;
  contactHref?: string;
};

type Vars = CSSProperties & Record<`--${string}`, string | number>;

export function CeoCard({
  title = "Meet the CEO",
  name = "Lousiana KD6",
  role = "CEO",
  photo,
  href = "#about",
  contactLabel = "Contact",
  contactHref = "#contact",
}: Props) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

  return (
    <div className="ns-ceo">
      <a className="ns-ceo__main" href={href} aria-label={`${title}: ${name}, ${role}`}>
        <span className="ns-ceo__photo" aria-hidden="true">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" className="ns-ceo__img" />
          ) : (
            <span className="ns-ceo__avatar">
              <span className="ns-ceo__initials">{initials}</span>
            </span>
          )}
        </span>
      </a>

      <a className="ns-ceo__contact" href={contactHref}>
        <span className="ns-nav__label">
          <span className="ns-nav__roll" aria-hidden="true">
            {Array.from(contactLabel).map((ch, c) => (
              <span key={c} className="ns-nav__ch" style={{ "--c": c } as Vars}>
                {ch}
              </span>
            ))}
          </span>
          <span className="ns-hero__sr">{contactLabel}</span>
        </span>

        {/* arrow ↗ in the component's top-right corner */}
        <svg
          className="ns-ceo__arrow"
          viewBox="0 0 16 16"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M4.5 11.5 11.5 4.5M5.75 4.5h5.75v5.75" />
        </svg>
      </a>
    </div>
  );
}
