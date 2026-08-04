// Structural validation for the org policy delivered by /api/workspace-policy.
// The renderer dereferences policy.<scope>.allowedModes, policy.features.*,
// policy.sharing.*, and policy.dataRetention.* unchecked, and treats a null
// policy as "allow everything" — so a managed response must carry a
// structurally valid policy or the whole response is malformed.
const POLICY_SCOPES = ["transcription", "llm"];
const SHARING_MODES = ["allowed", "domain_only", "disabled"];
const LOCAL_HISTORY_MODES = ["user_choice", "always_on", "always_off"];

function isValidPolicyShape(policy) {
  return (
    Boolean(policy) &&
    typeof policy === "object" &&
    POLICY_SCOPES.every(
      (scope) =>
        Array.isArray(policy[scope]?.allowedModes) &&
        Array.isArray(policy[scope]?.allowedByokProviders)
    ) &&
    Array.isArray(policy.llm?.allowedEnterpriseProviders) &&
    typeof policy.features?.agentEnabled === "boolean" &&
    typeof policy.features?.webSearchEnabled === "boolean" &&
    SHARING_MODES.includes(policy.sharing?.externalLinkSharing) &&
    LOCAL_HISTORY_MODES.includes(policy.dataRetention?.localHistoryMode) &&
    typeof policy.dataRetention?.cloudBackupAllowed === "boolean" &&
    (policy.dataRetention?.audioRetentionMaxDays === null ||
      typeof policy.dataRetention?.audioRetentionMaxDays === "number") &&
    (policy.minAppVersion === null || typeof policy.minAppVersion === "string")
  );
}

module.exports = { isValidPolicyShape };
