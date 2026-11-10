# ow.screen

[Home](../../index.md) / [All APIs](../../all-apis.md) / [ow](../index.md) / [ow.screen](index.md)

<a id="api-ow-screen-align-a96f9097"></a>

## ow.screen.align

### ow.screen.align(aText, aWidth, aAlign, aFillChar, aFillStyle) : String

Aligns multi-line text ("left", "center", or "right") to aWidth visible columns per line.

Sources:

- js/owrap.screen.js:271

<a id="api-ow-screen-alignline-09209582"></a>

## ow.screen.alignLine

### ow.screen.alignLine(aText, aWidth, aAlign, aFillChar, aFillStyle) : String

Aligns a single line of text ("left", "center", or "right") within aWidth visible columns, clipping if longer and padding with aFillChar (optionally styled with aFillStyle). Full UTF-8 wide characters and ANSI sequences are preserved accurately.

Sources:

- js/owrap.screen.js:241

<a id="api-ow-screen-borderchars-e9da1290"></a>

## ow.screen.borderChars

### ow.screen.borderChars(aStyle, aUnicode) : Map

Returns the box-drawing characters for aStyle ("rounded", "single", "double", "heavy", "left", "ascii", "none"). Automatically falls back to "ascii" when aUnicode is false.

Sources:

- js/owrap.screen.js:372

<a id="api-ow-screen-box-21920b6c"></a>

## ow.screen.box

### ow.screen.box(aContent, aOptions) : String

