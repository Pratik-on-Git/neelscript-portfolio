/**
 * "Meet the CEO" card: sits on the menubar's line (same top, same height,
 * same glass), right-aligned to the hero's outer margin.
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
};

export function CeoCard({
  title = "Meet the CEO",
  name = "Lousiana KD6",
  role = "CEO",
  photo,
  href = "#about",
}: Props) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

  return (
    <a className="ns-ceo" href={href} aria-label={`${title}: ${name}, ${role}`}>
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

      <span className="ns-ceo__text" aria-hidden="true">
        <span className="ns-ceo__title">{title}</span>
        <span className="ns-ceo__name">{name}</span>
        <span className="ns-ceo__role">{role}</span>
      </span>

      {/* pixel arrow ↗ */}
      <svg
        className="ns-ceo__arrow"
        viewBox="0 0 3 3"
        aria-hidden="true"
        focusable="false"
        shapeRendering="crispEdges"
      >
        <g className="ns-ceo__arrow-px">
          <rect x="1" y="0" width="2" height="1" />
          <rect x="2" y="1" width="1" height="1" />
          <rect x="1" y="1" width="1" height="1" />
          <rect x="0" y="2" width="1" height="1" />
        </g>
      </svg>
    </a>
  );
}
