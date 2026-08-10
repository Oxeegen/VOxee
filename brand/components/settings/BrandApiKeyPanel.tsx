import { useState } from "react";
import { useTranslation } from "react-i18next";
import { BRAND } from "@brand/config/brand";
import RegionKeyField from "./RegionKeyField";
import { consumeApiKeyFocus } from "@brand/utils/settingsNav";

/**
 * Dedicated panel with one API key per Oxeegen region. Each region's key
 * authenticates the scopes pointed at that region.
 */
export default function BrandApiKeyPanel() {
  const { t } = useTranslation();
  // Region to highlight when arriving from a "Key missing" health badge.
  const [focusRegion] = useState(() => consumeApiKeyFocus());
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">
          {BRAND.modelBrandName} {t("common.apiKey")}
        </h3>
        <p className="text-xs text-muted-foreground">
          {t("brand.apiKey.help", {
            defaultValue: "Sent as a Bearer token for authentication.",
          })}
        </p>
      </div>

      <RegionKeyField region="us" highlight={focusRegion === "us"} />
      <RegionKeyField region="eu" highlight={focusRegion === "eu"} />
    </div>
  );
}
