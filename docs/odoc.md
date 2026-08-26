# ODoc Engine & Web Help Reference Guide

`odoc` is OpenAF's documentation compiler, indexer, search engine, offline help database system, and web documentation browser. It extracts structured docstrings embedded in JavaScript code, indexes them into binary documentation databases (`.odoc.db`), and presents them via CLI or an interactive web server (`odocweb`).

---

## Table of Contents
1. [Overview & CLI Usage](#overview--cli-usage)
2. [`<odoc>` Docstring Tag Format](#odoc-docstring-tag-format)
3. [Building & Generating Help Databases (`.odoc.db`)](#building--generating-help-databases-odocdb)
4. [ODoc Core JavaScript Classes (`js/odoc.js`)](#odoc-core-javascript-classes-jsodocjs)
5. [Global Help Helper Functions](#global-help-helper-functions)
6. [Documentation Web Server (`odocweb`)](#documentation-web-server-odocweb)

---

## Overview & CLI Usage

OpenAF bundles the `odoc` command-line executable (`openaf --odoc` or `odoc`).

```bash
# Search for documentation matching a query
odoc search "ow.ch.create"

# Display documentation for a specific key
odoc key "ow.format.fromDate"

# Launch the offline Web Documentation Server (odocweb)
odoc web port=8080

# Build an .odoc.db file from JS source code files
odoc build src/ mylib.odoc.db
```

---

## `<odoc>` Docstring Tag Format

Documentation in OpenAF source code is authored using block comments containing `<odoc>` XML tags directly preceding functions or object definitions:

```javascript
/**
 * <odoc>
 * <key>ow.format.fromDate(aDate, aFormat) : String</key>
 * <category>Format</category>
 * <author>Nuno Aguiar</author>
 * <version>20230101</version>
 * <see>ow.format.toDate</see>
 * Formats a JavaScript Date object or epoch timestamp into a string using standard date format patterns.
 * 
 * Parameters:
 *   - aDate   : Date object or epoch milliseconds.
 *   - aFormat : Date format string (e.g. "yyyy-MM-dd HH:mm:ss").
 * 
 * Example:
 *   var formatted = ow.format.fromDate(new Date(), "yyyy-MM-dd");
 * </odoc>
 */
OpenWrap.format.prototype.fromDate = function(aDate, aFormat) {
  // implementation
};
```

### Supported `<odoc>` Tags

| Tag | Purpose | Example |
| :--- | :--- | :--- |
| `<key>` | Unique symbol name, signature, and return type. | `<key>ow.ch.create(aName, shouldCompress, type, options) : ow.ch</key>` |
| `<category>` | Functional group or topic classification. | `<category>Channels</category>` |
| `<author>` | Author name or maintainer. | `<author>Nuno Aguiar</author>` |
| `<version>` | Minimum OpenAF version or API version. | `<version>20230101</version>` |
| `<see>` | Cross-reference link to related keys. | `<see>ow.ch.get</see>` |

---

## Building & Generating Help Databases (`.odoc.db`)

You can compile source code docstrings into an offline binary database (`.odoc.db`) for distributions or oPacks:

### Command Line
```bash
odoc build dir=js/ out=.odoc.db
```

### Programmatically in JS
```javascript
load("odoc.js");

// Extract docstrings from directory and build .odoc.db
var docDB = new ODoc();
docDB.parseDir("js/");
docDB.saveDB(".odoc.db");
```

---

## ODoc Core JavaScript Classes (`js/odoc.js`)

`js/odoc.js` exposes four primary classes for documentation handling:

### `ODoc(aoDoc)`
* `add(aKey, aFullKey, aValue)`: Stores documentation entry.
* `get(aKey) : Map`: Returns `{ k: "signature", t: "body text" }`.
* `getKeys() : Array`: Returns array of indexed key names.
* `getAll() : Map`: Returns full documentation map.

### `ODocsGen(aMapOfFiles)`
* `genODoc(aFilename) : ODoc`: Parses XML `<odoc>` tags from file comments and returns indexed `ODoc`.
* `genODocs()`: Processes all files in map.

### `ODocs(aPath, aODocs, anArrayURLs, offline)`
* `loadFile(aPath)`: Loads `.odoc.db` file into memory.
* `save()`: Compiles and compresses entries into binary `.odoc.db` ZIP archive (level 9 compression).
* `saveWeb()`: Generates online `.gz` documentation endpoints.
* `search(aTerm, anArrayOfIds)`: Performs case-sensitive and case-insensitive exact/contains search across databases.
* `get(aID, aKey)`: Retrieves documentation entry for a specific subject ID and key.

---

## Global Help Helper Functions

OpenAF provides top-level global helpers in `openaf.js` for querying and generating help:

```javascript
// Toggle offline local .odoc.db search vs remote online lookup
setOfflineHelp(true);

// Search help across core JAR, oPacks, and external databases
var results = searchHelp("channel");

// Save offline .odoc.db database
saveHelp(".odoc.db", { "myModule": ["lib.js"] });
```

---

## Documentation Web Server (`odocweb`)

OpenAF includes `odocweb`, an offline embedded HTTP server that renders interactive, searchable HTML documentation for all core APIs and installed oPacks.

```bash
# Start odocweb on default port (8090)
odoc web

# Start odocweb on a custom port
odoc web port=8888
```

Open a web browser at `http://localhost:8888` to explore interactive documentation, search APIs, and view usage examples offline.
