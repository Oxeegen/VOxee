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
  /** Locked per-scope model configuration. */
  models: Record<BrandModelScope, BrandModelConfig>;
}

/**
 * Build-time overrides for the model endpoint and per-scope model ids, so
 * deployment config lives in the (unversioned) root .env and can be changed with
 * a rebuild — no source edit. brand.config.json holds placeholders; the real
 * values come from .env (see .env.example).
 *
 * - VITE_OXEE_ENDPOINT — shared OpenAI-compatible base URL (with /v1)
 * - VITE_OXEE_MODEL_<SCOPE> — model id per inference scope (see mapping below)
 */
const SCOPE_MODEL_ENV: Record<BrandModelScope, string> = {
  transcription: "VITE_OXEE_MODEL_TRANSCRIPTION",
  dictationCleanup: "VITE_OXEE_MODEL_DICTATION_CLEANUP",
  dictationAgent: "VITE_OXEE_MODEL_DICTATION_AGENT",
  dictationTranslation: "VITE_OXEE_MODEL_DICTATION_TRANSLATION",
  noteFormatting: "VITE_OXEE_MODEL_NOTE_FORMATTING",
  chatIntelligence: "VITE_OXEE_MODEL_CHAT_INTELLIGENCE",
};

const env = import.meta.env as unknown as Record<string, string | undefined>;

function applyEnvOverrides(config: BrandConfig): BrandConfig {
  const endpointOverride = env.VITE_OXEE_ENDPOINT;
  const models = {} as Record<BrandModelScope, BrandModelConfig>;
  for (const scope of Object.keys(config.models) as BrandModelScope[]) {
    const base = config.models[scope];
    models[scope] = {
      ...base,
      endpoint: endpointOverride || base.endpoint,
      model: env[SCOPE_MODEL_ENV[scope]] || base.model,
    };
  }
  return { ...config, models };
}

export const BRAND: BrandConfig = applyEnvOverrides(brandConfig as BrandConfig);

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
