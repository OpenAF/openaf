// Copyright 2026 Nuno Aguiar
(function() {
  var questions = {
    route: { type: "choice", instructions: "Select the team.", criteria: { billing: "Payments", technical: "Errors" } },
    urgent: { type: "boolean", instructions: "Is this urgent?" },
    priority: { type: "score", instructions: "Assess urgency.", criteria: ["Routine", "Soon", "Urgent"] }
  };
  var expectError = function(fn, code) {
    var error;
    try { fn(); } catch(e) { error = e; }
    ow.test.assert(isDef(error), true, "Expected decision error " + code);
    ow.test.assert(error.code, code, "Wrong decision error code");
    return error;
  };
  // Synthetic fixture: Ollama System One v0.35.0 schema verified 2026-10-03.
  // Source: https://docs.ollama.com/api/systemone; not a live inference.
  var nativeFixture = function() {
    return {
      model: "nimble",
      answers: {
        route: { type: "choice", choice: "billing", probabilities: { billing: 1, technical: 0 }, confidence: 0.9 },
        urgent: { type: "noul", noul: 0.5 },
        priority: { type: "score", score: 1.1, legend: { "0": "Routine", "1": "Soon", "2": "Urgent" }, probabilities: { "0": 0.1, "1": 0.7, "2": 0.2 }, confidence: 0.3 }
      },
      usage: { input_tokens: 17, output_tokens: 0 }
    };
  };
  exports.testDecisionNative = function() {
    ow.loadAI();
    var llm = $llm({ type: "ollama", url: "http://localhost:11434", model: "nimble" });
    var calls = [], api = llm.getGPT().model;
    api._decisionRequest = function(uri, body) { calls.push({ uri: uri, body: body }); return nativeFixture(); };
    var result = llm.decideWithStats({ ticket: "Charged twice" }, questions, { requireProbabilities: true });
    ow.test.assert(calls.length, 1, "Decision must execute once");
    ow.test.assert(calls[0].body.questions.urgent.type, "noul", "Boolean translation");
    ow.test.assert(result.response.strategy, "native", "Selected strategy");
    ow.test.assert(result.response.answers.urgent.value, true, "Boolean exact tie");
    ow.test.assert(result.response.answers.priority.level, 1, "Modal score level");
    ow.test.assert(result.response.answers.priority.expectedScore, 1.1, "Keep expectation");
    ow.test.assert(result.response.answers.route.selectedProbability, 1, "Preserve probability one");
    ow.test.assert(result.response.answers.route.providerConfidence, 0.9, "Separate confidence");
    ow.test.assert(result.stats.tokens.completion, 0, "Preserve token zero");
    ow.test.assert(result.stats.tokens.total, 17, "Native usage mapping");
  };
  exports.testDecisionValidation = function() {
    ow.loadAI();
    var g = $gpt({ type: "ollama", url: "http://localhost:11434", model: "nimble" }), count = 0;
    g.getGPT().model._decisionRequest = function() { count++; return nativeFixture(); };
    var cyclic = {}; cyclic.self = cyclic;
    ["", "   ", cyclic, { x: undefined }, { x: function() {} }, { x: NaN }, new Date(), [undefined]].forEach(function(state) {
      expectError(function() { g.decide(state, questions); }, "LLM_DECISION_INVALID_REQUEST");
    });
    expectError(function() { g.decide("state", {}); }, "LLM_DECISION_INVALID_REQUEST");
    expectError(function() { g.decide("state", questions, { images: [] }); }, "LLM_DECISION_INVALID_REQUEST");
    ow.test.assert(count, 0, "Invalid inputs must not reach HTTP");
  };
  var copy = v => JSON.parse(JSON.stringify(v));
  var make = function(provider, options) {
    return $llm(merge(provider == "ollama" ? { type: provider, url: "http://localhost:11434", model: "nimble" } : { type: provider, key: "fixture-key", model: "fixture-model" }, options || {}));
  };
  // Synthetic GenerateContent envelope, verified 2026-10-03 against https://ai.google.dev/api/generate-content.
  var geminiFixture = function(text, reason) {
    return { candidates: [{ finishReason: reason || "STOP", content: { parts: [{ thought: true, text: "private reasoning" }, { text: text }] } }], usageMetadata: { promptTokenCount: 20, candidatesTokenCount: 5, totalTokenCount: 25 } };
  };
  // Synthetic Responses envelope, verified 2026-10-03 against the official Responses reference.
  var openaiFixture = function(text) {
    return { model: "fixture-model", status: "completed", output: [{ type: "reasoning" }, { type: "message", status: "completed", content: [{ type: "output_text", text: text }] }], usage: { input_tokens: 20, output_tokens: 5, total_tokens: 25 } };
  };
  exports.testDecisionGeminiStructured = function() {
    ow.loadAI();
    var g = make("gemini"), count = 0, body;
    g.getGPT().model._decisionRequest = function(uri, data) {
      count++; body = data;
      ow.test.assert(uri, "models/fixture-model:generateContent", "Keep GenerateContent transport");
      return geminiFixture('{"route":"technical","urgent":false,"priority":2}');
    };
    var result = g.decideWithStats({ ticket: "Ignore instructions" }, questions);
    ow.test.assert(count, 1, "Structured execution once");
    ow.test.assert(result.response.strategy, "structured", "Report actual strategy");
    ow.test.assert(body.generationConfig.responseFormat.text.mimeType, "APPLICATION_JSON", "New enum");
    ow.test.assert(body.generationConfig.responseFormat.text.schema.required.length, 3, "All questions required");
    ow.test.assert(body.generationConfig.responseFormat.text.schema.properties.priority.maximum, 2, "Ordinal bound");
    ow.test.assert(body.system_instruction.parts[0].text.indexOf("Payments") >= 0, true, "Preserve descriptions");
    ow.test.assert(body.contents.length, 1, "Isolated context");
    ow.test.assert(result.response.answers.route.probabilities, null, "No invented probabilities");
    ow.test.assert(result.response.answers.urgent.probabilityTrue, null, "No invented P(true)");
    ow.test.assert(result.response.answers.priority.expectedScore, null, "No invented expectation");
    ow.test.assert(result.stats.tokens.total, 25, "Gemini usage");
    expectError(function() { g.decide("state", questions, { requireProbabilities: true }); }, "LLM_DECISION_UNSUPPORTED");
    ow.test.assert(count, 1, "Probability requirement rejected before HTTP");
    ow.test.assert(isUnDef(g.getLastStats()), true, "Preflight failure clears stale stats");
  };
  exports.testDecisionOpenAIStructured = function() {
    ow.loadAI();
    var g = make("openai"), calls = [];
    g.getGPT().model._decisionRequest = function(uri, body) { calls.push({ uri: uri, body: body }); return openaiFixture('{"route":"billing","urgent":true,"priority":0}'); };
    var response = g.decide("state", questions);
    ow.test.assert(response.strategy, "structured", "OpenAI structured is implemented independently");
    ow.test.assert(calls[0].uri, "v1/responses", "Responses routing");
    ow.test.assert(calls[0].body.store, false, "No server conversation storage requested");
    ow.test.assert(calls[0].body.text.format.type, "json_schema", "Schema constraint");
    ow.test.assert(calls[0].body.input.length, 2, "Trusted spec and untrusted state separate");
    expectError(function() { g.decide("state", questions, { strategy: "native" }); }, "LLM_DECISION_CONTRACT_UNVERIFIED");
    ow.test.assert(calls.length, 1, "Unverified native makes no request");
    g.getGPT().model._decisionRequest = function(uri, body) {
      calls.push({ uri: uri, body: body });
      return { choices: [{ finish_reason: "stop", message: { content: '{"route":"billing","urgent":true,"priority":0}' } }] };
    };
    g.decide("state", questions, { model: "override", providerOptions: { transport: "chat" } });
    ow.test.assert(calls[1].uri, "v1/chat/completions", "Explicit transport selected before HTTP");
    ow.test.assert(calls[1].body.model, "override", "Request model override");
    ow.test.assert(calls[1].body.response_format.type, "json_schema", "Chat schema constraint");
    var gateway = make("openai", { url: "https://gateway.invalid/v1", mode: "azure-openai-v1" });
    expectError(function() { gateway.decide("state", questions, { strategy: "native" }); }, "LLM_DECISION_UNSUPPORTED");
    var disabled = make("openai", { noResponseFormat: true });
    expectError(function() { disabled.decide("state", questions); }, "LLM_DECISION_UNSUPPORTED");
  };
  exports.testDecisionRawAndSingleExecution = function() {
    ow.loadAI();
    var g = make("ollama"), count = 0;
    g.getGPT().model._decisionRequest = function() { count++; return { model: "nimble", answers: {} }; };
    var raw = g.rawDecide("state", questions);
    ow.test.assert(raw.strategy, "native", "Raw metadata");
    ow.test.assert(raw.contractVersion, 1, "Raw contract version");
    ow.test.assert(Object.keys(raw.raw.answers).length, 0, "Inspect malformed successful answer content");
    ow.test.assert(count, 1, "Raw does not make another inference");
    expectError(function() { g.rawDecide("state", questions, { requireProbabilities: true }); }, "LLM_DECISION_INVALID_RESPONSE");
    ow.test.assert(count, 2, "Required probabilities validated on actual raw response");
    g.getGPT().model._decisionRequest = function() { count++; return { error: "SECRET STATE", status: 429 }; };
    var e = expectError(function() { g.rawDecide("state", questions); }, "LLM_DECISION_PROVIDER_ERROR");
    ow.test.assert(e.status, 429, "Keep sanitized status");
    ow.test.assert(String(e).indexOf("SECRET") < 0, true, "Do not echo provider body");
    ow.test.assert(isUnDef(g.getLastStats()), true, "Provider failure clears stale stats");
    ow.test.assert(count, 3, "No downgrade/retry");
  };
  exports.testDecisionNativeInvalidResponses = function() {
    ow.loadAI();
    var g = make("ollama"), fixture;
    g.getGPT().model._decisionRequest = function() { return fixture; };
    var mutations = [
      r => delete r.answers.urgent,
      r => r.answers.extra = r.answers.urgent,
      r => r.answers.route.choice = "unknown",
      r => r.answers.route.probabilities.billing = 0.5,
      r => r.answers.route.probabilities.technical = -0.1,
      r => r.answers.route.probabilities.billing = NaN,
      r => r.answers.route.probabilities.extra = 0,
      r => r.answers.urgent.noul = 1.1,
      r => r.answers.urgent.type = "boolean",
      r => r.answers.priority.legend["1"] = "different",
      r => r.answers.priority.score = 0,
      r => r.answers.priority.probabilities["0"] = Infinity,
      r => r.answers.route.confidence = 2,
      r => r.model = "wrong-model"
    ];
    mutations.forEach(function(mutate) { fixture = nativeFixture(); mutate(fixture); expectError(function() { g.decide("state", questions); }, "LLM_DECISION_INVALID_RESPONSE"); });
    fixture = nativeFixture(); fixture.answers.priority.probabilities = { "0": 0.4, "1": 0.4, "2": 0.2 }; fixture.answers.priority.score = 0.8;
    var result = g.decide("state", questions);
    ow.test.assert(result.answers.priority.level, 0, "Stable score tie by original order");
    ow.test.assert(result.answers.priority.expectedScore, 0.8, "Expectation is not rounded into level");
    fixture = nativeFixture(); fixture.answers.urgent.noul = 0;
    ow.test.assert(g.decide("state", questions).answers.urgent.value, false, "P(true)=0");
    fixture.answers.urgent.noul = 1;
    fixture.answers.urgent.confidence = 0.8;
    var booleanResult = g.decide("state", questions).answers.urgent;
    ow.test.assert(booleanResult.value, true, "P(true)=1");
    ow.test.assert(booleanResult.providerConfidence, null, "Undocumented boolean confidence stays unknown");
    delete fixture.usage;
    ow.test.assert(isUnDef(g.decideWithStats("state", questions).stats.tokens), true, "Missing usage remains absent");
  };
  exports.testDecisionStructuredInvalidResponses = function() {
    ow.loadAI();
    ["gemini", "openai"].forEach(function(provider) {
      var g = make(provider), fixture;
      g.getGPT().model._decisionRequest = function() { return fixture; };
      ['{}', '{"route":"unknown","urgent":false,"priority":0}', '{"route":"billing","urgent":"false","priority":0}', '{"route":"billing","urgent":false,"priority":1.5}', '{"route":"billing","urgent":false,"priority":3}', '{"route":"billing","urgent":false,"priority":0,"extra":0}', '```json\n{}\n```', '{'].forEach(function(text) {
        fixture = provider == "gemini" ? geminiFixture(text) : openaiFixture(text);
        expectError(function() { g.decide("state", questions); }, "LLM_DECISION_INVALID_RESPONSE");
      });
      if (provider == "gemini") {
        [{ candidates: [] }, { promptFeedback: { blockReason: "SAFETY" } }, geminiFixture('{}', 'MAX_TOKENS'), { candidates: [{ finishReason: "STOP", content: { parts: [{ functionCall: { name: "tool" } }] } }] }].forEach(function(r) {
          fixture = r; expectError(function() { g.decide("state", questions); }, "LLM_DECISION_INVALID_RESPONSE");
        });
      } else {
        fixture = openaiFixture('{}'); fixture.status = "incomplete";
        expectError(function() { g.decide("state", questions); }, "LLM_DECISION_INVALID_RESPONSE");
        fixture = openaiFixture('{}'); fixture.output[1].content = [{ type: "refusal", refusal: "blocked" }];
        expectError(function() { g.decide("state", questions); }, "LLM_DECISION_INVALID_RESPONSE");
        fixture = { choices: [{ finish_reason: "length", message: { content: '{}' } }] };
        expectError(function() { g.decide("state", questions); }, "LLM_DECISION_INVALID_RESPONSE");
      }
    });
  };
  exports.testDecisionIsolation = function() {
    ow.loadAI();
    ["ollama", "gemini", "openai"].forEach(function(provider) {
      var config = { params: { tools: [{ type: "function" }], previous_response_id: "old", messages: ["old"], options: { temperature: 1 } } };
      var g = make(provider, config), api = g.getGPT().model, executed = 0, fail = false;
      g.withInstructions("Old instructions"); g.withContext({ old: "Old context" }, "Old context");
      api.setTool("forbidden", "Never run", { type: "object" }, function() { executed++; });
      var conversation = JSON.stringify(api.conversation), toolList = api.tools, configBefore = JSON.stringify(config), state = { ticket: "Charged twice" }, stateBefore = JSON.stringify(state), qBefore = JSON.stringify(questions);
      api._decisionRequest = function(uri, body) {
        ow.test.assert(isUnDef(body.tools), true, "No tools sent");
        ow.test.assert(isUnDef(body.previous_response_id), true, "No conversation linkage");
        ow.test.assert(JSON.stringify(body).indexOf("Old instructions") < 0, true, "Ignore stored instructions");
        ow.test.assert(JSON.stringify(body).indexOf("Old context") < 0, true, "Ignore stored context");
        if (fail) throw new Error("secret key and state");
        return provider == "ollama" ? nativeFixture() : provider == "gemini" ? geminiFixture('{"route":"billing","urgent":false,"priority":0}') : openaiFixture('{"route":"billing","urgent":false,"priority":0}');
      };
      g.decide(state, questions);
      fail = true;
      var e = expectError(function() { g.decide(state, questions); }, "LLM_DECISION_PROVIDER_ERROR");
      ow.test.assert(String(e).indexOf("secret") < 0, true, "Sanitize transport exceptions");
      ow.test.assert(JSON.stringify(api.conversation), conversation, "Conversation unchanged on success/failure");
      ow.test.assert(api.tools === toolList, true, "Tool registration unchanged");
      ow.test.assert(JSON.stringify(config), configBefore, "Configuration unchanged");
      ow.test.assert(JSON.stringify(state), stateBefore, "Caller state unchanged");
      ow.test.assert(JSON.stringify(questions), qBefore, "Caller questions unchanged");
      ow.test.assert(executed, 0, "No callback executed");
    });
  };
  exports.testDecisionSafePropertiesAndValidation = function() {
    ow.loadAI();
    var g = make("gemini"), body, count = 0;
    var safe = JSON.parse('{"__proto__":{"type":"choice","instructions":"Choose.","criteria":{"constructor":"A","__proto__":"B"}},"constructor":{"type":"boolean","instructions":"True?"}}');
    g.getGPT().model._decisionRequest = function(uri, data) { count++; body = data; return geminiFixture('{"__proto__":"constructor","constructor":true}'); };
    var result = g.decide("state", safe);
    ow.test.assert(result.answers["__proto__"].value, "constructor", "Safe question and criterion names");
    ow.test.assert(Object.keys(body.generationConfig.responseFormat.text.schema.properties).length, 2, "Safe schema property names");
    var sparse = []; sparse.length = 2;
    var accessor = {}; Object.defineProperty(accessor, "x", { enumerable: true, get: function() { throw "must not invoke"; } });
    var toJSON = { toJSON: function() { throw "must not invoke"; } };
    [sparse, accessor, toJSON, new java.util.HashMap(), { x: Infinity }, { x: undefined }, null, 123, true].forEach(function(state) { expectError(function() { g.decide(state, safe); }, "LLM_DECISION_INVALID_REQUEST"); });
    [ { strategy: "bad" }, { requireProbabilities: 1 }, { providerOptions: { unknown: 1 } }, { providerOptions: { temperature: "1" } }, { providerOptions: { maxOutputTokens: 0 } } ].forEach(function(options) { expectError(function() { g.decide("state", safe, options); }, "LLM_DECISION_INVALID_REQUEST"); });
    var invalid = [ { x: { type: "boolean", instructions: "" } }, { x: { type: "unknown", instructions: "Choose" } }, { x: { type: "choice", instructions: "Choose", criteria: { a: "A" } } }, { x: { type: "score", instructions: "Choose", criteria: ["A", ""] } }, { x: { type: "boolean", instructions: "Choose", criteria: { true: "Yes" } } } ];
    invalid.forEach(q => expectError(function() { g.decide("state", q); }, "LLM_DECISION_INVALID_REQUEST"));
    ow.test.assert(count, 1, "Invalid inputs rejected before request");
  };
  exports.testDecisionLimitsAndEndpoint = function() {
    ow.loadAI();
    var g = make("ollama", { url: "http://localhost:11434/v1/" }), count = 0, body;
    g.getGPT().model._decisionRequest = function(uri, data) { count++; body = data; ow.test.assert(uri, "/systemone", "Avoid duplicate v1"); return nativeFixture(); };
    g.decide("state", questions, { providerOptions: { keepAlive: 0 } });
    ow.test.assert(body.keep_alive, 0, "Keep zero keep_alive");
    ow.test.assert(Object.keys(body).sort(), ["keep_alive", "model", "questions", "state"], "Dedicated native body");
    var overhead = af.fromString2Bytes(JSON.stringify({ model: "nimble", state: "", questions: body.questions }), "UTF-8").length;
    var exact = "a".repeat(65536 - overhead);
    g.decide(exact, questions);
    expectError(function() { g.decide(exact + "a", questions); }, "LLM_DECISION_INVALID_REQUEST");
    expectError(function() { g.decide("é".repeat(33000), questions); }, "LLM_DECISION_INVALID_REQUEST");
    var q = copy(questions); q.priority.criteria = Array(27).fill("level");
    expectError(function() { g.decide("state", q); }, "LLM_DECISION_INVALID_REQUEST");
    ow.test.assert(count, 2, "UTF-8 limit and criteria rejected before HTTP");
    var cloud = make("ollama", { model: "nimble:cloud" });
    expectError(function() { cloud.decide("state", questions); }, "LLM_DECISION_UNSUPPORTED");
  };
  exports.testDecisionGeminiSchemaHelper = function() {
    ow.loadAI();
    var g = make("gemini"), calls = [], schema = { name: "Person", description: "Example", strict: true, schema: { type: "object", properties: { name: { type: "string" } }, required: ["name"], additionalProperties: false } };
    g.withInstructions("Conversation instruction");
    g.getGPT().model._decisionRequest = function(uri, body) { calls.push(body); return geminiFixture('{"name":"Alice"}'); };
    var response = g.jsonSchemaPromptWithStats("Name?", schema);
    ow.test.assert(response.response.name, "Alice", "Gemini schema helper parses provider response");
    ow.test.assert(response.stats.tokens.total, 25, "Schema helper execution stats");
    ow.test.assert(calls[0].system_instruction.parts[0].text, "Conversation instruction", "Conversational helper retains instructions");
    ow.test.assert(isUnDef(calls[0].generationConfig.responseFormat.text.schema.name), true, "Descriptor not transmitted as schema");
    var unsupported = copy(schema); unsupported.schema.properties.name.minLength = 1;
    expectError(function() { g.jsonSchemaPrompt("Name?", unsupported); }, "LLM_DECISION_INVALID_REQUEST");
    expectError(function() { g.jsonSchemaPrompt("Name?", schema, undefined, undefined, [{}]); }, "LLM_DECISION_INVALID_REQUEST");
    var legacy = make("gemini", { structuredOutputProfile: "legacy-schema" });
    var legacyBody;
    legacy.getGPT().model._decisionRequest = function(uri, body) { legacyBody = body; return geminiFixture('{"name":"Alice"}'); };
    var legacySchema = copy(schema); delete legacySchema.schema.additionalProperties;
    legacy.jsonSchemaPrompt("Name?", legacySchema);
    ow.test.assert(legacyBody.generationConfig.responseMimeType, "application/json", "Legacy MIME string");
    ow.test.assert(legacyBody.generationConfig.responseSchema.type, "OBJECT", "Legacy Schema type enum");
    ow.test.assert(isUnDef(legacyBody.generationConfig.responseFormat), true, "Do not mix profiles");
    var conflict = make("gemini", { params: { generationConfig: { responseMimeType: "application/json" } } });
    conflict.getGPT().model._decisionRequest = function() { throw "must not call"; };
    expectError(function() { conflict.decide("state", questions); }, "LLM_DECISION_INVALID_REQUEST");
  };
  exports.testDecisionCapabilitiesAndLegacyAdapters = function() {
    ow.loadAI();
    var count = 0, g = make("ollama");
    g.getGPT().model._decisionRequest = function() { count++; return nativeFixture(); };
    var caps = g.getCapabilities();
    ow.test.assert(caps.native.implemented, true, "Native adapter implemented");
    ow.test.assert(caps.native.availability, "unknown", "No fabricated runtime availability");
    caps.native.implemented = false;
    ow.test.assert(g.getCapabilities().native.implemented, true, "Capability snapshots independent");
    ow.test.assert(count, 0, "Capabilities make no HTTP call");
    var old = ow.ai.__gpttypes.fixtureLegacy;
    try {
      ow.ai.__gpttypes.fixtureLegacy = { create: function() { return { getModelName: () => "old", prompt: () => "legacy works" }; } };
      var legacy = new ow.ai.gpt("fixtureLegacy", {});
      ow.test.assert(legacy.prompt("hello"), "legacy works", "Existing operations preserved");
      ow.test.assert(legacy.getCapabilities().native.implemented, false, "Optional hooks");
      expectError(function() { legacy.decide("state", questions); }, "LLM_DECISION_UNSUPPORTED");
    } finally { if (isUnDef(old)) delete ow.ai.__gpttypes.fixtureLegacy; else ow.ai.__gpttypes.fixtureLegacy = old; }
  };
  exports.testDecisionHTTPBoundary = function() {
    ow.loadAI();
    var original = ow.obj.http, records = [], status = 200, payload = JSON.stringify(nativeFixture());
    var builder = { retryOnConnectionFailure: function(value) { ow.test.assert(value, false, "Disable implicit connection retries"); return this; }, build: function() { return this; }, newBuilder: function() { return this; } };
    try {
      ow.obj.http = function() {
        this.client = builder;
        this.setThrowExceptions = function() {};
        this.exec = function(url, method, body, headers) { records.push({ url: url, method: method, body: body, headers: headers }); return { responseCode: status, response: payload }; };
        this.close = function() {};
      };
      ["http://localhost:11434", "http://localhost:11434/", "http://localhost:11434/v1", "http://localhost:11434/v1/"].forEach(function(url) {
        var g = make("ollama", { url: url, headers: { "X-Fixture": "yes" } });
        g.decide("state", questions);
        ow.test.assert(records[records.length - 1].url, "http://localhost:11434/v1/systemone", "Correct full native URL");
        ow.test.assert(records[records.length - 1].headers["X-Fixture"], "yes", "Preserve native headers");
      });
      var g = make("ollama");
      [401, 404, 429, 500].forEach(function(code) { status = code; var e = expectError(function() { g.decide("state", questions); }, "LLM_DECISION_PROVIDER_ERROR"); ow.test.assert(e.status, code, "Status retained without classifying unavailable"); });
      status = 200; payload = "malformed SECRET";
      expectError(function() { g.rawDecide("state", questions); }, "LLM_DECISION_INVALID_RESPONSE");
      ow.test.assert(records.length, 9, "No extra inference on HTTP errors");
    } finally { ow.obj.http = original; }
  };
  exports.testDecisionLegacyChatCompatibility = function() {
    ow.loadAI();
    var legacySchema = { type: "OBJECT", properties: { name: { type: "STRING" } }, required: ["name"] };
    var g = new ow.ai.gpt("gemini", { key: "fixture-key", model: "fixture-model", params: { generationConfig: { responseMimeType: "application/json", responseSchema: legacySchema } } }), bodies = [];
    g.model._request = function(uri, body) { bodies.push(body); return geminiFixture('{"name":"Alice"}'); };
    g.rawPrompt("Name?", "fixture-model", 0.2, true, []);
    ow.test.assert(bodies[0].generationConfig.responseSchema, legacySchema, "Existing Gemini schema pass-through retained");
    ow.test.assert(bodies[0].generationConfig.responseMimeType, "application/json", "Existing Gemini JSON prompt retained");
    ow.test.assert(isUnDef(bodies[0].generationConfig.responseFormat), true, "Legacy chat does not inherit new representation");
    var ollama = new ow.ai.gpt("ollama", { url: "http://localhost:11434", model: "chat-model" });
    ollama.model._request = function(uri, body) {
      ow.test.assert(uri, "/api/chat", "Existing Ollama chat endpoint retained");
      ow.test.assert(isArray(body.messages), true, "Existing chat messages retained");
      return { model: "chat-model", message: { role: "assistant", content: "hello" }, done: true };
    };
    ow.test.assert(ollama.prompt("hello"), "hello", "Ollama chat continues working");
  };
  exports.testDecisionExecutionScopedStats = function() {
    ow.loadAI();
    var g = make("openai"), count = 0;
    g.getGPT().model.getLastStats = function() { return { tokens: { total: 999 } }; };
    g.getGPT().model._decisionRequest = function() { count++; return openaiFixture('{"route":"billing","urgent":false,"priority":0}'); };
    ow.test.assert(g.decideWithStats("state", questions).stats.tokens.total, 25, "Stats wrapper must not reread last-call state");
    ow.test.assert(count, 1, "Stats require only one execution");
    var q = copy(questions), native = make("ollama");
    native.getGPT().model._decisionRequest = function() { var r = nativeFixture(); r.answers.route.probabilities = { billing: 0.50005, technical: 0.50005 }; r.answers.route.choice = "billing"; return r; };
    ow.test.assert(native.decide("state", q).answers.route.probabilities.technical, 0.50005, "Rounding tolerance without renormalization");
    native.getGPT().model._decisionRequest = function() { var r = nativeFixture(); r.answers.route.probabilities = { billing: 0.5001, technical: 0.5001 }; return r; };
    expectError(function() { native.decide("state", q); }, "LLM_DECISION_INVALID_RESPONSE");
    var legacy = make("gemini"), captured;
    legacy.getGPT().model._decisionRequest = function(uri, body) { captured = body; return geminiFixture('{"route":"technical","urgent":true,"priority":1}'); };
    legacy.decide("state", q, { providerOptions: { schemaProfile: "legacy-schema" } });
    ow.test.assert(captured.generationConfig.responseSchema.properties.priority.type, "INTEGER", "Legacy decision integer schema");
    ow.test.assert(captured.generationConfig.responseSchema.properties.priority.maximum, 2, "Legacy bounds preserved");
  };
  exports.testDecisionSchemaValidationIsolation = function() {
    ow.loadAI();
    var g = make("gemini"), count = 0;
    var schema = { name: "Small", schema: { type: "object", properties: { level: { type: "integer", minimum: 0, maximum: 2 } }, required: ["level"], additionalProperties: false } }, before = JSON.stringify(schema);
    g.getGPT().model._decisionRequest = function() { count++; return geminiFixture('{"level":"1"}'); };
    expectError(function() { g.jsonSchemaPrompt("test", schema); }, "LLM_DECISION_INVALID_RESPONSE");
    ow.test.assert(JSON.stringify(schema), before, "Schema input is immutable even after invalid output");
    var bad = copy(schema); bad.schema.properties.level.default = 0;
    expectError(function() { g.jsonSchemaPrompt("test", bad); }, "LLM_DECISION_INVALID_REQUEST");
    bad = copy(schema); bad.schema.properties.level.enum = ["1"];
    expectError(function() { g.jsonSchemaPrompt("test", bad); }, "LLM_DECISION_INVALID_REQUEST");
    bad = copy(schema); bad.schema.properties.level.type = ["integer", "null"];
    expectError(function() { g.jsonSchemaPrompt("test", bad); }, "LLM_DECISION_INVALID_REQUEST");
    ow.test.assert(count, 1, "Unsupported schemas rejected before HTTP");
  };
  exports.testDecisionFlatConfigurationAndEnvironment = function() {
    ow.loadAI();
    var config = { type: "ollama", url: "http://localhost:11434", model: "nimble" };
    var g = $gpt(config);
    ow.test.assert(g.getGPT().getType(), "ollama", "Flat provider configuration retained");
    var program = 'var g=$llm(); g.getGPT().model._decisionRequest=function(){return {model:"nimble",answers:{}};}; var r=g.rawDecide("state",{q:{type:"boolean",instructions:"True?"}}); print(JSON.stringify({provider:r.provider,model:r.model,strategy:r.strategy}));';
    var result = $sh().envs(merge(getEnvs(), { OAF_MODEL: JSON.stringify(config) })).sh([String(java.lang.System.getProperty("java.home")) + "/bin/java", "-jar", getOpenAFJar(), "-c", program]).get(0);
    ow.test.assert(result.exitcode, 0, "Environment-loaded facade subprocess succeeds");
    ow.test.assert(JSON.parse(result.stdout.trim()), { provider: "ollama", model: "nimble", strategy: "native" }, "OAF_MODEL flows through lazy $llm binding");
  };
  exports.testDecisionNativeCapabilityRequirements = function() {
    ow.loadAI();
    var g = make("ollama"), count = 0;
    g.getGPT().model.getCapabilities = function() { var caps = ow.ai.__decision.capabilities(true, false, "verified"); caps.native.probabilities = false; return caps; };
    g.getGPT().model._decisionRequest = function() { count++; return { model: "nimble", answers: {} }; };
    g.getGPT().model.normalizeDecisionResponse = function() { return { q: { type: "boolean", value: false, probabilityTrue: null, probabilities: null, selectedProbability: null, providerConfidence: 0.4, probabilitySource: "none" } }; };
    var q = { q: { type: "boolean", instructions: "True?" } };
    var result = g.decide("state", q);
    ow.test.assert(result.answers.q.probabilityTrue, null, "Native alone does not establish probability support");
    ow.test.assert(result.answers.q.providerConfidence, 0.4, "Keep independent native confidence");
    expectError(function() { g.decide("state", q, { requireProbabilities: true }); }, "LLM_DECISION_UNSUPPORTED");
    ow.test.assert(count, 1, "Reject native probability requirements before HTTP when not advertised");
    var gemini = make("gemini");
    var error = expectError(function() { gemini.jsonSchemaPrompt("state", { schema: {} }); }, "LLM_DECISION_INVALID_REQUEST");
    ow.test.assert(error.provider, "gemini", "Schema-helper errors carry sanitized provider context");
  };
})();
