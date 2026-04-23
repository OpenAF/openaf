# Terminal Visualization Expansion Plan And Status

## Implementation Status (2026-04-23)

This document started as a plan. Most of the MVP and a meaningful part of the follow-up work are now implemented in `js/owrap.format.js`.

### Implemented

- `ow.format.term.getCapabilities()` and `ow.format.term.getPalette()`
- `ow.format.viz.diffFrames()`, `watchResize()`, `live()`, `createCanvas()` and `viz.layout`
- `printSparkline`, `printHistogram`, `printHeatmap`, `printBullet`, `printScatter`, `printBoxplot`, `printTimeline` and `printStatusMatrix`
- `printDashboard(...)` multi-widget composition
- `ow.format.string.grid(...)` support for `sparkline`, `histogram`, `heatmap`, `bullet`, `scatter`, `boxplot`, `timeline`, `statusMatrix`, `progress`, `md` and `text`
- RGB ANSI preparation support plus 16/256/truecolor palette-aware rendering
- `printBullet(..., { valueFormat: "raw" | "si" | "bytes" })`

### Still Open / Partial

- `diffFrames(...)` currently rewrites the full frame while still returning changed-line metadata; it is not yet a minimal line/segment patcher
- no dedicated `render(buffer, { diffFrom })` helper separate from `viz.live(...)`
- no documented `printTable` cell formatter bridge yet beyond the dashboard/grid composition path
- no formal benchmark suite or snapshot-test corpus dedicated to the new renderers

The sections below keep the original design intent so remaining work can still be tracked against the shipped surface area.

## Goals

Add a cohesive set of terminal-first visualization functions that complement existing OpenAF capabilities (`printChart`, `printTree`, `printTable`, and `owrap.format.js` helpers such as `grid`, `progress`, `withMD`) while keeping APIs modular, responsive to terminal size, and performant enough for near real-time updates.

## Guiding Principles

1. **Reuse before reinventing**: Build on `owrap.format`, existing table/tree/chart formatters, ANSI helpers, and progress/grid internals.
2. **Adaptive rendering**: Always render against current terminal width/height and degrade gracefully for tiny terminals.
3. **Composable building blocks**: Keep low-level components reusable by higher-level widgets.
4. **Streaming-friendly performance**: Minimize allocations, support incremental redraw, and avoid full-screen repaint when possible.
5. **Safe defaults + opt-in richness**: Auto-detect color/TTY capabilities and provide monochrome/ASCII fallbacks.

## Proposed Functional Scope

### 1) Color & Terminal Capability Layer

Introduce a shared capability resolver (single source of truth):

- `term.getCapabilities()`
  - Detects: TTY vs non-TTY, color depth (none/16/256/truecolor), unicode support, width/height.
  - Caches result with optional refresh.
- `term.getPalette(mode = "auto")`
  - Returns resolved palette tokens (semantic colors like `accent`, `positive`, `warning`, `negative`, `muted`, `gridLine`).
  - Supports user override and theme presets (`dark`, `light`, `high-contrast`).

This layer should be consumed by all new renderers and optionally by existing ones over time.

### 2) Core Layout & Canvas Primitives

Add lightweight primitives for deterministic, testable rendering:

- `viz.createCanvas({ width, height })`
  - 2D character buffer + style metadata.
  - Supports clipping, bounds checks, and batched writes.
- `viz.layout`
  - Box model helpers for padding/margins.
  - Horizontal/vertical splits with min/max constraints.
  - Terminal-relative dimensions (`50%`, `auto`).
- `viz.render(buffer, { diffFrom })`
  - Emits either full frame or ANSI diff updates for lower flicker.

These are internal foundations for reusable performance.

### 3) New Visualization Functions (256-color aware)

#### a) `printHeatmap(data, options)`

Use block characters and color ramps to represent matrix-like values.

- Auto scales by terminal width and height.
- Supports legends and thresholds.
- Uses semantic palette with fallback ramps for 16-color and mono.

#### b) `printSparkline(series, options)`

Inline and block variants for compact trend visualization.

- Can be embedded in `printTable` cells.
- Supports min/max markers and delta highlighting.

#### c) `printHistogram(values, options)`

Terminal-native frequency bars (horizontal/vertical modes).

- Optional bucket auto-selection and labels.
- Handles large distributions with downsampling.

#### d) `printTimeline(events, options)`

Event stream/time-axis renderer.

- Useful for logs and pipeline phases.
- Integrates with `withMD` formatting for descriptions.

