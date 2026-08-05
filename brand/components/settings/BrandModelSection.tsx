import { useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useTranslation } from "react-i18next";
import {
  useSettingsStore,
  selectResolvedLLMConfig,
  setResolvedLLMConfig,
} from "@/stores/settingsStore";
import type { InferenceScope } from "@/config/inferenceScopes";
import OpenAICompatiblePanel from "@/components/OpenAICompatiblePanel";
import { Input } from "@/components/ui/input";
import { BRAND, getBrandModelConfig } from "@brand/config/brand";
import type { BrandModelScope } from "@brand/config/brand";
import BrandModeChoice, { type BrandChoice } from "./BrandModeChoice";
import { getOxeegenApiKey } from "./brandApiKey";

interface BrandModelSectionProps {
  scope: InferenceScope;
}

/**
 * Account-less LLM editor: choose the locked brand models (model name shown
 * read-only; shared org key entered once in the API Key section) or a Custom
 * OpenAI-compatible endpoint with its own URL/key and a fetched model list.
 */
export default function BrandModelSection({ scope }: BrandModelSectionProps) {
  const { t } = useTranslation();
  const brandCfg = getBrandModelConfig(scope as BrandModelScope);
  const config = useSettingsStore(useShallow((s) => selectResolvedLLMConfig(s, scope)));

  const isOnBrandEndpoint = useMemo(
    () => (config.remoteUrl || "") === brandCfg.endpoint,
    [config.remoteUrl, brandCfg.endpoint]
  );
  const [choice, setChoice] = useState<BrandChoice>(isOnBrandEndpoint ? "brand" : "custom");

  const handleChange = (next: BrandChoice) => {
    setChoice(next);
    if (next === "brand") {
      // Lock to the brand endpoint/model and (re)apply the shared org key so
      // the request is authenticated even after a Custom detour.
      setResolvedLLMConfig(scope, {
        mode: "self-hosted",
        provider: "custom",
        remoteUrl: brandCfg.endpoint,
        model: brandCfg.model,
        customApiKey: getOxeegenApiKey(),
      });
    } else {
      setResolvedLLMConfig(scope, { mode: "self-hosted", provider: "custom" });
    }
  };

  return (
    <div className="space-y-3">
      <BrandModeChoice choice={choice} onChange={handleChange} />

      {choice === "brand" ? (
        <div className="border border-border rounded-lg p-3 space-y-1.5">
          <label className="block text-xs font-medium text-muted-foreground">
            {t("common.model")}
          </label>
          <Input value={brandCfg.model} readOnly disabled className="h-8 text-sm" />
        </div>
      ) : (
        <div className="border border-border rounded-lg p-3">
          <OpenAICompatiblePanel
            baseUrl={config.remoteUrl ?? ""}
            setBaseUrl={(v) => setResolvedLLMConfig(scope, { remoteUrl: v })}
            apiKey={config.customApiKey ?? ""}
            setApiKey={(v) => setResolvedLLMConfig(scope, { customApiKey: v })}
            model={config.model}
            setModel={(v) => setResolvedLLMConfig(scope, { model: v })}
          />
        </div>
      )}
    </div>
  );
}
