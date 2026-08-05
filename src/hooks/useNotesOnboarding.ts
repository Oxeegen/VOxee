import { useState, useCallback } from "react";
import { useSettingsStore, selectIsCloudCleanupMode } from "../stores/settingsStore";
import { useUsage } from "./useUsage";
import { BRAND } from "@brand/config/brand";

interface UseNotesOnboardingReturn {
  isComplete: boolean;
  isProUser: boolean;
  isProLoading: boolean;
  isLLMConfigured: boolean;
  complete: () => void;
}

export function useNotesOnboarding(): UseNotesOnboardingReturn {
  const usage = useUsage();
  const isProUser = !!(usage?.isSubscribed || usage?.isTrial);
  const isProLoading = usage !== null && !usage.hasLoaded;
  const useCleanupModel = useSettingsStore((s) => s.useCleanupModel);
  const effectiveModel = useSettingsStore((s) => s.cleanupModel);
  const isCloudCleanup = useSettingsStore(selectIsCloudCleanupMode);

  const [isComplete, setIsComplete] = useState(
    // Account-less brand builds preconfigure the LLM (self-hosted), so the
    // notes model-setup onboarding is redundant — treat it as already done.
    () => !BRAND.showAccount || localStorage.getItem("notesOnboardingComplete") === "true"
  );

  const isLLMConfigured = isCloudCleanup || (useCleanupModel && !!effectiveModel);

  const complete = useCallback(() => {
    localStorage.setItem("notesOnboardingComplete", "true");
    setIsComplete(true);
  }, []);

  return { isComplete, isProUser, isProLoading, isLLMConfigured, complete };
}
