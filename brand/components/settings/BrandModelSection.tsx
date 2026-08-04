import { useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useTranslation } from "react-i18next";
import { Lock, Network } from "lucide-react";
import {
  useSettingsStore,
  selectResolvedLLMConfig,
  setResolvedLLMConfig,
} from "@/stores/settingsStore";
import type { InferenceScope } from "@/config/inferenceScopes";
import OpenAICompatiblePanel from "@/components/OpenAICompatiblePanel";
import ApiKeyInput from "@/components/ui/ApiKeyInput";
import { Input } from "@/components/ui/input";
import { cn } from "@/components/lib/utils";
import { BRAND, getBrandModelConfig } from "@brand/config/brand";
import type { BrandModelScope } from "@brand/config/brand";
import { useOxeegenApiKey } from "./brandApiKey";

interface BrandModelSectionProps {
  scope: InferenceScope;
}

/**
 * Account-less replacement for InferenceConfigEditor: the brand model is locked
 * (read-only endpoint + model), with an escape hatch to a Custom OpenAI-compatible
 * endpoint. Both share the single organization API key.
 */
export default function BrandModelSection({ scope }: BrandModelSectionProps) {
  const { t } = useTranslation();
  const brandCfg = getBrandModelConfig(scope as BrandModelScope);
  const config = useSettingsStore(useShallow((s) => selectResolvedLLMConfig(s, scope)));
  const { apiKey, setApiKey } = useOxeegenApiKey();

  const isOnBrandEndpoint = useMemo(
    () => (config.remoteUrl || "") === brandCfg.endpoint,
    [config.remoteUrl, brandCfg.endpoint]
  );
  const [choice, setChoice] = useState<"brand" | "custom">(
    isOnBrandEndpoint ? "brand" : "custom"
  );

  const selectBrand = () => {
    setChoice("brand");
    setResolvedLLMConfig(scope, {
      mode: "self-hosted",
      provider: "custom",
      remoteUrl: brandCfg.endpoint,
      model: brandCfg.model,
    });
  };

  const selectCustom = () => {
    setChoice("custom");
    setResolvedLLMConfig(scope, { mode: "self-hosted", provider: "custom" });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={selectBrand}
          className={cn(
            "flex items-center gap-2 rounded-lg border p-2.5 text-left text-sm transition-colors",
            choice === "brand"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-border-hover"
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
            choice === "custom"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-border-hover"
          )}
        >
          <Network className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-foreground">
            {t("reasoning.custom.endpointTitle")}
          </span>
        </button>
      </div>

      {choice === "brand" ? (
        <div className="space-y-3">
          <div className="border border-border rounded-lg p-3 space-y-2.5">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-muted-foreground">
                {t("reasoning.custom.endpointTitle")}
              </label>
              <Input value={brandCfg.endpoint} readOnly disabled className="h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-muted-foreground">
                {t("common.model")}
              </label>
              <Input value={brandCfg.model} readOnly disabled className="h-8 text-sm" />
            </div>
          </div>
          <ApiKeyInput apiKey={apiKey} setApiKey={setApiKey} />
        </div>
      ) : (
        <OpenAICompatiblePanel
          baseUrl={config.remoteUrl ?? ""}
          setBaseUrl={(v) => setResolvedLLMConfig(scope, { remoteUrl: v })}
          apiKey={apiKey}
          setApiKey={setApiKey}
          model={config.model}
          setModel={(v) => setResolvedLLMConfig(scope, { model: v })}
        />
      )}
    </div>
  );
}
