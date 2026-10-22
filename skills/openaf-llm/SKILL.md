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
- Current adapters implement Ollama native decisions (local or `:cloud` models), Gemini structured decisions, and OpenAI native and structured decisions. OpenAI native is verified only for supported models on the official endpoint; other models report `native.availability: "incompatible"` and an explicit native request fails before HTTP with `LLM_DECISION_UNSUPPORTED`. `auto` then selects structured. Read `getCapabilities()` on the installed runtime instead of maintaining a model list, and never substitute a model.
- Native decisions through the OpenAI adapter can target OpenRouter (`decisionApi: "openrouter"`) or Microsoft Foundry (`decisionApi: "microsoft"`, Foundry mode with an explicit deployment) only when configured explicitly; `decisionUrl` supplies an absolute endpoint when it cannot be derived. Per-provider settings go under `options.providerOptions`, which is allowlisted; check the decisions guide's table rather than passing conversational `params`.
- Structured answers have no provider probabilities. `requireProbabilities: true` rejects that strategy. Provider confidence and score expectation are distinct from selected probability and selected level; do not invent confidence from generated text.
- For schema-constrained conversational output, use the provider's documented helper. A prompt asking for JSON is not schema enforcement. Keep conversational transport settings separate from decision options.
- Image decisions require native strategy and state. Ollama takes raw base64 strings; OpenAI takes inline `data:image/...;base64,` URLs. Paths, external URLs, and the other provider's format are rejected before HTTP; structured decisions, OpenRouter, and Foundry reject images. Confirm model vision support separately.

Return editable configuration and request examples, expected result shape, and an explicit invocation. Test validation and parsing locally first. Run live inference only within the requested task, reporting provider/model and what actually succeeded; do not download models automatically.

## Local example

Save as `decision-preflight.js` (also bundled in [assets/decision-preflight.js](assets/decision-preflight.js)):

```javascript
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
```

Run `openaf -f decision-preflight.js`. Expected output: `decision preflight: ok`. The placeholder is not a credential; this example checks local capability/preflight behavior only and performs no inference. Do not swap in a native-eligible model to "complete" the test: that would send an HTTP request. A different installed contract needs an updated fixture, not an automatic live fallback.
