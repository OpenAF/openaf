# OpenAF & oJob Flags Reference

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

## OpenAF Core Integrity / Validation

| Env | Default | Purpose |
|-----|---------|---------|
| OAF_INTEGRITY | {} | Map of script integrity hashes |
| OAF_INTEGRITY_WARN | true | Warn vs abort on mismatch |
| OAF_INTEGRITY_STRICT | false | Require integrity entries |
| OAF_SIGNATURE_STRICT | false | Require signed scripts |
| OAF_SIGNATURE_KEY | (unset) | Public key for signature validation |
| OAF_VALIDATION_STRICT | false | Require integrity + signature both |

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
