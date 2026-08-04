import { create } from "zustand";
import logger from "../utils/logger";
import {
  useSettingsStore,
  selectResolvedLLMConfig,
  setResolvedLLMConfig,
} from "./settingsStore";
import { INFERENCE_SCOPES, type InferenceScope } from "../config/inferenceScopes";
import {
  isProviderValidForMode,
  getTranscriptionProviders,
  modelRegistry,
  REASONING_PROVIDERS,
  ENTERPRISE_PROVIDERS,
} from "../models/ModelRegistry";
import type { InferenceMode, ShareVisibility } from "../types/electron";
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

/** Whether a BYOK provider id is allowed for a scope. Unmanaged users allow everything. */
export function isProviderAllowed(
  state: Pick<PolicyState, "managed" | "policy">,
  scope: PolicyScope,
  providerId: string
): boolean {
  if (!state.managed || !state.policy) return true;
  return state.policy[scope].allowedByokProviders.includes(providerId);
}

/** Whether an enterprise-cloud provider id is allowed. Unmanaged users allow everything. */
export function isEnterpriseProviderAllowed(
  state: Pick<PolicyState, "managed" | "policy">,
  providerId: string
): boolean {
  if (!state.managed || !state.policy) return true;
  return state.policy.llm.allowedEnterpriseProviders.includes(providerId);
}

/** Whether the AI agent (dictation, voice, and chat) is allowed. */
export function isAgentAllowed(state: Pick<PolicyState, "managed" | "policy">): boolean {
  if (!state.managed || !state.policy) return true;
  return state.policy.features.agentEnabled;
}

/** Whether the agent's web_search tool is allowed. */
export function isWebSearchAllowed(state: Pick<PolicyState, "managed" | "policy">): boolean {
  if (!state.managed || !state.policy) return true;
  return state.policy.features.webSearchEnabled;
}

/** Whether a note share visibility is allowed under the org's external-sharing mode. */
export function isShareVisibilityAllowed(
  state: Pick<PolicyState, "managed" | "policy">,
  visibility: ShareVisibility
): boolean {
  if (!state.managed || !state.policy) return true;
  const mode = state.policy.sharing.externalLinkSharing;
  if (mode === "allowed") return true;
  if (mode === "domain_only") return visibility !== "link";
  return visibility !== "link" && visibility !== "domain";
}

/** The org-forced local history value, or null when the user may choose. */
export function lockedLocalHistoryValue(
  state: Pick<PolicyState, "managed" | "policy">
): boolean | null {
  if (!state.managed || !state.policy) return null;
  const mode = state.policy.dataRetention.localHistoryMode;
  if (mode === "always_on") return true;
  if (mode === "always_off") return false;
  return null;
}

/** Whether cloud backup/sync is allowed. */
export function isCloudBackupAllowed(state: Pick<PolicyState, "managed" | "policy">): boolean {
  if (!state.managed || !state.policy) return true;
  return state.policy.dataRetention.cloudBackupAllowed;
}

/** The org cap on audio retention days, or null when uncapped. */
export function maxAudioRetentionDays(
  state: Pick<PolicyState, "managed" | "policy">
): number | null {
  if (!state.managed || !state.policy) return null;
  return state.policy.dataRetention.audioRetentionMaxDays;
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

// Force any already-selected setting the policy disallows onto an allowed
// value, mirroring what the settings UI does on a manual change. Without this,
// stored settings would keep using values the org has blocked and the policy
// would only gate future UI clicks.
function reconcileSettingsWithPolicy(policy: OrgPolicy): void {
  reconcileModes(policy);
  reconcileProviders(policy);
  reconcileFeaturesAndRetention(policy);
}

function reconcileModes(policy: OrgPolicy): void {
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

// Providers are only reconciled for the mode that actually uses them; stale
// values behind an inactive mode are filtered by the pickers when re-entered.
function reconcileProviders(policy: OrgPolicy): void {
  const settings = useSettingsStore.getState();

  const transcriptionAllowed = policy.transcription.allowedByokProviders;
  if (!transcriptionAllowed.includes(settings.cloudTranscriptionProvider)) {
    const next = getTranscriptionProviders().find((p) => transcriptionAllowed.includes(p.id));
    if (next) {
      settings.setCloudTranscriptionProvider(next.id);
      settings.setCloudTranscriptionModel(next.models[0]?.id ?? "");
    }
  }

  for (const scope of Object.keys(INFERENCE_SCOPES) as InferenceScope[]) {
    const config = selectResolvedLLMConfig(useSettingsStore.getState(), scope);
    if (!config.provider) continue;

    if (config.mode === "providers" && !policy.llm.allowedByokProviders.includes(config.provider)) {
      const next = modelRegistry
        .getCloudProviders()
        .find((p) => policy.llm.allowedByokProviders.includes(p.id));
      setResolvedLLMConfig(scope, {
        provider: next?.id ?? "",
        model: next ? (REASONING_PROVIDERS[next.id]?.models[0]?.value ?? "") : "",
      });
    }

    if (
      config.mode === "enterprise" &&
      !policy.llm.allowedEnterpriseProviders.includes(config.provider)
    ) {
      const next = ENTERPRISE_PROVIDERS.find((id) =>
        policy.llm.allowedEnterpriseProviders.includes(id)
      );
      setResolvedLLMConfig(scope, {
        provider: next ?? "",
        model: next ? (REASONING_PROVIDERS[next]?.models[0]?.value ?? "") : "",
      });
    }
  }
}

function reconcileFeaturesAndRetention(policy: OrgPolicy): void {
  const settings = useSettingsStore.getState();

  if (!policy.features.agentEnabled && settings.useDictationAgent) {
    settings.setUseDictationAgent(false);
  }

  const historyMode = policy.dataRetention.localHistoryMode;
  if (historyMode === "always_on" && !settings.dataRetentionEnabled) {
    settings.setDataRetentionEnabled(true);
  } else if (historyMode === "always_off" && settings.dataRetentionEnabled) {
    settings.setDataRetentionEnabled(false);
  }

  if (!policy.dataRetention.cloudBackupAllowed && settings.cloudBackupEnabled) {
    settings.setCloudBackupEnabled(false);
  }

  const maxDays = policy.dataRetention.audioRetentionMaxDays;
  // audioRetentionDays === 0 means audio is not kept at all, which is always
  // within any cap — only clamp values above the cap.
  if (maxDays !== null && settings.audioRetentionDays > maxDays) {
    settings.setAudioRetentionDays(maxDays);
  }
}
