import { useTranslation } from "react-i18next";
import { Network } from "lucide-react";
import { InferenceModeSelector } from "@/components/ui/SettingsSection";
import type { InferenceModeOption } from "@/components/ui/SettingsSection";
import type { InferenceMode } from "@/types/electron";
import { BRAND } from "@brand/config/brand";
import OxeegenMark from "@brand/components/ui/OxeegenMark";

export type BrandChoice = "brand" | "custom";

/**
 * Two-option badge selector (reuses the upstream InferenceModeSelector look):
 * the locked brand models vs a Custom OpenAI-compatible endpoint.
 *
 * The selector is generic over its ids, so "brand"/"custom" are cast to
 * InferenceMode purely to satisfy the shared component's typing.
 */
export default function BrandModeChoice({
  choice,
  onChange,
}: {
  choice: BrandChoice;
  onChange: (choice: BrandChoice) => void;
}) {
  const { t } = useTranslation();

  const modes: InferenceModeOption[] = [
    {
      id: "brand" as InferenceMode,
      label: BRAND.modelBrandName,
      description: t("brand.models.brandDesc", {
        defaultValue: `Preconfigured ${BRAND.modelBrandName} models`,
      }),
      // Inherits the selector's icon color: primary (brand) when selected,
      // muted-foreground when not — adapts to the theme like the lucide icons.
      icon: <OxeegenMark className="w-4 h-4" />,
    },
    {
      id: "custom" as InferenceMode,
      label: t("brand.models.custom", { defaultValue: "Custom" }),
      description: t("brand.models.customDesc", {
        defaultValue: "Your own OpenAI-compatible endpoint",
      }),
      icon: <Network className="w-4 h-4" />,
    },
  ];

  return (
    <InferenceModeSelector
      modes={modes}
      activeMode={choice as InferenceMode}
      onSelect={(mode) => onChange(mode as BrandChoice)}
    />
  );
}
