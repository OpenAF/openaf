# $mcp

[Home](../index.md) / [All APIs](../all-apis.md) / [$mcp](index.md)

<a id="api-mcp-cancelrequest-dd70c550"></a>

## $mcp.cancelRequest

### $mcp.cancelRequest(id, reason) : Map

Sends best-effort notifications/cancelled. Does not roll back remote side effects. Low-level execOptions.onRequestId exposes outgoing ids.

Sources:

- js/openaf.js:11747

<a id="api-mcp-continuerequest-c2909a8b"></a>

## $mcp.continueRequest

### $mcp.continueRequest(method, originalParams, inputRequired) : Map

Explicitly continues one modern input_required round using registered handlers, keyed inputResponses and opaque requestState. Never called automatically.

Sources:

- js/openaf.js:11637

<a id="api-mcp-getagent-534579a8"></a>

## $mcp.getAgent

### $mcp.getAgent(agentId) : Map

Retrieves metadata for a specific A2A agent by ID.
Returns the agent's metadata map (id, name, title, version, tags, capabilities).
Throws an error if the agent is not found.
Must call initialize() first.

Example:

```javascript
var client = $mcp({cmd: "ojob a2a-server.yaml"});
client.initialize();
var agent = client.getAgent("weather-agent");
print(agent);
```

Sources:

- js/openaf.js:11843

<a id="api-mcp-getappresource-2bebde8d"></a>

## $mcp.getAppResource

### $mcp.getAppResource(name) : Map

Reads a tool's ui:// App resource, retaining the complete envelope. Never evaluates returned HTML or JavaScript.

Sources:

- js/openaf.js:11726

<a id="api-mcp-getcapabilities-81846c9e"></a>

## $mcp.getCapabilities

### $mcp.getCapabilities() : Map

Returns a copy of the negotiated server capabilities.

Sources:

- js/openaf.js:11519

<a id="api-mcp-gettoolui-798f8673"></a>

## $mcp.getToolUI

### $mcp.getToolUI(name) : Map

Returns a copy of a discovered tool's `_meta.ui` or undefined.

Sources:

- js/openaf.js:11714

<a id="api-mcp-hasapps-3e461f66"></a>

## $mcp.hasApps

### $mcp.hasApps() : Boolean

Reports whether discovered tools reference UI resources; does not imply a browser host or trusted content.

Sources:

- js/openaf.js:11737

<a id="api-mcp-listagents-caaee617"></a>

## $mcp.listAgents

### $mcp.listAgents() : Map

Lists all available A2A agents from the MCP server.
Returns a map with an 'agents' array containing agent metadata (id, name, title, version, tags, capabilities).
return _buildSyntheticInitializeResult(`aOptions.options`)

Example:

```javascript
var client = $mcp({cmd: "ojob a2a-server.yaml"});
client.initialize();
var agents = client.listAgents();
print(agents.agents);
```

Sources:

- js/openaf.js:11818

<a id="api-mcp-listresourcetemplates-c772bb20"></a>

## $mcp.listResourceTemplates

### $mcp.listResourceTemplates() : Map

Collects resourceTemplates pages. URI template expansion is the caller's responsibility.

Sources:

- js/openaf.js:11666

<a id="api-mcp-listresources-cc64d007"></a>

## $mcp.listResources

### $mcp.listResources() : Map

Collects resource pages with metadata. Requires advertised resources capability; unsuccessful responses remain intact.

Sources:

- js/openaf.js:11659

<a id="api-mcp-offnotification-09525da4"></a>

## $mcp.offNotification

### $mcp.offNotification(method) : Map

Removes the registered notification callback.

Sources:

- js/openaf.js:11576

<a id="api-mcp-offrequest-e18937bb"></a>

## $mcp.offRequest

### $mcp.offRequest(method) : Map

Removes the inbound handler and its optional capability from future requests.

Sources:

- js/openaf.js:11554

<a id="api-mcp-onelicitationrequest-3388ce92"></a>

## $mcp.onElicitationRequest

### $mcp.onElicitationRequest(handler, modes) : Map

Opts into elicitation; modes defaults to `{form:{}}`. URL mode requires version 2025-11-25 or later and explicit `{url:{}}` support.

Sources:

- js/openaf.js:11598

<a id="api-mcp-onnotification-643d4b60"></a>

## $mcp.onNotification

### $mcp.onNotification(method, handler) : Map

