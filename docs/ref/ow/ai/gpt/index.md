# ow.ai.gpt

[Home](../../../index.md) / [All APIs](../../../all-apis.md) / [ow](../../index.md) / [ow.ai](../index.md) / [ow.ai.gpt](index.md)

## Subcategories

- [ow.ai.gpt.prototype](prototype/index.md)

<a id="api-ow-ai-gpt-adddeveloperprompt-77d4b434"></a>

## ow.ai.gpt.addDeveloperPrompt

### ow.ai.gpt.addDeveloperPrompt(aPrompt) : ow.ai.gpt

Adds aPrompt (a string or an array of strings) with aRole (defaults to "developer") to the current conversation.

Sources:

- js/owrap.ai.js:4978

<a id="api-ow-ai-gpt-addprompt-1acaaa15"></a>

## ow.ai.gpt.addPrompt

### ow.ai.gpt.addPrompt(aPrompt, aRole) : ow.ai.gpt

Adds aPrompt (a string or an array of strings) with aRole (defaults to "user") to the current conversation.

Sources:

- js/owrap.ai.js:4944

<a id="api-ow-ai-gpt-addsystemprompt-0807dda0"></a>

## ow.ai.gpt.addSystemPrompt

### ow.ai.gpt.addSystemPrompt(aPrompt) : ow.ai.gpt

Adds aPrompt (a string or an array of strings) with aRole (defaults to "user") to the current conversation. For Gemini, large system instructions may be implicitly cached by the provider. For Anthropic, explicit cache markers are sent when &#96;promptCaching&#96; is enabled.

Sources:

- js/owrap.ai.js:4966

<a id="api-ow-ai-gpt-adduserprompt-6a4ede38"></a>

## ow.ai.gpt.addUserPrompt

### ow.ai.gpt.addUserPrompt(aPrompt) : ow.ai.gpt

Adds aPrompt (a string or an array of strings) with aRole (defaults to "user") to the current conversation.

Sources:

- js/owrap.ai.js:4955

<a id="api-ow-ai-gpt-booleanprompt-cc28a915"></a>

## ow.ai.gpt.booleanPrompt

### ow.ai.gpt.booleanPrompt(aPrompt, aModel, aTemperature, tools) : boolean

Tries to prompt aPrompt (a string or an array of strings) with aRole (defaults to "user") and aModel (defaults to the one provided on the constructor).

Sources:

- js/owrap.ai.js:5049

<a id="api-ow-ai-gpt-cleanprompt-2ec7e344"></a>

## ow.ai.gpt.cleanPrompt

### ow.ai.gpt.cleanPrompt() : ow.ai.gpt

Cleans the current conversation.

Sources:

- js/owrap.ai.js:4989

<a id="api-ow-ai-gpt-codeprompt-bfec5465"></a>

## ow.ai.gpt.codePrompt

### ow.ai.gpt.codePrompt(aPrompt, aModel, aTemperature, aCommentChars) : String

Tries to prompt aPrompt (a string or an array of strings) with aRole (defaults to "user") and aModel (defaults to the one provided on the constructor).

Sources:

- js/owrap.ai.js:5163

<a id="api-ow-ai-gpt-decide-91793844"></a>

## ow.ai.gpt.decide

### ow.ai.gpt.decide(aState, aQuestions, aOptions) : Map

Evaluates text/JSON state with named choice, boolean and ordinal score questions. Returns contractVersion 1. Options: strategy (auto/native/structured), model, requireProbabilities, providerOptions, images (Ollama raw base64 or OpenAI inline image data URLs; native only). Stateless: ignores conversation and tools. Native probabilities are provider information, not calibrated correctness. Structured probability fields are null.

Sources:

- js/owrap.ai.js:4527

<a id="api-ow-ai-gpt-decidewithstats-2b4325bf"></a>

## ow.ai.gpt.decideWithStats

### ow.ai.gpt.decideWithStats(aState, aQuestions, aOptions) : Map

Returns &#123; response, stats &#125; from one execution with request-scoped usage. Missing usage remains absent.

Sources:

- js/owrap.ai.js:4548

<a id="api-ow-ai-gpt-exportconversation-467de988"></a>

## ow.ai.gpt.exportConversation

### ow.ai.gpt.exportConversation() : Array

