# ow.server.a2a.prototype

[Home](../../../../index.md) / [All APIs](../../../../all-apis.md) / [ow](../../../index.md) / [ow.server](../../index.md) / [ow.server.a2a](../index.md) / [ow.server.a2a.prototype](index.md)

<a id="api-ow-server-a2a-prototype-getagent-1e36a158"></a>

## ow.server.a2a.prototype.getAgent

### ow.server.a2a.prototype.getAgent(aId) : Map

Returns the metadata for a specific agent by ID.

Throws an error if the agent is not found.

Sources:

- js/owrap.server.js:2222

<a id="api-ow-server-a2a-prototype-listagents-cf633105"></a>

## ow.server.a2a.prototype.listAgents

### ow.server.a2a.prototype.listAgents(aFilterFn) : Map

Returns a map with an 'agents' array containing metadata for all registered agents.

Optionally filter agents using aFilterFn(agentMeta) which should return true to include the agent.

Sources:

- js/owrap.server.js:2205

<a id="api-ow-server-a2a-prototype-registeragent-6cc62f46"></a>

## ow.server.a2a.prototype.registerAgent

### ow.server.a2a.prototype.registerAgent(aMeta, aHandler, aAuthFn, aOptions)

Registers an agent with the A2A registry.

`aMeta` should be a map with:

- `id` (string, required) : Unique agent identifier
- `name` (string) : Display name (defaults to id)
- `title` (string) : Human-readable title (defaults to id)
- `version` (string) : Version string (defaults to "1.0.0")
- `tags` (array) : Array of categorization tags
- `capabilities` (map) : Map of agent capabilities

`aHandler` is a function(message, options, context) that processes messages and returns:

```javascript
{ content: [{ type: "text", text: "..." }], isError: false }
```

`aAuthFn` is an optional function(context) that returns true/false for authorization.

`aOptions` is an optional map with:

- `sizeLimit` (number) : Maximum message size in bytes
- `timeout` (number) : Handler timeout in milliseconds
- `rateLimit` (number) : Requests per minute limit

Sources:

- js/owrap.server.js:2130

<a id="api-ow-server-a2a-prototype-send-7dff6c27"></a>

## ow.server.a2a.prototype.send

### ow.server.a2a.prototype.send(aId, aMessage, aOptions, aAuthContext) : Map

Sends a message to the specified agent and returns the response.

- `aId`: Agent identifier
- `aMessage`: String or Map with message content
- `aOptions`: Optional map with request options
- `aAuthContext`: Optional authentication/session context

Returns MCP-style response: `{ content: [{ type: "text", text: "..." }], isError: false }`

Sources:

- js/owrap.server.js:2239

<a id="api-ow-server-a2a-prototype-unregisteragent-36256e3f"></a>

## ow.server.a2a.prototype.unregisterAgent

### ow.server.a2a.prototype.unregisterAgent(aId)

Removes an agent from the registry by ID.

Sources:

- js/owrap.server.js:2193

