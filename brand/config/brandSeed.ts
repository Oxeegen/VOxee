import { BRAND } from "./brand";
import { computeBrandSeed } from "./brandSeedCompute.mjs";

/** Sentinel so the one-time seed runs at most once per install. */
const SEED_SENTINEL = `${BRAND.productName}BrandSeeded`;

/**
 * Apply brand localStorage defaults on first launch.
 *
 * - Runs once (guarded by a sentinel key).
 * - Never overwrites a value the user already set.
 * - Never writes secrets (see brandSeedCompute.mjs).
 *
 * Must run BEFORE the settings store reads localStorage — see the call site in
 * src/stores/settingsStore.ts.
 */
export function seedBrandDefaults(): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  const storage = window.localStorage;

  if (storage.getItem(SEED_SENTINEL) === "true") return;

  const seed = computeBrandSeed(BRAND);
  for (const [key, value] of Object.entries(seed)) {
    if (storage.getItem(key) === null) {
      storage.setItem(key, value);
    }
  }

  storage.setItem(SEED_SENTINEL, "true");
}
