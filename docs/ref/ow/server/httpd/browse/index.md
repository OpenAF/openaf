# ow.server.httpd.browse

[Home](../../../../index.md) / [All APIs](../../../../all-apis.md) / [ow](../../../index.md) / [ow.server](../../index.md) / [ow.server.httpd](../index.md) / [ow.server.httpd.browse](index.md)

<a id="api-ow-server-httpd-browse-files-c9f11c3e"></a>

## ow.server.httpd.browse.files

### ow.server.httpd.browse.files(aURI, aOptions) : Map

Provides a simple file browser for the provided `aURI`. The `aOptions` map can contain the following keys:

- `path` (string) The path to use as root (defaults to ".")
- `browse` (boolean) If true the file browser will be shown (defaults to true)
- `showURI` (boolean) If true the URI will be shown in the file browser (defaults to false)
- `sortTab` (boolean) If true the table will be sorted (defaults to false)
- `default` (string) The default file to show (defaults to undefined)
- `logo` (string) The logo to show in the file browser (defaults to undefined)
- `footer` (string) The footer to show in the file browser (defaults to undefined)

Sources:

- js/owrap.server.js:5184

<a id="api-ow-server-httpd-browse-odoc-571c1b36"></a>

## ow.server.httpd.browse.odoc

### ow.server.httpd.browse.odoc(aURI, aOptions) : Map

Provides a simple oDoc browser. The `aOptions` map can contain the following keys:

- `browse` (boolean) If true the file browser will be shown (defaults to true)
- `showURI` (boolean) If true the URI will be shown in the file browser (defaults to false)
- `sortTab` (boolean) If true the table will be sorted (defaults to false)
- `logo` (string) The logo to show in the file browser (defaults to undefined)
- `footer` (string) The footer to show in the file browser (defaults to undefined)
- `ttl` (number) The time to live for the cache (defaults to 5 minutes)

Sources:

- js/owrap.server.js:5462

<a id="api-ow-server-httpd-browse-opacks-9d1ec6c5"></a>

## ow.server.httpd.browse.opacks

### ow.server.httpd.browse.opacks(aURI, aOptions) : Map

Provides a simple oPack browser. The `aOptions` map can contain the following keys:

- `browse` (boolean) If true the file browser will be shown (defaults to true)
- `showURI` (boolean) If true the URI will be shown in the file browser (defaults to false)
- `sortTab` (boolean) If true the table will be sorted (defaults to false)
- `logo` (string) The logo to show in the file browser (defaults to undefined)
- `footer` (string) The footer to show in the file browser (defaults to undefined)
- `ttl` (number) The time to live for the cache (defaults to 5 minutes)

Sources:

- js/owrap.server.js:5547

