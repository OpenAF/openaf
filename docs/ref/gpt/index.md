# $gpt

[Home](../index.md) / [All APIs](../all-apis.md) / [$gpt](index.md)

<a id="api-gpt-close-094bbca1"></a>

## $gpt.close

### $gpt.close()

Closes the current GPT model.

Sources:

- js/owrap.ai.js:5791

<a id="api-gpt-decide-938dea30"></a>

## $gpt.decide

### $gpt.decide(aState, aQuestions, aOptions) : Map

Returns a stateless versioned decision envelope. Also exposed through $llm. See ow.ai.gpt.decide and docs/llm-decisions.md.

Sources:

- js/owrap.ai.js:5244

<a id="api-gpt-decidewithstats-64af07b8"></a>

## $gpt.decideWithStats

### $gpt.decideWithStats(aState, aQuestions, aOptions) : Map

Returns &#123; response, stats &#125; from one stateless decision execution.

Sources:

- js/owrap.ai.js:5258

<a id="api-gpt-exportconversation-101ebe69"></a>

## $gpt.exportConversation

### $gpt.exportConversation() : Array

Exports the current conversation in a standard portable format that can be imported into a different provider via importConversation().

Sources:

- js/owrap.ai.js:5742

<a id="api-gpt-getcapabilities-2989ccfe"></a>

## $gpt.getCapabilities

### $gpt.getCapabilities() : Map

Reports decision adapter support and runtime availability without a network request.

Sources:

- js/owrap.ai.js:5265

<a id="api-gpt-getembeddings-26663344"></a>

## $gpt.getEmbeddings

### $gpt.getEmbeddings(aInput, aDimensions, aEmbeddingModel) : Object

Gets text embeddings for aInput (string or array of strings) using aEmbeddingModel (defaults to provider-specific default). If aDimensions is specified, requests embeddings with that many dimensions (provider support varies). Returns the raw embedding response from the provider.

Sources:

- js/owrap.ai.js:5719

<a id="api-gpt-getembeddingswithstats-b3c298a9"></a>

## $gpt.getEmbeddingsWithStats

### $gpt.getEmbeddingsWithStats(aInput, aDimensions, aEmbeddingModel) : Map

Gets text embeddings for aInput (string or array of strings) using aEmbeddingModel and returns both the response and usage statistics. If aDimensions is specified, requests embeddings with that many dimensions (provider support varies). Returns a map with &#123; response, stats &#125;.

Sources:

- js/owrap.ai.js:5730

<a id="api-gpt-getlaststats-68379e9e"></a>

## $gpt.getLastStats

### $gpt.getLastStats() : Map

Returns the latest usage statistics reported by the underlying LLM vendor for the last prompt request.

Sources:

- js/owrap.ai.js:5286

<a id="api-gpt-getmodelinfo-1e58cf1b"></a>

## $gpt.getModelInfo

### $gpt.getModelInfo(aModelId) : Map

Returns the model information for aModelId (defaults to the current configured model when omitted).

Sources:

- js/owrap.ai.js:5277

<a id="api-gpt-importconversation-ab0a288e"></a>

## $gpt.importConversation

### $gpt.importConversation(aExport) : $gpt

Imports a portable conversation previously exported via exportConversation() into this provider instance.

Sources:

- js/owrap.ai.js:5749

<a id="api-gpt-iniprompt-4c93ed09"></a>

## $gpt.iniPrompt

### $gpt.iniPrompt(aPrompt, aRole, aModel, aTemperature) : String

Tries to prompt aPrompt (a string or an array of strings) and aModel (defaults to the one provided on the constructor) after cleaning the current conversation.

Sources:

- js/owrap.ai.js:5486

<a id="api-gpt-jsonschemaprompt-da3fc8fd"></a>

## $gpt.jsonSchemaPrompt

### $gpt.jsonSchemaPrompt(aPrompt, aResponseSchema, aModel, aTemperature, tools) : Object

Executes a prompt using OpenAI's JSON Schema response format, enforcing structured output validated against `aResponseSchema`.

`aResponseSchema` should be a map with:

- `name` (string)
- `description` (string)
- `schema` (JSON Schema object)
- `strict` (boolean, defaults to true)

Gemini uses its provider-specific GenerateContent schema hook and supported schema subset; explicit nonempty `tools` are rejected.

Returns the parsed JSON response matching the provided schema.

Only supported by the `openai` provider.

Sources:

- js/owrap.ai.js:5756

