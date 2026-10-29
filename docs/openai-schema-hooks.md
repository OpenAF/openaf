# OpenAI-compatible schema output

`jsonSchemaPrompt(prompt, descriptor)` and `jsonSchemaPromptWithStats` use the
OpenAI provider's `structuredSchemaPrompt` hook. The descriptor contains `name`,
`schema`, optional `description`, and `strict` (defaults to true).

```javascript
var llm = $llm({ type: "openai", options: {
  key: "...", url: "https://provider.example/v1", model: "model-name",
  schemaTransport: "chat"
}});
var result = llm.jsonSchemaPrompt("Extract the name: Alice", {
  name: "Person", schema: {
    type: "object", properties: { name: { type: "string" } },
    required: ["name"], additionalProperties: false
  }
});
```

`schemaTransport` accepts `responses` (default) or `chat`. If absent,
`decisionTransport` is respected. Schema requests make one inference call and
never silently fall back to JSON mode or another endpoint. Compatible services
must support the selected schema wire format. Existing URL, Azure routing,
authentication and ordinary prompt behavior continue to apply.

Responses uses `text.format`; Chat Completions uses `response_format.json_schema`.
The explicit schema takes precedence over generic parameters; conflicting
`text`, `response_format`, tools, input, messages and model parameters are
rejected. `noResponseFormat` disables schema requests. Explicit nonempty tools
are unsupported by this hook; registered tools are not invoked.

A private Ajv validator checks results without coercion, defaults or property
removal. The service's supported schema subset still applies. Refusals,
incomplete output, unexpected tool calls and invalid results fail without
committing conversation history. Statistics accompany successful results through
`jsonSchemaPromptWithStats`.

Reference: https://developers.openai.com/api/docs/guides/structured-outputs
