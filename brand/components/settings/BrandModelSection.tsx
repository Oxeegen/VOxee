import { useState } from "react";
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
import { BRAND, getBrandRegionModelConfig } from "@brand/config/brand";
import type { BrandModelScope, BrandRegionId } from "@brand/config/brand";
import BrandModeChoice, { type BrandChoice } from "./BrandModeChoice";
import { getOxeegenRegionKey } from "./brandApiKey";
import { getStoredBrandChoice, setStoredBrandChoice } from "./brandChoice";

interface BrandModelSectionProps {
  scope: InferenceScope;
}

/**
 * Account-less LLM editor: choose Oxeegen US / Oxeegen EU (locked region
 * endpoint + read-only model, region key applied) or a Custom OpenAI-compatible
 * endpoint. Nothing is selected until the user picks a provider.
 */
export default function BrandModelSection({ scope }: BrandModelSectionProps) {
  const { t } = useTranslation();
  const brandScope = scope as BrandModelScope;
  const config = useSettingsStore(useShallow((s) => selectResolvedLLMConfig(s, scope)));

  const [choice, setChoice] = useState<BrandChoice | null>(() => getStoredBrandChoice(scope));

  const handleChange = async (next: BrandChoice) => {
    setChoice(next);
    setStoredBrandChoice(scope, next);
    if (next === "custom") {
      setResolvedLLMConfig(scope, { mode: "self-hosted", provider: "custom" });
      return;
    }
    // Region: lock to that region's endpoint/model and apply its org key.
    const region = next as BrandRegionId;
    const { endpoint, model } = getBrandRegionModelConfig(region, brandScope);
    const key = await getOxeegenRegionKey(region);
    setResolvedLLMConfig(scope, {
      mode: "self-hosted",
      provider: "custom",
      remoteUrl: endpoint,
      model,
      customApiKey: key,
    });
  };

  const regionModel =
    choice === "eu" || choice === "us"
      ? getBrandRegionModelConfig(choice, brandScope).model
      : "";

  return (
    <div className="space-y-3">
      <BrandModeChoice choice={choice} onChange={handleChange} />

      {choice === "eu" || choice === "us" ? (
        <div className="border border-border rounded-lg p-3 space-y-1.5">
          <label className="block text-xs font-medium text-muted-foreground">
            {t("common.model")}
          </label>
          <Input value={regionModel} readOnly disabled className="h-8 text-sm" />
        </div>
      ) : choice === "custom" ? (
        <div className="border border-border rounded-lg p-3">
          <OpenAICompatiblePanel
            baseUrl={config.remoteUrl ?? ""}
            setBaseUrl={(v) => setResolvedLLMConfig(scope, { remoteUrl: v })}
            apiKey={config.customApiKey ?? ""}
            setApiKey={(v) => setResolvedLLMConfig(scope, { customApiKey: v })}
            model={config.model}
            setModel={(v) => setResolvedLLMConfig(scope, { model: v })}
            apiKeyHelp={t("reasoning.custom.apiKeyHelp").replace(/OpenAI/g, BRAND.modelBrandName)}
          />
        </div>
      ) : null}
    </div>
  );
}
