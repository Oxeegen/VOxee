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

/** Region-agnostic per-scope config (inference modes + which fields are locked). */
export interface BrandModelConfig {
  /** Inference provider key. "custom" = OpenAI-compatible self-hosted endpoint. */
  provider: string;
  /** Inference modes exposed to the UI for this scope. */
  modes: string[];
  /** Fields the user cannot edit (rendered read-only). */
  lockedFields: string[];
}

/** The two Oxeegen deployments the user can pick per scope. */
export type BrandRegionId = "us" | "eu";
export const BRAND_REGION_IDS: BrandRegionId[] = ["us", "eu"];

export interface BrandRegion {
  /** Display label, e.g. "Oxeegen US". */
  label: string;
  /** OpenAI-compatible base URL (with /v1) for this region. */
  endpoint: string;
  /** Per-scope model id served by this region. */
  models: Record<BrandModelScope, string>;
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
  /** Show the Integrations control-panel entry (CLI / MCP / calendar). */
  showIntegrations: boolean;
  /** Default floating-panel start position (user-overridable). */
  panelStartPosition: "bottom-right" | "center" | "bottom-left";
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
  /** Region-agnostic per-scope model configuration (modes + locked fields). */
  models: Record<BrandModelScope, BrandModelConfig>;
  /** Per-region endpoint + per-scope models (Oxeegen US / Oxeegen EU). */
  regions: Record<BrandRegionId, BrandRegion>;
}

/**
 * Build-time overrides for the region endpoints and per-scope model ids, so
 * deployment config lives in the (unversioned) root .env and can be changed with
 * a rebuild — no source edit. brand.config.json holds placeholders; the real
 * values come from .env (see .env.example).
 *
 * - VITE_OXEE_{EU,US}_ENDPOINT — OpenAI-compatible base URL (with /v1) per region
 * - VITE_OXEE_{EU,US}_MODEL_<SCOPE> — model id per region per inference scope
 */
const SCOPE_ENV_SUFFIX: Record<BrandModelScope, string> = {
  transcription: "TRANSCRIPTION",
  dictationCleanup: "DICTATION_CLEANUP",
  dictationAgent: "DICTATION_AGENT",
  dictationTranslation: "DICTATION_TRANSLATION",
  noteFormatting: "NOTE_FORMATTING",
  chatIntelligence: "CHAT_INTELLIGENCE",
};

const env = import.meta.env as unknown as Record<string, string | undefined>;

function applyEnvOverrides(config: BrandConfig): BrandConfig {
  const regions = {} as Record<BrandRegionId, BrandRegion>;
  for (const region of Object.keys(config.regions) as BrandRegionId[]) {
    const base = config.regions[region];
    const prefix = `VITE_OXEE_${region.toUpperCase()}`;
    const models = {} as Record<BrandModelScope, string>;
    for (const scope of Object.keys(config.models) as BrandModelScope[]) {
      models[scope] = env[`${prefix}_MODEL_${SCOPE_ENV_SUFFIX[scope]}`] || base.models[scope] || "";
    }
    regions[region] = {
      ...base,
      endpoint: env[`${prefix}_ENDPOINT`] || base.endpoint,
      models,
    };
  }
  return { ...config, regions };
}

export const BRAND: BrandConfig = applyEnvOverrides(brandConfig as BrandConfig);

/** Region-agnostic per-scope config (modes + locked fields). */
export function getBrandModelConfig(scope: BrandModelScope): BrandModelConfig {
  return BRAND.models[scope];
}

/** Resolved endpoint + model for a given region and scope. */
export function getBrandRegionModelConfig(
  region: BrandRegionId,
  scope: BrandModelScope
): { endpoint: string; model: string } {
  const r = BRAND.regions[region];
  return { endpoint: r?.endpoint ?? "", model: r?.models?.[scope] ?? "" };
}

/** True when the given field is locked (read-only) for the given scope. */
export function isBrandFieldLocked(scope: BrandModelScope, field: string): boolean {
  return BRAND.models[scope]?.lockedFields.includes(field) ?? false;
}
