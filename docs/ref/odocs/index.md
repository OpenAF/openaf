# ODocs

[Home](../index.md) / [All APIs](../all-apis.md) / [ODocs](index.md)

<a id="api-odocs-addall-dbc2c628"></a>

## ODocs.addAll

### ODocs.addAll(aODoc)

Add an external ODocs structure into these object.

Sources:

- js/odoc.js:126

<a id="api-odocs-get-ea99a4b7"></a>

## ODocs.get

### ODocs.get(aID, aKey) : Map

Returns the raw entry for a subject and key, loading missing subjects lazily and retaining cached entries. Returns undefined if the entry cannot be found. Offline mode prevents web fallback.

Sources:

- js/odoc.js:313

<a id="api-odocs-getodoc-df342701"></a>

## ODocs.getODoc

### ODocs.getODoc(aID) : ODoc

Returns a currently loaded subject without loading it. Returns undefined if the subject is not cached.

Sources:

- js/odoc.js:333

<a id="api-odocs-load-b5691e9a"></a>

## ODocs.load

### ODocs.load(aID, aFilename)

Loads a local documentation index and optionally one subject. Uses the remembered subject source or constructor path when aFilename is omitted. Accepts directories and standalone or nested ZIP archives.

Sources:

- js/odoc.js:242

<a id="api-odocs-loadfile-c58947bc"></a>

## ODocs.loadFile

### ODocs.loadFile(aPath)

Loads a local documentation index. Defaults to the constructor path. Online fallback and background refresh are enabled only when offline is false and no explicit aPath was supplied.

Sources:

- js/odoc.js:107

<a id="api-odocs-loadweb-29e08027"></a>

## ODocs.loadWeb

### ODocs.loadWeb(aID) : Boolean

Loads web documentation from the configured URLs, trying the next URL on invalid responses. Without aID, loads only the index. Returns false when offline or loading fails.

Sources:

- js/odoc.js:194

<a id="api-odocs-save-f70e55ac"></a>

## ODocs.save

### ODocs.save()

Saves the current ODocs into .odoc.db in the directory provided on the constructor in a way suitable for offline use.

Sources:

- js/odoc.js:140

<a id="api-odocs-saveweb-30eeda3f"></a>

## ODocs.saveWeb

### ODocs.saveWeb()

Saves the current ODocs into the path provided on the constructor with files suitable for loading from web.

Sources:

- js/odoc.js:170

<a id="api-odocs-search-769bab5c"></a>

## ODocs.search

### ODocs.search(aTerm, anArrayOfIds) : Array

Returns id/key candidates across the selected subjects. Prefers case-sensitive exact keys, then case-insensitive exact keys, then substrings. Ambiguous keys retain each matching subject.

Sources:

- js/odoc.js:279

