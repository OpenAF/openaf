# Stateless LLM decisions

`$llm`, `$gpt`, and `ow.ai.gpt` expose `decide(state, questions, options)`, `rawDecide(...)`, `decideWithStats(...)`, and `getCapabilities()`. The decision contract is version 1. `$llm` retains its existing lazy delegation to `$gpt`, flat provider configuration, and `OAF_MODEL` loading.

## Questions and state

```javascript
var state = { ticket: "The customer reports being charged twice." };
var questions = {
  route: {
    type: "choice",
    instructions: "Select the team responsible for this ticket.",
    criteria: {
      billing: "Charges, payments, and refunds",
      technical: "Software errors and service outages",
      account: "Login and account access"
    }
  },
  urgent: {
    type: "boolean",
    instructions: "Does this incident require an immediate response?"
  },
  priority: {
    type: "score",
    instructions: "Assess urgency using the ordered levels.",
    criteria: ["Routine", "Soon", "Urgent"]
  }
};
```

State is a nonempty text string or a JSON data object/array. Whitespace-only text, cycles, functions, undefined values, nonfinite numbers, sparse arrays, accessors, custom serialization functions, and Java/other host objects are rejected before HTTP. Data is copied without invoking accessors or `toJSON`. Question maps must be nonempty; instructions and descriptions must be nonempty strings. Choice criteria contain at least two named alternatives. Score criteria contain at least two descriptions in ascending order; indices start at zero. Boolean questions may optionally provide exactly `criteria: { "false": "Description of false", "true": "Description of true" }`.

Every question is evaluated against the same supplied state. Decisions ignore stored conversation, `withInstructions`, `withContext`, tools, MCP tools, and callbacks. They neither append history nor run tools. Sequential decisions require explicit separate calls. Structured requests place the question specification in system instructions and state in user data. A returned routing label is data; application code remains responsible for authorization and execution policies.

Version 1 supports text/JSON only. Images, streaming, tool options, and other unsupported option keys are rejected.

## Strategies and capabilities

`options.strategy` is `auto` (default), `native`, or `structured`. It is independent of OpenAI's provider configuration `mode`, which continues to control transport routing.

- `native` requires a verified native adapter compatible with all requested question types and requirements.
- `structured` requires provider schema-constrained generation. It never substitutes a prompt asking for JSON text.
- `auto` chooses one eligible implementation before HTTP, preferring native. Unknown endpoint/model/account availability permits an attempt; it does not imply guaranteed availability.

One strategy handles the entire request. A failed request never triggers a strategy, model, transport, or provider fallback. Decisions never download or warm up models.

`requireProbabilities: true` requires a complete choice/score distribution or P(true) for every boolean question. Expectations, provider confidence, self-reported confidence, and token log probabilities do not satisfy it. Structured execution is rejected before HTTP when this option is true. The actual returned probability information is validated again.

`options.model` overrides the model for this request within the configured provider and URL. No provider switch or model substitution occurs. Provider options are allowlisted under `options.providerOptions`:

| Provider | Options | Behavior |
| --- | --- | --- |
| Ollama | `keepAlive` | Duration string or finite seconds; translates to `keep_alive`, including zero/negative values |
| Gemini | `schemaProfile`, `temperature`, `maxOutputTokens` | Profile is `response-format` or `legacy-schema`; temperature is 0–2; token limit is a positive integer |
| OpenAI | `transport`, `temperature`, `maxOutputTokens` | Transport is `responses` or `chat`; chosen before HTTP; temperature is 0–2; token limit is a positive integer |

OpenAI defaults to `responses`; configuration `decisionTransport` can select `chat`. This setting is separate from `mode`. It never consults or updates conversational Responses fallback state. Configured Azure/Foundry/gateway URL and authentication routing remain in effect; actual structured-output availability is unknown until exercised. `noResponseFormat: true` disables eligibility for structured decisions.

Decision builders do not merge arbitrary `params` into their requests. Gemini rejects inherited output schema/MIME configuration for the explicit schema helper or decisions: remove those conflicting fields or use the established chat pass-through API separately.

```javascript
var capabilities = $llm(config).getCapabilities();
// No network call. Each strategy reports:
// { implemented, contract, questionTypes, probabilities, availability }
```

Capabilities also include `contractVersion`, `inputTypes`, and `streaming`. Contract states are `verified`, `unverified`, or `unsupported`. Availability is usually `unknown`; known incompatible Ollama cloud model tags report `incompatible`. Implemented support describes adapter code, not installed models, endpoint presence, account access, or calibrated probabilities. The public capability snapshot describes the configured model; an override is evaluated separately at execution time. Adapters without new hooks retain their existing operations and report unsupported decisions.

