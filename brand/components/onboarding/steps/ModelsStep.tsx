import { useTranslation } from "react-i18next";
import {
  SectionHeader,
  SettingsPanel,
  SettingsPanelRow,
  SettingsRow,
} from "@/components/ui/SettingsSection";
import { Toggle } from "@/components/ui/toggle";
import { Input } from "@/components/ui/input";
import { useSettingsStore } from "@/stores/settingsStore";
import { useAgentName } from "@/utils/agentName";

/** Step 3 — enable cleanup / voice agent (+ name) / translation. */
export default function ModelsStep() {
  const { t } = useTranslation();
  const useCleanupModel = useSettingsStore((s) => s.useCleanupModel);
  const setUseCleanupModel = useSettingsStore((s) => s.setUseCleanupModel);
  const useDictationAgent = useSettingsStore((s) => s.useDictationAgent);
  const setUseDictationAgent = useSettingsStore((s) => s.setUseDictationAgent);
  const useDictationTranslation = useSettingsStore((s) => s.useDictationTranslation);
  const setUseDictationTranslation = useSettingsStore((s) => s.setUseDictationTranslation);
  const { agentName, setAgentName } = useAgentName();

  return (
    <div className="space-y-4">
      <SectionHeader
        title={t("brand.onboarding.models.title", { defaultValue: "Models" })}
        description={t("brand.onboarding.models.subtitle", {
          defaultValue: "Enable the features you want. You can change these later in Settings.",
        })}
      />
      <SettingsPanel>
        <SettingsPanelRow>
          <SettingsRow
            label={t("brand.onboarding.models.cleanup", { defaultValue: "Text cleanup" })}
            description={t("brand.onboarding.models.cleanupDesc", {
              defaultValue: "Clean up filler words and formatting after dictation.",
            })}
          >
            <Toggle checked={useCleanupModel} onChange={setUseCleanupModel} />
          </SettingsRow>
        </SettingsPanelRow>

        <SettingsPanelRow>
          <SettingsRow
            label={t("brand.onboarding.models.agent", { defaultValue: "Voice agent" })}
            description={t("brand.onboarding.models.agentDesc", {
              defaultValue: "Speak commands to your assistant.",
            })}
          >
            <Toggle checked={useDictationAgent} onChange={setUseDictationAgent} />
          </SettingsRow>
        </SettingsPanelRow>

        {useDictationAgent && (
          <SettingsPanelRow>
            <SettingsRow
              label={t("brand.onboarding.models.agentName", { defaultValue: "Agent name" })}
              description={t("brand.onboarding.models.agentNameDesc", {
                defaultValue: "How you address your assistant.",
              })}
            >
              <Input
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                className="h-8 w-40 text-sm"
              />
            </SettingsRow>
          </SettingsPanelRow>
        )}

        <SettingsPanelRow>
          <SettingsRow
            label={t("brand.onboarding.models.translation", { defaultValue: "Translation" })}
            description={t("brand.onboarding.models.translationDesc", {
              defaultValue: "Dictate in one language and paste in another.",
            })}
          >
            <Toggle checked={useDictationTranslation} onChange={setUseDictationTranslation} />
          </SettingsRow>
        </SettingsPanelRow>
      </SettingsPanel>
    </div>
  );
}
