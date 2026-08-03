// Structural validation for the org policy delivered by /api/workspace-policy.
// The renderer dereferences policy.<scope>.allowedModes etc. unchecked, and
// treats a null policy as "allow everything" — so a managed response must
// carry a structurally valid policy or the whole response is malformed.
const POLICY_SCOPES = ["transcription", "llm"];

function isValidPolicyShape(policy) {
  return (
    Boolean(policy) &&
    typeof policy === "object" &&
    POLICY_SCOPES.every(
      (scope) =>
        Array.isArray(policy[scope]?.allowedModes) &&
        Array.isArray(policy[scope]?.allowedByokProviders)
    ) &&
    Array.isArray(policy.llm?.allowedEnterpriseProviders)
  );
}

module.exports = { isValidPolicyShape };
