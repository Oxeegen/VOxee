import { useTranslation } from "react-i18next";
import { InferenceModeSelector, SectionHeader } from "@/components/ui/SettingsSection";
import type { InferenceModeOption } from "@/components/ui/SettingsSection";
import type { InferenceMode } from "@/types/electron";
import { BRAND } from "@brand/config/brand";
import OxeegenMark from "@brand/components/ui/OxeegenMark";
import RegionFlag from "@brand/components/ui/RegionFlag";

export type RegionChoice = "us" | "eu" | "both";

/** Step 1 (required) — which Oxeegen region(s) to set up. */
export default function RegionStep({
  region,
  setRegion,
}: {
  region: RegionChoice | null;
  setRegion: (r: RegionChoice) => void;
}) {
  const { t } = useTranslation();

  const modes: InferenceModeOption[] = [
    {
      id: "us" as InferenceMode,
      label: BRAND.regions.us.label,
      description: t("brand.onboarding.region.desc", { defaultValue: `Preconfigured ${BRAND.modelBrandName} models` }),
      icon: <OxeegenMark className="w-4 h-4" />,
      labelSuffix: <RegionFlag region="us" className="w-4 h-3 shrink-0" />,
    },
    {
      id: "eu" as InferenceMode,
      label: BRAND.regions.eu.label,
      description: t("brand.onboarding.region.desc", { defaultValue: `Preconfigured ${BRAND.modelBrandName} models` }),
      icon: <OxeegenMark className="w-4 h-4" />,
      labelSuffix: <RegionFlag region="eu" className="w-4 h-3 shrink-0" />,
    },
    {
      id: "both" as InferenceMode,
      label: t("brand.onboarding.region.both", { defaultValue: "Both" }),
      description: t("brand.onboarding.region.bothDesc", { defaultValue: "Set up US and EU" }),
      icon: <OxeegenMark className="w-4 h-4" />,
      labelSuffix: (
        <span className="flex items-center gap-1">
          <RegionFlag region="us" className="w-4 h-3 shrink-0" />
          <RegionFlag region="eu" className="w-4 h-3 shrink-0" />
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <SectionHeader
        title={t("brand.onboarding.region.title", { defaultValue: "Choose your region" })}
        description={t("brand.onboarding.region.subtitle", {
          defaultValue: `Pick the ${BRAND.modelBrandName} deployment closest to you.`,
        })}
      />
      <InferenceModeSelector
        modes={modes}
        activeMode={(region ?? "") as InferenceMode}
        onSelect={(m) => setRegion(m as RegionChoice)}
      />
    </div>
  );
}
