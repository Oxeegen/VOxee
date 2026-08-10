import type { BrandRegionId } from "@brand/config/brand";

/**
 * Tiny brand-local bus to jump from a provider health badge ("Key missing") to
 * the Oxeegen API Key settings screen with the right region field highlighted.
 * Avoids threading an onNavigate callback through every settings component.
 */

const OPEN_API_KEY_EVENT = "voxee:open-api-key";
let pendingFocusRegion: BrandRegionId | null = null;

/** Request navigation to the API Key screen and highlight `region`'s field. */
export function openApiKeySettings(region: BrandRegionId): void {
  pendingFocusRegion = region;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(OPEN_API_KEY_EVENT));
  }
}

/** Subscribe to API-key-open requests (used by the settings shell to navigate). */
export function onOpenApiKey(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener(OPEN_API_KEY_EVENT, handler);
  return () => window.removeEventListener(OPEN_API_KEY_EVENT, handler);
}

/** Read and clear the pending focus region (consumed by the API Key panel). */
export function consumeApiKeyFocus(): BrandRegionId | null {
  const r = pendingFocusRegion;
  pendingFocusRegion = null;
  return r;
}
