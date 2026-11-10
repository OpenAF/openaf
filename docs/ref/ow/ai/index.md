# ow.ai

[Home](../../index.md) / [All APIs](../../all-apis.md) / [ow](../index.md) / [ow.ai](index.md)

## Subcategories

- [ow.ai.gpt](gpt/index.md)
- [ow.ai.network](network/index.md)
- [ow.ai.normalize](normalize/index.md)

<a id="api-ow-ai-agent-5b7573a4"></a>

## ow.ai.agent

### ow.ai.agent(aOptions) : Map

Creates a GPT-backed agent suitable for A2A (Agent-to-Agent) messaging.
Returns a map with 'meta' (agent metadata) and 'handler' (message handler function) ready for registration with `ow.server.a2a.registerAgent()`.

`aOptions` should contain:

- `id` (string, required) : Unique agent identifier
- `name` (string) : Display name (defaults to id)
- `title` (string) : Human-readable title (defaults to id)
- `version` (string) : Version string (defaults to "1.0.0")
- `tags` (array) : Array of categorization tags
- `capabilities` (map) : Map of agent capabilities (defaults to {messaging: true})
- `gpt` (required) : Either a `$gpt` instance or a config map for `$gpt` (e.g., {type: "openai", options: {key: "..."}})
- `systemPrompt` (string) : System message to guide the agent's behavior
- `tools` (array) : Array of tool names or definitions to add to the GPT instance

Example:

```javascript
var weatherAgent = ow.ai.agent({
  id: "weather-agent",
  name: "Weather Agent",
  gpt: {type: "openai", options: {key: "sk-..."}},
  systemPrompt: "You provide weather information concisely.",
  capabilities: {messaging: true, weatherData: true}
});

global.__a2a__ = new ow.server.a2a();
global.__a2a__.registerAgent(weatherAgent.meta, weatherAgent.handler);
```

Sources:

- js/owrap.ai.js:4190

<a id="api-ow-ai-cluster-13a1e7b2"></a>

## ow.ai.cluster

### ow.ai.cluster(args) : Object

Wraps access to clustering of data. The result will be an object with a classify method that will
return the clustering result given the provided data. Args expects different arguments depending on type of
clustering:

- `args.type` (String) "kmeans" (default)
- `args.numberOfClusters` (Number) number of clusters to use (default to 5)
- `classify(normalizedData)` (Map) returns a map of centroids and cluster assignments

Sources:

- js/owrap.ai.js:7353

<a id="api-ow-ai-decisiontree-57df3dad"></a>

## ow.ai.decisionTree

### ow.ai.decisionTree(aMap) : Object

Provides a wrapper to access the existing decision tree algorithms included:

ID3:

- `type`: `'id3'`
- `trainingSet` (array of maps) The training data
- `categoryAttr` (key name) The map key to build the decision tree on
- `ignoredAttributes` (array of keys) The list of keys to be ignored in each map

RandomForest:

- `type`: `'randomforest'`
- `trainingSet` (array of maps) The training data
- `categoryAttr` (key name) The map key to build the decision tree on
- `ignoredAttributes` (array of keys) The list of keys to be ignored in each map
- `treesNumber` (number) The number of decision trees to use

C45:

- `type`: `'c45'`
- `data` (array of arrays) The training data
- `features` (arrays of keys) The keys name by order of each array data value
- `featureTypes` (arrays of types) Categorization of each attribute between 'category' and 'number'
- `target` (key) The target key name (the last of each array data value)

Sources:

- js/owrap.ai.js:6504

<a id="api-ow-ai-gpt-e6d70a57"></a>

## ow.ai.gpt

### ow.ai.gpt(aType, aOptions) : ow.ai.gpt

Creates a GPT AI model of `aType` (e.g. "openai", "gemini", "ollama" or "anthropic") with `aOptions`.

Common `aOptions` properties include:

