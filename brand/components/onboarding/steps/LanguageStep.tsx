import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  SectionHeader,
  SettingsPanel,
  SettingsPanelRow,
  SettingsRow,
} from "@/components/ui/SettingsSection";
import LanguageSelector from "@/components/ui/LanguageSelector";
import type { LanguageOption } from "@/components/ui/LanguageSelector";
import { useSettingsStore } from "@/stores/settingsStore";
import { normalizeUiLanguage } from "@/i18n";

export const UI_LANGUAGE_OPTIONS: LanguageOption[] = [
  { value: "en", label: "English", flag: "🇺🇸" },
  { value: "es", label: "Español", flag: "🇪🇸" },
  { value: "fr", label: "Français", flag: "🇫🇷" },
  { value: "de", label: "Deutsch", flag: "🇩🇪" },
  { value: "pt", label: "Português", flag: "🇵🇹" },
  { value: "it", label: "Italiano", flag: "🇮🇹" },
  { value: "ru", label: "Русский", flag: "🇷🇺" },
  { value: "ja", label: "日本語", flag: "🇯🇵" },
  { value: "zh-CN", label: "简体中文", flag: "🇨🇳" },
  { value: "zh-TW", label: "繁體中文", flag: "🇹🇼" },
];

/** Step 0 — pick the interface language. Defaults to the system language (else English). */
export default function LanguageStep() {
  const { t } = useTranslation();
  const uiLanguage = useSettingsStore((s) => s.uiLanguage);
  const setUiLanguage = useSettingsStore((s) => s.setUiLanguage);

  // First run: default to the system language (falls back to English) unless the
  // user has already picked one. Applying it switches the whole wizard live.
  useEffect(() => {
    if (typeof localStorage !== "undefined" && localStorage.getItem("uiLanguage") == null) {
      const sys = normalizeUiLanguage(typeof navigator !== "undefined" ? navigator.language : "en");
      setUiLanguage(sys);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <SectionHeader
        title={t("brand.onboarding.language.title", { defaultValue: "Choose your language" })}
        description={t("brand.onboarding.language.subtitle", {
          defaultValue: "The language of the VOxee interface. You can change it later in Settings.",
        })}
      />
      <SettingsPanel>
        <SettingsPanelRow>
          <SettingsRow
            label={t("settings.language.uiLabel", { defaultValue: "Interface language" })}
            description={t("settings.language.uiDescription", { defaultValue: "Language of the app." })}
          >
            <LanguageSelector
              value={uiLanguage}
              onChange={setUiLanguage}
              options={UI_LANGUAGE_OPTIONS}
              className="min-w-40"
            />
          </SettingsRow>
        </SettingsPanelRow>
      </SettingsPanel>
    </div>
  );
}