Exports the current conversation as a portable, provider-neutral format array. Each entry contains: role ("system"&#124;"user"&#124;"assistant"), content (string&#124;null), and optionally toolCalls and toolResults arrays. The exported format can be safely imported into a different provider via importConversation().

Sources:

- js/owrap.ai.js:4766

<a id="api-ow-ai-gpt-getcapabilities-8527cdef"></a>

## ow.ai.gpt.getCapabilities

### ow.ai.gpt.getCapabilities() : Map

Returns implemented decision strategies, verified contracts and model availability (usually unknown). Does not contact the provider. Legacy adapters without hooks report unsupported decision strategies.

Sources:

- js/owrap.ai.js:4449

<a id="api-ow-ai-gpt-getconversation-80a52903"></a>

## ow.ai.gpt.getConversation

### ow.ai.gpt.getConversation() : Array

Returns the current conversation.

Sources:

- js/owrap.ai.js:4745

<a id="api-ow-ai-gpt-getlaststats-1ab797f6"></a>

## ow.ai.gpt.getLastStats

### ow.ai.gpt.getLastStats() : Map

Returns the latest usage statistics reported by the underlying GPT model for the most recent prompt request (including provider-specific fields such as OpenAI cached prompt tokens and Anthropic cache read/creation tokens when available).

Sources:

- js/owrap.ai.js:4558

<a id="api-ow-ai-gpt-importconversation-667514a5"></a>

## ow.ai.gpt.importConversation

### ow.ai.gpt.importConversation(aExport) : ow.ai.gpt

Imports a portable conversation previously exported via exportConversation() into this provider, converting it to the provider's native internal format. Supports text turns and tool call/result turns.

Sources:

- js/owrap.ai.js:4782

<a id="api-ow-ai-gpt-jsonprompt-ebb1a64d"></a>

## ow.ai.gpt.jsonPrompt

### ow.ai.gpt.jsonPrompt(aPrompt, aModel, aTemperature, tools) : Object

Tries to prompt aPrompt (a string or an array of strings) with aRole (defaults to "user") and aModel (defaults to the one provided on the constructor).

Sources:

- js/owrap.ai.js:5000

<a id="api-ow-ai-gpt-jsonpromptwithstats-dc0f663c"></a>

## ow.ai.gpt.jsonPromptWithStats

### ow.ai.gpt.jsonPromptWithStats(aPrompt, aModel, aTemperature, tools) : Map

Executes jsonPrompt and returns the parsed response together with any reported statistics (&#123; response, stats &#125;).

Sources:

- js/owrap.ai.js:5013

<a id="api-ow-ai-gpt-jsonpromptwithstatsraw-7e7f34f9"></a>

## ow.ai.gpt.jsonPromptWithStatsRaw

### ow.ai.gpt.jsonPromptWithStatsRaw(aPrompt, aModel, aTemperature, tools) : Map

Executes jsonPrompt and returns the raw response, parsed response, and statistics (&#123; response, raw, stats &#125;).

Sources:

- js/owrap.ai.js:5027

<a id="api-ow-ai-gpt-jsonschemaprompt-f7aed9fe"></a>

## ow.ai.gpt.jsonSchemaPrompt

### ow.ai.gpt.jsonSchemaPrompt(aPrompt, aResponseSchema, aModel, aTemperature, tools) : Object

Executes a prompt using OpenAI's JSON Schema response format, enforcing structured output validated against `aResponseSchema`.

`aResponseSchema` should be a map with:

- `name` (string)
- `description` (string)
- `schema` (JSON Schema object)
- `strict` (boolean, defaults to true)

Gemini uses its provider-specific GenerateContent schema hook and supported schema subset; explicit nonempty `tools` are rejected.

Returns the parsed JSON response matching the provided schema.

Only supported by the `openai` provider. Throws if the underlying provider does not implement `rawResponse`.

Sources:

- js/owrap.ai.js:4839

<a id="api-ow-ai-gpt-jsonschemapromptwithstats-be5d1447"></a>

## ow.ai.gpt.jsonSchemaPromptWithStats

### ow.ai.gpt.jsonSchemaPromptWithStats(aPrompt, aResponseSchema, aModel, aTemperature, tools) : Map

Executes jsonSchemaPrompt and returns the parsed response together with any reported statistics (&#123; response, stats &#125;).

aResponseSchema should be a map with: name (string), description (string), schema (JSON Schema object), strict (boolean, defaults to true). Gemini uses its provider-specific GenerateContent schema hook and supported schema subset; explicit nonempty tools are rejected.

Sources:

- js/owrap.ai.js:4892

<a id="api-ow-ai-gpt-parsecode-c724137e"></a>

## ow.ai.gpt.parseCode

### ow.ai.gpt.parseCode(anAnswer) : String

Tries to parse anAnswer and return the code between &#92;&#96;&#96;&#96; and &#92;&#96;&#96;&#96;.

Sources:

- js/owrap.ai.js:5126

<a id="api-ow-ai-gpt-pathprompt-d8a47eed"></a>

## ow.ai.gpt.pathPrompt

### ow.ai.gpt.pathPrompt(aPrompt, aJSONSchemaDef, aModel, aTemperature, tools) : String

Tries to prompt aPrompt (a string or an array of strings) with aRole (defaults to "user") and aModel (defaults to the one provided on the constructor).

Sources:

- js/owrap.ai.js:5112

<a id="api-ow-ai-gpt-prompt-898b2b69"></a>

## ow.ai.gpt.prompt

### ow.ai.gpt.prompt(aPrompt, aRole, aModel, aTemperature, aJsonFlag, tools) : String

Tries to prompt aPrompt (a string or an array of strings) with aRole (defaults to "user") and aModel (defaults to the one provided on the constructor).

Sources:

- js/owrap.ai.js:4612

<a id="api-ow-ai-gpt-promptimage-dcc49481"></a>

## ow.ai.gpt.promptImage

### ow.ai.gpt.promptImage(aPrompt, aImage, aDetailLevel, aRole, aModel, aTemperature, jsonFlag) : String

Tries to prompt aPrompt (a string or an array of strings) with aImage (a file path or a base64 string representation), aRole (defaults to "user") and aModel (defaults to the one provided on the constructor). Images are prepared with ow.ai.prepareImage; detail semantics are unchanged. Constructor options imageMaxSide, imageMaxBytes, imageMaxPixels, imageFormat, imageQuality and imageBackground override preparation defaults; imageResize:false preserves original bytes. For the anthropic provider aImage can also be an array, and items can be maps &#123; file &#124; base64 &#124; url, mediaType &#125; to attach PDFs and text files (sent as document blocks); aDetailLevel is ignored.

Sources:

- js/owrap.ai.js:4735

<a id="api-ow-ai-gpt-promptimggen-16163182"></a>

## ow.ai.gpt.promptImgGen

### ow.ai.gpt.promptImgGen(aPrompt, aModel, anOutputPathPrefix) : Array

Tries to prompt aPrompt (a string or an array of strings), aModel (defaults to the one provided on the constructor) to generate one or more images and anOutputPathPrefix to which the number of the image and ".png" will be appended. Returns an array of the files generated.

Sources:

- js/owrap.ai.js:4906

<a id="api-ow-ai-gpt-promptstream-5e5cc7a0"></a>

## ow.ai.gpt.promptStream

### ow.ai.gpt.promptStream(aPrompt, aRole, aModel, aTemperature, aJsonFlag, tools, aOnDelta) : String

Executes a streaming prompt, calling aOnDelta for each streamed chunk, and returns the aggregated response.

Sources:

- js/owrap.ai.js:4623

<a id="api-ow-ai-gpt-promptstreamjson-9b659828"></a>

## ow.ai.gpt.promptStreamJSON

### ow.ai.gpt.promptStreamJSON(aPrompt, aRole, aModel, aTemperature, tools, aOnDelta) : Object

Executes a streaming JSON prompt and returns the parsed JSON response.

Sources:

- js/owrap.ai.js:4679

<a id="api-ow-ai-gpt-promptstreamjsonwithstats-300ac9eb"></a>

## ow.ai.gpt.promptStreamJSONWithStats

### ow.ai.gpt.promptStreamJSONWithStats(aPrompt, aRole, aModel, aTemperature, tools, aOnDelta) : Map

Executes a streaming JSON prompt and returns the parsed response with statistics (&#123; response, stats &#125;).

Sources:

- js/owrap.ai.js:4693

<a id="api-ow-ai-gpt-promptstreamjsonwithstatsraw-0a0f9d18"></a>

## ow.ai.gpt.promptStreamJSONWithStatsRaw

### ow.ai.gpt.promptStreamJSONWithStatsRaw(aPrompt, aRole, aModel, aTemperature, tools, aOnDelta) : Map

Executes a streaming JSON prompt and returns the raw response, parsed response, and statistics (&#123; response, raw, stats &#125;).

Sources:

- js/owrap.ai.js:4708

<a id="api-ow-ai-gpt-promptstreamwithstats-b57d45ae"></a>

## ow.ai.gpt.promptStreamWithStats

### ow.ai.gpt.promptStreamWithStats(aPrompt, aRole, aModel, aTemperature, aJsonFlag, tools, aOnDelta) : Map

Executes a streaming prompt and returns a map with the aggregated response and statistics (&#123; response, stats &#125;).

Sources:

- js/owrap.ai.js:4653

<a id="api-ow-ai-gpt-promptwithstats-f4137da4"></a>

## ow.ai.gpt.promptWithStats

### ow.ai.gpt.promptWithStats(aPrompt, aRole, aModel, aTemperature, aJsonFlag, tools) : Map

Executes prompt and returns a map with the model response and any reported statistics (&#123; response, stats &#125;).

Sources:

- js/owrap.ai.js:4723

<a id="api-ow-ai-gpt-rawdecide-fef7e1cd"></a>

## ow.ai.gpt.rawDecide

### ow.ai.gpt.rawDecide(aState, aQuestions, aOptions) : Map

Returns &#123; contractVersion, provider, model, strategy, raw &#125; from one execution. Malformed answer content can be inspected, except requireProbabilities still validates coverage and probability semantics. Transport/API errors always throw.

Sources:

- js/owrap.ai.js:4538

<a id="api-ow-ai-gpt-rawimggen-bafe1e42"></a>

## ow.ai.gpt.rawImgGen

### ow.ai.gpt.rawImgGen(aPrompt, aModel) : Map

Tries to generate an image based on aPrompt (a string or an array of strings) with aModel (defaults to the one provided on the constructor). Returns the raw result.

Sources:

- js/owrap.ai.js:4933

<a id="api-ow-ai-gpt-rawprompt-e56edcf4"></a>

## ow.ai.gpt.rawPrompt

### ow.ai.gpt.rawPrompt(aPrompt, aRole, aModel, aTemperature, aJsonFlag, tools) : String

Tries to prompt aPrompt (a string or an array of strings) with aRole (defaults to "user") and aModel (defaults to the one provided on the constructor).

Sources:

- js/owrap.ai.js:4808

<a id="api-ow-ai-gpt-rawpromptstream-43e3f4e1"></a>

## ow.ai.gpt.rawPromptStream

### ow.ai.gpt.rawPromptStream(aPrompt, aRole, aModel, aTemperature, aJsonFlag, tools, aOnDelta) : Map

Executes a streaming prompt and returns the raw streaming payloads together with the aggregated response (&#123; content, events &#125;).

Sources:

- js/owrap.ai.js:4635

<a id="api-ow-ai-gpt-rawpromptstreamwithstats-0dc2d52b"></a>

## ow.ai.gpt.rawPromptStreamWithStats

### ow.ai.gpt.rawPromptStreamWithStats(aPrompt, aRole, aModel, aTemperature, aJsonFlag, tools, aOnDelta) : Map

Executes a streaming prompt and returns the raw streaming payloads, aggregated response, and statistics (&#123; response, stats &#125;).

Sources:

- js/owrap.ai.js:4666

<a id="api-ow-ai-gpt-rawpromptwithstats-ec01c96a"></a>

## ow.ai.gpt.rawPromptWithStats

### ow.ai.gpt.rawPromptWithStats(aPrompt, aRole, aModel, aTemperature, aJsonFlag, tools) : Map

Executes rawPrompt and returns the raw response together with any reported statistics (&#123; response, stats &#125;).

Sources:

- js/owrap.ai.js:4819

<a id="api-ow-ai-gpt-setconversation-361017fe"></a>

## ow.ai.gpt.setConversation

### ow.ai.gpt.setConversation(aConversation) : ow.ai.gpt

Sets the current conversation to aConversation.

Sources:

- js/owrap.ai.js:4755

<a id="api-ow-ai-gpt-setdebugch-94047317"></a>

## ow.ai.gpt.setDebugCh

### ow.ai.gpt.setDebugCh(aChName) : ow.ai.gpt

Sets the debug channel name to aChName. When defined, creates an OpenAF channel and logs all requests and responses. Call with undefined to disable debug logging.

Sources:

- js/owrap.ai.js:4797

<a id="api-ow-ai-gpt-setinstructions-9bf64dd9"></a>

## ow.ai.gpt.setInstructions

### ow.ai.gpt.setInstructions(aType) : ow.ai.gpt

Sets the instructions for the current conversation. aType can be a string (e.g. json, boolean, sql, js and path) or an array of strings.

Sources:

- js/owrap.ai.js:5073

<a id="api-ow-ai-gpt-settool-3f8dbffa"></a>

## ow.ai.gpt.setTool

### ow.ai.gpt.setTool(aName, aDesc, aParams, aFn) : ow.ai.gpt

Sets a tool with aName, aDesc (description), aParams (a json schema) and aFn (a javascript function tha receives a map according with the provided json schema and returns a map)

Sources:

- js/owrap.ai.js:5062

<a id="api-ow-ai-gpt-sqlprompt-91efb48e"></a>

## ow.ai.gpt.sqlPrompt

### ow.ai.gpt.sqlPrompt(aPrompt, aTableDefs, aDBName, aModel, aTemperature, tools) : String

Tries to prompt aPrompt (a string or an array of strings) with aRole (defaults to "user") and aModel (defaults to the one provided on the constructor).

Sources:

- js/owrap.ai.js:5097

