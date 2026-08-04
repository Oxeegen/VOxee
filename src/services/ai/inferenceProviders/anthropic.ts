import type { InferenceProvider } from "./types";
import { getCloudModel } from "../../../models/ModelRegistry";
import { wrapCleanupTranscript } from "../../../config/prompts";
import logger from "../../../utils/logger";

export const anthropicProvider: InferenceProvider = {
  id: "anthropic",
  async call({ text, model, agentName, config, ctx }) {
    if (typeof window === "undefined" || !window.electronAPI) {
      throw new Error("Anthropic reasoning is not available in this environment");
    }

    logger.logReasoning("ANTHROPIC_START", { model, agentName, environment: "browser" });
    const startTime = Date.now();

    logger.logReasoning("ANTHROPIC_IPC_CALL", { model, textLength: text.length });

    const systemPrompt = config.systemPrompt || ctx.getSystemPrompt(agentName);
    const userContent = config.systemPrompt ? text : wrapCleanupTranscript(text);
    const result = await window.electronAPI.processAnthropicReasoning(
      userContent,
      model,
      agentName,
      {
        ...config,
        systemPrompt,
        // Sonnet 5 / Opus 4.7+ reject `temperature`; the main-process handler
        // omits it when the registry says the model dropped it.
        supportsTemperature: getCloudModel(model)?.supportsTemperature ?? true,
      }
    );

    const processingTimeMs = Date.now() - startTime;

    if (!result.success) {
      logger.logReasoning("ANTHROPIC_ERROR", { model, processingTimeMs, error: result.error });
      throw new Error(result.error);
    }

    logger.logReasoning("ANTHROPIC_SUCCESS", {
      model,
      processingTimeMs,
      resultLength: result.text.length,
    });
    return result.text;
  },
};