| Provider | Native decisions | Structured decisions | Runtime availability |
| --- | --- | --- | --- |
| Ollama | Implemented; verified System One contract | Unsupported | Requires caller-supplied compatible local model/runner |
| Gemini | Unsupported | Implemented; GenerateContent | Model/endpoint/account availability unknown |
| OpenAI | Contract unverified; no native request | Implemented; Responses or explicit Chat | Model/endpoint/account availability unknown |
| Other existing adapters | Unsupported without optional hooks | Unsupported without optional hooks | Existing operations unchanged |

## Results and probabilities

`decide()` returns `{ contractVersion: 1, provider, model, strategy, answers }`. Each answer has its public `type`, `probabilities`, `selectedProbability`, `providerConfidence`, and `probabilitySource` (`provider` or `none`). Type-specific fields are:

| Type | Semantic result | Probability/expectation information |
| --- | --- | --- |
| Choice | `value`: an allowed criterion key | Distribution object keyed by criteria; selected alternative's probability |
| Boolean | `value`: boolean | `probabilityTrue`; optional native distribution uses `"false"`/`"true"` keys |
| Score | `level`: zero-based integer index | Distribution array in original criterion order; `expectedScore` is separate |

Structured answers have null probability fields and null `providerConfidence`; structured score expectations are null. They never contain generated confidence estimates.

For Ollama booleans, `value` is true when P(true) >= 0.5, including the exact tie. The complement supplies P(false). For native scores, the selected level is the mode, with ties resolved by original order. The expectation is preserved independently; it is not rounded into a selected level. Native choice labels must agree with a maximal supplied probability. These interpretation rules do not establish application safety or authorization policy.

Ollama's documented choice/score `confidence` is preserved as `providerConfidence`; boolean confidence remains null. It measures concentration of the distribution, not the selected alternative's probability or a universally calibrated probability of correctness. `probabilitySource: "provider"` includes deterministic transformations of documented provider probabilities, such as a boolean complement or an indexed distribution array.

Distributions require complete known keys, finite values in [0,1], and a sum within `N * 0.00005 + 1e-8` of 1, allowing four-decimal rounding across N entries. No renormalization occurs. Native score expectation consistency allows `(N - 1) * N * 0.00005 + 0.00005 + 1e-8`; expectations must still lie on the requested ordinal scale. Refused, blocked, truncated, missing, extra, malformed, and incompatible answers are rejected.

```javascript
var result = llm.decideWithStats(state, questions);
// { response: <normalized envelope>, stats: <usage from this execution> }
var inspection = llm.rawDecide(state, questions);
// { contractVersion: 1, provider, model, strategy, raw: <provider payload> }
```

Each wrapper executes once. Raw calls permit inspection of malformed successful answer content unless `requireProbabilities` is true; that requirement still validates coverage and probability semantics. API/transport failures and an unparseable HTTP response body always throw. The raw response is never obtained with a second inference.

Statistics follow existing token fields (`prompt`, `completion`, `total`, and provider-supported extra fields). Missing usage stays absent; zero is preserved. `decideWithStats` receives execution-scoped statistics directly. Built-in adapters clear previous statistics at the beginning of a decision, including preflight failure. If a response arrives and answer validation subsequently fails, usage from that response remains available. Legacy `getLastStats` remains last-call mutable state without a concurrency guarantee.

## Examples

```javascript
var local = $llm({
  type: "ollama",
  url: "http://localhost:11434",
  model: getEnv("OLLAMA_DECISION_MODEL")
});
var nativeResult = local.decide(state, questions, {
  strategy: "native",
  requireProbabilities: true
});

var gemini = $llm({
  type: "gemini",
  key: getEnv("GEMINI_API_KEY"),
  model: getEnv("GEMINI_MODEL")
});
var structuredResult = gemini.decide(state, questions, { strategy: "structured" });
print(structuredResult.answers.route.value);
// Probability fields are null.

var openai = $llm({
  type: "openai",
  key: getEnv("OPENAI_API_KEY"),
  model: getEnv("OPENAI_MODEL")
});
var openaiResult = openai.decide(state, questions, { strategy: "structured" });
// Native OpenAI remains gated: strategy: "native" throws without HTTP.
```