<a id="api-gpt-jsonschemapromptwithstats-40b72785"></a>

## $gpt.jsonSchemaPromptWithStats

### $gpt.jsonSchemaPromptWithStats(aPrompt, aResponseSchema, aModel, aTemperature, tools) : Map

Executes jsonSchemaPrompt and returns the parsed response together with any reported statistics (&#123; response, stats &#125;).

aResponseSchema should be a map with: name (string), description (string), schema (JSON Schema object), strict (boolean, defaults to true). Gemini uses its provider-specific GenerateContent schema hook and supported schema subset; explicit nonempty tools are rejected.

Sources:

- js/owrap.ai.js:5780

<a id="api-gpt-laststats-716c49e2"></a>

## $gpt.lastStats

### $gpt.lastStats() : Map

Alias for $gpt.getLastStats.

Sources:

- js/owrap.ai.js:5293

<a id="api-gpt-prompt-f6b900a2"></a>

## $gpt.prompt

### $gpt.prompt(aPrompt, aRole, aModel, aTemperature, tools) : String

Tries to prompt aPrompt (a string or an array of strings) and aModel (defaults to the one provided on the constructor).

Sources:

- js/owrap.ai.js:5310

<a id="api-gpt-promptbool-4468e7e0"></a>

## $gpt.promptBool

### $gpt.promptBool(aPrompt, aRole, aModel, aTemperature, tools) : boolean

Tries to prompt aPrompt (a string or an array of strings) and aModel (defaults to the one provided on the constructor) returning a boolean.

Sources:

- js/owrap.ai.js:5432

<a id="api-gpt-promptimage-bc66ded3"></a>

## $gpt.promptImage

### $gpt.promptImage(aPrompt, aImage, aDetailLevel, aRole, aModel, aTemperature, jsonFlag) : String

Tries to prompt aPrompt (a string or an array of strings) with aImage (a file path or a base64 string representation), aRole (defaults to "user") and aModel (defaults to the one provided on the constructor). Images are prepared with ow.ai.prepareImage; detail semantics are unchanged. Constructor options imageMaxSide, imageMaxBytes, imageMaxPixels, imageFormat, imageQuality and imageBackground override preparation defaults; imageResize:false preserves original bytes. For the anthropic provider aImage can also be an array, and items can be maps &#123; file &#124; base64 &#124; url, mediaType &#125; to attach PDFs and text files (sent as document blocks); aDetailLevel is ignored.

Sources:

- js/owrap.ai.js:5404

<a id="api-gpt-promptimggen-01bd2023"></a>

## $gpt.promptImgGen

### $gpt.promptImgGen(aPrompt, aModel, aPath) : Array

Tries to prompt aPrompt and aModel (defaults to the one provided on the constructor) to generate one or more images and aPath to which the number of the image and ".png" will be saved to. Returns an array of the image files generated.

Sources:

- js/owrap.ai.js:5413

<a id="api-gpt-promptjson-bc6059f2"></a>

## $gpt.promptJSON

### $gpt.promptJSON(aPrompt, aModel, aTemperature)

Tries to prompt aPrompt (a string or an array of strings) and aModel (defaults to the one provided on the constructor) returning a Javascript function.

Sources:

- js/owrap.ai.js:5459

<a id="api-gpt-promptjsonwithstats-86476dc6"></a>

## $gpt.promptJSONWithStats

### $gpt.promptJSONWithStats(aPrompt, aModel, aTemperature)

Tries to prompt aPrompt (a string or an array of strings) and aModel (defaults to the one provided on the constructor) returning a map with the parsed JSON response and statistics (&#123; response, stats &#125;).

Sources:

- js/owrap.ai.js:5468

<a id="api-gpt-promptjsonwithstatsraw-52f7066e"></a>

## $gpt.promptJSONWithStatsRaw

### $gpt.promptJSONWithStatsRaw(aPrompt, aModel, aTemperature)

Tries to prompt aPrompt (a string or an array of strings) and aModel (defaults to the one provided on the constructor) returning a map with the raw response, parsed JSON response, and statistics (&#123; response, raw, stats &#125;).

Sources:

- js/owrap.ai.js:5477

<a id="api-gpt-promptmd-29e1e6b5"></a>

## $gpt.promptMD

### $gpt.promptMD(aPrompt, aRole, aModel, aTemperature, tools) : String

Tries to prompt aPrompt (a string or an array of strings) and aModel (defaults to the one provided on the constructor) returning a markdown string.

Sources:

- js/owrap.ai.js:5423

<a id="api-gpt-promptpath-6af74fea"></a>

## $gpt.promptPath

### $gpt.promptPath(aPrompt, aJSONSchemaDef, aModel, aTemperature)

Tries to prompt aPrompt (a string or an array of strings) and aModel (defaults to the one provided on the constructor) returning a JMESPath query.

Sources:

- js/owrap.ai.js:5450

<a id="api-gpt-promptsql-6001d037"></a>

## $gpt.promptSQL

### $gpt.promptSQL(aPrompt, aTableDefs, aDBName, aModel, aTemperature, tools)

Tries to prompt aPrompt (a string or an array of strings) and aModel (defaults to the one provided on the constructor) returning a SQL query.

Sources:

- js/owrap.ai.js:5441

<a id="api-gpt-promptstream-68adefd6"></a>

## $gpt.promptStream

### $gpt.promptStream(aPrompt, aRole, aModel, aTemperature, aJsonFlag, tools, aOnDelta) : String

Executes a streaming prompt, calling aOnDelta for each streamed chunk, and returns the aggregated response.

Sources:

- js/owrap.ai.js:5319

<a id="api-gpt-promptstreamjson-95ea0da3"></a>

## $gpt.promptStreamJSON

### $gpt.promptStreamJSON(aPrompt, aRole, aModel, aTemperature, tools, aOnDelta) : Object

Executes a streaming JSON prompt and returns the parsed JSON response.

Sources:

- js/owrap.ai.js:5357

<a id="api-gpt-promptstreamjsonwithstats-6c0e850a"></a>

## $gpt.promptStreamJSONWithStats

### $gpt.promptStreamJSONWithStats(aPrompt, aRole, aModel, aTemperature, tools, aOnDelta) : Map

Executes a streaming JSON prompt and returns the parsed response with statistics (&#123; response, stats &#125;).

Sources:

- js/owrap.ai.js:5366

<a id="api-gpt-promptstreamjsonwithstatsraw-e150eb7a"></a>

## $gpt.promptStreamJSONWithStatsRaw

### $gpt.promptStreamJSONWithStatsRaw(aPrompt, aRole, aModel, aTemperature, tools, aOnDelta) : Map

Executes a streaming JSON prompt and returns the raw response, parsed response, and statistics (&#123; response, raw, stats &#125;).

Sources:

- js/owrap.ai.js:5375

<a id="api-gpt-promptstreamwithstats-1844f5fc"></a>

## $gpt.promptStreamWithStats

### $gpt.promptStreamWithStats(aPrompt, aRole, aModel, aTemperature, aJsonFlag, tools, aOnDelta) : Map

Executes a streaming prompt and returns a map with the aggregated response and statistics (&#123; response, stats &#125;).

Sources:

- js/owrap.ai.js:5337

<a id="api-gpt-promptwithstats-3e683472"></a>

## $gpt.promptWithStats

### $gpt.promptWithStats(aPrompt, aRole, aModel, aTemperature, tools) : Map

Executes prompt and returns a map with the response and the reported statistics (&#123; response, stats &#125;).

Sources:

- js/owrap.ai.js:5384

<a id="api-gpt-rawdecide-b9d8a2f1"></a>

## $gpt.rawDecide

### $gpt.rawDecide(aState, aQuestions, aOptions) : Map

Returns execution metadata and the raw provider payload from one stateless request.

Sources:

- js/owrap.ai.js:5251

<a id="api-gpt-rawpromptstream-c1e260f7"></a>

## $gpt.rawPromptStream

### $gpt.rawPromptStream(aPrompt, aRole, aModel, aTemperature, aJsonFlag, tools, aOnDelta) : Map

Executes a streaming prompt and returns the raw streaming payloads together with the aggregated response (&#123; content, events &#125;).

Sources:

- js/owrap.ai.js:5328

<a id="api-gpt-rawpromptstreamwithstats-9a556aea"></a>

## $gpt.rawPromptStreamWithStats

### $gpt.rawPromptStreamWithStats(aPrompt, aRole, aModel, aTemperature, aJsonFlag, tools, aOnDelta) : Map

Executes a streaming prompt and returns the raw streaming payloads, aggregated response, and statistics (&#123; response, stats &#125;).

Sources:

- js/owrap.ai.js:5347

<a id="api-gpt-rawpromptwithstats-68efe67f"></a>

## $gpt.rawPromptWithStats

### $gpt.rawPromptWithStats(aPrompt, aModel, aTemperature, aJsonFlag, tools) : Map

Executes the underlying rawPrompt call and returns the raw response together with the reported statistics (&#123; response, stats &#125;).

Sources:

- js/owrap.ai.js:5394

<a id="api-gpt-setdebugch-7eab25d2"></a>

## $gpt.setDebugCh

### $gpt.setDebugCh(aChName) : $gpt

Sets the debug channel name to aChName. When defined, creates an OpenAF channel and logs all requests and responses. Call with undefined to disable debug logging.

Sources:

- js/owrap.ai.js:5300

<a id="api-gpt-sysprompt-f68eb482"></a>

## $gpt.sysPrompt

### $gpt.sysPrompt(aPrompt, aModel, aTemperature) : String

Adds a prompt system aPrompt (a string or an array of strings) and aModel (defaults to the one provided on the constructor).

Sources:

- js/owrap.ai.js:5495

<a id="api-gpt-witha2aagents-fea0fa44"></a>

## $gpt.withA2aAgents

### $gpt.withA2aAgents(aA2aClient, aAgentIds) : ow.ai.gpt

Automatically adds A2A agents from an MCP/A2A client to the current GPT instance as tools.
The `aA2aClient` should be an initialized `$mcp` client that supports agents/* methods.
If `aAgentIds` is provided (array of strings), only those specific agents will be added. Otherwise, all available agents are added.
Each A2A agent becomes a GPT tool where the tool call sends a message to the agent and returns its response.

Example:

```javascript
var a2aClient = $mcp({type: "remote", url: "http://localhost:8080/a2a"});
a2aClient.initialize();
var gpt = $gpt({type: "openai", options: {key: "your-key"}});
gpt.withA2aAgents(a2aClient); // Adds all A2A agents as tools
// or gpt.withA2aAgents(a2aClient, ["weather-agent", "translator-agent"]); // Adds only specific agents

var response = gpt.prompt("What's the weather in Lisbon?"); // GPT can call the weather-agent
```

Sources:

- js/owrap.ai.js:5605

<a id="api-gpt-withcontext-61cb3200"></a>

## $gpt.withContext

### $gpt.withContext(anObject, aContext) : ow.ai.gpt

Adds a context to the current conversation.

Sources:

- js/owrap.ai.js:5513

<a id="api-gpt-withjsonassert-6fd78f54"></a>

## $gpt.withJSONAssert

### $gpt.withJSONAssert(aPath, anAssert) : ow.ai.gpt

Adds a JSON path aPath to be asserted with anAssert (e.g. isArray or isMap).

Sources:

- js/owrap.ai.js:5702

<a id="api-gpt-withmcptools-06a9932d"></a>

## $gpt.withMcpTools

### $gpt.withMcpTools(aMcpClient, aToolNames) : ow.ai.gpt

Automatically adds MCP tools from an MCP client to the current GPT instance. The `aMcpClient` should be an initialized `$mcp` client.
If `aToolNames` is provided (array of strings), only those specific tools will be added. Otherwise, all available tools are added.
Each MCP tool will be converted to a GPT-compatible tool using the MCP tool's JSON schema.

Example:

```javascript
var mcpClient = $mcp({cmd: "npx @modelcontextprotocol/server-filesystem /tmp"});
mcpClient.initialize();
var gpt = $gpt({type: "openai", options: {key: "your-key"}});
gpt.withMcpTools(mcpClient); // Adds all MCP tools
// or gpt.withMcpTools(mcpClient, ["read_file", "write_file"]); // Adds only specific tools

var response = gpt.prompt("Read the file /tmp/example.txt");
```

Sources:

- js/owrap.ai.js:5537

<a id="api-gpt-withsqltables-5cc300c1"></a>

## $gpt.withSQLTables

### $gpt.withSQLTables(aDBName, aTablesDefs) : ow.ai.gpt

Adds aDBName with aTableDefs to be used with promptSQL.

Sources:

- js/owrap.ai.js:5687

<a id="api-gpt-withtool-cc779c5e"></a>

## $gpt.withTool

### $gpt.withTool(aName, aDesc, aParams, aFn) : ow.ai.gpt

Sets a tool with aName, aDesc (description), aParams (a json schema) and aFn (a javascript function tha receives a map according with the provided json schema and returns a map)

Sources:

- js/owrap.ai.js:5527

