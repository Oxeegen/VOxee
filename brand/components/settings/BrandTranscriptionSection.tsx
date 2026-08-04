import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Lock, Network } from "lucide-react";
import ApiKeyInput from "@/components/ui/ApiKeyInput";
import { Input } from "@/components/ui/input";
import { cn } from "@/components/lib/utils";
import { BRAND, getBrandModelConfig } from "@brand/config/brand";
import { useOxeegenApiKey } from "./brandApiKey";

interface BrandTranscriptionSectionProps {
  /** Current self-hosted endpoint for this transcription context. */
  url: string;
  setUrl: (value: string) => void;
  /** Current model id for this transcription context. */
  model: string;
  setModel: (value: string) => void;
}

/**
 * Account-less transcription config: locked brand endpoint/model with a Custom
 * escape hatch. Endpoint/model are supplied and persisted by the caller (each
 * transcription context — dictation, meeting, upload — owns different store
 * keys), so this component stays context-agnostic.
 */
export default function BrandTranscriptionSection({
  url,
  setUrl,
  model,
  setModel,
}: BrandTranscriptionSectionProps) {
  const { t } = useTranslation();
  const brandCfg = getBrandModelConfig("transcription");
  const { apiKey, setApiKey } = useOxeegenApiKey();

  const isOnBrandEndpoint = useMemo(() => (url || "") === brandCfg.endpoint, [url, brandCfg.endpoint]);
  const [choice, setChoice] = useState<"brand" | "custom">(isOnBrandEndpoint ? "brand" : "custom");

  const selectBrand = () => {
    setChoice("brand");
    setUrl(brandCfg.endpoint);
    setModel(brandCfg.model);
  };

  const selectCustom = () => {
    setChoice("custom");
  };

  const locked = choice === "brand";

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={selectBrand}
          className={cn(
            "flex items-center gap-2 rounded-lg border p-2.5 text-left text-sm transition-colors",
            locked ? "border-primary bg-primary/5" : "border-border hover:border-border-hover"
          )}
        >
          <Lock className="w-4 h-4 text-primary" />
          <span className="font-medium text-foreground">{BRAND.modelBrandName}</span>
        </button>
        <button
          type="button"
          onClick={selectCustom}
          className={cn(
            "flex items-center gap-2 rounded-lg border p-2.5 text-left text-sm transition-colors",
            !locked ? "border-primary bg-primary/5" : "border-border hover:border-border-hover"
          )}
        >
          <Network className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-foreground">{t("settingsPage.selfHosted.serverUrl")}</span>
        </button>
      </div>

      <div className="border border-border rounded-lg p-3 space-y-2.5">
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-muted-foreground">
            {t("settingsPage.selfHosted.serverUrl")}
          </label>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            readOnly={locked}
            disabled={locked}
            placeholder="https://endpoint/v1"
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-muted-foreground">
            {t("common.model")}
          </label>
          <Input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            readOnly={locked}
            disabled={locked}
            placeholder="stt-model"
            className="h-8 text-sm"
          />
        </div>
      </div>

      <ApiKeyInput apiKey={apiKey} setApiKey={setApiKey} />
    </div>
  );
}
