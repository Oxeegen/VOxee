import { useState } from "react";
import { useTranslation } from "react-i18next";
import OpenAICompatiblePanel from "@/components/OpenAICompatiblePanel";
import { Input } from "@/components/ui/input";
import { BRAND, getBrandRegionModelConfig } from "@brand/config/brand";
import type { BrandRegionId } from "@brand/config/brand";
import BrandModeChoice, { type BrandChoice } from "./BrandModeChoice";
import ProviderHealthBadge from "./ProviderHealthBadge";
import { getOxeegenRegionKey } from "./brandApiKey";
import { getStoredBrandChoice, setStoredBrandChoice } from "./brandChoice";

interface BrandTranscriptionSectionProps {
  /** Stable id used to persist the US/EU/Custom choice (dictation/meeting/upload). */
  contextKey: string;
  /** Current self-hosted endpoint for this transcription context. */
  url: string;
  setUrl: (value: string) => void;
  /** Current model id for this transcription context. */
  model: string;
  setModel: (value: string) => void;
  /** This context's own API key (each screen has its own). */
  apiKey: string;
  setApiKey: (value: string) => void;
}

/**
 * Account-less transcription config: pick Oxeegen US / Oxeegen EU (locked region
 * endpoint + read-only model, region key applied) or a Custom OpenAI-compatible
 * endpoint. Endpoint/model/key are all owned by the caller so each transcription
 * screen (dictation/meeting/upload) has its own independent config.
 */
export default function BrandTranscriptionSection({
  contextKey,
  url,
  setUrl,
  model,
  setModel,
  apiKey,
  setApiKey,
}: BrandTranscriptionSectionProps) {
  const { t } = useTranslation();
  const choiceId = `transcription.${contextKey}`;

  const [choice, setChoice] = useState<BrandChoice | null>(() => getStoredBrandChoice(choiceId));

  const handleChange = async (next: BrandChoice) => {
    setChoice(next);
    setStoredBrandChoice(choiceId, next);
    if (next === "custom") return;
    const region = next as BrandRegionId;
    const { endpoint, model: regionModel } = getBrandRegionModelConfig(region, "transcription");
    setUrl(endpoint);
    setModel(regionModel);
    setApiKey(await getOxeegenRegionKey(region));
  };

  const regionModel =
    choice === "eu" || choice === "us"
      ? getBrandRegionModelConfig(choice, "transcription").model
      : "";

  const activeStatus = choice ? (
    <ProviderHealthBadge endpoint={url} model={model} apiKey={apiKey ?? ""} region={choice} />
  ) : undefined;

  return (
    <div className="space-y-3">
      <BrandModeChoice choice={choice} onChange={handleChange} activeStatus={activeStatus} />

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
            baseUrl={url}
            setBaseUrl={setUrl}
            apiKey={apiKey ?? ""}
            setApiKey={setApiKey}
            model={model}
            setModel={setModel}
            apiKeyHelp={t("reasoning.custom.apiKeyHelp").replace(/OpenAI/g, BRAND.modelBrandName)}
          />
        </div>
      ) : null}
    </div>
  );
}
