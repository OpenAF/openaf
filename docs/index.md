# OpenAF Documentation Index

Core references and extended guides to build and operate oJobs and OpenAF solutions.

## Core
- ojob.md – Main oJob YAML reference (structure, jobs, built-ins)
- ojob-all.yaml – Exhaustive annotated YAML template
- openaf.md – Core OpenAF runtime helpers & APIs

## Security & Configuration
- ojob-security.md – Integrity, auditing, unique execution, channel exposure
- openaf-flags.md – Runtime flags / environment variables

## Advanced & Deep Dives
- openaf-advanced.md – Extended ow.* module coverage, patterns
- ojob-recipes.md – Practical, composable job recipes
- terminal-256-viz-plan.md – Terminal visualization status, shipped widgets, remaining gaps

## AI & Processing
- ow-ai-gpttypes.md – AI / LLM types (if present)
- llm-frontend-guide.md – Rules for generating offline-first OpenAF frontends with mapped HTTP libs/endpoints

## Getting Started Path
1. Read `openaf.md` (core helpers) & skim `ojob.md` basics.
2. Copy `ojob-all.yaml` as a scaffold.
3. Pick patterns from `ojob-recipes.md`.
4. Harden with `ojob-security.md` & tune via `openaf-flags.md`.
5. Explore advanced modules in `openaf-advanced.md`.

## Search Tips
Use `$path` expressions in templates for dynamic data extraction, and leverage built-in jobs `(if)`, `(parallel)`, `(repeat)` for control flow without writing raw JavaScript where possible.

### Advanced Features Highlighted
- **Enhanced Parameter Validation**: Comprehensive `_$()` validation chains with type conversion, regex matching, and range checking
- **Job Input/Output Validation**: Declarative `check.in` and `check.out` sections with fluent validation syntax
- **AI/LLM Integration**: Multi-provider LLM support (OpenAI, Anthropic, Gemini, Ollama) with function calling and image processing
- **MCP Client**: `$mcp()` for Model Context Protocol communication with stdio, HTTP, and SSE transports; OAuth2 (client credentials & authorization_code); tool blacklist (see `openaf-advanced.md` §20)
- **FTP/FTPS Client**: `$ftp()` shortcut for plain and TLS-secured FTP file transfers (see `openaf.md`)
- **HTTP Path Prefix**: Deploy the embedded HTTP server under a configurable subpath via `HTTPD_PREFIX` flag (see `openaf-advanced.md` §19, `openaf-flags.md`)
- **Telemetry & Metrics**: Built-in metrics collection, OpenMetrics format support, and integration with monitoring systems
- **Security Enhancements**: File integrity checking, authorized domains, and comprehensive audit trails
- **Async Promises**: `$do` / `$doV` helpers build on `oPromise` for threaded or virtual-thread asynchronous execution with familiar `.then` / `.catch` chaining.
- **Inline Argument Token Interpolation**: oJob args support `"${key}"` and `"prefix-${key}-suffix"` patterns with default values and backslash escaping (see `ojob.md`)
- **Terminal Visualization**: `ow.format.term`, `ow.format.viz`, `printDashboard`, `printHeatmap`, `printBullet`, `printScatter`, `printBoxplot`, `printTimeline` and `printStatusMatrix` provide terminal-first dashboards and live updates
- **$path Channel Queues**: `chq(name, op, max, value)` adds queue-like channel operations directly inside `$path(...)` expressions for push/pop/shift/size/get flows

---
This index is intentionally minimal—open individual docs for full tables of contents.
