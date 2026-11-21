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

`schemaTransport` accepts `responses` or `chat`. When omitted, the hook
uses `decisionTransport` if configured. Tool-free requests default to Responses.
Requests with tools default to Responses on the official OpenAI endpoint and
Chat Completions on compatible endpoints. Each request uses the chosen protocol
throughout the tool loop. The endpoint must support the selected wire format.

Responses uses `text.format`. Chat Completions uses
`response_format.json_schema`. Pass a schema descriptor to control the output
format, and register functions with `withTool` or `setTool` for prompts that
need local tools. The client validates a batch of tool calls before invoking
its callbacks. `noResponseFormat` disables the schema hook.

A private Ajv validator checks results without coercion, defaults or property
removal. The service's supported schema subset still applies. Refusals,
incomplete output, unexpected tool calls and invalid results fail validation.
The hook restores conversation history when a failure occurs before any tool
callback runs. If a callback has already run, the error reports
`toolsExecuted: true` and `safeToRetry: false`. Statistics accompany successful
results through `jsonSchemaPromptWithStats`.

Reference: https://developers.openai.com/api/docs/guides/structured-outputs
