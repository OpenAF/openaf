# Changelog

Notable documentation and feature additions. Dates refer to the docs refresh cycle in which each item was added.

## 2026-04 — Terminal Visualization
- Added a terminal-focused visualization layer on top of `ow.format` intended for CLI dashboards, status views, quick exploratory output and streaming monitors.
- New renderers: `printSparkline`, `printHistogram`, `printHeatmap`, `printScatter`, `printBoxplot`, `printTimeline`, `printStatusMatrix`, `printBullet`, `printDashboard`.
- Terminal capability helpers: `ow.format.term.getCapabilities()`, `ow.format.term.getPalette()`.
- Live updates via `ow.format.viz.live()`, `ow.format.viz.diffFrames()`, `ow.format.viz.watchResize()`.
- See [openaf.md](docs/openaf.md) §14 and [openaf-advanced.md](docs/openaf-advanced.md) §16.

## 2026-03 — Docs Refresh
- Comprehensive documentation refresh for oJob, OpenAF core, plugins, oafp, odoc, opacks, python, sigil, obook, and testing.
- Added LLM integration guides: [llm-guide.md](docs/llm-guide.md), [llm-tui-guide.md](docs/llm-tui-guide.md), [llm-frontend-guide.md](docs/llm-frontend-guide.md).
- Added [ow-ai-gpttypes.md](docs/ow-ai-gpttypes.md) for AI/LLM provider wrappers.
- Added security documentation: [ojob-security.md](docs/ojob-security.md).
- Added [testing.md](docs/testing.md) for test framework guidelines.