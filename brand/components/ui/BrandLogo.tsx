import { useId } from "react";
import type { SVGProps } from "react";
import { BRAND } from "@brand/config/brand";

/** Darken/lighten a hex color by a multiplicative factor (1 = unchanged). */
function shade(hex: string, factor: number): string {
  const raw = hex.replace("#", "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  const num = parseInt(full, 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const r = clamp(((num >> 16) & 0xff) * factor);
  const g = clamp(((num >> 8) & 0xff) * factor);
  const b = clamp((num & 0xff) * factor);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

export interface BrandLogoProps extends SVGProps<SVGSVGElement> {
  /** Accessible label; defaults to the product name. */
  title?: string;
}

/**
 * Brand logo (rounded-square mic mark) drawn in the brand primary color.
 *
 * The SVG gradient id comes from useId() so every instance is unique — a fixed
 * shared id collides when several logos mount/unmount, tearing down the <defs>
 * the others reference and rendering them black.
 */
export default function BrandLogo({ title = BRAND.productName, ...props }: BrandLogoProps) {
  const gradientId = useId();
  const primary = BRAND.theme.primary;
  const primaryDark = shade(primary, 0.82);

  return (
    <svg viewBox="0 0 1024 1024" fill="none" role="img" aria-label={title} {...props}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={primary} />
          <stop offset="100%" stopColor={primaryDark} />
        </linearGradient>
      </defs>
      <rect width="1024" height="1024" rx="241" fill={`url(#${gradientId})`} />
      <circle cx="512" cy="512" r="314" fill="none" stroke="white" strokeWidth="74" />
      <path d="M512 383V641" stroke="white" strokeWidth="74" strokeLinecap="round" />
      <path d="M627 457V568" stroke="white" strokeWidth="74" strokeLinecap="round" />
      <path d="M397 457V568" stroke="white" strokeWidth="74" strokeLinecap="round" />
    </svg>
  );
}
