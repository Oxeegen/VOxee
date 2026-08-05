import buildFlags from "./buildFlags.json";

/**
 * Debug mode toggles the HTTP-exchange logger (model request/response capture).
 *
 * - Baked at build time via buildFlags.debug (scripts/build-brand.js can flip it).
 * - Overridable at dev time with VITE_OXEE_DEBUG=1.
 *
 * Renderer-only (relies on import.meta.env). The main process reads
 * brand/config/buildFlags.json directly.
 */
export const DEBUG_MODE: boolean =
  buildFlags.debug === true || import.meta.env?.VITE_OXEE_DEBUG === "1";
