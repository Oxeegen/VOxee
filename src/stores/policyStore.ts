import { create } from "zustand";
import logger from "../utils/logger";
import {
  useSettingsStore,
  selectResolvedLLMConfig,
  setResolvedLLMConfig,
} from "./settingsStore";
import { INFERENCE_SCOPES, type InferenceScope } from "../config/inferenceScopes";
import { isProviderValidForMode } from "../models/ModelRegistry";
import type { InferenceMode } from "../types/electron";
import type { OrgPolicy, PolicyScope } from "../types/policy";

interface PolicyState {
  /** True once the org enforces a policy on this user. */
  managed: boolean;
  /** The resolved policy, or null when unmanaged. */
  policy: OrgPolicy | null;
  /** True after the first fetch resolves (success or fail-closed cache). */
  loaded: boolean;
  fetchPolicy: () => Promise<void>;
}

// Several components mount useAuth at startup; share one in-flight fetch
// between them instead of hitting the API once per consumer.
let fetchInFlight: Promise<void> | null = null;

export const usePolicyStore = create<PolicyState>()((set) => ({
  managed: false,
  policy: null,
  loaded: false,
  fetchPolicy: (): Promise<void> => {
    fetchInFlight ??= (async () => {
      try {
        const result = await window.electronAPI.getWorkspacePolicy?.();
        if (result?.success) {
          const managed = Boolean(result.managed);
          const policy = result.policy ?? null;
          set({ managed, policy, loaded: true });
          if (managed && policy) reconcileSettingsWithPolicy(policy);
          return;
        }
        // Fetch failed with no cached policy: treat as unmanaged until a
        // later fetch succeeds.
        set({ loaded: true });
      } catch (error) {
        logger.error("Failed to fetch workspace policy:", error);
        set({ loaded: true });
      } finally {
        fetchInFlight = null;
      }
    })();
    return fetchInFlight;
  },
}));

/** Whether a transcription/LLM mode is allowed. Unmanaged users allow everything. */
export function isModeAllowed(
  state: Pick<PolicyState, "managed" | "policy">,
  scope: PolicyScope,
  mode: InferenceMode
): boolean {
  if (!state.managed || !state.policy) return true;
  return state.policy[scope].allowedModes.includes(mode);
}

/** Mark policy-disallowed mode options disabled with a "managed" badge. */
export function enforceModeOptions<
  T extends { id: InferenceMode; disabled?: boolean; badge?: string },
>(
  options: T[],
  scope: PolicyScope,
  state: Pick<PolicyState, "managed" | "policy">,
  managedBadge: string
): T[] {
  if (!state.managed || !state.policy) return options;
  return options.map((option) =>
    isModeAllowed(state, scope, option.id)
      ? option
      : { ...option, disabled: true, badge: managedBadge }
  );
}

// Force any already-selected mode the policy disallows onto the first allowed
// mode, mirroring what the settings UI does on a manual switch. Without this,
// stored settings would keep using a mode the org has blocked and the policy
// would only gate future UI clicks.
function reconcileSettingsWithPolicy(policy: OrgPolicy): void {
  const settings = useSettingsStore.getState();

  if (!policy.transcription.allowedModes.includes(settings.transcriptionMode)) {
    const next = policy.transcription.allowedModes[0];
    if (next) {
      settings.setTranscriptionMode(next);
      settings.setUseLocalWhisper(next === "local");
      settings.setCloudTranscriptionMode(next === "openwhispr" ? "openwhispr" : "byok");
    }
  }

  const llmNext = policy.llm.allowedModes[0];
  if (!llmNext) return;
  let switched = false;
  for (const scope of Object.keys(INFERENCE_SCOPES) as InferenceScope[]) {
    const config = selectResolvedLLMConfig(useSettingsStore.getState(), scope);
    if (policy.llm.allowedModes.includes(config.mode)) continue;
    const patch: Parameters<typeof setResolvedLLMConfig>[1] = {
      mode: llmNext,
      cloudMode: llmNext === "openwhispr" ? "openwhispr" : "byok",
    };
    if (!isProviderValidForMode(config.provider, llmNext)) {
      patch.provider = "";
      patch.model = "";
    }
    setResolvedLLMConfig(scope, patch);
    switched = true;
  }
  if (
    switched &&
    (llmNext === "openwhispr" || llmNext === "self-hosted" || llmNext === "enterprise")
  ) {
    window.electronAPI?.llamaServerStop?.();
  }
}
