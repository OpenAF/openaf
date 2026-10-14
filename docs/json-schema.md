# JSON Schema validation

OpenAF bundles Ajv 8.20.0 and ajv-formats 3.0.1. The `ow.obj.schema*` helpers support JSON Schema draft-07, draft-2019-09, and draft-2020-12. No additional oPack or npm installation is needed at runtime.

## Validate data

```javascript
ow.loadObj();

var schema = {
  type: "object",
  properties: {
    name: { type: "string", minLength: 1 },
    age: { type: "integer", minimum: 0 },
    email: { type: "string", format: "email" }
  },
  required: ["name", "age"],
  additionalProperties: false
};
var user = { name: "Alice", age: 30, email: "alice@example.com" };

ow.obj.schemaValidate(schema, user);           // true, or throws on invalid data
$$(user).isSchema(schema);                    // true, or throws on invalid data
_$(user, "user").isSchema(schema).$_();        // validation chain; $_() throws accumulated errors

var validate = ow.obj.schemaCompile(schema);
var valid = validate({ name: "Alice", age: -1 }); // false
if (!valid) print(JSON.stringify(validate.errors));
```

`schemaValidate` and `$$(...).isSchema(...)` throw a **string** for invalid data. They do not return `false`. Use `schemaCompile(schema)(data)` when you need a boolean. Compilation, unsupported dialects, configuration errors, and missing references can throw error objects.

A compiled validator's `errors` property is populated after a failed validation and is cleared after a successful validation. Read or copy it before calling the validator again. Errors use Ajv v8's `instancePath`, `schemaPath`, `keyword`, `params`, and `message` fields. The helpers are intended for synchronous schemas; `$async` schemas are outside their supported contract.

## API reference

| Method | Behavior |
| --- | --- |
| `ow.obj.schemaInit(options)` | Initializes process-wide validation options once. Usually called automatically. |
| `ow.obj.schemaCompile(schema)` | Returns a reusable boolean validator with an `errors` property. Equivalent JSON schema objects reuse the validator. |
| `ow.obj.schemaCheck(schema)` | Returns whether the schema itself is valid under its dialect. It does not validate application data or guarantee that references can be resolved. |
| `ow.obj.schemaAdd(key, schema)` | Registers a schema for later validation or references. Passing an array registers its members by `$id`, ignoring `key`. |
| `ow.obj.schemaValidate(schemaOrKey, data, errorOptions)` | Returns `true` on success; throws formatted validation errors on failure. Accepts a schema object, boolean schema, registered key, or `$id`. |
| `ow.obj.schemaRemove(key)` | Removes schemas by key, `$id`, regular expression, or equivalent schema object. Omitting the argument removes all application schemas but retains meta-schemas and initialization options. |
| `ow.obj.schemaGenerator(json, id, required, descriptionTemplate)` | Infers a draft-07 schema from sample values. Review the generated schema before relying on it. |

The global helpers also load the object wrapper automatically. Their optional arguments are error-reporting options, **not** Ajv initialization options:

```javascript
$$(user).isSchema(schema, { dataVar: "user", separator: "; " });
_$(user, "user").isSchema(schema, "Invalid user", { dataVar: "user" }).$_();
```

`schemaValidate` defaults `errorOptions` to `{ dataVar: "args" }`. An explicitly supplied map replaces that default; omitted fields then use Ajv's defaults. `dataVar` sets the name printed before the path and `separator` joins multiple errors. To collect multiple errors, initialize with `allErrors: true` before using any schema helper.

## Initialization and input changes

Without explicit options, OpenAF enables `$data`, `$comment`, and `useDefaults`. Type coercion and additional-property removal are disabled. Format validation uses fast mode. Compilation allows unknown annotation keywords and union types, while unknown formats still fail compilation.

`useDefaults: true` assigns missing defaults directly into the supplied object or array. Validation can therefore modify data, including data that later fails another constraint. Clone data before validating if you need to retain the original.

```javascript
ow.loadObj();
var data = {};
ow.obj.schemaValidate({
  type: "object",
  properties: { enabled: { type: "boolean", default: true } }
}, data);
// data.enabled is now true
```

Initialization is **first call wins** across every draft engine. Calling `schemaInit` later does not change options. Explicit options replace OpenAF's `$data`/`$comment`/`useDefaults` defaults; compatibility settings and bundled formats still apply. Start a fresh process for different configurations. For example, this must run before any other schema operation:

```javascript
ow.loadObj();
ow.obj.schemaInit({
  $data: true,
  useDefaults: false,
  coerceTypes: false,
  allErrors: true,
  format: "full"
});
```

Supported Ajv v8 options are passed through. Common choices include `strict`, `allErrors`, `useDefaults`, `coerceTypes`, `removeAdditional`, `validateFormats`, and `formats`. Custom format definitions override the bundled definitions. The `schemas` initialization option registers schemas through OpenAF's draft routing.

`$data: true` allows supported keyword values to refer to other values in the input:

```javascript
ow.loadObj();
var bounds = {
  type: "object",
  properties: {
    minimum: { type: "number" },
    value: { type: "number", minimum: { $data: "1/minimum" } }
  }
};
var withinBounds = ow.obj.schemaCompile(bounds);
withinBounds({ minimum: 3, value: 5 }); // true
withinBounds({ minimum: 3, value: 2 }); // false
```

## Choose a draft

The root `$schema` chooses the validator. When absent, OpenAF uses draft-07. Canonical dialect URIs are accepted with or without a trailing `#`:

| Draft | `$schema` |
| --- | --- |
| draft-07 | `http://json-schema.org/draft-07/schema` |
| draft-2019-09 | `https://json-schema.org/draft/2019-09/schema` |
| draft-2020-12 | `https://json-schema.org/draft/2020-12/schema` |

