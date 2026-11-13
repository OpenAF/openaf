# ow.format.viz

[Home](../../../index.md) / [All APIs](../../../all-apis.md) / [ow](../../index.md) / [ow.format](../index.md) / [ow.format.viz](index.md)

<a id="api-ow-format-viz-createcanvas-bbb80d22"></a>

## ow.format.viz.createCanvas

### ow.format.viz.createCanvas(aOptions) : Map

Creates a 2D character canvas with aOptions.width and aOptions.height (both default to terminal size). Returns a map with: width, height, write(row, col, str, style) and render() → String.

Sources:

- js/owrap.format.js:2081

<a id="api-ow-format-viz-diffframes-44966977"></a>

## ow.format.viz.diffFrames

### ow.format.viz.diffFrames(aPreviousFrame, aNextFrame, aOptions) : Map

Produces a terminal patch for replacing aPreviousFrame with aNextFrame and returns metadata for changed lines.

Sources:

- js/owrap.format.js:1903

<a id="api-ow-format-viz-layout-72e72940"></a>

## ow.format.viz.layout

### ow.format.viz.layout

Layout helpers: split(total, specs) splits a total dimension into sizes (numbers = fixed, "50%" = percentage, anything else = auto remainder). padLines(str, width, height, fillChar) pads/trims str to a fixed box.

Sources:

- js/owrap.format.js:2108

<a id="api-ow-format-viz-watchresize-3cfab210"></a>

## ow.format.viz.watchResize

### ow.format.viz.watchResize(callback, options) : Map

Polls terminal dimensions; returns a controller with `stop()`. Optional `getCapabilities`
supplies a capability map per poll for embedded terminals and deterministic tests.

Sources:

- js/owrap.format.js:1942

