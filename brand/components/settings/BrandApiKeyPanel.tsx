import { useTranslation } from "react-i18next";
import ApiKeyInput from "@/components/ui/ApiKeyInput";
import { BRAND } from "@brand/config/brand";
import { useOxeegenApiKey } from "./brandApiKey";

/**
 * Dedicated panel to enter the single organization API key shared by every
 * self-hosted scope (LLM + transcription). See brandApiKey.ts.
 */
export default function BrandApiKeyPanel() {
  const { t } = useTranslation();
  const { apiKey, setApiKey } = useOxeegenApiKey();

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">
          {t("common.apiKey")} — {BRAND.modelBrandName}
        </h3>
        <p className="text-xs text-muted-foreground">{t("reasoning.custom.apiKeyHelp")}</p>
      </div>
      <ApiKeyInput apiKey={apiKey} setApiKey={setApiKey} />
    </div>
  );
}