Unknown dialects are rejected. Add `$schema` explicitly when using newer keywords; an undeclared schema remains draft-07 and does not acquire newer keyword semantics.

```javascript
ow.loadObj();
var object2019 = {
  $schema: "https://json-schema.org/draft/2019-09/schema",
  type: "object",
  allOf: [{ properties: { name: { type: "string" } } }],
  unevaluatedProperties: false
};
ow.obj.schemaCompile(object2019)({ name: "Alice" }); // true
ow.obj.schemaCompile(object2019)({ extra: true });   // false

var tuple2020 = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "array",
  prefixItems: [{ type: "string" }, { type: "integer" }],
  items: false
};
ow.obj.schemaCompile(tuple2020)(["Alice", 30]);       // true
ow.obj.schemaCompile(tuple2020)(["Alice", 30, true]); // false
```

The engines coexist in one process with independent compilation state and shared initialization options. Schemas cannot reference a registered schema from another draft. Use the same declared draft for a schema and its external references. Draft-2020-12 changes tuple syntax; it does not reinterpret old array-valued `items` schemas automatically.

## Register schemas and references

Keys and resolved `$id` values must be unique across draft engines. Register dependencies before compiling or validating their consumers. Local `$ref` values, `$defs`/`definitions`, and registered external IDs are supported; OpenAF's synchronous helpers do not download missing schemas.

```javascript
ow.loadObj();
ow.obj.schemaAdd("address", {
  $id: "https://example.com/address.json",
  type: "object",
  properties: { city: { type: "string" } },
  required: ["city"]
});
ow.obj.schemaAdd("customer", {
  type: "object",
  properties: { address: { $ref: "https://example.com/address.json" } }
});
ow.obj.schemaValidate("customer", { address: { city: "Lisbon" } }); // true
ow.obj.schemaValidate("https://example.com/address.json", { city: "Porto" });

ow.obj.schemaRemove("customer");
ow.obj.schemaRemove("address");
ow.obj.schemaRemove("https://example.com/address.json");
```

Ajv can retain a schema’s `$id` after compilation fails on a missing reference. Register the missing dependency and retry, or remove that `$id` before changing the schema or its draft.

Removing a registration does not invalidate validator functions you already hold. Removing a key or ID follows Ajv's removal semantics; another alias for the same schema can remain registered. Use `schemaRemove()` to clear all application registrations.

## Generate a starting schema

```javascript
ow.loadObj();
var inferred = ow.obj.schemaGenerator(
  { name: "Alice", age: 30, email: "alice@example.com" },
  "https://example.com/person.json",
  ["name"]
);
ow.obj.schemaCheck(inferred); // true
ow.obj.schemaValidate(inferred, { name: "Bob", age: 25, email: "bob@example.com" });
```

The generator emits draft-07 and can infer formats such as email and URI. Array inference uses the first sample item. It also recognizes string shorthand for patterns (`"/pattern/"`), numeric ranges (`"[2, 4["`), and enumerations (`"(['red','blue'])"`). Always check generated schemas, particularly shorthand numeric constraints, and inspect them for the restrictions your application actually needs. The generator is not a general schema migration tool.

## Migrating from the bundled Ajv v6

OpenAF retains its schema helper signatures, defaults, return/throw behavior, equivalent-schema caching, and automatic format registration. Draft-07 retains permissive non-finite number validation, non-Unicode regular expression compilation, and ignored `$ref` sibling keywords unless explicitly overridden. Newer drafts validate `$ref` siblings normally.

| Legacy initialization option | OpenAF v8 handling |
| --- | --- |
| `format: "fast"` / `"full"` | Chooses bundled format mode. Default is fast. |
| `format: false` / `true` | Disables/enables format validation. Explicit `validateFormats` takes precedence. |
| `jsonPointers: false` / `true` | Selects property-style / JSON-pointer error paths through `jsPropertySyntax`. Explicit `jsPropertySyntax` takes precedence. |
| `strictKeywords`, `strictDefaults` | Map their combined enabled state to `strictSchema`. Explicit `strict` or `strictSchema` takes precedence; v8 strictness is broader than those legacy controls. |

Other removed legacy options are rejected with a migration message: `errorDataPath`, `nullable`, `extendRefs`, `missingRefs`, `processCode`, `sourceCode`, `unicode`, `uniqueItems`, `unknownFormats`, `cache`, `serialize`, `schemaId`, and `ajvErrors`. Use v8 equivalents where available: `code.process`, `code.source`, `ignoreKeywordsWithRef`, or explicitly declared `formats` entries. `nullable` is now a built-in schema keyword rather than an initialization option.

Errors use `instancePath` instead of `dataPath`, messages use “must” instead of “should,” and validation/error ordering can differ. Paths default to JSON-pointer syntax. Do not compare old message text verbatim. Ajv v8 and ajv-formats also contain correctness changes: for example, fast `date-time` validation requires `T` rather than accepting a space separator. `nullable` schemas now use the built-in v8 behavior. Standard format edge cases are not guaranteed to match v6 exactly.

`loadAjv()` still exposes the global draft-07 `Ajv` constructor. Direct `new Ajv(...)` users must follow the v8 API and arrange their own format registration and runtime-compatible code generation; OpenAF's compatibility settings are applied by `ow.obj.schemaInit`, not by the raw constructor. Custom keyword implementations and v6 internal instance fields are outside the compatibility contract.

See the [Ajv options reference](https://ajv.js.org/options.html), [v6-to-v8 migration guide](https://ajv.js.org/v6-to-v8-migration.html), and [JSON Schema draft reference](https://ajv.js.org/json-schema.html).
