# ow.format.string

[Home](../../../index.md) / [All APIs](../../../all-apis.md) / [ow](../../index.md) / [ow.format](../index.md) / [ow.format.string](index.md)

<a id="api-ow-format-string-ansiclip-88c10bd2"></a>

## ow.format.string.ansiClip

### ow.format.string.ansiClip(aStr, aWidth, aEllipsis) : String

Clips aStr to, at most, aWidth visible columns (wide emoji count as 2) without ever cutting an ANSI escape sequence. If clipped, aEllipsis (default "…") is appended and any open ANSI styling is reset.

Sources:

- js/owrap.format.js:933

<a id="api-ow-format-string-ansimovedown-3469c25a"></a>

## ow.format.string.ansiMoveDown

### ow.format.string.ansiMoveDown(nLines)

Moves the cursor nLines down.

Sources:

- js/owrap.format.js:992

<a id="api-ow-format-string-ansimoveleft-dd565e09"></a>

## ow.format.string.ansiMoveLeft

### ow.format.string.ansiMoveLeft(nChars)

Moves the cursor left chars.

Sources:

- js/owrap.format.js:1014

<a id="api-ow-format-string-ansimoveright-dbce2e3b"></a>

## ow.format.string.ansiMoveRight

### ow.format.string.ansiMoveRight(nChars)

Moves the cursor right chars.

Sources:

- js/owrap.format.js:1003

<a id="api-ow-format-string-ansimoveup-aac05a5c"></a>

## ow.format.string.ansiMoveUp

### ow.format.string.ansiMoveUp(nLines)

Moves the cursor nLines up.

Sources:

- js/owrap.format.js:981

<a id="api-ow-format-string-ansipad-bfe94a2c"></a>

## ow.format.string.ansiPad

### ow.format.string.ansiPad(aStr, aWidth) : String

Right-pads aStr with spaces up to aWidth visible columns (ANSI escape sequences and wide emoji are accounted for). Never truncates.

Sources:

- js/owrap.format.js:968

<a id="api-ow-format-string-ansiscrolldown-11460da2"></a>

## ow.format.string.ansiScrollDown

### ow.format.string.ansiScrollDown(nLines)

Scrolls the screen down by nLines.

Sources:

- js/owrap.format.js:1036

<a id="api-ow-format-string-ansiscrollup-5fd994f0"></a>

## ow.format.string.ansiScrollUp

### ow.format.string.ansiScrollUp(nLines)

Scrolls the screen up by nLines.

Sources:

- js/owrap.format.js:1025

<a id="api-ow-format-string-bestprefix-8657414d"></a>

## ow.format.string.bestPrefix

### ow.format.string.bestPrefix(aString, anArrayOfStrings) : aString

Given `anArrayOfStrings` will try to find the best prefix string on that array for the provided `aString`.
See `ow.format.string.closest` if you don't want to be based on the prefix.
Example:

```javascript
var anArrayOfStrings = [ "/user", "/use", "/username", "/u" ];
ow.format.string.bestPrefix("/user/1", anArrayOfStrings); // Returns /user
ow.format.string.bestPrefix("/u1", anArrayOfStrings); // Returns /u
ow.format.string.bestPrefix("/userna", anArrayOfStrings); // Returns /user
```

Sources:

- js/owrap.format.js:464

<a id="api-ow-format-string-bool-1a591ca7"></a>

## ow.format.string.bool

### ow.format.string.bool(aBoolValue, isLight, anExtra) : String

Given aBoolValue will return a green checkmark or a red cross character. If necessary anExtra ansiColor attributes can be added.

Sources:

- js/owrap.format.js:1047

<a id="api-ow-format-string-chart-c55dc4f3"></a>

## ow.format.string.chart

### ow.format.string.chart(aName, aDataPoint, aHSIze, aVSize, aMin, aMax, aTheme) : String

Given data aName will store, between calls, aDataPoint provided to plot a chart with a horizontal aHSize and a vertical aVSize. Optionally aMin value and aMax value can be provided. aTheme can optionally also be provided containing the map entries space (char), bar (char), point (char), vertical (boolean) and axis (boolean)

Sources:

- js/owrap.format.js:853

<a id="api-ow-format-string-closest-934fd554"></a>

## ow.format.string.closest

### ow.format.string.closest(aString, anArrayOfStrings, aThreshold) : aString