Renders a bordered box/panel around aContent (string or array of lines). Options: width, height, title, titleAlign ("left", "center", "right"), footer, footerAlign, align ("left", "center", "right"), padding (number or &#123;top,bottom,left,right&#125;), borderStyle ("rounded", "single", "double", "heavy", "left", "ascii", "none"), borderColor/borderStyleSpec, titleStyle, style, bgStyle, shadow (boolean).

Sources:

- js/owrap.screen.js:411

<a id="api-ow-screen-capabilities-78b110c3"></a>

## ow.screen.capabilities

### ow.screen.capabilities(aOptions) : Map

Detects terminal capabilities including colorMode ("none", "16", "256", "truecolor"), colorDepth, unicode support, width, and height. Respects NO&#95;COLOR, FORCE&#95;COLOR, COLORTERM, and TERM.

Sources:

- js/owrap.screen.js:20

<a id="api-ow-screen-clip-46f31cea"></a>

## ow.screen.clip

### ow.screen.clip(aText, aWidth, aEllipsis) : String

Clips aText to at most aWidth visible columns without splitting UTF-8 grapheme clusters or ANSI escapes.

Sources:

- js/owrap.screen.js:232

<a id="api-ow-screen-colorseq-f244a0db"></a>

## ow.screen.colorSeq

### ow.screen.colorSeq(aSpec, isBackground, aColorMode) : String

Returns SGR colour parameters for the requested colour depth.

Sources:

- js/owrap.screen.js:73

<a id="api-ow-screen-configure-6ea82e02"></a>

## ow.screen.configure

### ow.screen.configure(aOptions) : ow.screen

Configures default screen options (theme, colorMode, unicode, borderStyle, align, spacing, padding, etc.).

Sources:

- js/owrap.screen.js:9

<a id="api-ow-screen-gettheme-9ef938fc"></a>

## ow.screen.getTheme

### ow.screen.getTheme(aTheme, aColorMode, aOverrides) : Map

Returns a resolved TUI theme map for the given theme name ("default", "ocean", "light", "monochrome") or custom theme object and colorMode ("none", "16", "256", "truecolor").

Sources:

- js/owrap.screen.js:717

<a id="api-ow-screen-graphemes-0c2220d6"></a>

## ow.screen.graphemes

### ow.screen.graphemes(aText) : Array

Splits a plain UTF-8 string into user-perceived grapheme clusters (handling surrogate pairs, combining marks, skin-tone modifiers, variation selectors, keycaps, regional indicator flags, and ZWJ sequences).

Sources:

- js/owrap.screen.js:201

<a id="api-ow-screen-hr-89bfa50b"></a>

## ow.screen.hr

### ow.screen.hr(aWidth, aOptions) : String

Renders a horizontal rule / divider of aWidth columns with optional label, align ("left", "center", "right"), character, and style.

Sources:

- js/owrap.screen.js:386

<a id="api-ow-screen-interact-516c9091"></a>

## ow.screen.interact

### ow.screen.interact(aOptions) : Map

Runs a persistent `console`, `tui` or `javafx` view. Options include `view`,
`state`, `bindings` (event keys such as `action:save`, `change:name`, `init`,
`timer`), `reducer`, `interval` in milliseconds and `concurrency` (default 4).
Bindings are job names or `{job, args}` maps. Handlers receive independent
`event`, `values` and `state` snapshots. The reducer receives current `state`,
`event`, `result` and `error`, returning `state`, optional `view` and `close`.
`consoleUI` and `terminalUI` can provide borrowed console/TUI terminal adapters.
Closing drains handlers. Jobs must coordinate their own external side effects.

Sources:

- js/owrap.screen.js:835

<a id="api-ow-screen-keybar-dbf5679b"></a>

## ow.screen.keybar

### ow.screen.keybar(aBindings, aWidth, aOptions) : String

Renders a Textual-style keybinding footer/status bar from an array of &#123; key, label &#125; maps (or &#91;key, label&#93; pairs), styling keys as high-contrast badges and descriptions with the status bar style.

Sources:

- js/owrap.screen.js:791

<a id="api-ow-screen-parsecolor-0c0e8930"></a>

## ow.screen.parseColor

### ow.screen.parseColor(aSpec) : Map

Parses named, indexed or RGB colours. Returns null for invalid colours.

Sources:

- js/owrap.screen.js:68

<a id="api-ow-screen-parsestyle-c85bfb33"></a>

## ow.screen.parseStyle

### ow.screen.parseStyle(aStyle) : Map

Parses a style string (e.g. "BOLD,ITALIC,FG(39),BG(&#35;1e1e2e)") or style map (&#123; fg, bg, bold, dim, faint, italic, underline, doubleUnderline, blink, invert, reverse, hidden, strikethrough, align &#125;) into a normalized style map.

Sources:

- js/owrap.screen.js:81

<a id="api-ow-screen-progress-5c9e3e87"></a>

## ow.screen.progress

### ow.screen.progress(aValue, aMax, aMin, aWidth, aOptions) : String

Renders a smooth Unicode/ASCII progress bar with optional percentage/label and 16/256/truecolor styling. Options include: label, showPercent, smooth (default true, uses 1/8th sub-cell blocks), barStyle ("bracket" default, "thin" for ━/─ without brackets, "bar" for █/░ without brackets), theme, filledStyle, emptyStyle, labelStyle, percentStyle.

Sources:

- js/owrap.screen.js:737

<a id="api-ow-screen-run-7766dbe2"></a>

## ow.screen.run

### ow.screen.run(aViewOrWindowOptions, aOnMessageFn, aDesktopOptions) : Object

Convenience helper to launch an interactive TUI view session using ow.desktop(&#123; provider: "tui" &#125;).

Sources:

- js/owrap.screen.js:819

<a id="api-ow-screen-sanitize-be0f3907"></a>

## ow.screen.sanitize

### ow.screen.sanitize(aText, allowMultiline) : String

Sanitizes untrusted application text by stripping ANSI/OSC escape sequences and C0/C1 control characters.

Sources:

- js/owrap.screen.js:189

<a id="api-ow-screen-sgr-3083b0fe"></a>

## ow.screen.sgr

### ow.screen.sgr(aStyle, aColorMode) : String

Returns the complete ANSI SGR escape sequence (e.g. "&#92;x1b&#91;1;3;38;5;39m") for aStyle. Returns "" if no attributes are active or colorMode is "none" (unless force is used).

Sources:

- js/owrap.screen.js:140

<a id="api-ow-screen-space-4745ca75"></a>

## ow.screen.space

### ow.screen.space(aLines, aOptions) : Array

Applies padding (&#123; top, bottom, left, right &#125; or number) and margins (&#123; top, bottom, left, right &#125; or number) and item gap spacing to an array of lines or string.

Sources:

- js/owrap.screen.js:321

<a id="api-ow-screen-stripansi-1e3452bf"></a>

## ow.screen.stripAnsi

### ow.screen.stripAnsi(aText) : String

Removes ANSI CSI and OSC escape sequences from aText.

Sources:

- js/owrap.screen.js:181

<a id="api-ow-screen-style-66c4753b"></a>

## ow.screen.style

### ow.screen.style(aText, aStyle, aOptions) : String

Applies rich ANSI styling (foreground/background 16/256/truecolor, bold, dim/faint, italic, underline, doubleUnderline, blink, reverse/invert, hidden, strikethrough) to aText. Preserves nested resets by re-applying the outer SGR sequence before continuing.

Sources:

- js/owrap.screen.js:163

<a id="api-ow-screen-width-7149e3fa"></a>

## ow.screen.width

### ow.screen.width(aText) : Number

Returns the visible terminal column width of aText (ignoring ANSI sequences and counting wide CJK/emoji as 2 columns).

Sources:

- js/owrap.screen.js:224

<a id="api-ow-screen-wrap-74787ac4"></a>

## ow.screen.wrap

### ow.screen.wrap(aText, aWidth) : Array

Word-wraps aText to aWidth visible columns (preserving grapheme clusters, wide characters, and ANSI codes) and returns an array of wrapped lines.

Sources:

- js/owrap.screen.js:282

