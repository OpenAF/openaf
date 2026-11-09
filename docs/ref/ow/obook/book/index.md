# ow.oBook.book

[Home](../../../index.md) / [All APIs](../../../all-apis.md) / [ow](../../index.md) / [ow.oBook](../index.md) / [ow.oBook.book](index.md)

<a id="api-ow-obook-book-bookend-fdd10c1a"></a>

## ow.oBook.book.bookEnd

### ow.oBook.book.bookEnd()

Prints the oBook end banner and stops the watchLine/watchCommand loop. If exitOnEnd was set to true at construction time the process exits with code 0.

Sources:

- js/owrap.oBook.js:74

<a id="api-ow-obook-book-bookstart-79994561"></a>

## ow.oBook.book.bookStart

### ow.oBook.book.bookStart()

Prints the oBook start banner. Called once before the first page is shown.

Sources:

- js/owrap.oBook.js:91

<a id="api-ow-obook-book-interaction-08b89dd1"></a>

## ow.oBook.book.interaction

### ow.oBook.book.interaction()

Handles a single console interaction tick. On the first call the first page is shown. On subsequent calls it reads a key press: Enter/Space advances, Up/Down navigate, Ctrl+U exits to the console, 'q' or Escape quits. This method is called repeatedly via the watchLine mechanism when the book is running inside the OpenAF console.

Sources:

- js/owrap.oBook.js:103

<a id="api-ow-obook-book-parse-322d5f7e"></a>

## ow.oBook.book.parse

### ow.oBook.book.parse()

Parses the book string splitting it into alternating text/code sections using &#96;&#96;&#96;&#96;javascript and &#96;&#96;&#96;&#96;&#96;&#96;&#96;&#96; fenced block markers. Any &#42;requires pkg &#62;= version&#42; directives at the top of the book are processed via includeOPack(). The resulting structure is stored in this.struct.

Sources:

- js/owrap.oBook.js:207

<a id="api-ow-obook-book-printpart-c19d0c37"></a>

## ow.oBook.book.printPart

### ow.oBook.book.printPart(partId)

Renders the book section at index partId (0-based) including the progress indicator, the markdown text and any associated code block. When the code is multiline it is printed for copy-paste; when it is a single line it is written directly into the console input buffer.

Sources:

- js/owrap.oBook.js:32

