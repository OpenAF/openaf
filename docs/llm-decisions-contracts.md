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

## OpenAI native Decisions — unverified

- [29 September announcement](https://openai.com/index/devday-2026-recap/) confirms a limited preview.
- [Public reference](https://developers.openai.com/api/reference/overview) and official-domain searches were checked on 3 October. No authoritative HTTP request/response contract was located.
- Method/path, native model identifiers, request/response fields, question types, probability semantics, errors, and usage mapping remain unverified.
- Native implementation is blocked on that contract. Explicit official OpenAI native requests throw LLM_DECISION_CONTRACT_UNVERIFIED before HTTP. Azure/Foundry/third-party gateways report unsupported native Decisions rather than inheriting official OpenAI eligibility.
- No native OpenAI transport, invented-contract fixture, or live-success claim is included.
