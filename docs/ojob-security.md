# oJob Security & Integrity

[Index](./index.md) | [oJob Reference](./ojob.md) | [Security](./ojob-security.md) | [Flags](./openaf-flags.md) | [Recipes](./ojob-recipes.md) | [Advanced](./openaf-advanced.md)

This document details security-focused capabilities in oJob supplementing `ojob.md`.

## Authorized Domains for Remote Includes

Remote includes (e.g. `ojob.io/path/to/job`) are only permitted when host matches the allowlist:

Order of resolution (first non-empty wins):
1. Environment variable `OJOB_AUTHORIZEDDOMAINS` (comma separated)
2. Existing `ow.oJob.authorizedDomains`
3. Default constant `OJOB_AUTHORIZEDDOMAINS` (defaults to `["ojob.io"]`)

Unauthorized domains cause an immediate load error before fetching.

## Integrity Verification

Ensure included job files / URLs are unchanged:

```yaml
ojob:
  integrity:
    list:
    - ext.yaml: sha256:abcdef012345...
    - https://host/job: md5:1234abcd...
    strict: false   # abort on mismatch / missing if true
    warn: true      # log warning on mismatch (ignored if strict)
```

Supported algorithms: sha512, sha384, sha256, sha1, md5, md2 (syntax `alg:hash` or `alg-hash`).

## Job Definition Change & Removal Auditing

Environment flags:
- `OJOB_CHECK_JOB_CHANGES=true` – warns when a job name already loaded is redefined.
- `OJOB_CHECK_JOB_REMOVAL=true` – warns when job definitions are removed.

Useful for detecting tampering or unexpected dynamic modifications.

## Global Catch & Dependency Failure Handlers

```yaml
ojob:
  catch: |
    logErr("Global error: " + exception)   # vars: exception, job, args, id
  depsOnFail: |
    logWarn("Dependency failed for " + job.name)
```

Return `false` (or throw) in these blocks to propagate failures.

## Unique Execution (Singleton)

```yaml
ojob:
  unique:
    pidFile: mytask.pid
    killPrevious: false
```

Interpreted runtime args when unique mode active: `stop`, `restart`, `forcestop`, `status` (provided via `args.`). Prevents concurrent duplicate runs.

## Channel Exposure Security

```yaml
ojob:
  channels:
    expose      : true
    port        : 8080
    host        : 0.0.0.0
    keyStorePath: keystore.jks   # optional TLS
    keyPassword : changeme
    auth        :
    - login      : user1
      pass       : pass1
      permissions: rw
    permissions : r                # default permission
    audit       : "AUDIT | User: {{request.user}} | Channel: {{name}} | Operation: {{op}} | Key: {{{key}}}"
```

`audit: true` uses the default template. Providing a string overrides it.

## cronCheck Reliability & Retries

```yaml
jobs:
- name    : Reliable
  type    : periodic
  typeArgs:
    cron     : "*/30 * * * * *"
    cronCheck:
      active   : true
      ch       : oJob::cron
      retries  : 3
      retryWait: 2000
      cron     : "*/30 * * * * *"
  exec    : |
    if (Math.random() < 0.3) throw "transient failure";
```

State is persisted in `cronCheck.ch` as `{ name, last, status, retries }` enabling gap detection & retry logic.

## Environment Variables -> args

If `ojob.argsFromEnvs: true`, each environment variable becomes an arg (`MY_VAR` -> `args.my_var`). Combine with container orchestration for easy configuration injection.

## Structured JSON Logging

Set `OJOB_JSONLOG=true` or:
```yaml
ojob:
  log:
    format: json
```
for machine-parsable event logs.

## Combined Integrity / Signature (OpenAF)

OpenAF core can also enforce script integrity & signatures (`OAF_INTEGRITY`, `OAF_SIGNATURE_*`). Use together for full chain trust: platform JS + oJob YAML includes.

---
See also: `openaf-flags.md`, main `ojob.md`.
