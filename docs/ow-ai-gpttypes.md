# OpenAF AI GPT Types Reference Guide

This document provides a comprehensive reference guide for implementing LLM service API wrappers in OpenAF's `ow.ai` library. The `OpenWrap.ai.prototype.__gpttypes` object contains standardized wrappers for various LLM services, providing a unified interface for chat, tooling, image processing, model listing, and image generation capabilities.

See also: `openaf-advanced.md` (AI Helpers section) for higher-level usage patterns and integration tips.

## Overview

The GPT types system provides a consistent API across different LLM providers through standardized wrapper implementations. Each wrapper normalizes provider-specific APIs into a common interface, handling authentication, conversation management, tool calling, and various prompt types.

### Capability Matrix

| Provider  | Chat | Tooling | Image | Model List | Image Gen |
|-----------|------|---------|-------|------------|-----------|
| openai    | ✔    | ✔       | ✔     | ✔          | ✔         |
| gemini    | ✔    | ✔       | ✔     | ✔          | ✖         |
| ollama    | ✔    | ✔       | ✔     | ✔          | ✖         |
| anthropic | ✔    | ✔       | ✖     | ✔          | ✖         |

## Architecture

Each GPT type implementation follows this structure:

```javascript
OpenWrap.ai.prototype.__gpttypes = {
    [providerName]: {
        create: (aOptions) => {
            // Return wrapper object with standardized interface
        }
    }
}
```

## Wrapper Interface Specification

Every wrapper must implement the following standardized interface:

### Core Properties

- `conversation`: Array - Stores the conversation history
- `tools`: Object/Array - Stores available tools/functions

### Required Methods

#### Configuration Methods

##### `getConversation() : Array`
Returns the current conversation history in a standardized format.

##### `setConversation(aConversation) : Object`
Sets the conversation history. Must handle format normalization between provider formats and the standard format.

##### `setTool(aName, aDesc, aParams, aFn) : Object`
Registers a tool/function for use in conversations.
- `aName`: String - Tool name
- `aDesc`: String - Tool description
- `aParams`: Object - JSON schema for parameters
- `aFn`: Function - Function to execute when tool is called

#### Core Prompt Methods

##### `prompt(aPrompt, aModel, aTemperature, aJsonFlag, tools) : String`
Main prompting method that returns processed response text.
- `aPrompt`: String/Array - The prompt(s) to send
- `aModel`: String - Model to use (optional, defaults to configured model)
- `aTemperature`: Number - Temperature setting (optional)
- `aJsonFlag`: Boolean - Whether to request JSON response
- `tools`: Array - Tools to make available for this prompt

##### `rawPrompt(aPrompt, aModel, aTemperature, aJsonFlag, aTools) : Object`
Returns the raw API response without processing.

##### `promptImage(aPrompt, aImage, aDetailLevel, aRole, aModel, aTemperature, aJsonFlag) : String`
Prompts with image input (if supported by provider).
- `aImage`: String - File path or base64 encoded image
- `aDetailLevel`: String - Image analysis detail level

#### Conversation Management

##### `addPrompt(aRole, aPrompt) : Object`
Adds a message to the conversation.

##### `addUserPrompt(aPrompt) : Object`
Adds a user message to the conversation.

##### `addSystemPrompt(aPrompt) : Object`
Adds a system message to the conversation.

##### `addDeveloperPrompt(aPrompt) : Object`
Adds a developer message to the conversation (provider-specific).

##### `cleanPrompt() : Object`
Clears the conversation history.

#### Image Generation (Optional)

##### `rawImgGen(aPrompt, aModel) : Object`
Generates images, returns raw API response.

##### `promptImgGen(aPrompt, aModel) : Array`
Generates images, returns array of image data.

#### Model Information

##### `getModels() : Array`
Returns list of available models from the provider.

#### HTTP Communication

