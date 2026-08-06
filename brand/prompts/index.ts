import cleanup from "./dictationCleanup.md?raw";
import voiceAgent from "./voiceAgent.md?raw";
import chat from "./chat.md?raw";
import type { PromptKind } from "@/config/prompts/registry";

/**
 * Brand default prompts, authored as versioned .md files (baked at build via
 * Vite `?raw`). An empty file means "keep the upstream default" for that kind.
 *
 * {{agentName}} and other placeholders are substituted downstream by
 * resolvePrompt/applySubstitutions, so leave them in the .md as-is.
 */
const BRAND_PROMPTS: Partial<Record<PromptKind, string>> = {
  cleanup,
  dictationAgent: voiceAgent,
  chatAgent: chat,
};

/** Returns the brand default prompt for a kind, or "" to use the upstream default. */
export function getBrandPrompt(kind: PromptKind): string {
  return (BRAND_PROMPTS[kind] || "").trim();
}
