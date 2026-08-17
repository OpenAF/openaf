# Beautifiers Java Plugin Reference

The `Beautifiers` plugin evaluates `vkbeautify` into the JavaScript scope, providing pretty-printing and minification for XML, JSON, CSS, and SQL.

---

## Loading Syntax

```javascript
plugin("Beautifiers");
// Instantiates global `beautify` and defines `vkbeautify` class
```

---

## API Methods

| Method | Parameters | Return Type | Description |
| :--- | :--- | :--- | :--- |
| `beautify.xml(text, step)` | `String, [String\|Number]` | `String` | Pretty-prints XML markup (default step: 2 spaces). |
| `beautify.json(text, step)` | `String, [String\|Number]` | `String` | Pretty-prints JSON strings. |
| `beautify.css(text, step)` | `String, [String\|Number]` | `String` | Pretty-prints CSS stylesheets. |
| `beautify.sql(text, step)` | `String, [String\|Number]` | `String` | Pretty-prints SQL queries. |
| `beautify.xmlmin(text, preserveComments)` | `String, [Boolean]` | `String` | Minifies XML markup. |
| `beautify.jsonmin(text)` | `String` | `String` | Minifies JSON strings. |
| `beautify.cssmin(text, preserveComments)` | `String, [Boolean]` | `String` | Minifies CSS rules. |
| `beautify.sqlmin(text)` | `String` | `String` | Minifies SQL statements. |

---

## Practical Code Example

```javascript
plugin("Beautifiers");

var formattedXML = beautify.xml("<root><item id='1'><name>Test</name></item></root>");
var formattedSQL = beautify.sql("SELECT a, b FROM table WHERE a > 10 ORDER BY b DESC");
var minJSON = beautify.jsonmin('{\n  "name": "OpenAF",\n  "active": true\n}');
```