- `key`: provider API key when required.
- `model`: default model name or deployment name.
- `url`: provider base URL. For OpenAI defaults to "https://api.openai.com".
- `temperature`: default model temperature.
- `timeout`: request timeout in milliseconds (defaults to 15 minutes).
- `headers`: extra request headers. These override generated headers with the same names.
- `params`: extra request body parameters merged into prompt, image and embedding calls.
- `noSystem`: when true, system messages are converted to developer messages where supported (defaults to true).
- `schemaTransport`: explicit schema-hook transport, "responses" or "chat"; no automatic fallback. Tool-free calls default to Responses. Native-tool calls default to Responses on the official OpenAI endpoint and Chat Completions on compatible endpoints.
- `noResponseFormat`: when true, disables OpenAI-compatible JSON response_format injection.
- `promptCaching`: when true adds Anthropic cache_control markers; no prompt-caching beta header is required (defaults to false).

OpenAI-compatible transport options:

- `apiVersion`: API version/path segment for OpenAI-compatible routes (defaults to "v1"). In Azure legacy mode this becomes the api-version query parameter. In Foundry mode, "v1" uses the /openai/v1 path; dated versions use the /models route with api-version.
- `mode`: transport mode. Supported values are "openai" (default), "azure-openai-v1", "azure-openai-legacy" and "foundry". Aliases: "azure-v1", "azure-legacy" and "azure-foundry".
- `deployment`: deployment name for "azure-openai-legacy" mode. If omitted, the selected model name is used.
- `decisionApi`: native decision contract ("openai" default, "openrouter", or "microsoft"). Microsoft requires Foundry mode, API v1 and an explicit model deployment name.
- `decisionUrl`: optional absolute HTTP(S) native decision endpoint override.
- `authType`: authentication header style. Supported values are "bearer" (OpenAI default), "api-key" (Azure/Foundry default) and "none".

Examples:

- `OpenAI`: new `ow.ai.gpt("openai", { key: "sk-...", url: "https://api.openai.com/v1", model: "gpt-4o-mini" })`
- Azure OpenAI v1: new `ow.ai.gpt("openai", { key: "...", url: "https://RESOURCE.openai.azure.com", mode: "azure-openai-v1", model: "DEPLOYMENT" })`
- Azure OpenAI legacy: new `ow.ai.gpt("openai", { key: "...", url: "https://RESOURCE.openai.azure.com", mode: "azure-openai-legacy", deployment: "DEPLOYMENT", apiVersion: "2024-10-21" })`
- Azure AI Foundry v1: new `ow.ai.gpt("openai", { key: "...", url: "https://RESOURCE.services.ai.azure.com", mode: "foundry", model: "DEPLOYMENT" })`
- Azure AI Foundry dated API: new `ow.ai.gpt("openai", { key: "...", url: "https://RESOURCE.services.ai.azure.com/models", mode: "foundry", apiVersion: "2024-05-01-preview", model: "DEPLOYMENT" })`

Usage stats note: `getLastStats()` now includes OpenAI cached prompt tokens (`tokens.cached`) when reported by compatible models.

Sources:

- js/owrap.ai.js:4318

<a id="api-ow-ai-network-6f71c866"></a>

## ow.ai.network

### ow.ai.network(aMap) : ow.ai.network

Creates a neural network given the parameters in aMap. aMap should contain a "type" parameter to indicate the type of network (synaptic: perceptron, lstm, liquid or hopfield; brainjs: neuralnetwork, rnntimestep, lstmtimestep, grutimestep, rnn, lstm or gru).  Then aMap should contain a "args" parameter to provide each network inialization parameters. Please see "help ow.ai.network.&#91;type of network&#93;" for more details about each one.

Sources:

- js/owrap.ai.js:5832

<a id="api-ow-ai-regression-63c957b5"></a>

## ow.ai.regression

### ow.ai.regression() : Regression

Returns a Regression with the following functions:

- `linear(data, options)`: Map
- `power(data, options)`: Map
- `exponential(data, options)`: Map
- `logarithmic(data, options)`: Map
- `polynomial(data, options)`: Map

- `data`: an array of arrays of x, y values ([[0,1],[1,3],[2,5]])
- `options`: map to determine the order and precision ({ order: 2, precision: 5})

Sources:

- js/owrap.ai.js:13

<a id="api-ow-ai-valuesarray-62c3b1bc"></a>

## ow.ai.valuesArray

### ow.ai.valuesArray(entriesspan) : Map

Creates a valuesArray object with the following functions:

- `getValues()`: Array
- `push(value)`: void
- `deviation()`: Number
- `variance()`: Number
- `movingAverage()`: Number

- `entriesspan`: number of entries to keep

Sources:

- js/owrap.ai.js:34

