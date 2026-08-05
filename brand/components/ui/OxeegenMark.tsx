import { useId } from "react";

/**
 * Oxeegen mark as an inline single-color SVG using `fill="currentColor"`, so it
 * inherits the surrounding text color (e.g. primary when selected, muted when
 * not) and adapts to the theme like a lucide icon.
 *
 * Mask id comes from useId() to avoid <defs> collisions between instances.
 */
export default function OxeegenMark({ className }: { className?: string }) {
  const maskId = useId();
  return (
    <svg viewBox="0 0 231 231" fill="currentColor" className={className} aria-hidden="true">
      <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="231" height="231">
        <rect width="231" height="231" fill="#000" />
        <circle cx="115.5" cy="115.5" r="115.5" fill="#fff" />
        <rect x="67" y="0" width="33" height="231" fill="#000" />
        <rect x="132" y="0" width="33" height="231" fill="#000" />
      </mask>
      <rect width="231" height="231" mask={`url(#${maskId})`} />
      <rect x="100" y="0" width="32" height="231" rx="5" />
    </svg>
  );
}
