# Graph channels: operate and navigate a knowledge graph

[Index](./index.md) | [Core](./openaf.md#ow-ch---channels) | [ODoc](./odoc.md)

The `graph` channel type exposes a knowledge graph stored in a single JSON file as a regular OpenAF channel. It reads and writes the wiki graph format used by Mini-A (`graph.json`), and `ow.ch.utils.graph` adds navigation helpers (neighbors, shortest path, bounded traversal). Contracts live in [owrap.ch.js](../js/owrap.ch.js); tests are in [autoTestAll.Channels.js](../tests/autoTestAll.Channels.js) (`testGraphChannel`).

## File format

```json
{
  "version": 2,
  "nodes": { "doc:a.md": { "id": "doc:a.md", "type": "document", "props": { "title": "A" } } },
  "edges": [ { "from": "doc:a.md", "to": "doc:b.md", "type": "LINKS_TO", "provenance": "EXTRACTED", "props": { "page": "a.md" } } ],
  "communities": [], "summaries": {}, "semantic_cache": {}, "surprise": []
}
```

Node ids are prefixed by kind (`doc:<path>`, `concept:<name>`, ...). An edge is identified by `from`, `to`, `type`, `provenance`, `props.page` and `props.section`; `provenance` is `EXTRACTED`, `INFERRED` or `AMBIGUOUS` (the default when missing or invalid). Sections the channel does not manage (`communities`, `summaries`, `semantic_cache`, `surprise`, ...) are kept untouched when saving.

## Create a graph channel

```javascript
$ch("g").create(true, "graph", { file: "graph.json" });
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `file` | String | _required_ | Path to the graph JSON file |
| `readOnly` | Boolean | `false` | Reject changes and never write the file |
| `create` | Boolean | `true` | If `false` the file must already exist; otherwise an empty graph is started |
| `autosave` | String | `"always"` | `"always"` saves on every change, `"debounced"` saves at most every `saveDebounceMs`, `"off"` only saves on `save`/destroy |
| `saveDebounceMs` | Number | `5000` | Minimum interval between saves when `autosave` is `"debounced"` |
| `lock` | String | | Path to a dummy file used as a filesystem lock while loading and saving |

Saves write a temporary file and atomically move it over `file`. Destroying the channel flushes pending changes (unless read-only). A missing file with `create: false`, or a file that is not a JSON map, makes `create` throw.

## Keys and values

| Entry | Key | Value |
| --- | --- | --- |
| Node | `{ id }` | `{ id, type, props }` (`type` defaults to the existing type, or `concept` for new nodes) |
| Edge | `{ from, to, type, provenance, page, section }` | `{ from, to, type, provenance, props }` |

A key with `from` and `to` is an edge; a key with `id` is a node; anything else throws. For edges, `type` may be given in the key or the value; `provenance` may be given in either (key wins); `page` and `section` in the key are stored as `props.page` and `props.section`.

```javascript
$ch("g").set({ id: "doc:a.md" }, { type: "document", props: { title: "A" } });
$ch("g").set({ id: "doc:b.md" }, { type: "document", props: { title: "B" } });
$ch("g").set({ id: "concept:x" }, { type: "concept" });
$ch("g").set({ from: "doc:a.md", to: "doc:b.md", type: "LINKS_TO", provenance: "extracted" }, { props: { page: "a.md" } });
$ch("g").set({ from: "doc:b.md", to: "concept:x", type: "MENTIONS" }, {});

$ch("g").get({ id: "doc:b.md" });   // { id: "doc:b.md", type: "document", props: { title: "B" } }
$ch("g").size();                    // 5 (3 nodes + 2 edges)
```

Behavior to rely on:

- `getKeys`, `getAll`, `forEach` and `size` cover nodes first, then edges. `getSortedKeys` sorts nodes by id followed by edges.
- Setting an edge that already exists (same identity) updates its `props` instead of adding a duplicate.
- Setting an edge whose `from` or `to` node does not exist throws.
- Unsetting a node also removes every edge connected to it.
- With `readOnly: true`, `set` and `unset` throw `graph channel is read-only`.
- `setAll`, `unsetAll` and `getSet` follow the other channel types.

## Navigate with `ow.ch.utils.graph`

Every helper takes the channel name first. Node ids without a `:` are treated as `doc:` ids, so `"a.md"` means `"doc:a.md"`.

| Function | Returns | Description |
| --- | --- | --- |
| `neighbors(aName, anId, aOptions)` | Array | Edges connected to a node. Options: `direction` (`"out"`, `"in"` or `"both"`, default `"both"`), `type`, `provenance` (String or Array) |
| `degree(aName, anId, aOptions)` | Number | Number of edges connected to a node (same options as `neighbors`) |
| `path(aName, aFromId, aToId, aOptions)` | Array | Shortest path (BFS, ignoring edge direction) as node ids; `[]` if either node is missing or none exists. Options: `maxDepth`, `type` |
| `traverse(aName, anId, aOptions)` | Map | `{ nodes, edges }` reachable from a node. Options: `depth` (default `1`), `direction`, `type`, `provenance` |
| `find(aName, aOptions)` | Array | Nodes matching `type` and/or `text` (case-insensitive match on id and props) |
| `stats(aName)` | Map | `nodes`, `edges`, `nodeTypes`, `edgeTypes` and `provenance` counts |
| `save(aName)` | Boolean | Flush pending changes now (`false` if read-only) |

```javascript
var g = ow.ch.utils.graph;

g.path("g", "a.md", "concept:x");                       // [ "doc:a.md", "doc:b.md", "concept:x" ]
g.path("g", "a.md", "concept:x", { maxDepth: 1 });      // []
g.neighbors("g", "b.md", { direction: "out" });         // [ { from: "doc:b.md", to: "concept:x", type: "MENTIONS", ... } ]
g.traverse("g", "a.md", { depth: 2 }).nodes.length;     // 3
g.find("g", { type: "concept" });                       // [ { id: "concept:x", ... } ]
g.stats("g");                                           // { nodes: 3, edges: 2, ... }
```

## Example: model a folder tree

Directories and files become nodes and containment becomes a `CONTAINS` edge, so `path`, `neighbors` and `find` answer questions about the tree. Parents are set before children because an edge needs both of its nodes to exist.

```javascript
// Build a small tree to model
var root = io.createTempDir("graphDemo");
io.mkdir(root + "/src/app"); io.mkdir(root + "/docs");
io.writeFileString(root + "/README.md", "demo");
io.writeFileString(root + "/src/app/main.js", "//");
io.writeFileString(root + "/docs/guide.md", "#");

$ch("tree").create(true, "graph", { file: root + "/tree-graph.json" });

var base = String(io.fileInfo(root).canonicalPath);
var rel  = p => String(p).substring(base.length).replace(/^\//, "");        // path relative to root
var up   = p => rel(p).replace(/\/?[^\/]*$/, "");                           // relative path of the parent

$ch("tree").set({ id: "dir:" }, { type: "directory", props: { name: "." } });
listFilesRecursive(root)
  .filter(f => f.filename != "tree-graph.json")
  .sort((a, b) => a.filepath.length - b.filepath.length)                    // parents before children
  .forEach(f => {
    var id = (f.isDirectory ? "dir:" : "file:") + rel(f.canonicalPath);
    $ch("tree").set({ id: id }, { type: f.isDirectory ? "directory" : "file", props: { name: f.filename, size: f.size } });
    $ch("tree").set({ from: "dir:" + up(f.canonicalPath), to: id, type: "CONTAINS" }, {});
  });

var g = ow.ch.utils.graph;
g.path("tree", "dir:", "file:src/app/main.js");               // [ "dir:", "dir:src", "dir:src/app", "file:src/app/main.js" ]
g.neighbors("tree", "dir:src", { direction: "out" });         // one edge: dir:src -> dir:src/app
g.find("tree", { type: "file", text: ".md" });                // README.md and docs/guide.md nodes
g.stats("tree");                                              // { nodes: 7, edges: 6, nodeTypes: { directory: 4, file: 3 }, edgeTypes: { CONTAINS: 6 }, ... }

$ch("tree").destroy();
io.rm(root);
```

Edges created without a `provenance` are counted as `AMBIGUOUS`; add `provenance: "EXTRACTED"` to the edge key when the relation is known for certain, as it is for containment here.

## Working with Mini-A

The format is the one Mini-A saves in `<graphDir>/graph.json` (default `./.mini-a-wiki-graph`), so you can inspect or edit a graph produced by Mini-A without loading its code:

```javascript
$ch("wiki").create(true, "graph", { file: "./.mini-a-wiki-graph/graph.json", readOnly: true });
ow.ch.utils.graph.stats("wiki");
```

Limits to keep in mind:

- The whole file is rewritten on save. Do not let Mini-A and a writable graph channel update the same file at the same time; use `readOnly: true` for shared access, or the `lock` option when both sides cooperate on a lock file.
- Semantic extraction, community detection and summaries stay in Mini-A. Changing nodes or edges through the channel can leave `communities` and `summaries` stale until Mini-A rebuilds them.
- Mini-A edge identity also includes `props.page` and `props.section`; use the same `page`/`section` values when updating or removing edges it created.
- Everything is held in memory, so very large graphs cost memory proportional to their size.

## Source documentation

The same contracts are documented in the source as Markdown ODoc entries (`ow.ch.types.graph` and `ow.ch.utils.graph`), available with `help ow.ch.types.graph` in the console or `openaf -helpscript ow.ch.types.graph`. See [odoc.md](./odoc.md#opt-in-to-markdown) for the format.