Registers one event callback `(params, message)` per method on a dedicated connection. Re-registration replaces it.

Sources:

- js/openaf.js:11566

<a id="api-mcp-onrequest-5efb34ff"></a>

## $mcp.onRequest

### $mcp.onRequest(method, handler) : Map

Registers a synchronous inbound handler `(params, request)` on a dedicated connection. Return the protocol result or throw `{code,message,data}`.

Sources:

- js/openaf.js:11544

<a id="api-mcp-onsamplingrequest-c3286a68"></a>

## $mcp.onSamplingRequest

### $mcp.onSamplingRequest(handler) : Map

Opts into basic sampling using a synchronous application handler. Register before legacy initialization. No automatic LLM calls; sampling tools are rejected.

Sources:

- js/openaf.js:11583

<a id="api-mcp-readresource-823b983c"></a>

## $mcp.readResource

### $mcp.readResource(uri) : Map

Reads an absolute resource URI through MCP, retaining all text/blob contents, MIME types, metadata and unknown fields. Does not dereference URLs locally.

Sources:

- js/openaf.js:11673

<a id="api-mcp-sendtoagent-0621e417"></a>

## $mcp.sendToAgent

### $mcp.sendToAgent(agentId, message, options) : Map

Sends a `message` to the specified A2A agent and returns the response.

- `agentId`: String identifier of the target agent
- `message`: String or Map containing the `message` content
- `options`: Optional map with request `options`

Returns MCP-style response: `{ content: [{type: "text", text: "..."}], isError: false }`

Supports preFn and posFn hooks if configured in the MCP client `options`.
Must call initialize() first.

Example:

```javascript
var client = $mcp({cmd: "ojob a2a-server.yaml"});
client.initialize();
var response = client.sendToAgent("echo-agent", "Hello World");
print(response.content[0].text);
```

Sources:

- js/openaf.js:11870

<a id="api-mcp-setroots-2294bc06"></a>

## $mcp.setRoots

### $mcp.setRoots(roots) : Map

Sets explicit absolute file URI roots and registers roots/list. An empty array shares no roots; no paths are discovered automatically.

Sources:

- js/openaf.js:11616

<a id="api-mcp-startlistening-4a06a3e8"></a>

## $mcp.startListening

### $mcp.startListening() : Map

Opens one opt-in legacy HTTP GET event stream on an initialized dedicated client. Does not reconnect automatically.

Sources:

- js/openaf.js:11526

<a id="api-mcp-stoplistening-da0b8206"></a>

## $mcp.stopListening

### $mcp.stopListening() : Map

Closes the optional HTTP event stream; returns the client.

Sources:

- js/openaf.js:11537

<a id="api-mcp-subscriberesource-cbbf5f92"></a>

## $mcp.subscribeResource

### $mcp.subscribeResource(uri, callback) : Map

Subscribes on a dedicated legacy transport with resources.subscribe. Callback receives `(params, message)`. HTTP requires GET SSE; modern subscriptions/listen is unsupported.

Sources:

- js/openaf.js:11680

<a id="api-mcp-togpttools-a770bc78"></a>

## $mcp.toGptTools

### $mcp.toGptTools(aGptInstance, aToolNames) : $mcp

Automatically adds this MCP client's tools to a `$gpt` instance using the `$gpt.withTool` method.
The `aGptInstance` should be an initialized `$gpt` object. If `aToolNames` is provided (array of strings),
only those specific tools will be added. Otherwise, all available tools are added.
Each MCP tool will be converted to a GPT-compatible tool using the MCP tool's JSON schema.

Example:

```javascript
var mcpClient = $mcp({cmd: "npx @modelcontextprotocol/server-filesystem /tmp"});
mcpClient.initialize();
var gpt = $gpt({type: "openai", options: {key: "your-key"}});
mcpClient.toGptTools(gpt); // Adds all MCP tools to GPT
// or mcpClient.toGptTools(gpt, ["read_file", "write_file"]); // Adds only specific tools

var response = gpt.prompt("Read the file /tmp/example.txt");
```

Sources:

- js/openaf.js:11921

<a id="api-mcp-unsubscriberesource-2c7cfa4c"></a>

## $mcp.unsubscribeResource

### $mcp.unsubscribeResource(uri) : Map

Unsubscribes and removes its callback after a successful response.

Sources:

- js/openaf.js:11700

