import i18n, { normalizeUiLanguage } from "../../i18n";
import { useSettingsStore } from "../../stores/settingsStore";
import { en as enPrompts } from "../../locales/prompts";
import { getLanguageInstruction } from "../../utils/languageSupport";
import { PROMPT_KINDS, type PromptKind } from "./registry";
import { BRAND } from "@brand/config/brand";
import { getBrandPrompt } from "@brand/prompts";

export { PROMPT_KINDS, PROMPT_KIND_LIST, type PromptKind } from "./registry";

export interface ResolvePromptOptions {
  agentName: string | null;
  uiLanguage?: string;
  language?: string;
  customDictionary?: string[];
  targetLanguageLabel?: string;
}

export function resolvePrompt(kind: PromptKind, opts: ResolvePromptOptions): string {
  const custom = useSettingsStore.getState().customPrompts[kind];
  const template = custom || getDefaultPromptText(kind, opts.uiLanguage);
  return applySubstitutions(template, opts);
}

export function getDefaultPromptText(kind: PromptKind, uiLanguage?: string): string {
  // Account-less brand builds ship their own default prompts (versioned .md).
  // An empty brand file falls through to the upstream default for that kind.
  if (!BRAND.showAccount) {
    const brandPrompt = getBrandPrompt(kind);
    if (brandPrompt) return brandPrompt;
  }

  const def = PROMPT_KINDS[kind];
  if (!def.i18nKey) return def.fallback;
  const locale = normalizeUiLanguage(uiLanguage || "en");
  const t = i18n.getFixedT(locale, "prompts");
  return t(def.i18nKey, { defaultValue: def.fallback });
}

// The cleanup prompt tells the model its input arrives between <transcript>
// tags; the trailing line re-anchors the output contract right after the
// transcript, where models weight instructions most. Mirrors api/reason.ts
// in openwhispr-api.
export function wrapCleanupTranscript(text: string): string {
  return `<transcript>\n${text}\n</transcript>\n\nOutput only the cleaned transcript.`;
}

export function appendDictionarySuffix(
  prompt: string,
  customDictionary?: string[],
  uiLanguage?: string
): string {
  if (!customDictionary?.length) return prompt;
  const locale = normalizeUiLanguage(uiLanguage || "en");
  const suffix = i18n.getFixedT(locale, "prompts")("dictionarySuffix", {
    defaultValue: enPrompts.dictionarySuffix,
  });
  return prompt + suffix + customDictionary.join(", ");
}

function applySubstitutions(template: string, opts: ResolvePromptOptions): string {
  const name = opts.agentName?.trim() || "Assistant";
  let prompt = template.replace(/\{\{agentName\}\}/g, name);

  if (opts.targetLanguageLabel) {
    prompt = prompt.replace(/\{\{targetLanguage\}\}/g, opts.targetLanguageLabel);
  }

  const langInstruction = getLanguageInstruction(opts.language);
  if (langInstruction) prompt += "\n\n" + langInstruction;

  return appendDictionarySuffix(prompt, opts.customDictionary, opts.uiLanguage);
}
