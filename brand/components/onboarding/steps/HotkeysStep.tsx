import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  SectionHeader,
  SettingsPanel,
  SettingsPanelRow,
} from "@/components/ui/SettingsSection";
import { HotkeyListInput } from "@/components/ui/HotkeyListInput";
import { useSettingsStore } from "@/stores/settingsStore";
import { useHotkeyRegistration } from "@/hooks/useHotkeyRegistration";
import { getDefaultHotkey } from "@/utils/hotkeys";

/** Step 5 — the 5 global hotkeys (registered with the OS, same as Settings). */
export default function HotkeysStep() {
  const { t } = useTranslation();

  const dictationKey = useSettingsStore((s) => s.dictationKey);
  const setDictationKey = useSettingsStore((s) => s.setDictationKey);
  const chatAgentKey = useSettingsStore((s) => s.chatAgentKey);
  const setChatAgentKey = useSettingsStore((s) => s.setChatAgentKey);
  const voiceAgentKey = useSettingsStore((s) => s.voiceAgentKey);
  const setVoiceAgentKey = useSettingsStore((s) => s.setVoiceAgentKey);
  const translationKey = useSettingsStore((s) => s.translationKey);
  const setTranslationKey = useSettingsStore((s) => s.setTranslationKey);
  const meetingKey = useSettingsStore((s) => s.meetingKey);
  const setMeetingKey = useSettingsStore((s) => s.setMeetingKey);

  const { registerHotkey: registerDictation } = useHotkeyRegistration({
    onSuccess: setDictationKey,
    showSuccessToast: false,
    showErrorToast: false,
  });
  const meetingRegisterFn = useCallback(
    async (hotkey: string) =>
      (await window.electronAPI?.registerMeetingHotkey?.(hotkey)) ?? { success: false },
    []
  );
  const { registerHotkey: registerMeeting } = useHotkeyRegistration({
    registerFn: meetingRegisterFn,
    onSuccess: setMeetingKey,
    showSuccessToast: false,
    showErrorToast: false,
  });

  const rows = [
    {
      id: "dictation",
      label: t("brand.onboarding.hotkeys.dictation", { defaultValue: "Dictation" }),
      value: dictationKey || getDefaultHotkey(),
      onChange: (list: string) => registerDictation(list),
      required: true,
    },
    {
      id: "agent",
      label: t("brand.onboarding.hotkeys.agent", { defaultValue: "Chat agent" }),
      value: chatAgentKey,
      onChange: (list: string) => setChatAgentKey(list),
      onClear: () => setChatAgentKey(""),
    },
    {
      id: "voiceAgent",
      label: t("brand.onboarding.hotkeys.voiceAgent", { defaultValue: "Voice agent" }),
      value: voiceAgentKey,
      onChange: (list: string) => setVoiceAgentKey(list),
      onClear: () => setVoiceAgentKey(""),
    },
    {
      id: "translation",
      label: t("brand.onboarding.hotkeys.translation", { defaultValue: "Translation" }),
      value: translationKey,
      onChange: (list: string) => setTranslationKey(list),
      onClear: () => setTranslationKey(""),
    },
    {
      id: "meeting",
      label: t("brand.onboarding.hotkeys.meeting", { defaultValue: "Meeting" }),
      value: meetingKey,
      onChange: (list: string) => registerMeeting(list),
      onClear: () => {
        setMeetingKey("");
        void window.electronAPI?.registerMeetingHotkey?.("");
      },
    },
  ];

  return (
    <div className="space-y-4">
      <SectionHeader
        title={t("brand.onboarding.hotkeys.title", { defaultValue: "Hotkeys" })}
        description={t("brand.onboarding.hotkeys.subtitle", {
          defaultValue: "Global shortcuts. Defaults are shown — change any of them.",
        })}
      />
      <SettingsPanel>
        {rows.map((r) => (
          <SettingsPanelRow key={r.id}>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-foreground">{r.label}</p>
              <HotkeyListInput
                value={r.value}
                onChange={r.onChange}
                onClear={r.onClear}
                required={r.required}
              />
            </div>
          </SettingsPanelRow>
        ))}
      </SettingsPanel>
    </div>
  );
}