#### e) `printDashboard(widgets, options)`

Grid-composed multi-widget renderer leveraging `owrap.format.js` grid semantics.

- Widgets can be table/tree/chart/progress/heatmap/sparkline.
- Responsive reflow based on current terminal size.

### 4) Real-Time Update API

Introduce a common live rendering contract:

- `viz.live(rendererFn, options)`
  - Handles setup, frame cadence, resize handling, cleanup.
  - Supports frame throttling (e.g., max FPS), backpressure, and manual `update()`.
- `viz.diffFrames(prev, next)`
  - Emits minimal ANSI patches for smooth updates.
- `viz.watchResize(callback)`
  - Recompute layout when terminal dimensions change.

Integrate with `progress` where possible to avoid competing cursor control logic.

### 5) Integration With Existing OpenAF APIs

- Extend `printChart` with optional color themes from shared palette.
- Add `printTable` cell format hooks for sparkline/mini-bar rendering.
- Reuse `printTree` indentation/line drawing rules in dashboard tree widgets.
- Map markdown emphasis from `withMD` to terminal style tokens.
- Expose all through `ow.format` (or nearest existing namespace) with backward-compatible options.

## Performance Strategy

1. **Diff-based rendering first** for live mode.
2. **String builder pooling** and compact buffer representations.
3. **Controlled sampling/downscaling** for large datasets.
4. **Frame budget awareness**: skip heavy transforms when previous frame is still in flight.
5. **Microbenchmarks** for key operations:
   - buffer write throughput
   - full render vs diff render
   - sparkline/table-cell rendering at scale

Target baseline: responsive updates at ~10–20 FPS for moderate terminal dashboards on common CI/dev machines.

## API Design Sketch

```javascript
const caps = ow.format.term.getCapabilities();

ow.format.printHeatmap(matrix, {
  color: "auto",
  legend: true,
  width: "100%",
  height: 20
});

const live = ow.format.viz.live(({ frame, size }) => {
  return ow.format.printDashboard([
    { type: "progress", data: buildProgress(frame) },
    { type: "sparkline", data: metrics.latency },
    { type: "table", data: topRows() }
  ], { width: size.width, height: size.height, returnBuffer: true });
}, { fps: 15 });

// later
live.stop();
```

## Implementation Phases

### Phase 0 — Discovery & Refactor Map

- Inventory existing terminal formatting/color/cursor logic.
- Identify reusable internals and duplication hotspots.
- Produce a dependency map and migration-safe extension points.

### Phase 1 — Foundation

- Implement capability + palette resolver.
- Add canvas/layout primitives with unit tests.
- Add render/diff engine with deterministic outputs.

### Phase 2 — First Widgets

- Implement `printSparkline`, `printHistogram`, `printHeatmap`.
- Add table cell embedding hooks.
- Validate fallback behavior for no-color/non-TTY.

### Phase 3 — Live Runtime + Dashboard

- Implement `viz.live` loop, resize watcher, and diff updates.
- Implement `printDashboard` grid compositor.
- Integrate with existing progress output semantics.

### Phase 4 — Hardening

- Performance tuning + microbenchmarks.
- Snapshot tests for renderer outputs.
- Documentation and examples.

## Testing Plan

1. **Unit tests**
   - capability detection normalization
   - palette token resolution
   - layout split correctness
   - renderer edge cases (tiny terminal, empty data)
2. **Golden snapshot tests**
   - stable output for heatmap/histogram/sparkline/dashboard across fixed sizes
3. **Live behavior tests**
   - resize reactions
   - diff patch correctness
   - cursor restore on error/interrupt
4. **Compatibility tests**
   - non-TTY pipes
   - low-color terminals
   - unicode-disabled mode

## Documentation Deliverables

- New docs section: “Terminal Visualization” with:
  - capability model and theming
  - each function with examples
  - live update best practices
  - performance tuning notes
- Migration notes proving no breaking changes for current users.

## Risks & Mitigations

- **ANSI fragmentation across terminals**: maintain compatibility matrix + conservative defaults.
- **Performance regressions**: benchmark gates for hot paths.
- **API sprawl**: keep naming consistent and options schema shared.
- **Flicker/cursor corruption**: centralize cursor and alternate-screen handling in one runtime module.

## Suggested Initial Milestone (MVP)

Deliver in first release:

- capability/palette resolver
- sparkline + histogram
- live diff runtime
- dashboard with table + progress + sparkline widgets

Then iterate with heatmap/timeline and deeper theming.
