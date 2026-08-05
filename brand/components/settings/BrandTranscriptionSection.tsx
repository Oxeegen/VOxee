import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSettingsStore } from "@/stores/settingsStore";
import OpenAICompatiblePanel from "@/components/OpenAICompatiblePanel";
import { Input } from "@/components/ui/input";
import { getBrandModelConfig } from "@brand/config/brand";
import BrandModeChoice, { type BrandChoice } from "./BrandModeChoice";
import { getOxeegenApiKey } from "./brandApiKey";

interface BrandTranscriptionSectionProps {
  /** Current self-hosted endpoint for this transcription context. */
  url: string;
  setUrl: (value: string) => void;
  /** Current model id for this transcription context. */
  model: string;
  setModel: (value: string) => void;
}

/**
 * Account-less transcription config: locked brand endpoint/model (model name
 * shown read-only) or a Custom OpenAI-compatible endpoint with its own URL/key
 * and a fetched model list. Endpoint/model are owned by the caller (each
 * transcription context has different store keys); the API key is the shared
 * transcription secret.
 */
export default function BrandTranscriptionSection({
  url,
  setUrl,
  model,
  setModel,
}: BrandTranscriptionSectionProps) {
  const { t } = useTranslation();
  const brandCfg = getBrandModelConfig("transcription");

  const customTranscriptionApiKey = useSettingsStore((s) => s.customTranscriptionApiKey);
  const setCustomTranscriptionApiKey = useSettingsStore((s) => s.setCustomTranscriptionApiKey);

  const isOnBrandEndpoint = useMemo(
    () => (url || "") === brandCfg.endpoint,
    [url, brandCfg.endpoint]
  );
  const [choice, setChoice] = useState<BrandChoice>(isOnBrandEndpoint ? "brand" : "custom");

  const handleChange = (next: BrandChoice) => {
    setChoice(next);
    if (next === "brand") {
      setUrl(brandCfg.endpoint);
      setModel(brandCfg.model);
      setCustomTranscriptionApiKey(getOxeegenApiKey());
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
            baseUrl={url}
            setBaseUrl={setUrl}
            apiKey={customTranscriptionApiKey ?? ""}
            setApiKey={setCustomTranscriptionApiKey}
            model={model}
            setModel={setModel}
          />
        </div>
      )}
    </div>
  );
}
