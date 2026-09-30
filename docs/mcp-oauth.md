# Persistent delegated OAuth for `$mcp`

Existing authentication remains unchanged unless the new options are enabled.
Bearer and client-credentials authentication remain supported. A delegated client
can now receive a browser callback and retain credentials in an encrypted SBucket:

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

## Protected storage

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

Run `ojob autoTestAll.MCPOAuth.yaml` from `tests/` with the rebuilt runtime, and run
the existing MCP and Sec suites. The new suite uses temporary SBucket files and
loopback OAuth fixtures, including cross-process token renewal. It does not prove
a particular identity provider's app registration or consent policy.
