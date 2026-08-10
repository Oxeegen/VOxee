import { useTranslation } from "react-i18next";
import { SectionHeader } from "@/components/ui/SettingsSection";
import RegionKeyField from "@brand/components/settings/RegionKeyField";
import type { RegionChoice } from "./RegionStep";

/** Step 2 (required) — enter the key(s) for the region(s) chosen in step 1. */
export default function ApiKeysStep({
  region,
  setKeyValid,
}: {
  region: RegionChoice | null;
  setKeyValid: (updater: (prev: { us: boolean; eu: boolean }) => { us: boolean; eu: boolean }) => void;
}) {
  const { t } = useTranslation();
  const showUs = region === "us" || region === "both";
  const showEu = region === "eu" || region === "both";

  return (
    <div className="space-y-4">
      <SectionHeader
        title={t("brand.onboarding.keys.title", { defaultValue: "Enter your API key" })}
        description={t("brand.onboarding.keys.subtitle", {
          defaultValue: "Paste the organization key for your region — it's verified against the endpoint.",
        })}
      />
      {showUs && (
        <RegionKeyField
          region="us"
          onStatusChange={(s) => setKeyValid((prev) => ({ ...prev, us: s === "valid" }))}
        />
      )}
      {showEu && (
        <RegionKeyField
          region="eu"
          onStatusChange={(s) => setKeyValid((prev) => ({ ...prev, eu: s === "valid" }))}
        />
      )}
    </div>
  );
}
