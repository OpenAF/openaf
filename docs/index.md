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

## AI & Processing
- ow-ai-gpttypes.md – AI / LLM types (if present)

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
- **Telemetry & Metrics**: Built-in metrics collection, OpenMetrics format support, and integration with monitoring systems
- **Security Enhancements**: File integrity checking, authorized domains, and comprehensive audit trails

---
This index is intentionally minimal—open individual docs for full tables of contents.
