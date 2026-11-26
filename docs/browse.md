# File browser options

`ow.server.httpd.browse.files(uri, options)` advertises effective `capabilities`.
`query.enabled` adds server sorting/paging and bounded literal recursive search.
`preview.formats` replaces the default extension viewers with an explicit map;
exact filename keys use `name:`, such as `name:Dockerfile: dockerfile`.
An empty map disables formatted previews. `preview.maxBytes` bounds formatted
reads without truncating raw downloads. Truncated structured files show escaped text.

`operations.enabled` reserves `@@/status`, `@@/freshness`, `@@/metrics`, and POST
`@@/refresh` below the browser URI. Refresh requires the token supplied by the
listing form and enforces a cooldown. Routes retain the application's existing
authentication. Status/freshness describe load times, not inferred source changes.
The metrics endpoint uses the existing strict OpenMetrics formatter.

The module is loaded lazily from the OpenAF JAR. Virtual `odoc` and `opacks`
browsers retain their callbacks and do not advertise filesystem enhancements.
oJob-common can provide its generic enhanced browser on the current OpenAF
runtime independently of this built-in browser update.

Shared behavior fixtures live in oJob-common's `.github/tests/browse-core-regressions.js`;
run them with `CORE_BROWSE_MODULE=jar` against a rebuilt OpenAF JAR to test embedded code.
