# Localhost OAuth2 authentication

`ow.server.httpd.oauth2(options)` provides a reusable browser login for OAuth2
providers that support authorization-code flow with S256 PKCE and an HTTP loopback
redirect. It uses OpenAF's HTTPd server to receive the callback and `$sec` to
retain encrypted credentials. Call `ow.loadServer()` before creating the client.

```javascript
ow.loadServer();
var oauth = ow.server.httpd.oauth2({
  authURL: "https://identity.example.org/authorize",
  tokenURL: "https://identity.example.org/token",
  clientId: "registered-client-id",
  redirectURI: "http://127.0.0.1:17879/callback",
  scope: "read offline_access",
  tokenStore: { type: "sec", profile: "alice" }
});
try {
  var tokens = oauth.authenticate();
  // Use tokens.access_token with the provider's API; do not print credentials.
  print(stringify(oauth.getAuthStatus())); // Non-secret status only.
} finally {
  oauth.cancel(); // Releases a pending callback listener; retains stored tokens.
}
```

Register the exact callback URI with your provider. The URI must use `http` with
`127.0.0.1`, `localhost` or `::1`, an explicit port and no userinfo, query or
fragment. For IPv6 use, for example, `http://[::1]:17879/callback`. The listener
binds only to loopback; `localhost` binds to `127.0.0.1`. An occupied callback port
fails explicitly without reusing or stopping another server. The provider's
registered client must allow PKCE; confidential clients may supply `clientSecret`.
Client registration and authorization/token endpoints are supplied by the caller.

`authenticate()` reuses valid credentials, refreshes expiring access tokens, or
opens the authorization URL and waits for the callback. Every login generates
fresh state and PKCE material. Invalid state, methods, paths and malformed or
repeated callback parameters are rejected without accepting the login. Only one
callback is accepted, including concurrent delivery. Successful callbacks, denial,
timeout, cancellation and exceptions all release the listener. Browser responses
contain no tokens and use `Cache-Control: no-store`.

The controller provides four methods:

| Method | Result |
| --- | --- |
| `authenticate()` | OAuth token response from a new exchange; cached responses contain `access_token`, `token_type`, optional `refresh_token`, and remaining `expires_in` when known. |
| `getAuthStatus()` | `{authenticated, expiresAt, refreshable, persistent}`; never starts login or refresh. |
| `clearAuth()` | Removes the selected stored entry and in-memory credentials; returns non-secret status. Does not revoke provider consent. |
| `cancel()` | Cancels a pending callback login and closes its listener. Repeated calls are harmless; completed credentials are retained. |

Useful options:

| Option | Behavior/default |
| --- | --- |
| `scope`, `resource`, `audience` | Optional parameters sent to both authorization and token endpoints. |
| `clientSecret` | Optional secret sent to the token endpoint; never persisted. |
| `extraAuthParams`, `extraParams` | Additional authorization/token parameters; protocol-controlled fields cannot be overridden. |
| `interactive` | Defaults to `true`; `false` permits cached tokens and refresh only. |
| `disableOpenBrowser` | Defaults to `false`; set `true` for manual browser handling. |
| `onAuthorizationURL(url)` | Called when the listener is ready; can display the URL or hand it to a browser. |
| `loginTimeoutMs` | Callback wait, default `300000`; must be positive. |
| `tokenTimeoutMs` | Token HTTP timeout, default `60000`; must be positive. |
| `refreshWindowMs` | Refresh window before expiry, default `30000`; must be non-negative. |
| `tokenType` | Optional override for the cached token scheme. |
| `tokenStore` | Defaults to `$sec` storage in repository `oauth2`, bucket/profile `default`; `false` selects in-memory operation. |

Standalone store descriptors accept the same `$sec` and synchronous custom-store
options described below. The standalone default file is
`~/.openaf-sec-oauth2.yml` (under `OAF_HOME` when configured). The parent directory
must exist. Tokens, token type, expiry and configuration identity are persisted;
client secrets, authorization codes, callback state and PKCE verifiers are not.
A hashed key separates endpoints, client IDs, scopes, resource/audience, redirect
URI, profiles and additional parameters. Use distinct profiles for accounts.

