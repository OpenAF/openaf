# Decision adapter contract records

Verification date: **3 October 2026**. Starting commit: `e41865387d334211029a9b3284cc2de0e420f637` on `t8`. Reviewed AI source blob: `5aa4f774555114a5314cf7da3ce1a6249e43b493`. The implementation preserved the existing staged JSON Schema, Java, documentation, and test-registration work.

These records distinguish verified HTTP documentation, synthetic fixtures, and live execution. No fixture here is evidence of live inference.

## Ollama native

- Sources: [System One API](https://docs.ollama.com/api/systemone), [decision semantics](https://docs.ollama.com/capabilities/decision).
- Profile: Ollama v0.35.0+, local System One, `POST /v1/systemone`. Compatible GGUF weights/scoring runner required; cloud/MLX/Safetensors unsupported.
- Request: model; text/object/array state; named choice/noul/score questions; optional keep_alive. Public boolean translates to noul. Optional images (verified 4 October 2026): raw base64 PNG/JPEG/WebP array, shared in order; requires v0.35.1+ and CLEF/CLEF Flash vision weights. No chat messages, tools, generation controls, or streaming. Text-only serialized body <= 64 KiB; image bodies <= 32 MiB including base64 and JSON; choice/score 2–26 criteria.
- Response: model; answers; usage.input_tokens/output_tokens. Choice has choice/probabilities/confidence. Noul has numeric noul = P(true). Score has score, legend, probabilities, confidence. Legend and probability keys are zero-based indices as strings; score is the expectation of those indices. Confidence is distribution concentration, not calibrated correctness. Usage counts evaluated shared context again when questions are scored separately.
- Provenance: the full response schema, including expandable score fields, was fetched from the authoritative API page. `nativeFixture()` in `tests/autoTestAll.AIDecisions.js` uses these exact documented field shapes with synthetic boundary/expectation values. Request bodies are asserted at the dedicated HTTP boundary.
- Errors: non-2xx HTTP/API failures remain provider errors, including missing-model/endpoint 404; no strategy fallback.
- Live status: not established by fixtures; use the explicit smoke script with caller-configured local model.

## Gemini structured

- Sources: [GenerateContent reference](https://ai.google.dev/api/generate-content), [structured output guide](https://ai.google.dev/gemini-api/docs/structured-output).
- Profile: configured existing GenerateContent base (default v1beta), `POST models/{model}:generateContent`; existing API key and headers/timeout.
- New output request: generationConfig.responseFormat.text.mimeType = APPLICATION_JSON; schema is JSON Schema. This is the GenerateContent profile, not the Interactions API.
- Explicit legacy profile: generationConfig.responseMimeType = application/json and responseSchema with uppercase Schema type enums. The reference's legacy Schema fields do not include additionalProperties; numeric array-length bounds serialize as strings. Unsupported legacy types/enums/keywords fail explicitly.
- Response: candidates[].content.parts[].text, excluding thought parts; STOP required; promptFeedback blockReason and unsuccessful finish reasons rejected. usageMetadata maps to existing token statistics.
- Provenance: `geminiFixture()` in `tests/autoTestAll.AIDecisions.js` is a synthetic GenerateContent envelope with separate thought and final text. Tests assert new/legacy request fields independently, profile conflicts, usage, refusals, and local schema validation.
- Model/account availability remains unknown without execution.

## OpenAI structured

- Sources: [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [Responses create](https://developers.openai.com/api/reference/resources/responses/methods/create), [Chat Completions create](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create).
- Profile: existing configured URL/version/mode/authentication. Transport selected before HTTP: Responses default, or explicit Chat; no Responses availability probing or fallback in decisions.
- Responses request: input system/user messages, text.format.type=json_schema with name/schema/strict, store=false; optional temperature/max_output_tokens. No server conversation IDs, tools, or prior response IDs.
- Chat request: system/user messages; response_format.type=json_schema and json_schema descriptor; optional temperature/max_completion_tokens.
- Response: completed Responses message output_text content, excluding reasoning; or one stop-finished Chat message.content. Refusals, tool calls, and incomplete results rejected. Existing usage parsing reused directly from this execution.
- Provenance: `openaiFixture()` and Chat envelopes in `tests/autoTestAll.AIDecisions.js` are synthetic documented response shapes. Existing OpenAI chat/Responses and Azure/Foundry URL/authentication regression tests remain applicable.
- Gateway/model/account support is unknown. Implemented structured serialization is not a guarantee of every OpenAI-compatible endpoint's support.

## OpenAI native Decisions

Verified **7 October 2026** against the [Decisions guide](https://developers.openai.com/api/docs/guides/decisions) and [create reference](https://developers.openai.com/api/reference/resources/decisions/methods/create), replacing the earlier unverified preview record.

- Profile: public beta, official OpenAI `POST /v1/decisions`, model `gpt-6-luna`. Native eligibility requires the official root or `/v1` base, OpenAI mode, and API version v1. Other models are incompatible; Azure/Foundry/gateway native support is not asserted. No automatic model switch or HTTP fallback.
- Request: model, shared input, ordered questions, optional safety_identifier (at most 128 characters). Text input is direct; JSON state becomes JSON text. Images are inline base64 data URLs in ordered input_image parts alongside input_text in one user message, at most 128. External URLs/files/audio/tools/history/streaming are not included.
- Questions: predicate has instructions and name; choice has choices with string/boolean value and optional description; score has levels with label and optional description. The OpenAF v1 adapter retains string-valued choice keys, maps boolean to predicate (optional criteria included in instructions), and uses zero-based index labels for ordered score descriptions.
- Response: model, ordered answers, usage. Predicate has probability = P(true). Choice has choice, confidence, and probabilities entries {value, probability}. Score has score, confidence, and probabilities entries {value, label, probability}; value is the zero-based index and score is its probability-weighted expectation. A per-question refusal has type refusal and name.
- Normalization: enforce ordered name/type coverage, exact distribution coverage, finite probabilities and existing rounding tolerance. Boolean uses >= 0.5; score level is the modal index with first-index ties; expectation and provider confidence remain separate. Refusals fail normalized calls; raw calls retain the original envelope unless requireProbabilities forces validation.
- Usage: input_tokens/output_tokens/total_tokens and token details use existing OpenAI parsing; zero counts and full usage are preserved. Statistics are captured before answer validation.
- Provenance: openaiNativeFixture() and dedicated native tests use synthetic reference-shaped envelopes. Tests cover the HTTP boundary, authentication and URL routing without contacting OpenAI.
- Live status: not established by fixtures. The opt-in smoke script selects native for caller-configured OpenAI gpt-6-luna and requires probabilities. Account/model access is not inferred from documented adapter support.
