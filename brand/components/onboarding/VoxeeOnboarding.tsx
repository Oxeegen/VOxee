import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Sparkles,
  Globe,
  KeyRound,
  Brain,
  Sliders,
  Keyboard,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import StepProgress from "@/components/ui/StepProgress";
import { Button } from "@/components/ui/button";
import { BRAND } from "@brand/config/brand";
import OxeegenMark from "@brand/components/ui/OxeegenMark";
import WelcomeStep from "./steps/WelcomeStep";
import RegionStep, { type RegionChoice } from "./steps/RegionStep";
import ApiKeysStep from "./steps/ApiKeysStep";
import ModelsStep from "./steps/ModelsStep";
import PreferencesStep from "./steps/PreferencesStep";
import HotkeysStep from "./steps/HotkeysStep";

/** First-run VOxee setup wizard. Steps 1 (region) and 2 (a valid key) are required. */
export default function VoxeeOnboarding({ onComplete }: { onComplete: () => void }) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [region, setRegion] = useState<RegionChoice | null>(null);
  const [keyValid, setKeyValid] = useState<{ us: boolean; eu: boolean }>({ us: false, eu: false });

  const steps = useMemo(
    () => [
      { id: "welcome", title: t("brand.onboarding.steps.welcome", { defaultValue: "Welcome" }), icon: Sparkles },
      { id: "region", title: t("brand.onboarding.steps.region", { defaultValue: "Region" }), icon: Globe },
      { id: "keys", title: t("brand.onboarding.steps.keys", { defaultValue: "API keys" }), icon: KeyRound },
      { id: "models", title: t("brand.onboarding.steps.models", { defaultValue: "Models" }), icon: Brain },
      { id: "prefs", title: t("brand.onboarding.steps.prefs", { defaultValue: "Preferences" }), icon: Sliders },
      { id: "hotkeys", title: t("brand.onboarding.steps.hotkeys", { defaultValue: "Hotkeys" }), icon: Keyboard },
    ],
    [t]
  );

  const step2Valid =
    region === "us"
      ? keyValid.us
      : region === "eu"
        ? keyValid.eu
        : region === "both"
          ? keyValid.us || keyValid.eu
          : false;

  // Steps 1 (region) and 2 (a valid key) are mandatory; others are skippable.
  const canProceed = currentStep === 1 ? region !== null : currentStep === 2 ? step2Valid : true;

  const isLast = currentStep === steps.length - 1;
  const next = () => (isLast ? onComplete() : setCurrentStep((s) => Math.min(s + 1, steps.length - 1)));
  const back = () => setCurrentStep((s) => Math.max(s - 1, 0));

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <div className="px-6 pt-6 pb-4 border-b border-border/50">
        <div className="flex items-center gap-2 mb-4">
          <OxeegenMark className="w-5 h-5 text-primary" />
          <span className="text-sm font-semibold">{BRAND.productName}</span>
        </div>
        <StepProgress steps={steps} currentStep={currentStep} />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-lg mx-auto">
          {currentStep === 0 && <WelcomeStep />}
          {currentStep === 1 && <RegionStep region={region} setRegion={setRegion} />}
          {currentStep === 2 && <ApiKeysStep region={region} setKeyValid={setKeyValid} />}
          {currentStep === 3 && <ModelsStep />}
          {currentStep === 4 && <PreferencesStep />}
          {currentStep === 5 && <HotkeysStep />}
        </div>
      </div>

      <div className="px-6 py-4 border-t border-border/50 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={back} disabled={currentStep === 0}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          {t("brand.onboarding.back", { defaultValue: "Back" })}
        </Button>
        <Button size="sm" onClick={next} disabled={!canProceed}>
          {isLast ? (
            <>
              {t("brand.onboarding.finish", { defaultValue: "Finish" })}
              <Check className="w-4 h-4 ml-1" />
            </>
          ) : (
            <>
              {t("brand.onboarding.next", { defaultValue: "Next" })}
              <ChevronRight className="w-4 h-4 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
