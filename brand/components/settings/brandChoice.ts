import type { BrandChoice } from "./BrandModeChoice";

/**
 * Persist the Oxeegen-EU / Oxeegen-US / Custom selection per scope/context.
 * There is no default: a fresh install has nothing selected (returns null) until
 * the user picks a provider. Legacy values (the old single "brand") map to null
 * so the user re-selects a region.
 */
const KEY = (id: string) => `brandChoice.${id}`;
const VALID: BrandChoice[] = ["eu", "us", "custom"];

export function getStoredBrandChoice(id: string): BrandChoice | null {
  if (typeof localStorage === "undefined") return null;
  const v = localStorage.getItem(KEY(id));
  return VALID.includes(v as BrandChoice) ? (v as BrandChoice) : null;
}

export function setStoredBrandChoice(id: string, choice: BrandChoice): void {
  if (typeof localStorage !== "undefined") localStorage.setItem(KEY(id), choice);
}
