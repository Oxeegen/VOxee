const test = require("node:test");
const assert = require("node:assert/strict");

const load = () => import("../../brand/config/brandSeedCompute.mjs");

// Minimal account-less brand fixture (self-hosted OpenAI-compatible endpoints).
const ACCOUNTLESS_BRAND = {
  productName: "VOxee",
  showAccount: false,
  showOnboarding: false,
  models: {
    transcription: { provider: "custom", endpoint: "https://ep/v1", model: "stt-1" },
    dictationCleanup: { provider: "custom", endpoint: "https://ep/v1", model: "llm-1" },
    dictationAgent: { provider: "custom", endpoint: "https://ep/v1", model: "llm-1" },
    dictationTranslation: { provider: "custom", endpoint: "https://ep/v1", model: "llm-1" },
    noteFormatting: { provider: "custom", endpoint: "https://ep/v1", model: "llm-1" },
    chatIntelligence: { provider: "custom", endpoint: "https://ep/v1", model: "llm-1" },
  },
};

test("seeds self-hosted LLM modes for every scope (no region endpoint/model)", async () => {
  const { computeBrandSeed } = await load();
  const seed = computeBrandSeed(ACCOUNTLESS_BRAND);

  assert.equal(seed.cleanupMode, "self-hosted");
  assert.equal(seed.cleanupProvider, "custom");

  assert.equal(seed.dictationAgentMode, "self-hosted");
  assert.equal(seed.chatAgentMode, "self-hosted");
  assert.equal(seed.noteFormattingMode, "self-hosted");
  assert.equal(seed.translationMode, "self-hosted");

  // No default region: endpoint/model are filled when the user picks EU/US.
  assert.equal("cleanupModel" in seed, false);
  assert.equal("cleanupRemoteUrl" in seed, false);
  assert.equal("translationModel" in seed, false);
});

test("forces legacy cloud-mode fields to byok (never OpenWhispr Cloud)", async () => {
  const { computeBrandSeed } = await load();
  const seed = computeBrandSeed(ACCOUNTLESS_BRAND);

  assert.equal(seed.cloudTranscriptionMode, "byok");
  assert.equal(seed.cleanupCloudMode, "byok");
  assert.equal(seed.dictationAgentCloudMode, "byok");
  assert.equal(seed.chatAgentCloudMode, "byok");
  assert.equal(seed.noteFormattingCloudMode, "byok");
  assert.equal(seed.translationCloudMode, "byok");
});

test("seeds self-hosted transcription for dictation, meeting and upload", async () => {
  const { computeBrandSeed } = await load();
  const seed = computeBrandSeed(ACCOUNTLESS_BRAND);

  assert.equal(seed.transcriptionMode, "self-hosted");
  assert.equal(seed.remoteTranscriptionType, "openai-compatible");
  // No default region: the transcription endpoint/model are filled on selection.
  assert.equal("remoteTranscriptionUrl" in seed, false);
  assert.equal("remoteTranscriptionModel" in seed, false);
  // Legacy fields must agree with self-hosted so migrateProviderSettings keeps it.
  assert.equal(seed.cloudTranscriptionMode, "byok");
  assert.equal(seed.cloudTranscriptionProvider, "custom");

  assert.equal(seed.meetingTranscriptionMode, "self-hosted");
  assert.equal(seed.meetingRemoteTranscriptionType, "openai-compatible");
  assert.equal("meetingRemoteTranscriptionUrl" in seed, false);

  assert.equal(seed.uploadTranscriptionMode, "self-hosted");
});

test("derives account-less flags", async () => {
  const { computeBrandSeed } = await load();
  const seed = computeBrandSeed(ACCOUNTLESS_BRAND);

  assert.equal(seed.onboardingCompleted, "true");
  assert.equal(seed.skipAuth, "true");
  assert.equal(seed.authenticationSkipped, "true");
});

test("never seeds an API key", async () => {
  const { computeBrandSeed } = await load();
  const seed = computeBrandSeed(ACCOUNTLESS_BRAND);

  const keys = Object.keys(seed).join(" ").toLowerCase();
  assert.equal(/apikey|api_key|secret|bearer|token/.test(keys), false);
  // Explicit: the shared-key store fields are not seeded.
  assert.equal("cleanupCustomApiKey" in seed, false);
  assert.equal("customTranscriptionApiKey" in seed, false);
});

test("returns an empty seed when the brand keeps accounts enabled", async () => {
  const { computeBrandSeed } = await load();
  const seed = computeBrandSeed({ ...ACCOUNTLESS_BRAND, showAccount: true });
  assert.deepEqual(seed, {});
});

test("keeps onboardingCompleted unset when onboarding is enabled", async () => {
  const { computeBrandSeed } = await load();
  const seed = computeBrandSeed({ ...ACCOUNTLESS_BRAND, showOnboarding: true });
  assert.equal("onboardingCompleted" in seed, false);
});
