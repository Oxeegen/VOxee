import { useTranslation } from "react-i18next";
import { Mic, Sparkles, Bot, Languages, Users, FileText } from "lucide-react";
import { BRAND } from "@brand/config/brand";

/** Step 0 — welcome + a short feature overview. */
export default function WelcomeStep() {
  const { t } = useTranslation();

  const features = [
    { icon: Mic, label: t("brand.onboarding.welcome.dictation", { defaultValue: "Voice dictation into any app" }) },
    { icon: Sparkles, label: t("brand.onboarding.welcome.cleanup", { defaultValue: "AI text cleanup" }) },
    { icon: Bot, label: t("brand.onboarding.welcome.agent", { defaultValue: "Voice agent commands" }) },
    { icon: Languages, label: t("brand.onboarding.welcome.translation", { defaultValue: "Dictation translation" }) },
    { icon: Users, label: t("brand.onboarding.welcome.meeting", { defaultValue: "Meeting transcription" }) },
    { icon: FileText, label: t("brand.onboarding.welcome.notes", { defaultValue: "Notes with semantic search" }) },
  ];

  return (
    <div className="space-y-5 text-center">
      <div className="space-y-1.5">
        <h2 className="text-xl font-semibold">
          {t("brand.onboarding.welcome.title", { defaultValue: `Welcome to ${BRAND.productName}` })}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("brand.onboarding.welcome.subtitle", {
            defaultValue: `${BRAND.productName} turns your voice into text, notes and actions, powered by ${BRAND.modelBrandName} models. Let's set it up.`,
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
        {features.map(({ icon: Icon, label }, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-card px-3 py-2.5"
          >
            <Icon className="w-4 h-4 text-primary shrink-0" />
            <span className="text-xs font-medium">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
