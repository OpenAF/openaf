ow.loadAI();
ow.loadTest();
var llm = $llm({ type: "openai", model: "example-model", key: "unused-offline-placeholder" });
var caps = llm.getCapabilities();
ow.test.assert(caps.contractVersion, 1, "decision contract");
var rejected = false;
try {
  llm.decide("A billing question", {
    urgent: { type: "boolean", instructions: "Is immediate action needed?" }
  }, { strategy: "native" });
} catch (e) {
  rejected = String(e.code || e).indexOf("LLM_DECISION_CONTRACT_UNVERIFIED") >= 0;
}
ow.test.assert(rejected, true, "native contract rejected before HTTP");
print("decision preflight: ok");
