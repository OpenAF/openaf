# ow.template.html

[Home](../../../index.md) / [All APIs](../../../all-apis.md) / [ow](../../index.md) / [ow.template](../index.md) / [ow.template.html](index.md)

<a id="api-ow-template-html-genstaticversion-042d8b5e"></a>

## ow.template.html.genStaticVersion

### ow.template.html.genStaticVersion(anOriginalHTML) : String

Tries to convert anOriginalHTML with "src" based tags like img, script &#38; stylesheet link tags into a single HTML embeeding  all content.

Sources:

- js/owrap.template.js:1706

<a id="api-ow-template-html-genstaticversion4md-af692dbb"></a>

## ow.template.html.genStaticVersion4MD

### ow.template.html.genStaticVersion4MD(anOriginalMD) : String

Tries to convert a markdown into a single HTML embeeding css and image contents.

Sources:

- js/owrap.template.js:1697

<a id="api-ow-template-html-genstaticversion4mdfile-52e4ca1a"></a>

## ow.template.html.genStaticVersion4MDFile

### ow.template.html.genStaticVersion4MDFile(anOriginalMDFile) : String

Tries to convert a markdown file into a single HTML embeeding css and image contents.

Sources:

- js/owrap.template.js:1688

<a id="api-ow-template-html-inlineimagetag-1002ed56"></a>

## ow.template.html.inlineImageTag

### ow.template.html.inlineImageTag(aImageFile, justPartial) : String

Returns a base64 representation of aImageFile to include in markdown/html content. If justPartial = true then only the src  part of the html img tag is returned.

Sources:

- js/owrap.template.js:1665

<a id="api-ow-template-html-inlinesrc-1557ec62"></a>

## ow.template.html.inlineSrc

### ow.template.html.inlineSrc(aFile, aPrefix, aSuffix) : String

Returns a base64 representation of aFile to include in markdown/html content. If aPrefix and/or aSuffix is provided it will be prefixed and suffixed to the output.

Sources:

- js/owrap.template.js:1626

<a id="api-ow-template-html-inlinesrcurl-f4387d10"></a>

## ow.template.html.inlineSrcURL

### ow.template.html.inlineSrcURL(aURL, aPrefix, aSuffix) : String

Returns a base64 representation of aURL to include in markdown/html content. If aPrefix and/or aSuffix is provided it will be prefixed and suffixed to the output.

Sources:

- js/owrap.template.js:1642

<a id="api-ow-template-html-njsmapautotheme-32263050"></a>

## ow.template.html.njsmapAutoTheme

### ow.template.html.njsmapAutoTheme() : String

Returns a script to automatically set the njsmap theme based on the user's preference if the MD&#95;DARKMODE flag is set to "auto".

Sources:

- js/owrap.template.js:1675

<a id="api-ow-template-html-parsemap-d4ddebc3"></a>

## ow.template.html.parseMap

### ow.template.html.parseMap(aMapOrArray, genParts, forceDark) : Object

Returns a string with a HTML representation of the aMapOrArray provided or, if genParts = true, a map with the style css and the out string necessary. If forceDark = true it will force the dark mode.

Sources:

- js/owrap.template.js:1541

<a id="api-ow-template-html-parsemapinhtml-88e155cf"></a>

## ow.template.html.parseMapInHTML

### ow.template.html.parseMapInHTML(aMapOrArray, forceDark) : String

Returns a full HTML page with the nJSMap representation of the aMapOrArray provided. If forceDark = true it will force the dark mode.

Sources:

- js/owrap.template.js:1569

<a id="api-ow-template-html-thinfontcss-5595b974"></a>

## ow.template.html.thinFontCSS

### ow.template.html.thinFontCSS(aSize) : String

Returns a CSS string for a thin font with the provided aSize (in points).

Sources:

- js/owrap.template.js:1594

<a id="api-ow-template-html-thinfontdiv-de6952b3"></a>

## ow.template.html.thinFontDiv

### ow.template.html.thinFontDiv(aTxt, aSize, aExtra) : String

Returns a HTML div part to write aTxt with the provided aSize (in points). Optionally aExtra css can be added.

Sources:

- js/owrap.template.js:1615

<a id="api-ow-template-html-thinfontspan-4cbd3148"></a>

## ow.template.html.thinFontSpan

### ow.template.html.thinFontSpan(aTxt, aSize, aExtra) : String

Returns a HTML span part to write aTxt with the provided aSize (in points). Optionally aExtra css can be added.

Sources:

- js/owrap.template.js:1604

