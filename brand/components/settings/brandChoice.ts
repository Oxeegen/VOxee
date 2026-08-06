import type { BrandChoice } from "./BrandModeChoice";

/**
 * Persist the Oxeegen/Custom selection per scope/context. Without this the
 * choice would be inferred from "endpoint === brand endpoint", so picking Custom
 * without changing the URL would revert to Oxeegen on reopen (hiding the Custom
 * panel and its edits).
 */
const KEY = (id: string) => `brandChoice.${id}`;

export function getStoredBrandChoice(id: string, fallback: BrandChoice): BrandChoice {
  if (typeof localStorage === "undefined") return fallback;
  const v = localStorage.getItem(KEY(id));
  return v === "brand" || v === "custom" ? v : fallback;
}

export function setStoredBrandChoice(id: string, choice: BrandChoice): void {
  if (typeof localStorage !== "undefined") localStorage.setItem(KEY(id), choice);
}