##### `_request(aURI, aData, aVerb) : Object`
Internal method for making HTTP requests to the provider API.

## Implementation Guidelines

### 1. Options Validation

Always validate and set defaults for configuration options:

```javascript
create: (aOptions) => {
    ow.loadObj()
    aOptions = _$(aOptions, "aOptions").isMap().$_()
    aOptions.params = _$(aOptions.params, "aOptions.params").isMap().default({})
    aOptions.key = _$(aOptions.key, "aOptions.key").isString().$_()
    aOptions.timeout = _$(aOptions.timeout, "aOptions.timeout").isNumber().default(15 * 60000)
    aOptions.model = _$(aOptions.model, "aOptions.model").isString().default("default-model")
    aOptions.temperature = _$(aOptions.temperature, "aOptions.temperature").isNumber().default(0.7)
    aOptions.url = _$(aOptions.url, "aOptions.url").isString().default("https://api.provider.com")
    aOptions.headers = _$(aOptions.headers, "aOptions.headers").isMap().default({})
    // Provider-specific options...
}
```

### 2. Conversation Format Normalization

Handle conversion between the standard conversation format and provider-specific formats:

**Standard Format:**
```javascript
[
    { role: "system", content: "System message" },
    { role: "user", content: "User message" },
    { role: "assistant", content: "Assistant response" }
]
```

**Provider-specific Format Handling:**
- Convert role names (e.g., "assistant" ↔ "model")
- Handle content structure differences
- Manage system message placement variations

### 3. Tool/Function Calling

Implement tool calling support where available:

```javascript
setTool: (aName, aDesc, aParams, aFn) => {
    _r.tools[aName] = {
        type: "function",
        function: {
            name: aName,
            description: aDesc,
            parameters: aParams
        },
        fn: aFn
    }
    return _r
}
```

Handle tool execution in `rawPrompt`:
- Detect tool calls in responses
- Execute registered functions
- Continue conversation with tool results

**Gemini 2.5/3 notes**
- Tool calls arrive as `functionCall` parts; send tool results back as `functionResponse` parts on a follow-up `user` message.
- `functionCall.args` may be an object or a JSON string depending on the model/version.
- When requesting JSON output, prefer `generationConfig.responseMimeType = "application/json"` and only set `responseSchema` when it has non-empty `properties`.

### 4. Authentication Patterns

#### API Key in Header (OpenAI, Anthropic)
```javascript
requestHeaders: merge(aOptions.headers, { 
    Authorization: "Bearer " + Packages.openaf.AFCmdBase.afc.dIP(_key),
    Accept: "*/*"
})
```

#### API Key in URL Parameter (Gemini)
```javascript
case "GET" : return _fnh($rest(__m).get2Stream(aOptions.url + "/" + aURI + "?key=" + Packages.openaf.AFCmdBase.afc.dIP(_key)))
case "POST": return _fnh($rest(__m).post2Stream(aOptions.url + "/" + aURI + "?key=" + Packages.openaf.AFCmdBase.afc.dIP(_key), aData))
```

#### No Authentication (Ollama)
```javascript
requestHeaders: {
    Accept: "*/*"
}
```

### 5. Error Handling

Implement robust error handling in `_request` method:

```javascript
var _fnh = r => {
    var _r 
    if ("function" !== typeof r.getClass) {
        _r = (isDef(r.error) ? jsonParse(r.error, __, __, true) : r)
    } else {
        _r = jsonParse(af.fromBytes2String(r.readAllBytes()))
    }
    if (typeof _r.response !== "undefined") {
        return jsonParse(_r.response)
    } else {
        return _r
    }
}
```

### 6. Image Handling

For providers supporting image input:

