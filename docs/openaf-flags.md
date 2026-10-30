# OpenAF & oJob Flags Reference

[Index](./index.md) | [oJob Reference](./ojob.md) | [Security](./ojob-security.md) | [Flags](./openaf-flags.md) | [Recipes](./ojob-recipes.md) | [Advanced](./openaf-advanced.md)

Central list of noteworthy runtime flags and environment variables.

## oJob Runtime (__flags subset & env)

| Name | Default | Purpose |
|------|---------|---------|
| OJOB_SEQUENTIAL | true | Force sequential todo execution (unless explicit async) |
| OJOB_SHAREARGS | true | Share mutated args across sequential jobs |
| OJOB_INIT_ARRAY_ARGS_LIST | true | Wrap root array args into `{ _list: [...] }` |
| OJOB_CHECK_JOB_CHANGES | false | Warn when job with same name is changed |
| OJOB_CHECK_JOB_REMOVAL | false | Warn when jobs removed |
| OJOB_JSONLOG | (unset) | Force JSON logging format |
| OJOB_AUTHORIZEDDOMAINS | ojob.io | Allowlist for remote includes |
| OJOB_LOCALPATH | (unset) | Local path for ojob files resolution |

## JDBC URL execution permissions

Both `__flags` entries default to boolean `false`; only boolean `true` permits the
covered mechanisms. Set them before creating trusted connections.

| Flag | Default | Restriction and reason |
| --- | --- | --- |
| `DB_ALLOW_JDBC_URL_INIT` | false | Blocks covered URL initialization SQL and SQL script files, which can execute statements when a connection opens. |
| `DB_ALLOW_JDBC_URL_CUSTOM_CLASSES` | false | Blocks covered URL-selected Java classes and indirect configuration selectors, which can execute code with the OpenAF process's permissions. |

See [JDBC URL execution policy](./jdbc-url-policy.md) for driver-specific options,
examples, migration guidance and coverage boundaries. These permissions apply to
core DB connections and are independent.

## Alternative (native) implementations (`__flags.ALTERNATIVES`)

Each flag selects a native Java implementation over the bundled JavaScript one when `true`. Set to `false` to fall back.

| Flag | Default | Purpose |
|------|---------|---------|
| toTOON / fromTOON | true | Native Java TOON encoder/decoder (`af.toTOON`, `af.fromTOON`) |
| path | true | Native Java JMESPath engine behind `$path` (`af.pathJava`, see [path-java.md](./path-java.md)); `false` uses the bundled JavaScript `jmespath` |
| jsonParse, merge, extend, traverse, colorify, listFilesRecursive, restart | true | See `openaf.js` ODoc for each |

## AI/LLM Configuration

| Env | Default | Purpose |
|-----|---------|---------|
| OAF_MODEL | (unset) | Default LLM model configuration as JSLON |
| OPENAI_API_KEY | (unset) | OpenAI API key for LLM operations |
| ANTHROPIC_API_KEY | (unset) | Anthropic Claude API key |
| GEMINI_API_KEY | (unset) | Google Gemini API key |
| OLLAMA_HOST | http://localhost:11434 | Ollama server URL |

## OpenAF Core Integrity / Validation

| Env | Default | Purpose |
|-----|---------|---------|
| OAF_INTEGRITY | {} | Map of script integrity hashes |
| OAF_INTEGRITY_WARN | true | Warn vs abort on mismatch |
| OAF_INTEGRITY_STRICT | false | Require integrity entries |
| OAF_SIGNATURE_STRICT | false | Reject script loading because no script signature format is currently defined |
| OAF_SIGNATURE_KEY | (unset) | Reserved for a future documented script signature format |
| OAF_VALIDATION_STRICT | false | Reject script loading until combined integrity and signature validation is defined |

These script-policy flags apply to OpenAF's `load`, `require`, and compiled-library helpers. Low-level `af.eval`, `af.compile`, and `af.load` remain explicit trusted-code execution primitives.

## Server Management

| Env / Flag | Default | Purpose |
|------------|---------|---------|
| OAF_PIDFILE | (unset) | Override PID file path in ow.server.checkIn |
| HTTPD_PREFIX *(flag)* | `{}` | Runtime flag (set via `__flags.HTTPD_PREFIX` or `ojob.flags`). Map of port-to-path-prefix entries for the embedded HTTP server. Key `"0"` is the global default. E.g. `{ "0": "/app", "8080": "/api" }`. Must be set before calling `ow.server.httpd.start()`. |

## Template / Markdown

| Flag | Default | Purpose |
|------|---------|---------|
| MD_RENDER_SVG | false | When true, ` ```svg ` fenced blocks in markdown are extracted and injected as inline SVG in HTML output instead of being treated as code blocks |

## Misc Performance / Behavior

| Flag | Purpose |
|------|---------|
| OAF_PRECOMPILE_LEVEL | JS precompile aggressiveness (0..2) |
| PFOREACH.seq_thrs_ms | Millisecond threshold to switch to parallel foreach |
| PFOREACH.threads_thrs | Core multiple threshold |
| PRINT_BUFFER_STREAM | Buffered print size |
| HTTP_TIMEOUT / HTTP_CON_TIMEOUT | HTTP client defaults |
| HTTPD_THREADS | Auto/number for embedded HTTPD |

## Adjust via YAML

```yaml
ojob:
  flags:
    OJOB_CHECK_JOB_CHANGES: true
    HTTP_TIMEOUT: 45000
```

## Inspecting Flags

```javascript
print(stringify(__flags, void 0, '  '))
```

---
See also: `ojob-security.md`, main guides.
