# oJob Security & Integrity

[Index](./index.md) | [oJob Reference](./ojob.md) | [Security](./ojob-security.md) | [Flags](./openaf-flags.md) | [Recipes](./ojob-recipes.md) | [Advanced](./openaf-advanced.md)

This document details security-focused capabilities in oJob supplementing `ojob.md`.

## Authorized Domains for Remote Includes

Remote includes (e.g. `ojob.io/path/to/job`) are only permitted when host matches the allowlist:

Resolution order:
1. Environment variable `OJOB_AUTHORIZEDDOMAINS`, when defined and not the literal `null` (comma separated; do not add spaces)
2. Existing `ow.oJob.authorizedDomains`
3. Default constant `OJOB_AUTHORIZEDDOMAINS` (defaults to `["ojob.io"]`)

The definition download helpers check the exact hostname before fetching. For an unauthorized host they return an `Unauthorized URL` placeholder definition; do not rely on this path to throw an exception or provide a nonzero exit status. Loader inspection still processes trusted libraries and includes; it is not a sandbox.

## Integrity Verification

Ensure included job files / URLs are unchanged:

```yaml
ojob:
  integrity:
    list:
    - /absolute/path/ext.yaml: sha256:REPLACE_WITH_ACTUAL_DIGEST
    strict: true
    warn: false
```

Replace the illustrative digest before running. Match the resolved resource name: local lookups use canonical paths, and extensionless remote oJob paths normally resolve to `.json` URLs. Integrity verification is entered when the registry contains at least one hash. `warn: true` allows a known mismatch to continue, including with `strict: true`; use `warn: false` to reject mismatches. `strict: true` additionally rejects checked resources with no matching registered hash. A definition's own integrity configuration applies to subsequent loads; to verify the entry definition itself, configure the registry before loading it.

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
    logErr("Global error: " + exception); // vars: exception, job, args, id
  depsOnFail: |
    logWarn("Dependency failed for " + job.name)
```

A `catch` handler must return `true` to mark an exception handled; `false`, no return, or a throw leaves it unhandled. A job-level `catch` overrides the global handler. Dependency `onFail` / `depsOnFail` handlers use `true` to allow the dependent job to proceed despite the failed prerequisite. These handlers do not enqueue missing dependencies.

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

State is stored in `cronCheck.ch` as `{ name, last, status, retries }`. The default channel is in memory; retaining state across restarts requires a persistent channel. The counter includes the initial attempt: `retries: 3` permits up to three attempts when `retryWait` is supplied. Register the periodic job in `todo` and use `ojob.daemon: true` to keep it running.

## Environment Variables -> args

If `ojob.argsFromEnvs: true`, environment variables are merged into args with their original names (`MY_VAR` -> `args.MY_VAR`). Explicit arguments override environment values with the same key. Values still need conversion/validation with `check.in`. Combine with container orchestration for easy configuration injection.

## Structured JSON Logging

Set `OJOB_JSONLOG=true` or:
```yaml
ojob:
  log:
    format: json
```
for machine-parsable event logs.

## Encrypted Definitions

The loader recognizes `.yaml.enc`, `.yml.enc`, `.json.enc`, and `.js.enc` definitions, locally or on authorized remote hosts. It decrypts their bytes using OpenAF's `dbIP` support before parsing. The `.js.enc` suffix follows the JSON-definition path; it does not mean a JavaScript job body.

The CLI blocks `-compile`, `-tojson`, `-jobs`, `-todo`, and `-deps` for an encrypted entry definition or detected encrypted `include`/`jobsInclude`. These are specific inspection restrictions, not a claim that all help or loading operations are blocked. Encryption and integrity/signature verification are separate mechanisms.

## Combined Integrity / Signature (OpenAF)

OpenAF core can also enforce script integrity & signatures (`OAF_INTEGRITY`, `OAF_SIGNATURE_*`). Use together for full chain trust: platform JS + oJob YAML includes.

---
See also: `openaf-flags.md`, main `ojob.md`.
