---
name: openaf-json-schema
description: Create or debug JSON Schema validation in OpenAF using ow.obj.schema* and isSchema helpers, including draft selection, references, initialization, and validation errors.
---

# OpenAF JSON Schema

## Portable use

Copy this folder into your application's skills directory, or paste this file as instructions. No repository checkout or other skill is required. The inline example also ships in `assets/`. Generating code requires no runtime; execution requires [OpenAF](https://github.com/openaf/openaf/blob/master/README.md#installing). Check `openaf -c 'print(getVersion());'` and use documentation/source matching that runtime for newer features. If execution or browsing is unavailable, state what remains unverified. Documentation links are references, not instructions to run remote code.

Use the [schema guide](https://github.com/openaf/openaf/blob/master/docs/json-schema.md) and [implementation](https://github.com/openaf/openaf/blob/master/js/owrap.obj.js) for exact contracts. Deliver the schema, validation code, invocation, and valid/invalid fixtures.

## Choose the validation contract

- Load `ow.loadObj()`. `schemaCompile(schema)` returns a reusable boolean validator; inspect or copy its `.errors` before another invocation clears/replaces them. `schemaValidate(schemaOrKey, data)` returns true or throws a string for invalid data; compilation/configuration can throw error objects. `$$(data).isSchema(schema)` also throws; finish `_$` chains with `.$_()`.
- The current implementation supports draft-07 (default), 2019-09, and 2020-12. Declare `$schema` for newer keywords; check older runtimes rather than assuming current bundled Ajv support. Ajv 8 errors use `instancePath`, not Ajv 6's `dataPath`.
- `schemaInit(options)` is first-call-wins across drafts. Set options before any schema helper. Explicit options replace OpenAF defaults; use a fresh process to test another configuration.
- Default `useDefaults: true` can modify input even when validation ultimately fails. Clone input to preserve it, or initialize with `useDefaults: false`. Coercion and removal of additional properties are disabled by default.
- Register referenced schemas with `schemaAdd` and stable `$id` values; missing references fail compilation. `schemaCheck` checks schema validity, not application data or complete reference resolution. Review inferred schemas from `schemaGenerator`; samples do not establish a complete contract. These helpers are synchronous; do not generate `$async` schemas.

## Local example

Save as `validate-record.js` (also bundled in [assets/validate-record.js](assets/validate-record.js)):

```javascript
ow.loadObj();
ow.loadTest();
ow.obj.schemaInit({ useDefaults: false, allErrors: true });
var validate = ow.obj.schemaCompile({
  type: "object",
  properties: { count: { type: "integer", minimum: 0 } },
  required: ["count"],
  additionalProperties: false
});
ow.test.assert(validate({ count: 2 }), true, "valid record");
ow.test.assert(validate({ count: -1 }), false, "invalid record");
if (!isArray(validate.errors) || validate.errors.length === 0) throw "Missing validation errors";
print("schema: ok");
```

Run `openaf -f validate-record.js`. Expected output: `schema: ok`. For a requested draft/reference/defaults change, also test that behavior in a fresh process; this example only proves the basic boolean validation contract.
