# ODoc: API lookup and documentation generation

[Index](./index.md) | [CLI](./cli.md) | [Coverage](./documentation-coverage.md)

ODoc extracts documentation from JavaScript and Java comments. OpenAF packages a ZIP-format `.odoc.db` and can generate gzip files for web publication. Contracts live in [odoc.js](../js/odoc.js) and [openaf.js](../js/openaf.js).

## Look up an API

```sh
openaf -helpscript 'io.readFileJSON'
openaf -c 'setOfflineHelp(true); print(stringify(searchHelp("io.readFileJSON")));'
```

In the console use `help io.readFileJSON`. For a unique match, `searchHelp(term, optionalPath, optionalSubjectIds)` returns an array containing `{ id, key, fullkey, text }`. Multiple matches return candidates with `id` and `key`; no match returns an empty array. `setOfflineHelp(true)` selects local help. Installed package help can also be searched.

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
| `ODoc(initialEntries)` | One subject; `add`, `get`, `getKeys`, and `getAll` manage entries with `{ k: signature, t: text }`. |
| `ODocsGen(filesBySubject)` | Constructor parses the files. `genODoc(filename)` returns an `ODoc`; `getODoc()` returns plain maps by subject. |
| `ODocs(path, entries, urls, offline)` | Collection with `loadFile(path)`, `search(term, subjectIds)`, `get(id, key)`, `save()`, and `saveWeb()`. Use a directory with trailing slash to load its `.odoc.db`. |
| `saveHelp(directory, filesBySubject)` | Extract and save local help. |
| `saveHelpWeb(directory, filesBySubject)` | Extract and save compressed web data. |

The [build script](../buildos.js) uses these helpers for distribution help. Generating help does not verify example behavior; run the [documentation checks](./documentation-coverage.md) too.