Given `anArrayOfStrings` will try to find the closest string on that array for the provided `aString`.
If `aThreshold` is not provided a default value of 3 will be used.
See `ow.format.string.bestPrefix` if you want to be based on the prefix.
Example:

```javascript
var anArrayOfStrings = [ "/user", "/use", "/username", "/u" ];
ow.format.string.closest("/user/1", anArrayOfStrings); // Returns /user
ow.format.string.closest("/u1", anArrayOfStrings); // Returns /u
ow.format.string.closest("/userna", anArrayOfStrings); // Returns /user
ow.format.string.closest("/usernam", anArrayOfStrings); // Returns /username
```

Sources:

- js/owrap.format.js:364

<a id="api-ow-format-string-dataclean-7bc6f196"></a>

## ow.format.string.dataClean

### ow.format.string.dataClean(aName)

Given aName for data points entered using ow.format.string.chart and ow.format.string.dataLineChart will effectively delete all cached data. If aName is not provided it will eliminate of cached data.

Sources:

- js/owrap.format.js:778

<a id="api-ow-format-string-datalinechart-9a914598"></a>

## ow.format.string.dataLineChart

### ow.format.string.dataLineChart(aName, aDataPoint, aHSIze, aVSize, aOptions) : String

Given data aName will store, between calls, aDataPoint (number or array of numbers) provided to plot a line chart with a horizontal aHSize and a vertical aVSize. Optionally aOptions, equivalent to ow.format.string.lineChart options, can optionally also be provided.

Sources:

- js/owrap.format.js:795

<a id="api-ow-format-string-distance-544d86c7"></a>

## ow.format.string.distance

### ow.format.string.distance(aStringA, aStringB, maxOffset) : Number

Calculates the distance between aStringA and aStringB into the number of inserts, deletions and updates needed. If the maxOffset is not provided a value of 5 maximum characters difference will be  used. (Currently based on Sift4)

Sources:

- js/owrap.format.js:404

<a id="api-ow-format-string-genpass-be4f1f32"></a>

## ow.format.string.genPass

### ow.format.string.genPass(aSize, aSets, aExclude, aWeights) : String

Tries to generate a random password with aSize (defaults to 12) optionally given an array of aSets (between lowercase, uppercase, numbers, symbols and symbols2) and also aExclude a string of characters given an optional percentage of aWeights probability for each aSets.

Sources:

- js/owrap.format.js:37

<a id="api-ow-format-string-getastralcodepoint-9d2c7502"></a>

## ow.format.string.getAstralCodePoint

### ow.format.string.getAstralCodePoint(aHighSurrogate, aLowSurrogate) : Number

Given a 8-bit aHighSurrogate code and a 8-bit aLowSurogate code returns a 16-bit unicode code

Sources:

- js/owrap.format.js:98

<a id="api-ow-format-string-getsurrogatepair-19057387"></a>

## ow.format.string.getSurrogatePair

### ow.format.string.getSurrogatePair(astralCodePoint) : Array

Returns an array of two 8 bit codes given an unicode astralCodePoint of 16 bits

Sources:

- js/owrap.format.js:87

<a id="api-ow-format-string-grid-19a1b13c"></a>

## ow.format.string.grid

### ow.format.string.grid(aMatrix, aX, aY, aBgPattern, shouldReturn) : String

Renders a live terminal grid composed of cells defined by `aMatrix` (an array of rows, each row an array of cell maps).
`aX` sets the height per row in lines (defaults to terminal height / number of rows), `aY` sets the total width in characters
(defaults to terminal width). `aBgPattern` is the background fill character (defaults to " "). If `shouldReturn` = true the
result is returned as a string instead of printed with cursor-up (for live-update loops).

Each cell is a map with the following fields:

- `obj`: the data to render (type-dependent, see below)
- `type`: rendering type — map, tree, table, chart, area, bar, func, sparkline, histogram, heatmap, bullet, scatter, boxplot, timeline, statusMatrix, progress, md or text (default: tree for maps/arrays, text otherwise)
- `title`: optional column heading rendered as "> title ────" above the cell content
- `xspan`: number of columns this cell spans horizontally (default: 1)
- `yspan`: number of rows this cell spans vertically (default: 1)

Per-type 'obj' format and extra options:

