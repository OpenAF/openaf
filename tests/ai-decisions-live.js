// Explicit provider smoke test; excluded from ordinary autoTestAll registration.
if (getEnv("OPENAF_DECISIONS_LIVE") !== "1") {
  print("SKIPPED: set OPENAF_DECISIONS_LIVE=1 to opt in.");
} else {
  try {
    var configuration = getEnv("OAF_MODEL");
    if (!configuration) throw new Error("Live smoke requires caller-supplied OAF_MODEL configuration.");
    var config = af.fromJSSLON(configuration);
    if (!isMap(config) || !isString(config.model) || !config.model.trim()) throw new Error("Live smoke requires an explicit model.");
    if (["ollama", "gemini", "openai"].indexOf(config.type) < 0) throw new Error("Unsupported live smoke provider.");
    if (config.type != "ollama" && (!isString(config.key) || !config.key.length)) throw new Error("Live smoke requires caller-supplied credentials.");
    var strategy = config.type == "ollama" ? "native" : "structured";
    var result = $llm(config).decideWithStats({ ticket: "A customer was charged twice." }, {
      route: { type: "choice", instructions: "Select the responsible team.", criteria: { billing: "Payments and refunds", technical: "Software errors" } },
      urgent: { type: "boolean", instructions: "Does this ticket report a critical outage?" },
      priority: { type: "score", instructions: "Assess urgency.", criteria: ["Routine", "Soon", "Immediate"] }
    }, { strategy: strategy, requireProbabilities: strategy == "native" });
    print(JSON.stringify({ status: "LIVE_TESTED", provider: result.response.provider, model: result.response.model, strategy: result.response.strategy, stats: result.stats }));
  } catch(e) {
    print(JSON.stringify({ status: ["LLM_DECISION_UNSUPPORTED", "LLM_DECISION_CONTRACT_UNVERIFIED"].indexOf(e.code) >= 0 ? "BLOCKED" : "FAILED", code: e.code || "LIVE_CONFIG_ERROR" }));
    exit(1);
  }
}
