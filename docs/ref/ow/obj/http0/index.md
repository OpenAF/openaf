# ow.obj.http0

[Home](../../../index.md) / [All APIs](../../../all-apis.md) / [ow](../../index.md) / [ow.obj](../index.md) / [ow.obj.http0](index.md)

<a id="api-ow-obj-http0-close-8287f501"></a>

## ow.obj.http0.close

### ow.obj.http0.close()

Closes the current http connection response (if any) and shuts down the underlying Apache HTTP client, releasing any pooled connections it may be keeping open. The object remains usable afterwards: the next exec() call will transparently build a new underlying client.

Sources:

- js/owrap.obj.js:2634

