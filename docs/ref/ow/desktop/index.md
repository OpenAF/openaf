# ow.desktop

[Home](../../index.md) / [All APIs](../../all-apis.md) / [ow](../index.md) / [ow.desktop](index.md)

<a id="api-ow-desktop-info-c5d981c4"></a>

## ow.desktop.info

### ow.desktop.info() : Map

Returns session state, selected provider and actual capabilities. Does not start a toolkit.

Sources:

- js/owrap.desktop.js:118

<a id="api-ow-desktop-registerprovider-10510718"></a>

## ow.desktop.registerProvider

### ow.desktop.registerProvider(aProvider)

Registers a provider implementing SPI version 1 before the desktop session starts. Providers expose describe, probe, start, request and stop. Used by optional oPacks and contract tests.

Sources:

- js/owrap.desktop.js:56

<a id="api-ow-desktop-shutdown-66a9d87c"></a>

## ow.desktop.shutdown

### ow.desktop.shutdown() : oPromise

Stops only the desktop session and its owned helper/server. Idempotent.

Sources:

- js/owrap.desktop.js:400

<a id="api-ow-desktop-start-58af31a2"></a>

## ow.desktop.start

### ow.desktop.start() : oPromise

Initializes the selected runtime and resolves to info(), including actual capabilities, without creating a window.

Sources:

- js/owrap.desktop.js:125

<a id="api-ow-desktop-wait-c4121c01"></a>

## ow.desktop.wait

### ow.desktop.wait(aTimeoutMs)

Keeps a standalone script alive until windows close, then shuts down desktop resources. An optional deadline raises TIMEOUT after cleanup. Do not call from a desktop callback.

Sources:

- js/owrap.desktop.js:417

<a id="api-ow-desktop-window-b470eb57"></a>

## ow.desktop.window

### ow.desktop.window(aOptions) : Object

Creates a provider-neutral handle. Exactly one of html, url, file or a declarative view is required. Commands return oPromises; on/off subscribe to ready, message, closed and error events.

Sources:

- js/owrap.desktop.js:311

