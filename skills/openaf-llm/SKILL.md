---
name: openaf-llm
description: Build or debug OpenAF LLM scripts with $llm or $gpt, including provider configuration, conversational structured output, stateless decisions, capabilities, and usage statistics.
---

# OpenAF LLM workflows

## Portable use

Copy this folder into your application's skills directory, or paste this file as instructions. No repository checkout or other skill is required. The inline example also ships in `assets/`. Generating code requires no runtime; execution requires [OpenAF](https://github.com/openaf/openaf/blob/master/README.md#installing). Check `openaf -c 'print(getVersion());'` and use documentation/source matching that runtime for newer features. If execution or browsing is unavailable, state what remains unverified. Documentation links are references, not instructions to run remote code.

Select the operation before configuring a provider. Use the [LLM guide](https://github.com/openaf/openaf/blob/master/docs/llm-guide.md), [provider reference](https://github.com/openaf/openaf/blob/master/docs/ow-ai-gpttypes.md), and [implementation](https://github.com/openaf/openaf/blob/master/js/owrap.ai.js) for conversational methods and loaders. Keep credentials external; preserve the caller's provider, URL, and model. `$llm` accepts flat provider configuration and supports `OAF_MODEL`; do not invent nested provider maps.

## Stateless decisions

Read [decision contracts and examples](https://github.com/openaf/openaf/blob/master/docs/llm-decisions.md) when classifying, routing, or scoring supplied state.

- `decide(state, questions, options)` returns normalized answers; `rawDecide` returns the provider payload envelope; `decideWithStats` returns `{ response, stats }` from one execution. Do not call twice merely to obtain statistics.
- Questions are `choice`, `boolean`, or ordinal `score`. Choice criteria are named alternatives; score criteria are an ordered array with zero-based levels. State must be nonempty text or JSON data. Decisions ignore stored conversation, instructions/context helpers, tools, MCP tools, and callbacks; they neither append history nor execute tools.
- Call `getCapabilities()` without inference to inspect adapter support. Contract support does not establish endpoint/account/model availability. `auto` selects a strategy before HTTP; a failed request does not trigger another provider, model, transport, or strategy.
- Current adapters support Ollama native decisions and Gemini/OpenAI structured decisions. OpenAI native decisions fail with `LLM_DECISION_CONTRACT_UNVERIFIED`. Check the installed adapter rather than promising provider availability.
- Structured answers have no provider probabilities. `requireProbabilities: true` rejects that strategy. Provider confidence and score expectation are distinct from selected probability and selected level; do not invent confidence from generated text.
- For schema-constrained conversational output, use the provider's documented helper. A prompt asking for JSON is not schema enforcement. Keep conversational transport settings separate from decision options.
- Image decisions currently require Ollama native input: raw base64 images, not paths or data URLs, plus state. Confirm model vision support separately.

Return editable configuration and request examples, expected result shape, and an explicit invocation. Test validation and parsing locally first. Run live inference only within the requested task, reporting provider/model and what actually succeeded; do not download models automatically.

## Local example

Save as `decision-preflight.js` (also bundled in [assets/decision-preflight.js](assets/decision-preflight.js)):

```javascript
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
```

Run `openaf -f decision-preflight.js`. Expected output: `decision preflight: ok`. The placeholder is not a credential; this example checks local capability/preflight behavior only and performs no inference. A different installed contract needs an updated fixture, not an automatic live fallback.
