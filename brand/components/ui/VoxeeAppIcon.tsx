import { useId } from "react";
import type { SVGProps } from "react";
import { BRAND } from "@brand/config/brand";

/**
 * The VOxee application icon — the exact same three-bar mark that ships as the
 * window/tray/taskbar icon (`brand/assets/voxee-icon.svg`), inlined as an SVG so
 * every in-app surface (loading screen, window header, onboarding) stays pixel-
 * consistent with the OS icon.
 *
 * The gradient id comes from useId() so multiple instances never collide on a
 * shared <defs> (a fixed id tears down the gradient when one instance unmounts,
 * rendering the others black).
 */
export default function VoxeeAppIcon({ title = BRAND.productName, ...props }: SVGProps<SVGSVGElement> & { title?: string }) {
  const gradientId = useId();
  return (
    <svg viewBox="0 0 1024 1024" fill="none" role="img" aria-label={title} {...props}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4744E2" />
          <stop offset="1" stopColor="#805BFE" />
        </linearGradient>
      </defs>
      <rect width="1024" height="1024" rx="230" fill={`url(#${gradientId})`} />
      <rect x="242" y="221" width="150" height="582" rx="75" fill="white" />
      <rect x="437" y="162" width="150" height="700" rx="75" fill="white" />
      <rect x="632" y="221" width="150" height="582" rx="75" fill="white" />
    </svg>
  );
}
