# ODoc: API lookup and documentation generation

[Index](./index.md) | [CLI](./cli.md) | [Coverage](./documentation-coverage.md)

ODoc extracts documentation from JavaScript and Java comments. OpenAF packages a ZIP-format `.odoc.db` and can generate gzip files for web publication. Contracts live in [odoc.js](../js/odoc.js) and [openaf.js](../js/openaf.js).

## Look up an API

```sh
openaf -helpscript 'io.readFileJSON'
openaf -c 'setOfflineHelp(true); print(stringify(searchHelp("io.readFileJSON")));'
```

In the console use `help io.readFileJSON`. For a unique match, `searchHelp(term, optionalPath, optionalSubjectIds)` returns an array containing `{ id, key, fullkey, text }`. Matches prefer case-sensitive exact keys, then case-insensitive exact keys, then substrings across all selected subjects. Multiple matches return candidates with `id` and `key`; use the third argument to select a subject. No match returns an empty array. `setOfflineHelp(true)` selects local help and prevents all odoc web requests. Switching help mode resets package discovery. With `false`, local help loads first, with web fallback and background refresh. Installed package help can also be searched.

Check `openaf -c 'print(getVersion());'` when comparing help to source. Installed help describes the installed artifact, which may differ from source edits.

The core launcher does not provide `--odoc`, `odoc search`, `odoc key`, `odoc build`, or `odoc web`. Loading `odoc.js` defines library objects, not a command dispatcher. Separately installed tools may provide other commands.

## Write a docstring

Save this as `greeting.js`:

```javascript
/**
 * <odoc>
 * <key>greeting(aName) : String</key>
 * Returns a greeting for aName. Example: greeting("Ada") returns "Hello Ada".
 * </odoc>
 */
function greeting(aName) {
  return "Hello " + aName;
}
```

`<key>` supplies the signature. The parser derives the lookup name by stripping the signature after the first `(`, `{`, `[`, or `:`. The body must be XML-compatible: escape literal `&` and `<`. Source comments commonly use a trailing backslash to preserve line breaks.

The parser does not create searchable fields for `<category>`, `<author>`, `<version>`, or `<see>`. Put compatibility and related-API information in the body instead.

## Opt in to Markdown

Use Markdown when an entry contains more than one paragraph or includes examples. Keep simple, single-paragraph descriptions as plain text. Use blank lines between paragraphs, lists for options, backticks for parameter names and short expressions, and fenced blocks with a language label for standalone examples.

Mark an individual entry with `format="markdown"` or its alias `format="md"`:

````javascript
/**
 * <odoc format="markdown">
 * <key>greeting(aName) : String</key>
 * <![CDATA[
 * Returns a **greeting** for `aName`.
 *
 * - Accepts a name.
 * - Returns a string.
 *
 * ```javascript
 * greeting("Ada");
 * // "Hello Ada"
 * ```
 * ]]>
 * </odoc>
 */
````

Markdown entries preserve ordinary newlines, blank lines, and indentation; trailing backslashes are unnecessary. CDATA allows literal `&` and XML/HTML examples. Without CDATA, the body must remain XML-compatible. Existing unmarked entries retain their original extraction and plain-text display.

Generated Markdown entries contain `{ k, t, format: "markdown" }`. `ODoc.add(key, signature, text, "markdown")` (or `"md"`) provides the same opt-in for programmatically created entries. Both aliases normalize to `format: "markdown"`. Local ZIP and web gzip storage retain the format marker.

Console help and `openaf -helpscript` render marked bodies with `ow.format.withMD()` when ANSI output is available. Unsupported terminals and redirected CLI output display the Markdown source. Browser help displays preserved source text. `searchHelp()` always returns raw text and adds `format` only for marked entries; callers can render it themselves:

```javascript
var results = searchHelp("greeting", "help", ["greetings"]);
if (results.length == 1 && isString(results[0].text)) {
  ow.loadFormat();
  print(results[0].format == "markdown" ? ow.format.withMD(results[0].text) : results[0].text);
}
```

`withMD()` implements OpenAF's supported Markdown subset, rather than full CommonMark.

## Generate local help

Run from the directory containing `greeting.js`:

```sh
openaf -c 'io.mkdir("help"); saveHelp("help", { greetings: "greeting.js" });'
openaf -c 'setOfflineHelp(true); print(stringify(searchHelp("greeting", "help/")));'
```

The first argument is an **output directory**, not a database filename. Each map value is one source filename, not an array or directory. This creates `help/.odoc.db`. `ODoc.parseDir` and `ODoc.saveDB` are not core APIs.

After creating an output directory, `saveHelpWeb("help-web", { greetings: "greeting.js" })` writes subject `.gz` files and `__odockeys.gz`. It does not start a web server. The repository's `odocweb/` directory holds generated data. Publish it through your chosen documentation frontend.

## Library interfaces

Call `loadHelp()` before constructing these objects:

| Interface | Contract |
| --- | --- |
| `ODoc(initialEntries)` | One subject; `add`, `get`, `getKeys`, and `getAll` manage entries with `{ k: signature, t: text }` and optional `format: "markdown"`. |
| `ODocsGen(filesBySubject)` | Constructor parses the files. `genODoc(filename)` returns an `ODoc`; `getODoc()` returns plain maps by subject. |
| `ODocs(path, entries, urls, offline)` | Collection with `loadFile(path)`, `search(term, subjectIds)`, `get(id, key)`, `save()`, and `saveWeb()`. Load a directory, a standalone `.odoc.db`/ZIP, or a JAR/ZIP containing `.odoc.db`. `get(id, key)` caches subjects and returns `undefined` for missing entries. |
| `saveHelp(directory, filesBySubject)` | Extract and save local help. |
| `saveHelpWeb(directory, filesBySubject)` | Extract and save compressed web data. |

The [build script](../buildos.js) uses these helpers for distribution help. Generating help does not verify example behavior; run the [documentation checks](./documentation-coverage.md) too.

## Regression checks

Build with `ojob build.yaml`, then run the focused checks against the rebuilt JAR:

```sh
cd tests
java -jar ../openaf.jar --ojob -e autoTestAll.oDoc.yaml
```

The tests use temporary documentation fixtures and mock HTTP responses. They cover storage, extraction, search, offline behavior, cleanup, and display. Separate integration checks are available from the repository root:

```sh
python3 tools/docs/test_odoc_terminal.py --jar openaf.jar
node tools/docs/test_odoc_browser.js
```

The terminal check requires a POSIX pseudo-terminal. The browser check requires Node.js, Playwright, and Chrome; it uses a temporary headless profile and mocked HTTP responses.