Ollama requires v0.35.0+ and compatible scoring-capable GGUF weights/runner. An arbitrary chat model is insufficient. Choice and score questions support 2–26 criteria. The entire serialized UTF-8 text-only body must be <= 65,536 bytes; state is never truncated. Root URLs and URLs ending in `/v1` are supported without duplicate version segments; a base ending in `/api` is rejected. Context-window failures remain visible provider errors.

## Gemini conversational schema output

Existing `jsonSchemaPrompt(prompt, descriptor, model, temperature, tools)` and `jsonSchemaPromptWithStats(...)` also support Gemini. The descriptor remains `{ name, description, schema, strict }`; only the schema is sent in Gemini's output format. Descriptor metadata is retained locally, and `strict` does not map to a Gemini request field. Local schema validation applies on both strict settings. OpenAI's established signatures, parser/error behavior, conversation handling, and Responses-to-Chat compatibility fallback remain intact.

Gemini's helper preserves conversational instructions/history and appends the successful exchange. Decisions use a separate isolated request. Explicit nonempty tools are rejected by the Gemini schema helper; registered tools are not attached or executed.

Gemini defaults to the `response-format` profile:

```javascript
// configuration: structuredOutputProfile: "response-format"
// generationConfig.responseFormat.text = {
//   mimeType: "APPLICATION_JSON", schema: compiledSchema
// }
```

Select `structuredOutputProfile: "legacy-schema"` explicitly to use `responseMimeType: "application/json"` plus `responseSchema` with uppercase Schema type enums. Profiles never mix or retry blindly. The old Gemini chat `params.generationConfig` schema pass-through remains unchanged.

The new helper deliberately supports a small schema subset: single `type`, `properties`, `required`, boolean `additionalProperties`, primitive `enum`, `items`, `minItems`, `maxItems`, `minimum`, `maximum`, `description`, and `title`. Supported types are object, array, string, number, integer, boolean, and null. Unsupported keywords/types fail before HTTP. Validation is explicit and independent of process-global Ajv configuration.

The legacy Schema profile additionally rejects null types, nonstring enums, and `additionalProperties` in caller schemas. Its decision compiler omits the unsupported additional-property keyword and enforces exact question coverage locally. Instructions, required properties, enums, and integer bounds remain schema-constrained. New profile schemas retain `additionalProperties: false` for decisions.

## Errors and troubleshooting

Errors are Error objects with stable `code`, sanitized `provider`, and numeric HTTP `status` when available. Ordinary errors omit provider bodies, state, URLs containing credentials, and authentication headers.

| Code | Meaning |
| --- | --- |
| `LLM_DECISION_INVALID_REQUEST` | Invalid data/questions/options/schema, unsupported schema keyword, conflicting profile, or request-size limit |
| `LLM_DECISION_UNSUPPORTED` | Requested strategy/types/requirements are ineligible |
| `LLM_DECISION_CONTRACT_UNVERIFIED` | Official OpenAI native Decisions contract has not been verified |
| `LLM_DECISION_INVALID_RESPONSE` | Malformed JSON, refusal/truncation, invalid answers, or invalid probability semantics |
| `LLM_DECISION_PROVIDER_ERROR` | HTTP/API error, timeout, or transport failure |

A 404 remains a provider error: it can refer to a missing model rather than a missing endpoint. Authentication, quota, rate-limit, and server failures do not mean feature unsupported. Decisions disable redirects and implicit connection retries. Existing debug channels receive decision request/response metadata only; decision bodies are not logged or persisted by default.

## Validation and opt-in live smoke tests

Deterministic tests are registered in `tests/autoTestAll.AIDecisions.{js,yaml}`. Fixtures are synthetic, based on the verified schemas recorded in [contract notes](llm-decisions-contracts.md); they do not demonstrate live provider access.

Ordinary CI does not perform provider inference. A separate smoke script can be invoked explicitly:

```sh
# Run only after configuring the provider and model you intend to contact.
# OAF_MODEL contains the usual flat configuration; credentials belong in that configuration.
OPENAF_DECISIONS_LIVE=1 java -jar openaf.jar -f tests/ai-decisions-live.js
```

The script skips without the opt-in flag, fails without caller-supplied model/configuration, and prints only metadata/statistics. It never selects a provider/model, downloads a model, or switches strategies. Native Ollama requires a compatible already-available local model. Gemini/OpenAI require caller credentials and a schema-capable configured model. Native OpenAI is blocked pending its verified contract; it is not counted as implemented or live-tested.
