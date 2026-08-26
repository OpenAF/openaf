# OpenAF Processor (oafp) Reference Guide

`oafp` (OpenAF Data Processor) is a universal data piping, filtering, transformation, and formatting CLI tool and library built on OpenAF. It acts as a multi-format equivalent to `jq`, `yq`, `xq`, `csvkit`, and `sql`, enabling seamless interoperability between different structured data formats.

---

## Table of Contents
1. [Overview & Basic Usage](#overview--basic-usage)
2. [CLI Options & Parameters](#cli-options--parameters)
3. [Input Formats (`in`)](#input-formats-in)
4. [Output Formats (`out`)](#output-formats-out)
5. [Data Transformation & Query Operations](#data-transformation--query-operations)
   - [JMESPath Filtering (`path` / `opath`)](#jmespath-filtering-path--opath)
   - [SQL Queries (`sql` / `isql`)](#sql-queries-sql--isql)
   - [nLinq Querying (`from` / `ifrom`)](#nlinq-querying-from--ifrom)
   - [Template Application (`template`)](#template-application-template)
   - [Data Masking & Redaction (`mask`)](#data-masking--redaction-mask)
   - [Object Diffing (`diff`)](#object-diffing-diff)
   - [Schema Validation (`schema`)](#schema-validation-schema)
   - [Advanced Data Transforms & Cleansing](#advanced-data-transforms--cleansing)
6. [Input/Output Formatting Options (`fi` / `fo`)](#inputoutput-formatting-options-fi--fo)
7. [oJob Integration](#ojob-integration)
8. [API Usage in JavaScript](#api-usage-in-javascript)

---

## Overview & Basic Usage

`oafp` can be invoked from the command line directly as `oafp` (or via `openaf --oafp` / `ojob oafp`).

```bash
# Basic format conversion (JSON stdin to YAML stdout)
cat data.json | oafp in=json out=yaml

# Convert CSV to formatted Markdown table
oafp data=users.csv in=csv out=mdtable

# Extract specific keys using JMESPath
cat payload.json | oafp path="items[?status=='active'].name"

# Query CSV data using SQL
oafp data=sales.csv in=csv sql="SELECT category, SUM(amount) AS total GROUP BY category" out=json

# Fetch remote REST data and filter
oafp url="https://api.example.com/users" path="[*].email" out=lines
```

---

## CLI Options & Parameters

| Parameter | Description | Example |
| :--- | :--- | :--- |
| `data=` | Input file path, URL, or raw string data (defaults to reading from stdin). | `data=file.yaml` |
| `file=` | Alias for specifying input file path. | `file=config.json` |
| `cmd=` | Execute shell command and capture stdout as input data. | `cmd="docker ps --format json"` |
| `url=` | Remote HTTP/S URL (`urlmethod`, `urlparams`, `urldata`). | `url="https://api.com/data"` |
| `in=` / `input=` | Explicit input format override. Auto-detected if omitted. | `in=json` |
| `out=` / `output=` | Output format specification. Defaults to `ctree` or `yaml`/`json`. | `out=yaml` |
| `outfile=` | File path to write output directly. | `outfile=output.json` |
| `outfileappend=` | Append output to existing file stream (`true` or `false`). | `outfileappend=true` |
| `path=` | JMESPath expression to query/filter raw input data. | `path="users[0].name"` |
| `opath=` | JMESPath expression applied post-transform before output formatting. | `opath="[*].id"` |
| `sql=` | SQL query expression executed against data via `$sql()`. | `sql="SELECT * WHERE age > 21"` |
| `isql=` | SQL query executed on raw input before transforms. | `isql="SELECT name FROM t"` |
| `from=` / `ifrom=` | nLinq query expression (`$from(...)`) post / pre transform. | `from="[?age > 21]"` |
| `template=` | Handlebars template file or inline string to apply to input data. | `template="Hello {{name}}"` |
| `diff=` | Compare input data with another file/URL/data source. | `diff=other.json` |
| `mask=` | List of keys/paths to mask or anonymize in output. | `mask="password,ssn"` |
| `schema=` | JSON schema file or URL to validate input data against. | `schema=user-schema.json` |
| `fi=` / `fo=` | Filter Input / Filter Output options (e.g. `sortKeys`, `flat`, `unflat`). | `fo=sortKeys` |
| `loop=` | Repeat execution periodically every N seconds. | `loop=5` |
| `loopcls=` | Clear terminal screen on each loop iteration (`true` or `false`). | `loopcls=true` |
| `color=` | Force enable or disable ANSI colors (`true` or `false`). | `color=false` |
| `parallel=` | Enable multi-core parallel streaming execution. | `parallel=true` |
| `secKey`, `secRepo` | Decrypt encrypted secret buckets via `$sec()`. | `secRepo=main` |
| `-v` / `version=` | Output comprehensive environment and system diagnostic report. | `oafp -v` |
| `-examples` | Query interactive example database from `ojob.io/oafp-examples.yaml`. | `oafp -examples` |

---

## Input Formats (`in`)

Specify input format with `in=<format>`:

* **`json`**: Standard JSON document or array stream.
* **`yaml`**: YAML documents / multi-document streams.
* **`csv`**: CSV/TSV tabular data (auto-detects delimiter, quotes, and header row).
* **`dsv`**: Custom Delimiter-Separated Values (`indsvsep`, `indsvquote`, `indsvheader`).
* **`lines`**: Line-by-line streaming string input.
* **`ndjson`**: Newline-delimited JSON stream.
* **`slon`**: Simple Language Object Notation.
* **`ndslon`**: Newline-delimited SLON stream.
* **`toon`**: Token-Oriented Object Notation.
* **`toml`**: TOML configuration format.
* **`xml`**: XML document parsed into object graph (`xmlignored`, `xmlprefix`).
* **`ini`**: INI configuration file parsed into key-value sections.
* **`md`** / **`mdtable`** / **`mdcode`**: Markdown text, tables, or fenced code blocks.
* **`sql`**: SQL statements or AST parsing.
* **`jwt`**: Decodes JWT token headers and payload (`injwtsecret`, `injwtpubkey`).
* **`openmetrics`**: Prometheus / OpenMetrics metric string parser.
* **`xls`**: Excel spreadsheet reader (`inxlssheet`, `inxlsevalformulas`).
* **`hsperf`**: Java HotSpot JVM performance counters (`/tmp/hsperfdata_*`).
* **`jfr`**: Java Flight Recorder event parser.
* **`javathread`** / **`javagc`** / **`javas`**: Java thread dumps, GC logs, and local JVM process discovery.
* **`jmx`**: JMX MBean inspector (`jmxurl`, `jmxpid`, `jmxuser`, `jmxpass`, `jmxop`).
* **`snmp`**: SNMP OID poller (`insnmp`, `insnmpcommunity`, `insnmpversion`).
* **`ls`**: File and archive lister (`lsrecursive`, `lsext`: tar, tgz, zip, jar).
* **`sh`**: Command output parser (`inshformat`: json, yaml, raw).
* **`db`**: Database query execution (`indbjdbc`, `indbuser`, `indbpass`, `indbexec`).
* **`ch`**: OpenAF channel reader (`inch`).
* **`llm` / `llmmodels`**: LLM query and model discovery.
* **`mcp`**: Model Context Protocol client (`inmcptoolslist`, `inmcplistprompts`).
* **`raw`** / **`rawhex`** / **`base64`**: Raw strings, hex dumps, base64 payloads.

---

## Output Formats (`out`)

Specify output format with `out=<format>`:

* **Terminal Trees & Visualizations:**
  * `ctree` (colored tree), `tree` (plain tree), `mtree` (mono tree), `btree` (branch tree).
  * `table`, `ctable`, `stable` (ANSI ASCII tables).
  * `chart`, `schart` (Terminal ASCII line/bar charts with `"<units> [<path[:color][:legend]>...]"`).
  * `grid` (Multi-widget terminal dashboard layout).
* **Serialized Formats:**
  * `json`, `pjson` (pretty JSON), `cjson` (colorized JSON).
  * `yaml`, `cyaml`, `kyaml` (Kubernetes key-ordered YAML), `mdyaml` (multi-doc).
  * `slon`, `cslon`, `ndslon`.
  * `toon`, `toml`, `ini`.
  * `csv`, `dsv` (`dsvsep`, `dsvquote`, `dsvfields`, `dsvheader`).
  * `lines` (raw row-by-row lines).
* **Documents & Web:**
  * `md`, `mdtable` (Markdown text/tables with `mdtemplate` Handlebars interpolation).
  * `html` (Interactive web preview with `htmlopen`, `htmlwait`, `htmldark`).
  * `raw`, `rawascii` (ASCII debug visualizer).
  * `xls` (Excel file generation with `xlsfile`, `xlssheet`).
* **Systems & Integrations:**
  * `template`: Handlebars template renderer (`template`, `templatepath`).
  * `log`: Log stream formatter with ANSI log-level coloring (`logtheme`).
  * `openmetrics`: Prometheus metric format exporter (`metricsprefix`).
  * `envs`: Shell environment variable export script generation (`envscmd`, `envsprefix`).
  * `cmd`: Execute shell command per record (`outcmd`, `outcmdtmpl`).
  * `jwt`: JWT token signer (`jwtsecret`, `jwtalg`).
  * `sql` / `db`: SQL INSERT statement generator or direct JDBC database batch inserter (`sqltable`, `dbjdbc`).
  * `ch`: OpenAF channel publisher (`ch`, `chkey`).

---

## Data Transformation & Query Operations

### JMESPath Filtering (`path` / `opath`)
Filter objects and arrays using JMESPath expressions:
```bash
oafp data=metrics.json path="nodes[?status=='READY'].{Host: ip, Memory: mem_free}"
```

### SQL Queries (`sql` / `isql`)
Execute full ANSI-SQL queries against JSON, CSV, or YAML data directly in memory:
```bash
oafp data=logs.json in=json sql="SELECT level, COUNT(1) AS cnt GROUP BY level ORDER BY cnt DESC" out=mdtable
```

### nLinq Querying (`from` / `ifrom`)
Apply LINQ-like expressions using OpenAF nLinq syntax:
```bash
oafp data=users.json from="[?age > 21].select({Name: name})"
```

### Template Application (`template`)
Apply Handlebars templates directly to data payloads:
```bash
oafp data=user.json template="User {{name}} <{{email}}> belongs to {{department}}."
```

### Data Masking & Redaction (`mask`)
Mask sensitive fields in configuration files or logs:
```bash
oafp data=config.yaml mask="password,db.secret,tokens[*]" out=yaml
```

### Object Diffing (`diff`)
Compare two datasets and highlight structural and value differences:
```bash
oafp data=prod-config.json diff=staging-config.json out=ctree
```

### Schema Validation (`schema`)
Validate input data against a JSON Schema specification:
```bash
oafp data=payload.json schema=schema.json
```

### Advanced Data Transforms & Cleansing
* `sortmapkeys=true`: Recursively sort object keys alphabetically.
* `maptoarray=true` / `arraytomap=true`: Pivot between key-value maps and object arrays.
* `flatmap=true`: Flatten nested hierarchies into single-level dot-notation maps.
* `merge=true`: Deep-merge an array of objects into a single object.
* `correcttypes=true`: Convert stringified numbers, booleans, and ISO dates into proper types.
* `removenulls=true` / `removeempty=true` / `removedups=true`: Data cleansing transforms.
* `llmprompt="<prompt>"`: Transform data using an LLM prompt.
* `regression=true`: Mathematical curve fitting (linear, exponential, polynomial) with forecasting.
* `kmeans=true`: K-means clustering classification on datasets.
* `set=union|intersection|diff`: Mathematical set operations across arrays.
* `val2icon=simple`: Replace booleans and nulls with terminal icons/emojis.

---

## Input/Output Formatting Options (`fi` / `fo`)

Customize input parsing (`fi`) and output formatting (`fo`) with flags:

* `fo=sortKeys`: Sort object keys alphabetically on output.
* `fo=flat`: Flatten nested object structures into single-level dot-notation maps.
* `fo=unflat`: Expand dot-notation flat maps back into nested object hierarchies.
* `csvdelim=";"`: Set custom CSV delimiter.

---

## oJob Integration

`oafp` can be invoked inside oJob workflows using the `(oafp)` job shortcut:

```yaml
jobs:
  - name: Process Sales Data
    to  : (oafp)
    exec:
      data  : sales.csv
      in    : csv
      sql   : "SELECT category, SUM(total) AS sales GROUP BY category"
      out   : json
      assign: salesReport
```

---

## API Usage in JavaScript

You can invoke `oafp` programmatically in OpenAF scripts:

```javascript
// Load oafp engine
load("oafp.js");

// Run oafp transformation on an in-memory object
var data = [
  { name: "Alice", dept: "Engineering", salary: 90000 },
  { name: "Bob",   dept: "Engineering", salary: 95000 },
  { name: "Carol", dept: "Marketing",   salary: 80000 }
];

var result = $oafp(data, {
  sql: "SELECT dept, AVG(salary) AS avg_sal GROUP BY dept",
  out: "json"
});

print(result);
```