- `text/md`: obj is a string; md renders markdown
- `map`: obj is a map rendered with printMap
- `tree/table`: obj is a map or array rendered with `ow.format`
- `chart/area`: obj is a printChart format string
- `bar`: obj is a printBars format string (e.g. "int 42:red:label"); delegates to printBars and supports max, min, indicator, space
- `func`: obj is a JS function body string receiving mx (height) and my (width), must return a string
- `sparkline`: obj is a number array or multi-series array (see `ow.format.printSparkline`)
- `histogram`: obj is a number array (see `ow.format.printHistogram`)
- `heatmap`: obj is a number matrix or { values, xLabels, yLabels } (see `ow.format.printHeatmap`)
- `bullet`: obj is a map or array of maps with { value, target, min, max, ranges, label }; supports target, ranges, label, unit, showValue and valueFormat in options (see `ow.format.printBullet`)
- `scatter`: obj is an array of [x,y] or { x, y, symbol, color } points (see `ow.format.printScatter`)
- `boxplot`: obj is a number array or array of { values, label } series (see `ow.format.printBoxplot`)
- `timeline`: obj is an array of { label, start, end, color, status } events (see `ow.format.printTimeline`)
- `statusMatrix`: obj is a matrix or { values, xLabels, yLabels } of status values (see `ow.format.printStatusMatrix`)
- `pie/donut/stackedBar`: obj is a category array or value map; options match the corresponding renderer
- `stackedColumns`: obj is an array of { label, values } columns
- `divergingBars`: obj is a signed category array or value map
- `treemap`: obj is a non-negative category array or value map
- `progress`: obj is a number or { value, max, min } map

Each cell delegates rendering to `ow.format.printDashboard`.

Sources:

- js/owrap.format.js:1272

<a id="api-ow-format-string-leftpad-cf37e285"></a>

## ow.format.string.leftPad

### ow.format.string.leftPad(aString, length, padExpression) : String

Using a padExpression will left pad aString for the given length.

Sources:

- js/owrap.format.js:515

<a id="api-ow-format-string-linechart-c6a1bbda"></a>

## ow.format.string.lineChart

### ow.format.string.lineChart(aSeries, aOptions) : String

Given an array of values (1 series) or an array of arrays of values (multiple series) will plot a line chart in
ascii, with the provided `aOptions`, a return the corresponding string. Available options:

- `min` (number) The minimum value to use in the chart
- `max` (number) The maximum value to use in the chart
- `height` (number) The line chart lines height to use
- `width` (number) The maximum width of the line chart
- `colors` (array) Array of color names to use for each series
- `label` (boolean) Boolean value to indicate if y labels should be included (default true)
- `format` (function) Custom functions that receives a value and returns a formatted string for labels
- `dColor` (string) The default color to use
- `offset` (number) The offset to assume (default 2)
- `padding` (string) The chart padding string (default "")
- `fixed` (number) If no custom format function is provided will be the fixed decimals to use (default 2)
- `symbols` (array) An array of 10 characters to replace the default symbols

Sources:

- js/owrap.format.js:588

<a id="api-ow-format-string-linechartlegend-c03facd2"></a>

## ow.format.string.lineChartLegend

### ow.format.string.lineChartLegend(titles, options) : Array

Given an array of titles and the options provided to ow.format.string.lineChart will return an array with each "symbol" and color used for each series and the corresponding "title".

Sources:

- js/owrap.format.js:744

<a id="api-ow-format-string-lshash-2d42f6ab"></a>

## ow.format.string.lsHash

### ow.format.string.lsHash(aStringA, aStringB, dontCareDiffSize) : String

Generates a locality sensitive hash for `aStringA`. If `aStringB` is provided it will compute the
hash difference between `aStringA` and `aStringB` returning a number (if 0 means the strings are almost
identical; if 200 or higher means the strings are very different). Optionally you can indicate that the
difference should care about differences in size `dontCareDiffSize` = true. This is based on https://github.com/trendmicro/tlsh/blob/master/js_ext.

Note: A `aStringA` and `aStringB` should be, at least, 512 characters long and have enough randomness to
generate a proper hash.

Sources:

- js/owrap.format.js:539

<a id="api-ow-format-string-lshashdiff-7cc4d6c4"></a>

## ow.format.string.lsHashDiff

### ow.format.string.lsHashDiff(aHashA, aHashB, dontCareDiffSize) : String

From a previously created, with ow.format.string.lsHash, aHashA and aHashB will calculate  the difference between them returning a number (if 0 means the strings are almost identical; if 200 or higher means the strings are very different). Optionally you can indicate that the difference should care about differences in size dontCareDiffSize = true. This is based on https://github.com/trendmicro/tlsh/blob/master/js&#95;ext.

Sources:

