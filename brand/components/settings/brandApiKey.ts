import { useSettingsStore, getSettings } from "@/stores/settingsStore";

/**
 * Single organization API key shared by every self-hosted scope.
 *
 * All brand scopes target the same OpenAI-compatible endpoint, so one key
 * serves them all. It is written through the existing store setters:
 *   - cleanupCustomApiKey and customTranscriptionApiKey persist ENCRYPTED via
 *     Electron safeStorage (they are declared secrets).
 *   - the other per-scope custom keys use the same localStorage storage that
 *     upstream already uses for user-entered custom keys.
 *
 * `cleanupCustomApiKey` is the canonical value read back everywhere.
 */

export function getOxeegenApiKey(): string {
  return getSettings().cleanupCustomApiKey || "";
}

export function setOxeegenApiKey(key: string): void {
  const s = useSettingsStore.getState();
  s.setCleanupCustomApiKey(key); // secret (safeStorage)
  s.setCustomTranscriptionApiKey(key); // secret (safeStorage)
  s.setDictationAgentCustomApiKey(key);
  s.setChatAgentCustomApiKey(key);
  s.setNoteFormattingCustomApiKey(key);
  s.setTranslationCustomApiKey(key);
}

/** Reactive accessor for the shared key. */
export function useOxeegenApiKey(): { apiKey: string; setApiKey: (key: string) => void } {
  const apiKey = useSettingsStore((s) => s.cleanupCustomApiKey) || "";
  return { apiKey, setApiKey: setOxeegenApiKey };
}
