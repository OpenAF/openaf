ow.loadAI();
ow.loadTest();
var llm = $llm({ type: "openai", model: "example-model", key: "unused-offline-placeholder" });
var caps = llm.getCapabilities();
ow.test.assert(caps.contractVersion, 1, "decision contract");
ow.test.assert(caps.native.availability, "incompatible", "unverified model is not native-eligible");
var code;
try {
  llm.decide("A billing question", {
    urgent: { type: "boolean", instructions: "Is immediate action needed?" }
  }, { strategy: "native" });
} catch (e) {
  code = e.code;
}
ow.test.assert(code, "LLM_DECISION_UNSUPPORTED", "native request rejected before HTTP");
print("decision preflight: ok");
