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
| `store` | Map | | Delegate nodes, edges and the remaining sections to another channel type instead of keeping them in memory (see [Keep the graph out of memory](#keep-the-graph-out-of-memory)). Can't be combined with `file` |

Saves write a temporary file and atomically move it over `file`. Destroying the channel flushes pending changes (unless read-only). A missing file with `create: false`, or a file that is not a JSON map, makes `create` throw.

## Keep the graph out of memory

By default the whole graph lives in memory and `file` is rewritten on every save. With `store` the graph is kept in other OpenAF channels (nodes, edges, adjacency and the remaining sections, one channel each, named `graph::<name>::<part>`), so the memory used is bounded by that channel's own caching instead of by the graph size. Memory stays the default.

```javascript
$ch("g").create(true, "graph", { store: { type: "mvs", options: { file: "graph.db", compact: true } } });
```

| `store` field | Type | Description |
| --- | --- | --- |
| `type` | String | Channel type used for every part (e.g. `mvs`) |
| `options` | Map or Function | Options for the underlying channels. A Map gets a distinct `map` name per part added (so one `mvs` file holds them all); a Function receives the part name (`nodes`, `edges`, `adj`, `meta`) and returns that part's options |
| `compress` | Boolean | Passed as `shouldCompress` when creating the underlying channels |
| `bulk` | Boolean | Use the underlying channel's `setAll` for `setAll` batches (defaults to `true` for `mvs`, `false` otherwise) |

With a store, `file`, `autosave`, `saveDebounceMs` and `lock` don't apply: every change goes straight to the store channel. `create: false` throws if the store is empty, and `readOnly` works as usual. Destroying the graph channel destroys the underlying ones. The `ow.ch.utils.graph` helpers work unchanged.

### When does it make sense?

Measured with `mvs` (80,000 nodes with small props and 80,000 edges, JDK 21; indicative numbers):

| | In memory (JSON file) | `mvs` store |
| --- | --- | --- |
| Open an existing graph | ~2.2 s | ~0.05 s |
| Heap after open + 2,000 `neighbors`, 200 `get`, one `path` | ~154 MB | ~12 MB |
| Writing 160,000 entries one `set` at a time | ~2.9 s | ~75 s (~25x slower) |
| Writing 160,000 entries in one `setAll` | ~1.4 s | ~6 s (~4x slower) |
| Point reads (`get`, `neighbors`) | baseline | ~3x slower |
| Whole-graph scans (`stats`, `find`) | baseline | ~10-50x slower |

Use a store when the graph is large relative to the heap, is mostly read, or you can't afford to load it at start-up. Stay in memory for small graphs (a few thousand nodes), write-heavy loads or frequent `stats`/`find`. Notes:

- Load in batches: `setAll` writes a whole batch to the store at once (one `mvs` commit, and each node's adjacency written once), about 12x faster than the same entries with `set`. It follows the same rules as sequential `set` calls (an edge needs its nodes to exist earlier in the batch or already stored). Batching is on for `mvs`; set `store.bulk` to `true` or `false` to force it for other types that implement `setAll` properly.
- `mvs` commits on every change and reuses space lazily, so a long write session can bloat the file badly (7 GB for the load above). Set `compact: true` in the `mvs` options so it is compacted when the channel is destroyed (61 MB for the same graph).
- `getKeys`, `getAll`, `find` and `stats` still materialize node ids and edges in memory while they run; avoid them on very large graphs.
- Unlike the JSON file, a store is not in the Mini-A `graph.json` format.

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

## More use cases

The graph does not have to come from Mini-A: any set of things and relations fits. The snippets below assume the helpers `N` and `E` and the shortcut `G`:

```javascript
$ch("g").create(true, "graph", { file: "infra.json" });
var G = ow.ch.utils.graph;
var N = (id, type, props) => $ch("g").set({ id: id }, { type: type, props: props || {} });
var E = (from, to, type, prov) => $ch("g").set({ from: from, to: to, type: type, provenance: prov || "EXTRACTED" }, {});
```

### Service dependencies and impact analysis

Model services and datastores with `DEPENDS_ON` edges, then ask what breaks when something goes down. Following edges backwards (`direction: "in"`) from a node lists everything that depends on it, directly or not.

```javascript
N("svc:web", "service"); N("svc:api", "service"); N("svc:auth", "service");
N("svc:queue", "service"); N("svc:db", "database");
E("svc:web", "svc:api", "DEPENDS_ON");   E("svc:api", "svc:auth", "DEPENDS_ON");
E("svc:api", "svc:db", "DEPENDS_ON");    E("svc:auth", "svc:db", "DEPENDS_ON");
E("svc:queue", "svc:db", "DEPENDS_ON");

// Blast radius if the database fails (includes the database itself)
G.traverse("g", "svc:db", { depth: 5, direction: "in", type: "DEPENDS_ON" }).nodes.map(n => n.id);
// [ "svc:db", "svc:api", "svc:auth", "svc:queue", "svc:web" ]

// Most critical component: how many services depend directly on it
G.degree("g", "svc:db", { direction: "in" });                 // 3

// Entry points: services nothing else depends on
G.find("g", { type: "service" }).filter(n => G.degree("g", n.id, { direction: "in" }) == 0).map(n => n.id);
// [ "svc:web", "svc:queue" ]

// How does the web tier reach the database?
G.path("g", "svc:web", "svc:db");                              // [ "svc:web", "svc:api", "svc:db" ]
```

Rebuild the graph from your CMDB, Kubernetes manifests or Terraform state on a schedule, and keep the file in version control to diff the architecture between releases.

### Review uncertain relations

`provenance` records how sure you are about a relation. Edges created without it are `AMBIGUOUS`, and heuristics (naming conventions, log correlation, an LLM) can mark theirs `INFERRED`. Use that to build a review queue and promote the edges a person confirms. Provenance is part of the edge identity, so promoting means unsetting the old edge and setting a new one.

```javascript
N("person:ana", "person");
$ch("g").set({ from: "person:ana", to: "svc:api", type: "OWNS" }, {});          // AMBIGUOUS

// Review queue: everything that is not certain
G.neighbors("g", "person:ana", { provenance: ["INFERRED", "AMBIGUOUS"] });

// Promote after confirmation
$ch("g").getKeys().filter(k => k.from).forEach(k => {
  var e = $ch("g").get(k);
  if (e.provenance == "AMBIGUOUS") {
    $ch("g").unset(k);
    $ch("g").set({ from: e.from, to: e.to, type: e.type, provenance: "EXTRACTED" }, { props: e.props });
  }
});
G.stats("g").provenance;                                       // only EXTRACTED edges left
```

### Ownership and "who do I ask?"

Add people, teams and topics as nodes with `OWNS`, `MEMBER_OF` or `KNOWS` edges. `path` finds the shortest chain between any two nodes, which turns into an escalation route or an explanation of why two things are related. `find` with `text` searches ids and properties, so it works as a quick lookup.

```javascript
G.find("g", { type: "person", text: "ana" });                  // who is Ana?
G.neighbors("g", "svc:api", { direction: "in", type: "OWNS" }).map(e => e.from);   // owners of the API
G.path("g", "person:ana", "svc:db");                           // how is Ana connected to the database?
```

### Export for visualization

Edge keys carry everything needed to draw the graph, so exporting to Mermaid (or Graphviz, or `oafp`) is a few lines.

```javascript
var lines = [ "graph LR" ];
$ch("g").getKeys().filter(k => k.from).forEach(k =>
  lines.push("  " + k.from.replace(/\W/g, "_") + " -->|" + k.type + "| " + k.to.replace(/\W/g, "_")));
io.writeFileString("infra.mmd", lines.join("\n"));
```

### Other ideas

- **Document and code maps**: `IMPORTS` or `LINKS_TO` edges between files, to find orphans (`degree` of 0) or circular references.
- **Data lineage**: `PRODUCES`/`CONSUMES` edges between jobs and datasets; `traverse` with `direction: "out"` shows everything downstream of a changed table.
- **Incident and runbook index**: link alerts, services and runbooks, then `neighbors` of an alert gives the runbook to follow.
- **Shared, read-only reference data**: ship a curated `graph.json` with an application and open it with `readOnly: true`.

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
