import { isSelfHostedTranscription } from "./selfHostedTranscription.js";

export function shouldSkipTranscriptionApiKey(settings) {
  if (!isSelfHostedTranscription(settings)) return false;

  // A self-hosted endpoint that has a key configured (e.g. an organization's
  // OpenAI-compatible server) still needs the key sent — skipping it yields a
  // 401. Only skip when no key is set (a truly keyless local server).
  const key =
    typeof settings?.customTranscriptionApiKey === "string"
      ? settings.customTranscriptionApiKey.trim()
      : "";
  return key.length === 0;
}
