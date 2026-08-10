import { useTranslation } from "react-i18next";
import { Sun, Moon, Monitor } from "lucide-react";
import {
  SectionHeader,
  SettingsPanel,
  SettingsPanelRow,
  SettingsRow,
} from "@/components/ui/SettingsSection";
import { Toggle } from "@/components/ui/toggle";
import LanguageSelector from "@/components/ui/LanguageSelector";
import type { LanguageOption } from "@/components/ui/LanguageSelector";
import { useSettingsStore } from "@/stores/settingsStore";
import { useTheme } from "@/hooks/useTheme";

const UI_LANGUAGE_OPTIONS: LanguageOption[] = [
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

/** Step 4 — theme, floating icon, and languages (defaults: system theme). */
export default function PreferencesStep() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  const floatingIconAutoHide = useSettingsStore((s) => s.floatingIconAutoHide);
  const setFloatingIconAutoHide = useSettingsStore((s) => s.setFloatingIconAutoHide);
  const panelStartPosition = useSettingsStore((s) => s.panelStartPosition);
  const setPanelStartPosition = useSettingsStore((s) => s.setPanelStartPosition);
  const uiLanguage = useSettingsStore((s) => s.uiLanguage);
  const setUiLanguage = useSettingsStore((s) => s.setUiLanguage);
  const preferredLanguage = useSettingsStore((s) => s.preferredLanguage);
  const setPreferredLanguage = useSettingsStore((s) => s.setPreferredLanguage);

  const themeOptions = [
    { value: "light", icon: Sun, label: t("settingsPage.general.appearance.light", { defaultValue: "Light" }) },
    { value: "dark", icon: Moon, label: t("settingsPage.general.appearance.dark", { defaultValue: "Dark" }) },
    { value: "auto", icon: Monitor, label: t("settingsPage.general.appearance.auto", { defaultValue: "System" }) },
  ] as const;

  return (
    <div className="space-y-5">
      <div>
        <SectionHeader
          title={t("brand.onboarding.prefs.title", { defaultValue: "Preferences" })}
          description={t("brand.onboarding.prefs.subtitle", { defaultValue: "Appearance and languages." })}
        />
        <SettingsPanel>
          <SettingsPanelRow>
            <SettingsRow
              label={t("settingsPage.general.appearance.title", { defaultValue: "Theme" })}
              description={t("settingsPage.general.appearance.description", {
                defaultValue: "Light, dark, or follow the system.",
              })}
            >
              <div className="inline-flex items-center gap-px p-0.5 bg-muted/60 dark:bg-surface-2 rounded-md">
                {themeOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = theme === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setTheme(option.value)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-[5px] text-xs font-medium transition-colors duration-100 ${
                        isSelected
                          ? "bg-background dark:bg-surface-raised text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className={`w-3 h-3 ${isSelected ? "text-primary" : ""}`} />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </SettingsRow>
          </SettingsPanelRow>

          <SettingsPanelRow>
            <SettingsRow
              label={t("settingsPage.general.floatingIcon.autoHide", { defaultValue: "Auto-hide floating icon" })}
              description={t("settingsPage.general.floatingIcon.autoHideDescription", {
                defaultValue: "Hide the floating icon when idle.",
              })}
            >
              <Toggle checked={floatingIconAutoHide} onChange={setFloatingIconAutoHide} />
            </SettingsRow>
          </SettingsPanelRow>

          <SettingsPanelRow>
            <SettingsRow
              label={t("settingsPage.general.floatingIcon.startPosition", { defaultValue: "Icon position" })}
              description={t("settingsPage.general.floatingIcon.startPositionDescription", {
                defaultValue: "Where the floating panel appears.",
              })}
            >
              <select
                value={panelStartPosition}
                onChange={(e) =>
                  setPanelStartPosition(e.target.value as "bottom-right" | "center" | "bottom-left")
                }
                className="h-7 rounded border border-border/70 bg-surface-1/80 px-2.5 text-xs font-medium text-foreground shadow-sm hover:border-border-hover focus:outline-none focus:ring-2 focus:ring-ring/30 transition-colors"
              >
                <option value="bottom-right">
                  {t("settingsPage.general.floatingIcon.bottomRight", { defaultValue: "Bottom right" })}
                </option>
                <option value="center">
                  {t("settingsPage.general.floatingIcon.center", { defaultValue: "Center" })}
                </option>
                <option value="bottom-left">
                  {t("settingsPage.general.floatingIcon.bottomLeft", { defaultValue: "Bottom left" })}
                </option>
              </select>
            </SettingsRow>
          </SettingsPanelRow>
        </SettingsPanel>
      </div>

      <div>
        <SectionHeader
          title={t("settings.language.sectionTitle", { defaultValue: "Language" })}
          description={t("settings.language.sectionDescription", {
            defaultValue: "Interface and transcription languages.",
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
                className="min-w-32"
              />
            </SettingsRow>
          </SettingsPanelRow>
          <SettingsPanelRow>
            <SettingsRow
              label={t("settings.language.transcriptionLabel", { defaultValue: "Transcription language" })}
              description={t("settings.language.transcriptionDescription", {
                defaultValue: "The language you speak.",
              })}
            >
              <LanguageSelector value={preferredLanguage} onChange={setPreferredLanguage} />
            </SettingsRow>
          </SettingsPanelRow>
        </SettingsPanel>
      </div>
    </div>
  );
}
