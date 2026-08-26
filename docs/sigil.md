# OpenAF Sigil Macro & Template Engine Guide

`Sigil` encompasses both OpenAF's dynamic string interpolation macro engine (`<sigil:...>`) and its fluent object inspection (`$$`) and defensive parameter validation (`_$`) libraries.

---

## Table of Contents
1. [Overview & Syntax](#overview--syntax)
2. [Sigil Handlers & Types](#sigil-handlers--types)
   - [Environment Variables (`${ENV}`)](#environment-variables-env)
   - [Secret Buckets (`<sigil:sec ...>`)](#secret-buckets-sigilsec-)
   - [JavaScript Expressions (`#{expr}`)](#javascript-expressions-expr)
   - [Map & Scope Variables (`{{var}}`)](#map--scope-variables-var)
3. [Filter Pipelines & Transformations](#filter-pipelines--transformations)
4. [JavaScript Macro API (`$sigil`)](#javascript-macro-api-sigil)
5. [Object Inspection API (`$$`)](#object-inspection-api-)
6. [Fluent Parameter Validation API (`_$`)](#fluent-parameter-validation-api-_)
7. [oJob Sigil Integration](#ojob-sigil-integration)

---

## Overview & Syntax

Sigil expressions are enclosed within delimiters or `<sigil:...>` tags. When evaluated by the Sigil engine, expressions are replaced with their resolved runtime values.

```yaml
# Example Sigil expansions in configuration
db:
  host: "${DB_HOST:-localhost}"
  user: "{{appUser}}"
  pass: "<sigil:sec repo='main' bucket='db' key='pass'>"
  url : "jdbc:postgresql://#{getDBHost()}:5432/#{getDBName()}"
```

---

## Sigil Handlers & Types

### Environment Variables (`${ENV}`)
Interpolates environment variables with optional default fallback syntax:

```bash
${PORT:-8080}              # Resolves PORT or falls back to 8080
${DATABASE_URL}           # Resolves DATABASE_URL
```

### Secret Buckets (`<sigil:sec ...>`)
Securely fetches secrets from encrypted SBuckets (`ow.sec`) without hardcoding credentials:

```xml
<sigil:sec repo="main" bucket="db" key="password">
<sigil:sec repo="system" key="apiToken">
```

### JavaScript Expressions (`#{expr}`)
Evaluates JavaScript code snippets inline and substitutes the return value:

```bash
#{now()}                             # Inserts current timestamp
#{ (1024 * 1024).toString() }        # Evaluates arithmetic
#{ getEnv('NODE_ENV') || 'dev' }     # Inline function call
```

### Map & Scope Variables (`{{var}}`)
Resolves properties from a provided context object or map:

```bash
{{user.name}}
{{config.http.port}}
```

---

## Filter Pipelines & Transformations

Sigil expressions support pipe filters (`|`) to transform values during expansion:

```bash
${DB_PASS | base64}                  # Base64 encodes the resolved value
${SERVICE_NAME | lower}              # Converts string to lowercase
${PATH_LIST | split(',')}            # Splits string into array
```

### Built-in Filters

| Filter | Description | Example |
| :--- | :--- | :--- |
| `upper` / `lower` | Case conversion. | `${NAME \| upper}` |
| `trim` | Whitespace trimming. | `${TOKEN \| trim}` |
| `base64` / `unbase64` | Base64 encoding/decoding. | `${RAW \| base64}` |
| `json` / `yaml` | Format serialization. | `{{obj \| json}}` |
| `default(val)` | Default fallback if value is null/undefined. | `{{missing \| default('N/A')}}` |

---

## JavaScript Macro API (`$sigil`)

Expand Sigil templates programmatically using `$sigil(...)` or `ow.format.sigil`:

```javascript
// Basic string interpolation with scope map
var template = "Hello {{user.name}}, your port is ${PORT:-8080}.";
var result = $sigil(template, { user: { name: "Alice" } });

// Register custom handler
$sigil.setHandler("custom", function(aKey, aScope) {
  return "Custom_" + aKey;
});
```

---

## Object Inspection API (`$$`)

The `$$` helper provides deep object inspection, path retrieval, and type predicate checks:

```javascript
var user = { name: "Alice", roles: ["admin", "dev"], meta: { active: true } };

// Path navigation with dot/bracket notation
$$(user).get("meta.active");          // true
$$(user).get("roles[0]");              // "admin"
$$(user).getI("META.ACTIVE");         // Case-insensitive retrieval
$$(user).set("meta.level", 5);        // Sets nested property
$$(user).unset("meta.active");        // Removes property

// Type predicates
$$(user).isMap();                     // true
$$(user).get("roles").isArray();       // true
```

---

## Fluent Parameter Validation API (`_$`)

`_$()` provides defensive parameter checking, type coercion, and fluent assertion chains:

```javascript
function createUser(name, email, age) {
  // Parameter validation with descriptive error messages
  _$(name, "name").isString().notEmpty().$_("Name is required");
  _$(email, "email").isString().contains("@").$_("Valid email required");
  _$(age, "age").isNumber().between(18, 120).default(21);
}

// Chainable assertions
_$(val, "val").isNumber().greater(0).lessEquals(100).$_();
_$(ip, "ip").isString().regexp("^\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}$").$_();
```

---

## oJob Sigil Integration

oJobs automatically process Sigil expressions across job arguments, inputs, and environment configurations:

```yaml
jobs:
  - name: Connect DB
    check:
      dbUser: "isString.default('admin')"
      dbPort: "isNumber.between(1024, 65535)"
    exec:
      dbUser: "${DB_USER:-admin}"
      dbPass: "<sigil:sec repo='main' bucket='db' key='pass'>"
      dbHost: "#{ getHost() }"
```