Transactions cover load, exchange, save and clear with the existing process/file
locking adapter. Rotated refresh tokens replace the previous value; omission
preserves it. A transient provider failure retains credentials. A rejected refresh
(`invalid_grant`) clears them and attempts one fresh login, subject to `interactive`.
`interaction_required` clears credentials and reports login required. Storage
failures stop authentication with sanitized errors; a failed save requires
`clearAuth()` or a new controller before retrying. OAuth token errors can carry a
sanitized `oauthError` identifier without exposing the provider response.

Unknown expiry is stored as `null`. The issuing controller may reuse that token;
a new controller refreshes or authenticates again. Cached responses omit provider
fields that are not in the stored credential record. `cancel()` controls callback
login; token HTTP requests are bounded by `tokenTimeoutMs`.

## Persistent delegated OAuth for `$mcp`

`$mcp` uses the same helper for `auth.callback: true`. Persistence remains opt-in
through `auth.tokenStore`, with the existing repository `mcp-oauth2` and credential
identity unchanged.

Bearer and client-credentials authentication remain supported. A delegated client
can receive a browser callback and retain credentials in an encrypted SBucket:

```javascript
var client = $mcp({
  type: "remote",
  url: "https://example.org/mcp",
  auth: {
    type: "oauth2",
    grantType: "authorization_code",
    clientId: "registered-client-id",
    authURL: "https://identity.example.org/authorize",
    tokenURL: "https://identity.example.org/token",
    redirectURI: "http://127.0.0.1:17879/callback",
    scope: "read offline_access",
    callback: true,
    interactive: true,
    tokenStore: { type: "sec", profile: "alice" }
  }
});
try {
  client.authenticate(); // non-secret status only; no MCP initialization required
  client.initialize();
  // client.listTools(), client.callTool(...)
} finally { client.destroy(); }
```

Register the exact callback with the identity provider. `callback: true` starts an
exclusive loopback HTTP listener, uses S256 PKCE and validates state. The listener
is closed after completion, denial, timeout or destruction. `loginTimeoutMs`
defaults to 300000; `disableOpenBrowser: true` prevents automatic browser opening.
`onAuthorizationURL(url)` can display the login URL outside protocol STDOUT.
Without `callback: true`, existing pasted-code behavior remains available.

For normal unattended use, set `interactive: false`. Valid cached access tokens
are reused and refresh tokens renewed without a browser. Missing or revoked
credentials fail with a login-required error; no tool call is automatically
replayed by these authentication additions. `sendResource: false` omits the OAuth
`resource` parameter for scope-based providers. `tokenTimeoutMs` defaults to 60000.

## Protected storage options

`auth.tokenStore: { type: "sec" }` enables the built-in adapter. Its defaults are
repository `mcp-oauth2`, bucket `default`, profile `default`, and a 60000 ms lock
wait. Optional `repo`, `bucket`, `file`, `lockSecret` and `mainSecret` map to `$sec`;
`lockTimeoutMs` changes the lock wait. The parent directory must exist. Repository
names accept letters, digits, hyphens and underscores, excluding `system`.

Choose a distinct `profile` for each account. The default hashed entry name binds
the MCP URL, resolved token endpoint, authorization issuer/endpoint when known,
client, resource/audience, grant, normalized scopes, redirect URI, token scheme,
profile, and digests of extra parameters. It does not infer the user's identity
from token claims. Different configurations get separate entries. With persistence
enabled, `extraParams` cannot override protocol-controlled grant, credential,
resource, scope, audience or redirect fields; configure their ordinary auth options.

Existing explicit `tokenStore: { repo, bucket, key, ... }` configurations remain
supported. `key` selects an exact entry instead of the generated name; a changed
configuration at that key fails explicitly until `clearAuth()` is called. Records
from the earlier fingerprint format also require clearing and signing in again.
This keeps WorkIQ's explicit profile keys usable without silently migrating tokens
whose full identity was not recorded.