```javascript
promptImage: (aPrompt, aImage, aDetailLevel, aRole, aModel, aTemperature, aJsonFlag) => {
    aRole = _$(aRole, "aRole").isString().default("user")
    aDetailLevel = _$(aDetailLevel, "aDetailLevel").isString().default("low")

    var base64 = ""
    if (io.fileExists(aImage)) {
        base64 = af.fromBytes2String(af.toBase64Bytes(io.readFileBytes(aImage)))
    } else {
        if (isString(aImage)) {
            base64 = aImage
        }
    }
    
    // Provider-specific image format handling
}
```

### 7. JSON Response Handling

Implement JSON-specific prompting:

```javascript
if (aJsonFlag) {
    // Provider-specific JSON response configuration
    // Examples:
    // OpenAI: response_format: { type: "json_object" }
    // Ollama: format: "json"
    // Anthropic: Add "output json" to messages
}
```

## Provider-Specific Implementation Notes

### OpenAI
- Uses `Bearer` token authentication
- Supports comprehensive tool calling
- Has dedicated image generation endpoints
- Supports structured JSON responses via `response_format`

### Gemini
- Uses API key in URL parameters
- Has unique conversation format with `parts` arrays
- System instructions handled separately
- Tool calling uses `functionDeclarations` format

### Ollama
- No authentication required (local/self-hosted)
- OpenAI-compatible message format
- Uses `/api/chat` and `/api/tags` endpoints
- JSON format specified in request body

### Anthropic
- Uses `x-api-key` header with `anthropic-version`
- System messages handled via dedicated `system` field
- Limited tool calling support
- No native image generation

## Testing Your Implementation

1. **Basic Chat**: Test simple prompt/response
2. **Conversation**: Verify conversation history maintenance
3. **System Messages**: Test system prompt handling
4. **JSON Mode**: Verify JSON response parsing
5. **Image Input**: Test image processing (if supported)
6. **Tool Calling**: Test function execution (if supported)
7. **Model Listing**: Verify model enumeration
8. **Error Handling**: Test with invalid inputs

## Error Patterns to Avoid

1. **Authentication Leakage**: Always use `Packages.openaf.AFCmdBase.afc.dIP()` for sensitive data
2. **Format Inconsistency**: Ensure conversation format normalization
3. **Missing Defaults**: Always provide sensible defaults for optional parameters
4. **Resource Leaks**: Properly close HTTP connections with `_h.close()`
5. **Tool Security**: Validate tool parameters before execution

## Example Minimal Implementation

```javascript
newprovider: {
    create: (aOptions) => {
        ow.loadObj()
        aOptions = _$(aOptions, "aOptions").isMap().$_()
        aOptions.key = _$(aOptions.key, "aOptions.key").isString().$_()
        aOptions.url = _$(aOptions.url, "aOptions.url").isString().$_()
        aOptions.model = _$(aOptions.model, "aOptions.model").isString().default("default-model")
        aOptions.timeout = _$(aOptions.timeout, "aOptions.timeout").isNumber().default(15 * 60000)
        
        var _r = {
            conversation: [],
            tools: {},
            
            getConversation: () => _r.conversation,
            setConversation: (aConversation) => {
                if (isArray(aConversation)) _r.conversation = aConversation
                return _r
            },
            
            prompt: (aPrompt, aModel, aTemperature, aJsonFlag, tools) => {
                var result = _r.rawPrompt(aPrompt, aModel, aTemperature, aJsonFlag, tools)
                // Extract text from provider-specific response format
                return result.message.content
            },
            
            rawPrompt: (aPrompt, aModel, aTemperature, aJsonFlag, aTools) => {
                // Implementation specific to provider API
                var body = {
                    model: aModel || aOptions.model,
                    messages: _r.conversation.concat([{role: "user", content: aPrompt}])
                }
                return _r._request("chat/completions", body)
            },
            
            _request: (aURI, aData, aVerb) => {
                // HTTP request implementation
            },
            
            // ... other required methods
        }
        return _r
    }
}
```

This guide should provide sufficient information for implementing new LLM service wrappers that integrate seamlessly with the OpenAF AI ecosystem.
