import { useSettingsStore, setResolvedLLMConfig } from "@/stores/settingsStore";
import type { InferenceScope } from "@/config/inferenceScopes";
import { getBrandRegionModelConfig } from "@brand/config/brand";
import type { BrandRegionId } from "@brand/config/brand";
import { getStoredBrandChoice, setStoredBrandChoice } from "./brandChoice";

/**
 * Two organization API keys, one per Oxeegen region (EU / US). Each is stored
 * ENCRYPTED via Electron safeStorage (secretKeys.js entries `oxeegen-eu` /
 * `oxeegen-us`) and reached through IPC — not kept in the settings store.
 *
 * When a region key is set, it is propagated to the per-scope custom API key of
 * every scope currently pointed at that region, since inference reads the
 * per-scope key (cleanupCustomApiKey, customTranscriptionApiKey, …).
 */

type Store = ReturnType<typeof useSettingsStore.getState>;

// brandChoice id -> setter for that scope's custom API key. Transcription
// contexts (dictation/meeting/upload) share the single customTranscriptionApiKey.
const SCOPE_KEY_SETTERS: Record<string, (s: Store, key: string) => void> = {
  dictationCleanup: (s, k) => s.setCleanupCustomApiKey(k),
  dictationAgent: (s, k) => s.setDictationAgentCustomApiKey(k),
  chatIntelligence: (s, k) => s.setChatAgentCustomApiKey(k),
  noteFormatting: (s, k) => s.setNoteFormattingCustomApiKey(k),
  dictationTranslation: (s, k) => s.setTranslationCustomApiKey(k),
  "transcription.dictation": (s, k) => s.setCustomTranscriptionApiKey(k),
  "transcription.meeting": (s, k) => s.setCustomTranscriptionApiKey(k),
  "transcription.upload": (s, k) => s.setCustomTranscriptionApiKey(k),
};

export async function getOxeegenRegionKey(region: BrandRegionId): Promise<string> {
  const api = window.electronAPI;
  const fn = region === "eu" ? api?.getOxeegenEuKey : api?.getOxeegenUsKey;
  return (await fn?.()) || "";
}

export async function setOxeegenRegionKey(region: BrandRegionId, key: string): Promise<void> {
  const api = window.electronAPI;
  const save = region === "eu" ? api?.saveOxeegenEuKey : api?.saveOxeegenUsKey;
  await save?.(key);
  // Apply to every scope currently on this region.
  const s = useSettingsStore.getState();
  for (const [id, setter] of Object.entries(SCOPE_KEY_SETTERS)) {
    if (getStoredBrandChoice(id) === region) setter(s, key);
  }
}

const LLM_SCOPES: InferenceScope[] = [
  "dictationCleanup",
  "dictationAgent",
  "chatIntelligence",
  "noteFormatting",
  "dictationTranslation",
];

/**
 * Semi-automatic setup (onboarding accelerator): once a region key validates,
 * point every scope that has NO provider selected yet at that region (endpoint +
 * locked model + this key). Scopes already configured (US / EU / Custom) are
 * left untouched. Runs are idempotent — only null-choice scopes are affected.
 */
export async function autoSelectRegionForUnsetScopes(region: BrandRegionId): Promise<void> {
  const key = await getOxeegenRegionKey(region);
  const s = useSettingsStore.getState();

  for (const scope of LLM_SCOPES) {
    if (getStoredBrandChoice(scope) !== null) continue;
    const { endpoint, model } = getBrandRegionModelConfig(region, scope);
    setResolvedLLMConfig(scope, {
      mode: "self-hosted",
      provider: "custom",
      remoteUrl: endpoint,
      model,
      customApiKey: key,
    });
    setStoredBrandChoice(scope, region);
  }

  // Transcription: dictation + upload share remoteTranscription{Url,Model};
  // meeting has its own url (meetingRemoteTranscriptionUrl), shared model.
  const { endpoint, model } = getBrandRegionModelConfig(region, "transcription");
  let touchedTranscription = false;
  const applyBase = (id: string) => {
    if (getStoredBrandChoice(id) !== null) return;
    s.setRemoteTranscriptionUrl(endpoint);
    s.setRemoteTranscriptionModel(model);
    setStoredBrandChoice(id, region);
    touchedTranscription = true;
  };
  applyBase("transcription.dictation");
  applyBase("transcription.upload");
  if (getStoredBrandChoice("transcription.meeting") === null) {
    s.setMeetingRemoteTranscriptionUrl(endpoint);
    s.setRemoteTranscriptionModel(model);
    setStoredBrandChoice("transcription.meeting", region);
    touchedTranscription = true;
  }
  if (touchedTranscription) s.setCustomTranscriptionApiKey(key);
}
