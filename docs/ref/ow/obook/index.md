# ow.oBook

[Home](../../index.md) / [All APIs](../../all-apis.md) / [ow](../index.md) / [ow.oBook](index.md)

## Subcategories

- [ow.oBook.book](book/index.md)

<a id="api-ow-obook-book-d47dd6df"></a>

## ow.oBook.book

### ow.oBook.book(aBook, exitOnEnd)

Creates an interactive tutorial book from aBook, which can be a file path to a markdown file or a markdown string. The book alternates text sections with fenced &#96;&#96;&#96;&#96;javascript code blocks that the user can copy or execute interactively at the OpenAF console. If exitOnEnd is true the process exits when the last page is acknowledged.

Sources:

- js/owrap.oBook.js:11

