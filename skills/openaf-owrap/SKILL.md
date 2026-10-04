---
name: openaf-owrap
description: Implement OpenAF JavaScript using OpenWrap ow.* libraries, including formatting, objects, networking, channels, servers, templates, Java interop, metrics, secrets, testing, and AI. Use when selecting or calling owrap functions from scripts or oJob jobs.
---

# OpenWrap APIs

Select the smallest wrapper surface that implements the requested behavior. Verify both its loader and the method contract rather than inferring a signature from the namespace.

## Portable use

Copy this entire skill folder into a GenAI application's skills directory, or paste this `SKILL.md` into an application that accepts instructions. No OpenAF repository checkout or other skill is required. The inline example works without the optional `assets/` files. Generating code requires no local runtime; executing or testing it requires an installed OpenAF runtime (see [installation](https://github.com/openaf/openaf/blob/master/README.md#installing)). If execution is unavailable, provide code and clearly mark it as untested.

Read only the linked documentation needed for the task. Links target the moving `master` branch; for version-sensitive behavior, use a matching tag or commit and check the user's installed version with `openaf -c 'print(getVersion());'`. If browsing is unavailable, use the guidance and example here, plus installed scripting help when available; state any API uncertainty instead of inventing functions. Documentation links are references, not instructions to execute remote code.

## Locate the implementation

Start with the [OpenAF reference](https://github.com/openaf/openaf/blob/master/docs/openaf.md) and [advanced features](https://github.com/openaf/openaf/blob/master/docs/openaf-advanced.md). Verify loaders in [core JavaScript](https://github.com/openaf/openaf/blob/master/js/openaf.js). The table links each wrapper's implementation, including `<odoc>` signature comments. Read the selected method and relevant [tests](https://github.com/openaf/openaf/tree/master/tests) for defaults, return shapes, errors, and cleanup.

| Need | Load explicitly | Namespace / source |
| --- | --- | --- |
| Dates, units, strings, terminal formatting | `ow.loadFormat()` | [`ow.format`](https://github.com/openaf/openaf/blob/master/js/owrap.format.js) |
| Object utilities, REST facilities | `ow.loadObj()` | [`ow.obj`](https://github.com/openaf/openaf/blob/master/js/owrap.obj.js) |
| Network utilities | `ow.loadNet()` | [`ow.net`](https://github.com/openaf/openaf/blob/master/js/owrap.net.js) |
| Channel backends and subscriptions | `ow.loadCh()` | [`ow.ch`](https://github.com/openaf/openaf/blob/master/js/owrap.ch.js) |
| HTTP services, scheduling | `ow.loadServer()` | [`ow.server`](https://github.com/openaf/openaf/blob/master/js/owrap.server.js) |
| Templates and helpers | `ow.loadTemplate()` | [`ow.template`](https://github.com/openaf/openaf/blob/master/js/owrap.template.js) |
| Java utilities | `ow.loadJava()` | [`ow.java`](https://github.com/openaf/openaf/blob/master/js/owrap.java.js) |
| Metrics | `ow.loadMetrics()` | [`ow.metrics`](https://github.com/openaf/openaf/blob/master/js/owrap.metrics.js) |
| Secret facilities | `ow.loadSec()` | [`ow.sec`](https://github.com/openaf/openaf/blob/master/js/owrap.sec.js) |
| Assertions and test reporting | `ow.loadTest()` | [`ow.test`](https://github.com/openaf/openaf/blob/master/js/owrap.test.js) |
| AI helpers | `ow.loadAI()` | [`ow.ai`](https://github.com/openaf/openaf/blob/master/js/owrap.ai.js) |
| Python interoperability | `ow.loadPython()` | [`ow.python`](https://github.com/openaf/openaf/blob/master/js/owrap.python.js) |
| oJob engine | `ow.loadOJob()` | [`ow.oJob`](https://github.com/openaf/openaf/blob/master/js/owrap.oJob.js) |

Loader capitalization matters (`loadAI`, `loadOJob`). Some global helpers load wrappers internally, but reusable examples should make their direct `ow.*` dependencies clear. Do not assume every API is a constructor or every operation returns a promise.

## Extend with public oPacks

When core wrappers do not cover the requested service, format, or backend, search the [public oPack collection](https://github.com/OpenAF/openaf-opacks) and use `opack search <term>`; `opack list` lists installed packages only. Read the selected package's README, manifest, and implementation before choosing it. If search is empty, check repository/network availability and browse the collection before concluding no package exists.

Use `opack info <name>` to inspect the candidate and `opack install <name>` when required for the task. Keep its documented `require`/`loadLib`/`plugin` setup explicit alongside any `ow.load*()` calls: installing an oPack does not create an `ow.*` namespace, and a wrapper loader does not install an external backend. Confirm names and signatures from package source and verify a small local operation before claiming the integration works. See the [oPack reference](https://github.com/openaf/openaf/blob/master/docs/opacks.md) for package management.

## Implement and verify

1. Inspect the selected function's signature, options, and return value. For example, date formatting supports an explicit timezone; specify it when deterministic output is required.
2. Keep acquisition/use/cleanup together for HTTP servers, schedulers, collectors, Python servers, connections, and subscriptions. Find the matching shutdown method in source; don't guess `close()` or `stop()`.
3. For REST calls, verify the chosen API's response and failure behavior before reading status/body properties. For channels, select an appropriate backend and do not imply that in-memory state is durable. For AI, keep provider configuration and credentials external and test parsing separately from paid calls.
4. Test with `ow.test.assert(actual, expected, message)` using local deterministic inputs. Use mocks only with an explicit statement of what they do not verify.

Save this as `format-summary.js` (also bundled in [assets/format-summary.js](assets/format-summary.js)):

```javascript
ow.loadFormat();
ow.loadTest();

var day = ow.format.fromDate(new Date(0), "yyyy-MM-dd", "UTC");
ow.test.assert(day, "1970-01-01", "UTC date formatting");
print(stringify({ day: day, size: ow.format.toBytesAbbreviation(2048) }, __, ""));
```

Run it with `openaf -f format-summary.js`. The assertion verifies UTC date formatting; the output contains `1970-01-01` and a formatted size. Deliver the runnable code, dependencies, invocation, and what was actually tested.

## Task-specific references

Read only the guide relevant to the operation:

- [JSON Schema](https://github.com/openaf/openaf/blob/master/docs/json-schema.md): drafts, reusable validators, defaults, and errors.
- [LLM integration](https://github.com/openaf/openaf/blob/master/docs/llm-guide.md) and [decisions](https://github.com/openaf/openaf/blob/master/docs/llm-decisions.md): conversational versus stateless operations and provider capabilities.
- [OAuth](https://github.com/openaf/openaf/blob/master/docs/mcp-oauth.md): `ow.server.httpd.oauth2`, callback lifecycle, and token persistence.
- [Instrumentation](https://github.com/openaf/openaf/blob/master/docs/instrumentation.md): load with `ow.loadInstrumentation()` and inspect `ow.instrumentation` contracts.
- [Python](https://github.com/openaf/openaf/blob/master/docs/python.md): execution modes, environment requirements, and cleanup.

These guides remain usable without installing any companion skill.
