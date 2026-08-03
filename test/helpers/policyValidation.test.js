const test = require("node:test");
const assert = require("node:assert/strict");

const { isValidPolicyShape } = require("../../src/helpers/policyValidation");

const validPolicy = () => ({
  version: 1,
  transcription: {
    allowedModes: ["openwhispr", "local"],
    allowedByokProviders: [],
  },
  llm: {
    allowedModes: ["openwhispr"],
    allowedByokProviders: ["openai"],
    allowedEnterpriseProviders: ["bedrock"],
  },
  features: { agentEnabled: true, webSearchEnabled: false },
  sharing: { externalLinkSharing: "allowed" },
  dataRetention: {
    audioRetentionMaxDays: null,
    localHistoryMode: "user_choice",
    cloudBackupAllowed: true,
  },
  minAppVersion: null,
});

test("accepts a well-formed policy", () => {
  assert.equal(isValidPolicyShape(validPolicy()), true);
});

test("accepts empty allowlists", () => {
  const policy = validPolicy();
  policy.transcription.allowedModes = [];
  policy.llm.allowedModes = [];
  policy.llm.allowedEnterpriseProviders = [];
  assert.equal(isValidPolicyShape(policy), true);
});

test("rejects a missing or non-object policy", () => {
  assert.equal(isValidPolicyShape(undefined), false);
  assert.equal(isValidPolicyShape(null), false);
  assert.equal(isValidPolicyShape("managed"), false);
  assert.equal(isValidPolicyShape(42), false);
});

test("rejects a policy missing a scope", () => {
  for (const scope of ["transcription", "llm"]) {
    const policy = validPolicy();
    delete policy[scope];
    assert.equal(isValidPolicyShape(policy), false, `missing ${scope}`);
  }
});

test("rejects non-array allowlists the renderer dereferences", () => {
  for (const [scope, field] of [
    ["transcription", "allowedModes"],
    ["transcription", "allowedByokProviders"],
    ["llm", "allowedModes"],
    ["llm", "allowedByokProviders"],
    ["llm", "allowedEnterpriseProviders"],
  ]) {
    const policy = validPolicy();
    policy[scope][field] = "openwhispr";
    assert.equal(isValidPolicyShape(policy), false, `${scope}.${field} as string`);
    delete policy[scope][field];
    assert.equal(isValidPolicyShape(policy), false, `${scope}.${field} missing`);
  }
});
