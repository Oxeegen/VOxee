/**
 * Pure computation of the localStorage defaults that make an account-less brand
 * build point at the organization's self-hosted OpenAI-compatible endpoints out
 * of the box.
 *
 * Kept as a dependency-free ESM function (receives the brand config as an
 * argument) so it runs identically under Vite (bundled) and `node --test`.
 *
 * NEVER seed an API key here — secrets are entered by the user and stored
 * encrypted via Electron safeStorage. This only writes non-secret preferences.
 *
 * The store key names mirror src/config/inferenceScopes.ts and the transcription
 * state in src/stores/settingsStore.ts. Keep them in sync if upstream renames.
 */

// scope name -> { store keys } for the 5 LLM inference scopes.
const LLM_SCOPE_KEYS = {
  dictationCleanup: {
    mode: "cleanupMode",
    provider: "cleanupProvider",
    model: "cleanupModel",
    remoteUrl: "cleanupRemoteUrl",
  },
  dictationAgent: {
    mode: "dictationAgentMode",
    provider: "dictationAgentProvider",
    model: "dictationAgentModel",
    remoteUrl: "dictationAgentRemoteUrl",
  },
  noteFormatting: {
    mode: "noteFormattingMode",
    provider: "noteFormattingProvider",
    model: "noteFormattingModel",
    remoteUrl: "noteFormattingRemoteUrl",
  },
  chatIntelligence: {
    mode: "chatAgentMode",
    provider: "chatAgentProvider",
    model: "chatAgentModel",
    remoteUrl: "chatAgentRemoteUrl",
  },
  dictationTranslation: {
    mode: "translationMode",
    provider: "translationProvider",
    model: "translationModel",
    remoteUrl: "translationRemoteUrl",
  },
};

/**
 * @param {object} brand - the parsed brand.config.json (BrandConfig shape).
 * @returns {Record<string,string>} localStorage key -> string value to seed.
 */
export function computeBrandSeed(brand) {
  /** @type {Record<string,string>} */
  const seed = {};
  if (!brand) return seed;

  // Locked self-hosted models only make sense in account-less mode.
  if (brand.showAccount) return seed;

  const models = brand.models || {};

  // --- LLM scopes: self-hosted OpenAI-compatible endpoint ---
  for (const [scope, keys] of Object.entries(LLM_SCOPE_KEYS)) {
    const cfg = models[scope];
    if (!cfg) continue;
    seed[keys.mode] = "self-hosted";
    seed[keys.provider] = "custom";
    if (cfg.model) seed[keys.model] = cfg.model;
    if (cfg.endpoint) seed[keys.remoteUrl] = cfg.endpoint;
  }

  // --- Transcription: dictation (shared base), meeting, upload ---
  const stt = models.transcription;
  if (stt) {
    // Dictation + shared base keys (upload reuses remoteTranscription* url/model).
    seed.transcriptionMode = "self-hosted";
    seed.remoteTranscriptionType = "openai-compatible";
    if (stt.endpoint) seed.remoteTranscriptionUrl = stt.endpoint;
    if (stt.model) seed.remoteTranscriptionModel = stt.model;

    // Meeting context.
    seed.meetingTranscriptionMode = "self-hosted";
    seed.meetingRemoteTranscriptionType = "openai-compatible";
    if (stt.endpoint) seed.meetingRemoteTranscriptionUrl = stt.endpoint;

    // Upload context.
    seed.uploadTranscriptionMode = "self-hosted";
  }

  // --- Brand-driven flags ---
  if (!brand.showOnboarding) {
    seed.onboardingCompleted = "true";
  }
  if (!brand.showAccount) {
    seed.skipAuth = "true";
    seed.authenticationSkipped = "true";
  }

  return seed;
}