- js/owrap.format.js:569

<a id="api-ow-format-string-nlinestemplate-143d0743"></a>

## ow.format.string.nLinesTemplate

### ow.format.string.nLinesTemplate(aSourceTemplate, initMap, alternativeTemplate, alternativePrintFunction) : Function

Returns a function to print multiple lines at the same time (using ansi cursor up). The function accepts a map parameter since it's based on the aSourceTemplate (handlebars). The initial render is performed using initMap. If ansi support is not  available and if alternativeTemplate is defined (and different of "" otherwise it defaults to aSourceTemplate) it will use it as alternative. Optionally it's also possible to define a different print function (alternativePrintFunction) to print (like log, for example).

Sources:

- js/owrap.format.js:1205

<a id="api-ow-format-string-pausestring-0170fda1"></a>

## ow.format.string.pauseString

### ow.format.string.pauseString(aString, aMsg)

Given aString starts an interactive paging of the contents of aString. PgUp/Left and PgDown/Right move by a page; Up/Down move by a line. Shift+Left/Home jumps to the top and Shift+Right/End jumps to the bottom. Shift+PgUp and Shift+PgDown are also supported as top/bottom aliases. At the bottom navigation remains available; forward paging or any ordinary key exits. Use q to quit. Press / to find literal text, Enter to search, Escape to cancel, and n/N for next/previous match. Search ignores case unless the query contains uppercase letters; matches wrap at either end. An empty search clears matches. ANSI styling is ignored when searching and preserved when highlighting. Text fitting on one screen is printed immediately without waiting for input. Optionally aMsg can be provided to be displayed with the paging percentage (use &#92;&#123;&#123;percentage&#125;&#125; to be replaced by the percentage).

Sources:

- js/owrap.format.js:1423

<a id="api-ow-format-string-printable-12574ed6"></a>

## ow.format.string.printable

### ow.format.string.printable(aByteArray, aDefaultChar) : String

Tries to convert aByteArray into a printable string. If aDefaultChar to replace the non-printable characters is not provided it will default to ".".

Sources:

- js/owrap.format.js:1144

<a id="api-ow-format-string-progress-132e5068"></a>

## ow.format.string.progress

### ow.format.string.progress(aNumericValue, aMax, aMin, aSize, aIndicator, aSpace) : String

Outputs an in-line progress bar given `aNumericValue`, `aMax` value, `aMin` value, the `aSize` of the bar and the `aIndicator`
to use. If not provided, `aMax` defaults to `aValue`, `aMin` defaults to 0, `aSize` defaults to the current screen width (or 5 if
if can be determined), `aIndicator` defaults to "#"
and `aSpace` defaults to " ". If `aSize` is a negative value and it's possible to determine the current screen width it will
subtract to the screen width. Example:

```javascript
loadLodash(); ow.loadFormat();
var arr = [-30, -25, -10, 0, 3, 5], max = _.max(arr), min = _.min(arr);
for(let i in arr) {
   print(ow.format.string.progress(arr[i], max, min, 5, '-'));
}
```

Sources:

- js/owrap.format.js:1084

<a id="api-ow-format-string-renderlines-9f458915"></a>

## ow.format.string.renderLines

### ow.format.string.renderLines(aMatrix, numberOfLines, aWidth, aBgPattern, shouldReturn) : String

Tries to render a string grid (if shouldReturn = true won't print it but jsut return it) for a specific aWidth for a numberOfLines with aBgPattern background pattern (defaults to " ") with aMatrix contents (divided by "&#92;n").

Sources:

- js/owrap.format.js:1246

<a id="api-ow-format-string-rightpad-b679fd3e"></a>

## ow.format.string.rightPad

### ow.format.string.rightPad(aString, length, padExpression) : String

Using a padExpression will right pad aString for the given length.

Sources:

- js/owrap.format.js:527

<a id="api-ow-format-string-separatorstounix-4145ac5c"></a>

## ow.format.string.separatorsToUnix

### ow.format.string.separatorsToUnix(aFilenamePath) : String

Tries to convert the provided aFilenamePath into a path with unix folder separators.

Sources:

- js/owrap.format.js:495

<a id="api-ow-format-string-separatorstowindows-530f6689"></a>

## ow.format.string.separatorsToWindows

### ow.format.string.separatorsToWindows(aFilenamePath) : String

Tries to convert the provided aFilenamePath into a path with windows folder separators.

Sources:

- js/owrap.format.js:505

<a id="api-ow-format-string-tabexpand-9c67e64f"></a>

## ow.format.string.tabExpand

### ow.format.string.tabExpand(aStr, aTabSize) : String

Given an input aStr and, optionally, aTabSize will expand the tabs in the string to the provided aTabSize ( similar to the unix expand command).  If aTabSize is not provided it will default to 8.

Sources:

- js/owrap.format.js:1055

<a id="api-ow-format-string-tohex-3a8311fb"></a>

## ow.format.string.toHex

### ow.format.string.toHex(aByteArray, aSeparator) : String

Tries to convert aByteArray into a string of hex values separated by aSeparator (defaults to " ").

Sources:

- js/owrap.format.js:1161

<a id="api-ow-format-string-tohexarray-ecc3d560"></a>

## ow.format.string.toHexArray

### ow.format.string.toHexArray(aByteArray, perLine) : String

Returns an array with the ow.format.string.toHex of aByteArray and ow.format.string.printable with a maximum  of perLine (defaults to 30) characters per array element.

Sources:

- js/owrap.format.js:1177

<a id="api-ow-format-string-unicode-4dac17a6"></a>

## ow.format.string.unicode

### ow.format.string.unicode(aCodeNumber) : String

Given a unicode `aCodeNumber` (8 or 16 bits) will convert to the necessary sequence of 8 bit.
For example: `ow.format.string.unicode(0x1F37A)`.

Sources:

- js/owrap.format.js:18

<a id="api-ow-format-string-updateline-b47db818"></a>

## ow.format.string.updateLine

### ow.format.string.updateLine(aPrintNLFn) : Function

Facilitates updating a message in the same line without entering new-lines. It will use the aPrintNLFn (if not defined uses printnl). Returns an object with two functions: line(aMessage) and end(). The function line() should be called to change the current line message. On the  end calling the function end() will clean-up a return the cursor to the beginning of the line.

Sources:

- js/owrap.format.js:909

<a id="api-ow-format-string-wildcardre-09927160"></a>

## ow.format.string.wildcardRE

### ow.format.string.wildcardRE(aPattern, caseSensitive) : RegExp

Given aPattern using '&#42;' wildcards (to match zero or more characters) or '?' question-mark to match a single character will return the corresponding RegExp. Optionally if caseSensitive=true the RegExp will include case sensitive option.

Sources:

- js/owrap.format.js:1408

<a id="api-ow-format-string-wildcardtest-4a6b2b5f"></a>

## ow.format.string.wildcardTest

### ow.format.string.wildcardTest(aString, aPattern, caseSensitive) : Boolean

Given aString will try to apply aPattern using '&#42;' wildcards (to match zero or more characters) or '?' question-mark to match a single character. Will return true if the aPattern can be applied to aString. Optionally if caseSensitive=true the pattern will be tested with case sensitive.

Sources:

- js/owrap.format.js:1393

<a id="api-ow-format-string-wordwrap-ef07ea91"></a>

## ow.format.string.wordWrap

### ow.format.string.wordWrap(aString, maxWidth, newLineSeparator, tabDefault) : String

Given aString word wraps the text on it given the maxWidth length per line. Optionally you can provide a newLineSeparator otherwise '&#92;n' will be used. Optionally tabDefault determines how many spaces a tab represents (default 4) (available after ow.loadFormat())

Sources:

- js/owrap.format.js:343

<a id="api-ow-format-string-wordwraparray-28f52d67"></a>

## ow.format.string.wordWrapArray

### ow.format.string.wordWrapArray(anArray, maxTableSize, sepLen, sepFunc, useIndex, perRowHeight) : Array

Given `anArray` of maps will return an array suitable to use with printTable for a `maxTableSize`, a separator length
(`sepLen` (which defaults to 1)) and an optional line separator function (`sepFunc` that receives the max length of a
column). Word-wrap is achieved by creating new map array entries whenever the calculated max size of each line
with `sepLen` is achieved. The boolean flag `useIndex` changes the result to a map with lines and idx (array of the positions
on the lines array that are a new `anArray` entry). If `perRowHeight` is true, each record uses its own wrapped height and column sizes are measured per physical line.
Example of usage:

```javascript
__initializeCon()
var maxS = __con.getTerminal().getWidth()
print(printTable(ow.format.string.wordWrapArray(io.listFiles("js").files, maxS, 1, s => ansiColor("FAINT", repeat(s, "-"))), maxS))
```

Sources:

- js/owrap.format.js:198

