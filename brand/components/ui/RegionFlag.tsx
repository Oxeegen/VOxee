import type { BrandRegionId } from "@brand/config/brand";

/**
 * Small inline SVG flags for the Oxeegen regions. Inline SVG (not emoji) because
 * Windows does not render flag emoji glyphs — it shows the letter pair instead.
 */

// 12 gold stars arranged in a ring (approximate EU flag), radius ~5.5 around (12,9).
const EU_STARS: Array<[number, number]> = [
  [12, 3.5],
  [14.75, 4.24],
  [16.76, 6.25],
  [17.5, 9],
  [16.76, 11.75],
  [14.75, 13.76],
  [12, 14.5],
  [9.25, 13.76],
  [7.24, 11.75],
  [6.5, 9],
  [7.24, 6.25],
  [9.25, 4.24],
];

export default function RegionFlag({
  region,
  className = "w-4 h-4",
}: {
  region: BrandRegionId;
  className?: string;
}) {
  if (region === "eu") {
    return (
      <svg viewBox="0 0 24 18" className={className} role="img" aria-label="EU">
        <rect width="24" height="18" rx="2.5" fill="#003399" />
        <g fill="#FFCC00">
          {EU_STARS.map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="0.9" />
          ))}
        </g>
      </svg>
    );
  }
  // US
  return (
    <svg viewBox="0 0 24 18" className={className} role="img" aria-label="US">
      <rect width="24" height="18" rx="2.5" fill="#B22234" />
      <g fill="#fff">
        <rect y="2.77" width="24" height="1.38" />
        <rect y="5.54" width="24" height="1.38" />
        <rect y="8.31" width="24" height="1.38" />
        <rect y="11.08" width="24" height="1.38" />
        <rect y="13.85" width="24" height="1.38" />
      </g>
      <rect width="10.5" height="9.69" rx="1.5" fill="#3C3B6E" />
      <g fill="#fff">
        {[2.5, 5.25, 8].map((x) =>
          [2, 4.6, 7.2].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="0.62" />)
        )}
      </g>
    </svg>
  );
}
