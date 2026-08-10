import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Network } from "lucide-react";
import { InferenceModeSelector } from "@/components/ui/SettingsSection";
import type { InferenceModeOption } from "@/components/ui/SettingsSection";
import type { InferenceMode } from "@/types/electron";
import { BRAND } from "@brand/config/brand";
import OxeegenMark from "@brand/components/ui/OxeegenMark";
import RegionFlag from "@brand/components/ui/RegionFlag";

export type BrandChoice = "us" | "eu" | "custom";

/**
 * Three-option badge selector (reuses the upstream InferenceModeSelector look):
 * the two locked Oxeegen regions (US / EU, with their flags) vs a Custom
 * OpenAI-compatible endpoint. `choice` may be null — nothing is selected by
 * default; the user must pick a provider.
 *
 * The selector is generic over its ids, so the choices are cast to InferenceMode
 * purely to satisfy the shared component's typing.
 */
export default function BrandModeChoice({
  choice,
  onChange,
  activeStatus,
}: {
  choice: BrandChoice | null;
  onChange: (choice: BrandChoice) => void;
  /** Health badge rendered next to the "active" badge on the selected provider. */
  activeStatus?: ReactNode;
}) {
  const { t } = useTranslation();

  const regionDesc = t("brand.models.regionDesc", {
    defaultValue: `Preconfigured ${BRAND.modelBrandName} models`,
  });

  const modes: InferenceModeOption[] = [
    {
      id: "us" as InferenceMode,
      label: BRAND.regions.us.label,
      description: regionDesc,
      icon: <OxeegenMark className="w-4 h-4" />,
      labelSuffix: <RegionFlag region="us" className="w-4 h-3 shrink-0" />,
    },
    {
      id: "eu" as InferenceMode,
      label: BRAND.regions.eu.label,
      description: regionDesc,
      icon: <OxeegenMark className="w-4 h-4" />,
      labelSuffix: <RegionFlag region="eu" className="w-4 h-3 shrink-0" />,
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

  // Attach the health badge to the currently-selected provider row.
  const modesWithStatus = modes.map((m) =>
    m.id === (choice as InferenceMode) ? { ...m, statusSuffix: activeStatus } : m
  );

  return (
    <InferenceModeSelector
      modes={modesWithStatus}
      // Empty string matches no id, so nothing is highlighted when unset.
      activeMode={(choice ?? "") as InferenceMode}
      onSelect={(mode) => onChange(mode as BrandChoice)}
    />
  );
}
