import brandConfig from "./brand.config.json";

/**
 * Single typed accessor for the brand configuration.
 *
 * Source of truth: `brand/config/brand.config.json`.
 *
 * - Renderer (bundled by Vite / type-checked by tsc): import { BRAND } from "@brand/config/brand".
 * - Main process (CommonJS): read the JSON directly, e.g.
 *   `const brandConfig = require("../../brand/config/brand.config.json")`.
 *
 * Keep this file free of runtime side effects so it can be imported anywhere.
 */

export type BrandModelScope =
  | "transcription"
  | "dictationCleanup"
  | "dictationAgent"
  | "dictationTranslation"
  | "noteFormatting"
  | "chatIntelligence";

export interface BrandModelConfig {
  /** Inference provider key. "custom" = OpenAI-compatible self-hosted endpoint. */
  provider: string;
  /** Base URL including the `/v1` suffix. */
  endpoint: string;
  /** Model id served by the endpoint. */
  model: string;
  /** Inference modes exposed to the UI for this scope. */
  modes: string[];
  /** Fields the user cannot edit (rendered read-only). */
  lockedFields: string[];
}

export interface BrandTheme {
  /** Primary brand color (hex). */
  primary: string;
  /** When true, the same primary color is kept in dark mode (no filter/shift). */
  keepPrimaryInDark: boolean;
}

export interface BrandConfig {
  /** Product name — app title, userData folder, i18n runtime rebrand. */
  productName: string;
  /** AppUserModelID + electron-builder appId. */
  appId: string;
  /** Display name for the model provider (badges, toggles). */
  modelBrandName: string;
  /** Default agent name. */
  agentName: string;
  /** Show account / sign-in / billing. false also enables the in-house model sections. */
  showAccount: boolean;
  /** Show local (whisper/parakeet/GGUF) model options. */
  showLocalModels: boolean;
  /** Show the Support menu. */
  showSupport: boolean;
  /** Show the first-run onboarding wizard. */
  showOnboarding: boolean;
  /** Show the "about you" use-case onboarding step. */
  showUseCaseStep: boolean;
  /** Theme values. */
  theme: BrandTheme;
  /** Auto-update feed. feedUrl null => updates disabled. */
  update: { feedUrl: string | null };
  /** External URLs. null => hidden / not applicable. */
  urls: {
    docs: string | null;
    support: string | null;
    terms: string | null;
    privacy: string | null;
  };
  /** Locked per-scope model configuration. */
  models: Record<BrandModelScope, BrandModelConfig>;
}

export const BRAND = brandConfig as BrandConfig;

/** Returns the locked model config for a given inference scope. */
export function getBrandModelConfig(scope: BrandModelScope): BrandModelConfig {
  return BRAND.models[scope];
}

/** True when the given field is locked (read-only) for the given scope. */
export function isBrandFieldLocked(
  scope: BrandModelScope,
  field: string
): boolean {
  return BRAND.models[scope]?.lockedFields.includes(field) ?? false;
}
