# ow.server.mcp

[Home](../../../index.md) / [All APIs](../../../all-apis.md) / [ow](../../index.md) / [ow.server](../index.md) / [ow.server.mcp](index.md)

<a id="api-ow-server-mcp-createskillcatalog-c7bd6861"></a>

## ow.server.mcp.createSkillCatalog

### ow.server.mcp.createSkillCatalog(sources, baseDir) : Map

Builds a Skills over MCP catalog from directories, inline files or providers.
A provider supplies a catalog array or function and a read function taking
`{ skill, path, ref }`. Catalog files supply path, size and SHA-256 digest.
Read functions return UTF-8 text or `{ bytes, mimeType }`.

Sources:

- js/owrap.server.js:1932

<a id="api-ow-server-mcp-discoverresult-e78d43db"></a>

## ow.server.mcp.discoverResult

### ow.server.mcp.discoverResult(initData) : Map

Builds the mandatory server/discover response (modern era) advertising this server's supported protocol versions, capabilities and identity.

Sources:

- js/owrap.server.js:1879

<a id="api-ow-server-mcp-eraof-0403f521"></a>

## ow.server.mcp.eraOf

### ow.server.mcp.eraOf(reqObj) : String

Classifies a parsed JSON-RPC request as "modern" (carries a modern params.&#95;meta protocol version), "legacy-initialize" (an initialize handshake request) or "legacy-stateless" (any other request, handled statelessly per today's default behavior).

Sources:

- js/owrap.server.js:1807

<a id="api-ow-server-mcp-invalidparamserror-5d646fbc"></a>

## ow.server.mcp.invalidParamsError

### ow.server.mcp.invalidParamsError(anId, aMessage, aData) : Map

Builds a JSON-RPC Invalid Params (-32602) error response, used when a modern-era request is missing a required params.&#95;meta field (e.g. io.modelcontextprotocol/clientCapabilities).

Sources:

- js/owrap.server.js:1839

<a id="api-ow-server-mcp-ismodern-21ec9d17"></a>

## ow.server.mcp.isModern

### ow.server.mcp.isModern(aVersion) : boolean

Returns true if aVersion is a protocol version string on or after the modern (stateless, 2026-07-28+) era. Protocol version strings are YYYY-MM-DD so lexicographic comparison is a valid chronological ordering.

Sources:

- js/owrap.server.js:1756

<a id="api-ow-server-mcp-metaclientcapabilities-4b843ffe"></a>

## ow.server.mcp.metaClientCapabilities

### ow.server.mcp.metaClientCapabilities(reqObj) : Map

Extracts the per-request client capabilities from params.&#95;meta&#91;"io.modelcontextprotocol/clientCapabilities"&#93;, or &#95;&#95; if not present.

Sources:

- js/owrap.server.js:1793

<a id="api-ow-server-mcp-metaprotocolversion-061c895a"></a>

## ow.server.mcp.metaProtocolVersion

### ow.server.mcp.metaProtocolVersion(reqObj) : String

Extracts the modern per-request protocol version from a parsed JSON-RPC request's params.&#95;meta field (io.modelcontextprotocol/protocolVersion), or &#95;&#95; if not present.

Sources:

- js/owrap.server.js:1779

<a id="api-ow-server-mcp-requestmeta-6de509e9"></a>

## ow.server.mcp.requestMeta

### ow.server.mcp.requestMeta(reqObj) : Map

Returns the request's params.&#95;meta map (per the spec, &#95;meta is nested inside params, not a top-level JSON-RPC envelope field), or &#95;&#95; if not present.

Sources:

- js/owrap.server.js:1767

<a id="api-ow-server-mcp-unsupportedversionerror-2edc1a52"></a>

## ow.server.mcp.unsupportedVersionError

### ow.server.mcp.unsupportedVersionError(anId, aRequestedVersion) : Map

Builds a JSON-RPC UnsupportedProtocolVersionError (-32022) response listing the versions this server supports.

Sources:

- js/owrap.server.js:1821

<a id="api-ow-server-mcp-wrapresult-a07ccfbf"></a>

## ow.server.mcp.wrapResult

### ow.server.mcp.wrapResult(aBody, anEra, opts) : Map

Wraps a MCP result body per the negotiated era. Legacy eras ("legacy-initialize"/"legacy-stateless") return aBody unchanged -- zero behavior change for existing callers. The "modern" era merges in the required resultType ("complete"), and, when opts.isList is true, CacheableResult fields (ttlMs, cacheScope) with sensible defaults (opts.ttlMs default 0, opts.cacheScope default "private"). When opts.serverInfo is given, it is advertised (SHOULD, per spec) as result.&#95;meta&#91;"io.modelcontextprotocol/serverInfo"&#93;.

Sources:

- js/owrap.server.js:1852