The versioned encrypted record contains the access token, refresh token, scheme,
absolute expiry and identity fingerprint. It excludes client secrets, authorization
codes and PKCE verifiers. Unknown expiry is stored as `null`: the issuing instance
may keep using that token, but another instance must refresh or authenticate again.

A repository-wide process-local mutex and NIO file lock cover load, exchange,
save and clear. Each transaction reads the latest record. Interactive login also
holds the lock; competing callers may time out. Locks coordinate cooperating
adapters on local filesystems. Avoid direct `$sec` writes to the active repository
and do not assume shared/network filesystem locking or crash-safe transactions.
A process failure after provider rotation but before saving may require signing in
again. Rotated refresh tokens replace old ones; omitted refresh tokens retain the
previous value. `destroy()` preserves stored tokens.

New secret/key files have owner-only permissions on POSIX. The default main key
remains in `~/.openaf-sec`; access to that key can unlock the repository. Default-key
initialization is coordinated across adapters. Supply protected external secrets
where your deployment requires them. Do not log credentials or put them in source.

Storage/decryption/locking failures stop authentication with sanitized errors.
After a failed save, that client refuses further authentication until `clearAuth()`
succeeds or the client is recreated. Transient token errors preserve credentials.
A refresh `invalid_grant` removes rejected credentials and immediately attempts the
configured grant once, honoring `interactive`, callback and prompt options. It
never reuses a consumed authorization code. `interaction_required` clears the record
and reports that login is required. Authentication recovery does not replay MCP calls.

`getAuthStatus()` reads non-secret status without refreshing or signing in (endpoint
discovery may occur). `authenticate()` ensures authentication according to the
configured policy. `clearAuth()` removes the selected local record and in-memory
credentials; it does not revoke provider consent. A missing entry is harmless.

### Custom token stores

Instead of the `sec` descriptor, provide a synchronous object:

```javascript
tokenStore: {
  profile: "alice",
  load: function(key) { /* Return a record, or undefined when absent. */ },
  save: function(key, record) { /* Persist the record before returning. */ },
  clear: function(key) { /* Remove this entry. */ },
  withLock: function(key, fn) {
    // Acquire your backend's lock, invoke fn() once, release in finally.
    // Return fn()'s result and propagate its exception.
  }
}
```

`load`, `save` and `clear` execute inside `withLock`. The adapter must coordinate all
users of its backend and protect stored secrets. Treat records as opaque versioned
objects and return detached values. The synchronous callback must finish before
`withLock` returns. No `$sec` repository is opened for a custom store.

## Forwarding MCP responses

`ow.server.mcpStdio(..., { rawToolResults: true })` preserves tool results that
already have a `content` array, including `structuredContent` and `isError`.
The default remains text serialization. This opt-in supports MCP bridges such as
Mini-A WorkIQ without changing existing tool output contracts.

## Tests

From `tests/`, run `ojob autoTestAll.ServerOAuth.yaml` and
`ojob autoTestAll.MCPOAuth.yaml` with the rebuilt runtime, then the MCP, Server and
Sec suites. The Server suite includes standalone OAuth tests, and the MCP suite
includes callback login followed by initialization and an authenticated tool call. The new suite uses temporary SBucket files and
loopback OAuth fixtures, including cross-process token renewal. It does not prove
a particular identity provider's app registration or consent policy.

## List results

`listTools()` and `listPrompts()` use the same authenticated request path for every page. They preserve the first page's result metadata, including `resultType`, `_meta`, and extension fields, while combining the item arrays. Successful tool lists still apply the configured blacklist. Legacy responses do not acquire modern metadata.

A single page retains its cache metadata. For multiple pages, `ttlMs` is bounded by the earliest remaining page lifetime; a missing or invalid lifetime prevents caching. Different cache scopes produce a private, non-cacheable aggregate (`ttlMs: 0`). After the existing 1,000-page limit, `nextCursor` remains available to indicate that enumeration is incomplete; it is removed only when enumeration finishes.

An error, `input_required`, or malformed list response is returned unchanged, including when it follows successful pages. Callers must inspect the response before treating it as a list; these responses are not converted to empty or partial success.
