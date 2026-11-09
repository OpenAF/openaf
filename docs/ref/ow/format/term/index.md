# ow.format.term

[Home](../../../index.md) / [All APIs](../../../all-apis.md) / [ow](../../index.md) / [ow.format](../index.md) / [ow.format.term](index.md)

<a id="api-ow-format-term-getcapabilities-2488c104"></a>

## ow.format.term.getCapabilities

### ow.format.term.getCapabilities(aOptions) : Map

Returns a map with terminal capabilities, including width/height, tty/ansi availability and color depth. Detected base facts are cached unless aOptions.refresh = true. Width/height, ansi, unicode and colorMode overrides apply only to the current call; NO&#95;COLOR always disables colour.

Sources:

- js/owrap.format.js:1769

