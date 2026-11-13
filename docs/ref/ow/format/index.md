# ow.format

[Home](../../index.md) / [All APIs](../../all-apis.md) / [ow](../index.md) / [ow.format](index.md)

## Subcategories

- [ow.format.cron](cron/index.md)
- [ow.format.dateDiff](datediff/index.md)
- [ow.format.string](string/index.md)
- [ow.format.term](term/index.md)
- [ow.format.viz](viz/index.md)
- [ow.format.xls](xls/index.md)

<a id="api-ow-format-ip2int-293e271d"></a>

## ow.format.IP2int

### ow.format.IP2int(aIP) : String

Converts an IP address into it's decimal IP address representation.

Sources:

- js/owrap.format.js:3619

<a id="api-ow-format-addnumberseparator-0ae6c19e"></a>

## ow.format.addNumberSeparator

### ow.format.addNumberSeparator(aNumber, aSeparator) : String

Returns a formatted number with decimal separators (default is comma but you can provide a custom aSeparator).

(available after ow.loadFormat())

Sources:

- js/owrap.format.js:3452

<a id="api-ow-format-bool-19fa2620"></a>

## ow.format.bool

### ow.format.bool(aBoolValue, isLight, anExtra) : String

Given aBoolValue will return a green checkmark or a red cross character. If necessary anExtra ansiColor attributes can be added.

Sources:

- js/owrap.format.js:1761

<a id="api-ow-format-checkversionspec-340a3986"></a>

## ow.format.checkVersionSpec

### ow.format.checkVersionSpec(aVersion, aSpec) : Boolean

Checks whether aVersion satisfies a comma-separated version specification using &#62;=, &#60;=, &#62;, &#60;, = or bare equality. (available after ow.loadFormat())

Sources:

- js/owrap.format.js:1672

<a id="api-ow-format-compareversion-59611c0c"></a>

## ow.format.compareVersion

### ow.format.compareVersion(aVersionA, aVersionB) : Number

Compares two versions returning 1 when aVersionA is greater, 0 when they are equal and -1 when aVersionA is lower. Supports date, numeric and semantic versions. (available after ow.loadFormat())

Sources:

- js/owrap.format.js:1632

<a id="api-ow-format-datetimetransition-ce214102"></a>

## ow.format.dateTimeTransition

### ow.format.dateTimeTransition(aZone, aDate) : Map

Given aZone (defaults to Europe/London) and aDate (defaults to now) will return a map with the previous  and next date/time transition.

Sources:

- js/owrap.format.js:4784

<a id="api-ow-format-datetimezones-e6dd67f4"></a>

## ow.format.dateTimeZones

### ow.format.dateTimeZones() : Array

List all available Java zone ids.

Sources:

- js/owrap.format.js:4774

<a id="api-ow-format-elapsedtime-b1a034de"></a>

## ow.format.elapsedTime

### ow.format.elapsedTime(aStartTime, aEndTime, aFormat) : String

Shortcut for ow.format.elapsedTime4ms calculating the absolute difference, in ms, between aStartTime and aEndTime.

Sources:

- js/owrap.format.js:6175

<a id="api-ow-format-elapsedtime4ms-a28435a8"></a>

## ow.format.elapsedTime4ms

### ow.format.elapsedTime4ms(aMs, aFormat) : String

Given `aMs` (milliseconds) will convert into a string with the corresponding human-readable time and date components
up to years. This is usually helpful when comparing dates (see also `ow.format.elapsedTime`). You can control the output
format by adding options to `aFormat`:

Example:

```javascript
aFormat = {
   full : false, // when true outputs everything even if it's 0 value
   abrev: false, // when true outputs smaller "1h2m3s" instead of "1 hour, 2 minutes and 3 seconds"
   pad  : false, // when true pads values with 0 on the left
   colon: false, // when true outputs just values separated by ":"
   sep  : ", ",  // customizes the values separator, defaults to ", " or "" (in case of abrev = true)
   maxLeft : 7,  // the maximum number of time units to show counting from the left
   maxRight: 7   // the maximum number of time units to show counting from the right
}
```

Sources:

- js/owrap.format.js:4989

<a id="api-ow-format-escapehtml-41b6c3fc"></a>

## ow.format.escapeHTML

### ow.format.escapeHTML(aString) : String

Will escape, and return, aString for HTML/XML special characters.

(available after ow.loadFormat())

Sources:

- js/owrap.format.js:4681

<a id="api-ow-format-escapehtml4-bed315c2"></a>

## ow.format.escapeHTML4

### ow.format.escapeHTML4(aString) : String

Uses Apache Commons Lang escape HTML4 functionality to convert aString into HTML4 entities where needed.

Sources:

- js/owrap.format.js:4722

<a id="api-ow-format-escapere-1cd7cb5b"></a>

## ow.format.escapeRE

### ow.format.escapeRE(aString) : String

Tries to escape in aString all characters that make up a RegExp.

Sources:

- js/owrap.format.js:4742

<a id="api-ow-format-escapestring-ad613582"></a>

## ow.format.escapeString

### ow.format.escapeString(aString, aExceptString) : String

Will escape, and return, aString for RegExp special characters with the exception of any characters in aExceptString.

(available after ow.loadFormat())

Sources:

- js/owrap.format.js:4333

<a id="api-ow-format-frombase16-ba681d8f"></a>

## ow.format.fromBase16

### ow.format.fromBase16(aString) : bytes

Given a base 16 aString transforms it back to the original array of bytes.

Sources:

- js/owrap.format.js:3566

<a id="api-ow-format-frombase32-46a5eaf8"></a>

## ow.format.fromBase32

### ow.format.fromBase32(aString) : bytes

Given a base 32 aString transforms it back to the original array of bytes.

Sources:

- js/owrap.format.js:3553

<a id="api-ow-format-frombase36-2b5b899b"></a>

## ow.format.fromBase36

### ow.format.fromBase36(aString) : Number

Converts a provided base36 aString into the corresponding number.

Sources:

- js/owrap.format.js:3543

<a id="api-ow-format-frombinary-d7f1bd38"></a>

## ow.format.fromBinary

### ow.format.fromBinary(aString) : Number

Converts a provided binary aString into the decimal number.

Sources:

- js/owrap.format.js:3589

<a id="api-ow-format-frombyte-ca994ea7"></a>

## ow.format.fromByte

### ow.format.fromByte(aByte) : Number

Converts a byte info a decimal number.

Sources:

- js/owrap.format.js:3466

<a id="api-ow-format-frombytesabbreviation-80f64fb3"></a>

## ow.format.fromBytesAbbreviation

### ow.format.fromBytesAbbreviation(aStr, useDecimal) : Number

Tries to reverse the ow.format.toBytesAbbreviation from aStr (string) back to the original value in bytes. Use useDecimal=true to interpret KB as 1000 instead of 1024 (see more in https://en.wikipedia.org/wiki/Byte&#35;Multiple-byte&#95;units)

(available after ow.loadFormat())

Sources:

- js/owrap.format.js:3767

<a id="api-ow-format-fromdate-5b6be637"></a>

## ow.format.fromDate

### ow.format.fromDate(aDate, aFormat, aTimeZone) : String

Will convert a javascript `aDate` into a String representation given `aFormat`:

- `G`: Era descriptor (AD)
- `y`: Year (1996; 96)
- `Y`: Week year (2009; 09)
- `M`: Month in year (July; Jul; 07)
- `w`: Week in year (27)
- `W`: Week in month (2)
- `D`: Day in year (189)
- `d`: Day in month (10)
- `F`: Day of week in month (2)
- `E`: Day name in week (Tuesday; Tue)
- `u`: Day number of week (1 = Monday, ..., 7 = Sunday) (1)
- `a`: Am/pm number (PM)
- `H`: Hour in day (0-23)
- `k`: Hour in day (1-24)
- `K`: Hour in am/pm (0-11)
- `h`: Hour in am/pm (1-12)
- `m`: Minute in hour (30)
- `s`: Second in minute (55)
- `S`: Millisecond (978)
- `z`: Time zone (Pacific Standard Time; PST; GMT-08:00)
- `Z`: Time zone (-0800)
- `X`: Time zone (-08; -0800; -08:00)

Optionally you can also provide `aTimeZone` (like 'America/New_York', 'Europe/London', 'UTC', ...)

(available after `ow.loadFormat()`)

Sources:

- js/owrap.format.js:4120

<a id="api-ow-format-fromhex-ccdea76d"></a>

## ow.format.fromHex

### ow.format.fromHex(aString) : Number

Converts a provided hexadecimal aString into the decimal number.

Sources:

- js/owrap.format.js:3579

<a id="api-ow-format-fromisodate-c0fed577"></a>

## ow.format.fromISODate

### ow.format.fromISODate(aISODate) : Date

Converts a ISO date string into a javascript Date.

Sources:

- js/owrap.format.js:4250

<a id="api-ow-format-fromldapdate-dbd64602"></a>

## ow.format.fromLDAPDate

### ow.format.fromLDAPDate(aLDAPDate) : Date

Converts a numeric aLDAPDate (also known as Windows NT time format, Active Directory timestamps) into a javascript Date.

Sources:

- js/owrap.format.js:4191

<a id="api-ow-format-fromnumberspacing-f5a8820c"></a>

## ow.format.fromNumberSpacing

### ow.format.fromNumberSpacing(aNumber, aSpacer) : Number

Returns a number from a string with aSpacer as thousands separator.

(available after ow.loadFormat())

Sources:

- js/owrap.format.js:3677

<a id="api-ow-format-fromoctal-0aad200d"></a>

## ow.format.fromOctal

### ow.format.fromOctal(aString) : Number

Converts a provided octal aString into the decimal number.

Sources:

- js/owrap.format.js:3599

<a id="api-ow-format-fromsiabbreviation-4180b4e7"></a>

## ow.format.fromSIAbbreviation

### ow.format.fromSIAbbreviation(aString) : Number

Converts the provided string using SI notationp prefix (do previously make the necessary conversions: 5mV -&#62; 5m, 5cm -&#62; 5c, 9km -&#62; 9k) to the corresponding number. Uses the current approved SI prefix list (https://en.wikipedia.org/wiki/Metric&#95;prefix)

Sources:

- js/owrap.format.js:3729

<a id="api-ow-format-fromtimeabbreviation-665ba272"></a>

## ow.format.fromTimeAbbreviation

### ow.format.fromTimeAbbreviation(aStr) : Number

From aStr time abbreviation (e.g. 1h2m3s (1 hour, 2 minutes and 3 seconds)) will return the corresponding amount of time in ms.

Sources:

- js/owrap.format.js:3812

<a id="api-ow-format-fromunixdate-3922ce25"></a>

## ow.format.fromUnixDate

### ow.format.fromUnixDate(aUnixDate) : Date

Converts aUnixDate timestamp into a javascript Date.

Sources:

- js/owrap.format.js:4181

<a id="api-ow-format-fromwedodate-dabb0439"></a>

## ow.format.fromWedoDate

### ow.format.fromWedoDate(aWedoDate, aFormat) : String

Shortcut for `ow.format.fromDate` but using a wedo date. See `ow.format.fromDate` for more help.

(available after `ow.loadFormat()`)

Sources:

- js/owrap.format.js:4165

<a id="api-ow-format-fromwedodatetodate-993d22ff"></a>

## ow.format.fromWedoDateToDate

### ow.format.fromWedoDateToDate(aWedoDate) : Date

Returns a date object from a wedo date. (available after ow.loadFormat())

Sources:

- js/owrap.format.js:4221

<a id="api-ow-format-getactualtime-b0710352"></a>

## ow.format.getActualTime

### ow.format.getActualTime(useAlternative) : Date

Retrieves the current actual time from worldtimeapi.org (through https). The current actual time will be returned in a Date. If useAlternative = true it will use worldclockapi.com (through http)

Sources:

- js/owrap.format.js:4108

<a id="api-ow-format-getclasspath-4539475d"></a>

## ow.format.getClasspath

### ow.format.getClasspath() : String

Returns the current java classpath.

Sources:

- js/owrap.format.js:4528

<a id="api-ow-format-getcurrentdirectory-a0b3de5e"></a>

## ow.format.getCurrentDirectory

### ow.format.getCurrentDirectory() : String

Returns the current working directory.

Sources:

- js/owrap.format.js:4487

<a id="api-ow-format-getdoh-2be07bae"></a>

## ow.format.getDoH

### ow.format.getDoH(aAddr, aType, aProvider) : Array

Performs a DNS over HTTPs query with aAddr. Optionally you can provide the aType of record (defaults to 'a') and the DNS over HTTPs aProvider between 'google' and 'cloudflare'.

Sources:

- js/owrap.format.js:6448

<a id="api-ow-format-gethostaddress-762e699d"></a>

## ow.format.getHostAddress

### ow.format.getHostAddress() : String

Returns the current host ip address.

Sources:

- js/owrap.format.js:4570

<a id="api-ow-format-gethostname-36aa99f6"></a>

## ow.format.getHostName

### ow.format.getHostName() : String

Returns the current hostname.

Sources:

- js/owrap.format.js:4558

<a id="api-ow-format-getjavahome-9b7cf62c"></a>

## ow.format.getJavaHome

### ow.format.getJavaHome() : String

Returns the current java home directory.

Sources:

- js/owrap.format.js:4518

<a id="api-ow-format-getjavaversion-9380cf21"></a>

## ow.format.getJavaVersion

### ow.format.getJavaVersion() : String

Returns the current java version.

Sources:

- js/owrap.format.js:4497

<a id="api-ow-format-getos-e48affb6"></a>

## ow.format.getOS

### ow.format.getOS() : String

Returns the current operating system identifier string.

Sources:

- js/owrap.format.js:4457

<a id="api-ow-format-getosarch-e27c456b"></a>

## ow.format.getOSArch

### ow.format.getOSArch() : String

Returns the current operating system architecture string.

Sources:

- js/owrap.format.js:4467

<a id="api-ow-format-getosversion-350b44f8"></a>

## ow.format.getOSVersion

### ow.format.getOSVersion() : String

Returns the current operating system version string.

Sources:

- js/owrap.format.js:4477

<a id="api-ow-format-getpublicip-674327d4"></a>

## ow.format.getPublicIP

### ow.format.getPublicIP() : Map

Uses the functionality provided by http://ifconfig.co to return a map with the apparent current public ip address, public hostname and a guess of country and city. Please be aware of the request limits of the service (around 1 request per minute).

Sources:

- js/owrap.format.js:4350

<a id="api-ow-format-getreversedoh-3e96bc81"></a>

## ow.format.getReverseDoH

### ow.format.getReverseDoH(aIP, aProvider) : Array

Tries to retrieve the reverse DNS of aIP using DNS over HTTPs. Optionally you can choose the aProvider between 'google' and 'cloudflare'.

Sources:

- js/owrap.format.js:6486

<a id="api-ow-format-gettlscertificates-8053d633"></a>

## ow.format.getTLSCertificates

### ow.format.getTLSCertificates(aHost, aPort, withJava, aPath, aPass, aSoTimeout) : Array

Tries to retreive the TLS certificates from aHost, aPort (defaults to 443). Optionally if withJava=true the original certificate Java object will also be included. If the CA certificates is in a different location you can provide aPath and the corresponding aPass. Additionally you can specificy aSoTimeout (socket timeout in ms) which defaults to 10s.

Sources:

- js/owrap.format.js:4364

<a id="api-ow-format-gettmpdir-5c03c21e"></a>

## ow.format.getTmpDir

### ow.format.getTmpDir() : String

Returns the current temporary directory.

Sources:

- js/owrap.format.js:4538

<a id="api-ow-format-getuserhome-31ae10f6"></a>

## ow.format.getUserHome

### ow.format.getUserHome() : String

Returns the current user home path.

Sources:

- js/owrap.format.js:4507

<a id="api-ow-format-getusername-136ea30c"></a>

## ow.format.getUserName

### ow.format.getUserName() : String

Returns the current user name.

Sources:

- js/owrap.format.js:4548

<a id="api-ow-format-int2ip-8bdb4582"></a>

## ow.format.int2IP

### ow.format.int2IP(aIPInt) : String

Converts the decimal IP address representation aIPInt into an IP address.

Sources:

- js/owrap.format.js:3609

<a id="api-ow-format-isemail-3bcf0c33"></a>

## ow.format.isEmail

### ow.format.isEmail(aEmail) : boolean

Tries to determine if aEmail seems a syntactic valid email.

Sources:

- js/owrap.format.js:4296

<a id="api-ow-format-ishost-f0a8fd98"></a>

## ow.format.isHost

### ow.format.isHost(aHost) : boolean

Tries to determine if aHost seems a syntactic valid host.

Sources:

- js/owrap.format.js:4322

<a id="api-ow-format-isipv4-5e413ecb"></a>

## ow.format.isIPv4

### ow.format.isIPv4(aIP) : boolean

Tries to determine if aIP is a syntactic valid IPv4.

Sources:

- js/owrap.format.js:4274

<a id="api-ow-format-isipv6-04c1ddfc"></a>

## ow.format.isIPv6

### ow.format.isIPv6(aIP) : boolean

Tries to determine if aIP is a syntactic valid IPv6.

Sources:

- js/owrap.format.js:4285

<a id="api-ow-format-isurl-20a5109c"></a>

## ow.format.isURL

### ow.format.isURL(aURL) : boolean

Tries to determine if aURL seems a syntactic valid URL.

Sources:

- js/owrap.format.js:4311

<a id="api-ow-format-iswedodate-9c160510"></a>

## ow.format.isWedoDate

### ow.format.isWedoDate(aWedoDate) : boolean

Determines if the `aWedoDate` object is a wedo date type (returns true if yes, false otherwise).

(available after `ow.loadFormat()`)

Sources:

- js/owrap.format.js:4232

<a id="api-ow-format-iswindows-c0134e07"></a>

## ow.format.isWindows

### ow.format.isWindows() : Boolean

Returns true if the operating system is identified as Windows otherwise returns false.

Sources:

- js/owrap.format.js:4447

<a id="api-ow-format-logerrwithfooter-6b0d6cfe"></a>

## ow.format.logErrWithFooter

### ow.format.logErrWithFooter(aMessage, aFooter)

Equivalent to ow.format.printWithFooter (see help ow.format.printWithFooter) using the logErr function.

Sources:

- js/owrap.format.js:5349

<a id="api-ow-format-logerrwithprogressfooter-8547ac48"></a>

## ow.format.logErrWithProgressFooter

### ow.format.logErrWithProgressFooter(aMessage, aTemplate, aPerc, aSize, aUnixBlock, aWindowsBlock, aSpace)

Equivalent to ow.format.printWithProgressFooter (see help ow.format.printWithProgressFooter) using the logErr function.

Sources:

- js/owrap.format.js:5428

<a id="api-ow-format-logwarnwithfooter-9594b3cf"></a>

## ow.format.logWarnWithFooter

### ow.format.logWarnWithFooter(aMessage, aFooter)

Equivalent to ow.format.printWithFooter (see help ow.format.printWithFooter) using the logWarn function.

Sources:

- js/owrap.format.js:5360

<a id="api-ow-format-logwarnwithprogressfooter-5a8f8f89"></a>

## ow.format.logWarnWithProgressFooter

### ow.format.logWarnWithProgressFooter(aMessage, aTemplate, aPerc, aSize, aUnixBlock, aWindowsBlock, aSpace)

Equivalent to ow.format.printWithProgressFooter (see help ow.format.printWithProgressFooter) using the logWarn function.

Sources:

- js/owrap.format.js:5439

<a id="api-ow-format-logwithfooter-72da605d"></a>

## ow.format.logWithFooter

### ow.format.logWithFooter(aMessage, aFooter)

Equivalent to ow.format.printWithFooter (see help ow.format.printWithFooter) using the log function.

Sources:

- js/owrap.format.js:5338

<a id="api-ow-format-logwithprogressfooter-8e979425"></a>

## ow.format.logWithProgressFooter

### ow.format.logWithProgressFooter(aMessage, aTemplate, aPerc, aSize, aUnixBlock, aWindowsBlock, aSpace)

Equivalent to ow.format.printWithProgressFooter (see help ow.format.printWithProgressFooter) using the log function.

Sources:

- js/owrap.format.js:5417

<a id="api-ow-format-logwithwaiting-e334c386"></a>

## ow.format.logWithWaiting

### ow.format.logWithWaiting(aMainFunc, aPrefixMsg, aCompleteMsg, aErrorMsg, aWaitSpeed, aTheme)

Executes aMainFunc while log aPrefixMsg with a waiting aTheme (defaults to a sequence of chars with a rotating bar). When aMainFunc ends it will replace the log with aCompleteMsg or aErrorMsg in case an exception is thrown. Optionally you can provide a different aWaitSpeed while cycling between the aTheme sequence of chars increasing/decreasing the "animation" effect.

Sources:

- js/owrap.format.js:5198

<a id="api-ow-format-percprogressreport-e4d90258"></a>

## ow.format.percProgressReport

### ow.format.percProgressReport(aMainFunc, aProgressFunc, aTimeout)

Percentage progress report help function over a function on `aMainFunc` calling `aProgressFunc` in parallel
with a percentage function parameter (receiving target and source numbers). You can also provide an alternative
`aTimeout` between `aProgressFunc` calls (defaults to 150ms).

Example:

```javascript
ow.format.percProgressReport(() => {
   ioStreamCopy(io.writeFileStream("target.file"), io.readFileStream("source.file"));
}, (percFunc) => {
	  var perc = percFunc(io.fileInfo("target.file").size, io.fileInfo("source.file").size);
   ...
});
```

Sources:

- js/owrap.format.js:5211

<a id="api-ow-format-percentile-2001cbbb"></a>

## ow.format.percentile

### ow.format.percentile(aArray, aPercentile) : Number

Will return the percentile (aPercentile between 0 and 1) for the provided aArray of numbers.

Sources:

- js/owrap.format.js:3966

<a id="api-ow-format-printboxplot-4b5637b8"></a>

## ow.format.printBoxplot

### ow.format.printBoxplot(values, aOptions) : String

Returns one or more compact terminal boxplots from a number array or an array of &#123; values, label &#125; series. aOptions: width, min, max, showOutliers (default true), palette.

Sources:

- js/owrap.format.js:2871

<a id="api-ow-format-printbullet-388466d8"></a>

## ow.format.printBullet

### ow.format.printBullet(values, aOptions) : String

Returns one or more bullet graphs from a map or array of maps with &#123; value, target, min, max, ranges, label &#125;. aOptions: width, palette, min, max, target, ranges, label, unit, showValue (default true), valueFormat ("raw", "si" or "bytes"; default "raw").

Sources:

- js/owrap.format.js:2710

<a id="api-ow-format-printdashboard-dca203e5"></a>

## ow.format.printDashboard

### ow.format.printDashboard(widgets, aOptions) : String

Returns a multi-widget dashboard string. `widgets` is an array (or 2D array for explicit grid rows) of widget maps
with fields: type, data, title, span (proportional column width, default 1), options. Supported types: table, tree,
chart, sparkline, histogram, heatmap, bullet, scatter, boxplot, timeline, statusMatrix, progress, text, md, map, area, bar, func.

Per-widget notes:

- `chart`: data is a printChart format string
- `area`: data is consumed by `ow.format.string.chart`
- `bar`: data is a printBars format string; options can include max, min, indicator, space
- `bullet`: data is consumed by `ow.format.printBullet`; options can include min, max, target, ranges, label, unit, showValue, valueFormat
- `sparkline`: data is consumed by `ow.format.printSparkline`
- `histogram`: data is consumed by `ow.format.printHistogram`
- `heatmap`: data is consumed by `ow.format.printHeatmap` (numeric matrix, or a date/time/date-time keyed map for a time-bucketed view)
- `scatter`: data is consumed by `ow.format.printScatter`
- `boxplot`: data is consumed by `ow.format.printBoxplot`
- `timeline`: data is consumed by `ow.format.printTimeline`
- `statusMatrix`: data is consumed by `ow.format.printStatusMatrix`

`aOptions`: width, height, columns (auto if 0), border (default true), borderColor, borderStyle, palette, capabilities.
Category widget types: `pie`, `donut`, `stackedBar`, `stackedColumns`, `divergingBars`, `treemap`; data and options match their renderers.

Sources:

- js/owrap.format.js:3111

<a id="api-ow-format-printdivergingbars-0061b9bf"></a>

## ow.format.printDivergingBars

### ow.format.printDivergingBars(values, options) : String

Renders signed category values around a zero axis. Accepts numbers, `{label,value,color}` records
or a value map. Options match category renderers, plus `symmetric` (true), `min`/`max`,
`labels` (true), `showValue` (true). Width defaults to 40; height defaults to the row count.
An explicit range must include zero and every value. Monochrome uses `-` and `+` bars.
Narrow areas fall back to signed text. Input order is retained; categories are not aggregated.

Sources:

- js/owrap.format.js:7242

<a id="api-ow-format-printdonut-2ac4a85d"></a>

## ow.format.printDonut

### ow.format.printDonut(values, options) : String

Uses `printPie` geometry with `innerRadius` (default 0.5, fraction in [0,1)).
Optional `centerText` fits wholly inside the hole. `centerTextOverflow` defaults to legend;
clip/omit are alternatives. All other options match `printPie`.

Sources:

- js/owrap.format.js:7176

<a id="api-ow-format-printheatmap-6db6fffb"></a>

## ow.format.printHeatmap

### ow.format.printHeatmap(values, aOptions) : String

Returns a compact terminal heatmap for a numeric matrix, a map containing { `values`, xLabels, yLabels }, or
(for a time-bucketed view) a plain map keyed by date ("YYYY-MM-DD"), time ("HH:mm") or date-time
("YYYY-MM-DDTHH:mm") strings mapping to numeric `values`, e.g. { "2026-01-15": 3, "2026-01-16": 0 }.

Time-bucketed `aOptions`: xAxis/yAxis (one of "year", "month", "week", "weekday", "day", "hour"; yAxis may
be "none" to force a single row; defaults to xAxis:"week",yAxis:"weekday" for date/date-time keys - a
GitHub-style contribution calendar - or xAxis:"hour",yAxis:"none" for time-only keys; pass e.g.
xAxis:"hour",yAxis:"weekday" on date-time keys for a punch-card view), weekStart (0=Sunday, default),
from/to (bound the visible range), aggregate ("sum" default, "avg", "max" or "count", for multiple `values`
landing in the same bucket), legend (default false, renders "Less (shades) More"), empty (glyph for
buckets with no data, default "·"), dayLabels (which weekday rows/columns get a text label, default
["Mon","Wed","Fri"]), width, height, palette.

Sources:

- js/owrap.format.js:2573

<a id="api-ow-format-printhistogram-6a16b4db"></a>

## ow.format.printHistogram

### ow.format.printHistogram(values, aOptions) : String

Returns a terminal histogram string for the numeric values array. Bucket count is auto-selected via Sturges' formula unless aOptions.buckets is set. aOptions: width, height, vertical (default false = horizontal bars), color, labels (default true), showCount (default true), palette.

Sources:

- js/owrap.format.js:2211

<a id="api-ow-format-printpie-31136678"></a>

## ow.format.printPie

### ow.format.printPie(values, options) : String

Renders non-negative category proportions as a pie. Input formats and colour options match `printStackedBar`.
`size`: tiny (one-line bar), small (12x5 geometry), medium (20x8), auto.
`width`/`height` bound the entire output including legends and override preset geometry.
With one explicit dimension the other is derived using `cellAspect` after reserving legends.
Dashboard-allocated dimensions are bounds; set widget options.width/height to override geometry.
`legend`: auto/right/bottom/inline/none.
`mode`: auto/halfblock/braille/ascii. Auto prefers half-block colour; ASCII uses category letters.
`startAngle`: -90 degrees, `clockwise`: true, `cellAspect`: 0.5 (cell width/height).
Geometry below 8x4 falls back to a stacked bar (`fallback: "auto"`) or text (`"text"`).
Braille uses majority colour per cell (input-order ties); monochrome uses category stipples.
Legends mark unsampled positive slices with `*`. Excess categories group as Other (n).

Sources:

- js/owrap.format.js:7157

<a id="api-ow-format-printscatter-1fced013"></a>

## ow.format.printScatter

### ow.format.printScatter(points, aOptions) : String

Returns a compact terminal scatter plot from an array of &#91;x,y&#93; pairs or &#123; x, y, symbol, color &#125; points. aOptions: width, height, xMin, xMax, yMin, yMax, xLabel, yLabel, palette.

Sources:

- js/owrap.format.js:2800

<a id="api-ow-format-printsparkline-d7b554fd"></a>

## ow.format.printSparkline

### ow.format.printSparkline(series, aOptions) : String

Returns a compact sparkline string for the provided numeric series or array of named series (&#123;data, name, color&#125;). aOptions: width (default terminal width), label, showMinMax (default false), color, palette. Opt-in enhancements: min/max fixed range, thresholds &#91;&#123;value,color&#125;&#93;, markMin/markMax, highlightLast (boolean or colour), trend, missing (gap/skip/error), colorScale (array or &#123;min,max,colors&#125;), capabilities and unicode. Enhanced mode respects the total width including labels. Null/undefined/NaN are missing; other non-finite/non-numeric values throw. Threshold colours override the scale; highlightLast overrides both. Monochrome retains markers. Downsampling enhanced series selects the last point in each bin, retaining the last sample. Degrades to ASCII characters when unicode is not available.

Sources:

- js/owrap.format.js:2152

<a id="api-ow-format-printstackedbar-906fb792"></a>

## ow.format.printStackedBar

### ow.format.printStackedBar(values, options) : String

Returns a category distribution. `values` accepts numbers, `{label,value,color}` records or a value map.
Options: `width` (40), `height`, `normalize` (true), `max`, `fractional` (true),
`legend` (none), `showPercent` (true), `showValue` (false), `precision` (1),
`palette` (auto), `colors`, `color`, `unicode`, `capabilities`, `maxCategories` (12; 0 disables grouping).
Invalid values/colours throw. Tiny segments may have no pixels and are marked `*` in legends.
All renderers return strings without printing. Explicit dimensions include legends.

Sources:

- js/owrap.format.js:6993

<a id="api-ow-format-printstackedcolumns-1d2793d3"></a>

## ow.format.printStackedColumns

### ow.format.printStackedColumns(columns, options) : String

Renders `[{label: "Host", values: {CPU: 50, Memory: 30}}]` using stable category colours.
Options match `printStackedBar`, plus `height` (10), `width` (40), `gap` (1), `labels` (true).
Missing categories are zero. Absolute mode uses one shared max. Too narrow a box throws.

Sources:

- js/owrap.format.js:7187

<a id="api-ow-format-printstatusmatrix-dee29abc"></a>

## ow.format.printStatusMatrix

### ow.format.printStatusMatrix(values, aOptions) : String

Returns a compact status matrix from a matrix or &#123; values, xLabels, yLabels &#125; of statuses. aOptions: width, height, xLabels, yLabels, symbols, palette.

Sources:

- js/owrap.format.js:3019

<a id="api-ow-format-printtimeline-d2b2130b"></a>

## ow.format.printTimeline

### ow.format.printTimeline(events, aOptions) : String

Returns a compact terminal timeline from an array of &#123; label, start, end, color, status &#125; events. aOptions: width, from, to, palette, labels (default true).

Sources:

- js/owrap.format.js:2946

<a id="api-ow-format-printtreemap-3d68d1d5"></a>

## ow.format.printTreemap

### ow.format.printTreemap(values, options) : String

Renders non-negative categories as cell rectangles using deterministic balanced recursive slicing.
Inputs and colour options match `printPie`. Defaults: width 40, height 10, labels true,
cellAspect 0.5, legend auto (up to three bottom rows). Legend right reserves a side panel.
Rectangles are quantized to cells; categories receiving no cells are marked `*` in the legend.
Zero values occupy no cells. Labels are clipped inside their own rectangles. Narrow areas use
a stacked distribution. `legend: "none"` devotes the whole area to geometry.

Sources:

- js/owrap.format.js:7298

<a id="api-ow-format-printwithfooter-2c861232"></a>

## ow.format.printWithFooter

### ow.format.printWithFooter(aMessage, aFooter)

Prints aMessage (if defined) with a aTemplate (template compiled function or string).

Sources:

- js/owrap.format.js:5309

<a id="api-ow-format-printwithprogressfooter-211be790"></a>

## ow.format.printWithProgressFooter

### ow.format.printWithProgressFooter(aMessage, aTemplate, aPerc, aSize, aUnixBlock, aWindowsBlock, aSpace)

Prints `aMessage` (if defined) with a `aTemplate` (template compiled function or string) as a footer for percentage
progress information with the percentage value `aPerc`, for a given optional `aSize` (defaults to 50), an optional
`aUnixBlock` or `aWindowsBlock` (depending on the current operating system) and `aSpace`. Example:

```javascript
ow.loadTemplate();
var fn = ow.template.execCompiled(ow.template.compile("({{percFormat}}%) progress: |{{progress}}|"));
ow.format.printWithProgressFooter("processing xyz...", fn, aPerc);
ow.format.printWithFooter("Done.", "");
```

Sources:

- js/owrap.format.js:5371

<a id="api-ow-format-printwithwaiting-6445d021"></a>

## ow.format.printWithWaiting

### ow.format.printWithWaiting(aMainFunc, aPrefixMsg, aCompleteMsg, aErrorMsg, aWaitSpeed, aTheme, printNLFn, useAsSuffix)

Executes aMainFunc while priting aPrefixMsg with a waiting aTheme (defaults to a sequence of chars with a rotating bar). When aMainFunc ends it will replace the priting with aCompleteMsg or aErrorMsg in case an exception is thrown. Optionally you can provide a different aWaitSpeed while cycling between the aTheme sequence of chars increasing/decreasing the "animation" effect.

Sources:

- js/owrap.format.js:5143

<a id="api-ow-format-progressreport-9440afdc"></a>

## ow.format.progressReport

### ow.format.progressReport(aMainFunc, aProgressFunc, aTimeout)

Executes aMainFunc to execute some synchronous function while aProgressFunc is called asynchronously to  keep track of progress. You can also provide an alternative aTimeout between aProgressFunc calls (defaults to 150ms).

Sources:

- js/owrap.format.js:5115

<a id="api-ow-format-round-236d4e11"></a>

## ow.format.round

### ow.format.round(aNumber, aDigits) : String

Will return aNumber rounded to 0 decimal digits or aDigits decimal digits.

(available after ow.loadFormat())

Sources:

- js/owrap.format.js:3952

<a id="api-ow-format-semver-47c0ce1f"></a>

## ow.format.semver

### ow.format.semver(aVersion) : ow.format.semver

Creates an `ow.format.semver` instance for `aVersion`, with the following methods:

- `nextMajor`
- `nextMinor`
- `nextPatch`
- `getMajor`
- `getMinor`
- `getPatch`
- `greater(aVersion)`
- `lower(aVersion)`
- `greaterEquals(aVersion)`
- `lowerEquals(aVersion)`
- `equals(aVersion)`

Sources:

- js/owrap.format.js:1596

<a id="api-ow-format-sortsemanticversions-e062c896"></a>

## ow.format.sortSemanticVersions

### ow.format.sortSemanticVersions(aArray) : Array

Will sort the provided aArray of semantic versions (e.g. 1.0.0, 1.0.1, 1.1.0, 2.0.0, ...)

(available after ow.loadFormat())

Sources:

- js/owrap.format.js:3988

<a id="api-ow-format-sqlformat-6d0b0d9c"></a>

## ow.format.sqlFormat

### ow.format.sqlFormat(aSQL, aMap) : String

Will format `aSQL` using the sql-formatter library. Optionally you can provide `aMap` with the following options:

- `indent`: the indentation string (defaults to "  ")
- `uppercase`: if true will uppercase the SQL (defaults to false)
- `linesBetweenQueries`: number of lines between queries (defaults to 1)
- `maxColumnLength`: maximum column length (defaults to 50)
- `skipWhitespaceNearBlockParentheses`: if true will whitespace near block parentheses (defaults to false)
- `language`: the SQL language dialect (defaults to "StandardSql")

The language can be one of the following:

- `Db2`
- `MariaDb`
- `MySql`
- `N1ql`
- `PlSql`
- `PostgreSql`
- `Redshift`
- `SparkSql`
- `StandardSql`
- `TSql`

Sources:

- js/owrap.format.js:4943

<a id="api-ow-format-sshprogress-dc8edb94"></a>

## ow.format.sshProgress

### ow.format.sshProgress(aFn) : Object

Returns a SSH Java progress monitor callback object to be use with the SSH plugin functions.
Expects callback `aFn` that will be called with state (e.g. begin, count, end) and an Info map.
The Info map is composed of:

- `source`: the reported source of the transfer
- `target`: the reported target of the transfer
- `op`: the operation being performed (get or put)
- `start`: reported unix epoch when the transfer started
- `end`: reported unix epoch when the transfer stopped
- `count`: the last reported byte count
- `speed`: the calculated speed of transfer

If the returned value is false the transfer will be cancelled.

Sources:

- js/owrap.format.js:5070

<a id="api-ow-format-streamhandle-63abf01c"></a>

## ow.format.streamHandle

### ow.format.streamHandle(aHandle, inHandle, errHandle, outHandle, bufferSize) : Function

Returns a function to help automated interaction with a running process. The function `aHandle` receives: `aType` (in/err); `aTxt`,
`inHandle` (function), `errHandle` (function) and an `outHandle` (function). Optionally you can provide an alternative `inHandle` function to print
stdout text, an `errHandle` function to print stderr text, an `outHandle` function to send text to stdin and/or a non default `bufferSize`.

Example:

```javascript
var res = $sh("myProcess.sh --something")
          .cb(expect((aType, aTxt, inHandle, errHandle, outHandle) => {
             if (aType == "in") {
                inHandle(aTxt)
                if (/ name\?/.test(aTxt))                return outHandle("Scott\n")
               if (aTxt.indexOf("Anything else?") >= 0) return outHandle("nope!\n")
             }
          }))
          .get(0)
```

Sources:

- js/owrap.format.js:3396

<a id="api-ow-format-streamsh-cc784a4c"></a>

## ow.format.streamSH

### ow.format.streamSH(aFunction, anEncoding) : Function

To be used with sh, af.sh or ssh.exec as the callbackFunc. Returns a function that will call aFunction for each line and used the returned string with print and printErr.

Sources:

- js/owrap.format.js:3329

<a id="api-ow-format-streamshlog-99f84196"></a>

## ow.format.streamSHLog

### ow.format.streamSHLog(aFunction) : Function

To be used with sh, af.sh or ssh.exec as the callbackFunc. Returns a function that will call aFunction for each line and used the returned string with log and logErr.

Sources:

- js/owrap.format.js:3310

<a id="api-ow-format-streamshprefix-a499836a"></a>

## ow.format.streamSHPrefix

### ow.format.streamSHPrefix(aPrefix, anEncoding, aSeparator, aTemplate, aFnHandler, infoFn, errorFn) : Function

To be used with sh, af.sh or ssh.exec as the callbackFunc. Returns a function that will prefix each line with aPrefix and used the returned string with print and printErr. Optionally you can provide aTemplate to add "prefix" (defaults to "&#91;&#123;&#123;prefix&#125;&#125;&#93;") and/or provide aFnHandler to chain another streaming handling function (receives a stream and a boolean to indicate if its stdout or stderr). It's also possible to provide a infoFn and errorFn to handle the output. If infoFn or errorFn are not provided they will default to print and printErr or to log and logErr if &#95;&#95;flags.SH.prefixLog is true.

Sources:

- js/owrap.format.js:3359

<a id="api-ow-format-testhost-05bf59e7"></a>

## ow.format.testHost

### ow.format.testHost(aAddress, aTimeout) : Map

Uses the java implementation (e.g. usually ICMP ping) for testing reachability to an aAddress. It timeouts after aTimeout (defaults to 4000ms). Returns a map with the "time" spent trying to get an answer from aAddress and a boolean "reachable" with the result.

Sources:

- js/owrap.format.js:4582

<a id="api-ow-format-testport-c000e0f7"></a>

## ow.format.testPort

### ow.format.testPort(aAddress, aPort, aCustomTimeout) : boolean

Tries to connect to aPort (e.g. 1234) on aAddress (e.g. 1.2.3.4). If the connection is successfull it will disconnect and return true, otherwise it will return false. If aCustomTimeout (in ms) is defined, it will use that value as the timeout instead of the 1,5 seconds by default.

Sources:

- js/owrap.format.js:4605

<a id="api-ow-format-testportlatency-df40eef4"></a>

## ow.format.testPortLatency

### ow.format.testPortLatency(aHost, aPort, aCustomTimeout) : Number

Test establishing a TCP socket connection with aHost on aPort. Optionally aCustomTimeout can be provided (defaults to 60000 ms). The test will be timed and the time in ms will be returned. If returned a time &#60; 0 then an error occurred or the  host:port couldn't be reached.

Sources:

- js/owrap.format.js:4628

<a id="api-ow-format-testpublicport-510e062f"></a>

## ow.format.testPublicPort

### ow.format.testPublicPort(aPort) : Map

Uses the functionality provided by http://ifconfig.co to return a map with the result of testing if aPort is within public  reach from your apparent current public ip address. Please be aware of the request limits of the service (around 1 request per minute).

Sources:

- js/owrap.format.js:4429

<a id="api-ow-format-testurllatency-b8a0758d"></a>

## ow.format.testURLLatency

### ow.format.testURLLatency(aURL, aCustomTimeout) : Number

Test sending a HTTP(s) GET to aURL. Optionally aCustomTimeout can be provided. The test will be timed and the time in ms will be returned. If returned a time &#60; 0 then an error occurred or the host:port couldn't be reached.

Sources:

- js/owrap.format.js:4656

<a id="api-ow-format-timeago-536ca25d"></a>

## ow.format.timeago

### ow.format.timeago(aDate, isAbv) : String

Will output how much time ago aDate is (e.g. 2 years ago, 30 minutes ago, etc...).

Optionally isAbv = true for abbreviated output.  (available after ow.loadFormat())

Sources:

- js/owrap.format.js:4018

<a id="api-ow-format-toabbreviation-fb3c9c0d"></a>

## ow.format.toAbbreviation

### ow.format.toAbbreviation(aNumber, aDigits) : String

Returns a number abbreviation to "k", "m", "b", "t". Will round number to 2 decimals if aDigits doesn't provide a different decimal digits to round to.

(available after ow.loadFormat())

Sources:

- js/owrap.format.js:3629

<a id="api-ow-format-tobase16-32492d5a"></a>

## ow.format.toBase16

### ow.format.toBase16(aString) : String

Given aString or array of bytes transforms the contents to base 16.

Sources:

- js/owrap.format.js:3530

<a id="api-ow-format-tobase32-8a6158b1"></a>

## ow.format.toBase32

### ow.format.toBase32(aString) : String

Given aString or array of bytes transforms the contents to base 32.

Sources:

- js/owrap.format.js:3517

<a id="api-ow-format-tobase36-e5c792a0"></a>

## ow.format.toBase36

### ow.format.toBase36(aNumber, aLength) : String

Converts a provided aNumber to the base36 representation. Optionally you can provide a length for 0 left pad.

Sources:

- js/owrap.format.js:3506

<a id="api-ow-format-tobinary-a262fb3e"></a>

## ow.format.toBinary

### ow.format.toBinary(aNumber, aLength) : String

Converts a provided aNumber to the binary representation. Optionally you can provide a length for 0 left pad.

Sources:

- js/owrap.format.js:3496

<a id="api-ow-format-tobytesabbreviation-2be15be3"></a>

## ow.format.toBytesAbbreviation

### ow.format.toBytesAbbreviation(aNumber, aDigits) : String

Returns a number abbreviation to "bytes", "KB", "MB", "GB", "TB", etc. Will round number to 3 significant digits if aDigits doesn't provide a different number of precision digits to convert to.

(available after ow.loadFormat())

Sources:

- js/owrap.format.js:3690

<a id="api-ow-format-tocslon-3e52e6e0"></a>

## ow.format.toCSLON

### ow.format.toCSLON(aObj, cTheme) : String

Equivalent to ow.fornat.toSLON but includes ansi color.

Sources:

- js/owrap.format.js:3909

<a id="api-ow-format-todate-affbc179"></a>

## ow.format.toDate

### ow.format.toDate(aStringDate, aFormat, aTimeZone) : Date

Will convert `aStringDate` into a javascript Date given `aFormat`:

- `G`: Era descriptor (AD)
- `y`: Year (1996; 96)
- `Y`: Week year (2009; 09)
- `M`: Month in year (July; Jul; 07)
- `w`: Week in year (27)
- `W`: Week in month (2)
- `D`: Day in year (189)
- `d`: Day in month (10)
- `F`: Day of week in month (2)
- `E`: Day name in week (Tuesday; Tue)
- `u`: Day number of week (1 = Monday, ..., 7 = Sunday) (1)
- `a`: Am/pm number (PM)
- `H`: Hour in day (0-23)
- `k`: Hour in day (1-24)
- `K`: Hour in am/pm (0-11)
- `h`: Hour in am/pm (1-12)
- `m`: Minute in hour (30)
- `s`: Second in minute (55)
- `S`: Millisecond (978)
- `z`: Time zone (Pacific Standard Time; PST; GMT-08:00)
- `Z`: Time zone (-0800)
- `X`: Time zone (-08; -0800; -08:00)

Optionally you can also provide the original `aTimeZone` (like 'America/New_York', 'Europe/London', 'UTC', ...)
(available after `ow.loadFormat()`)

Sources:

- js/owrap.format.js:4048

<a id="api-ow-format-tohex-38e4e2b2"></a>

## ow.format.toHex

### ow.format.toHex(aNumber, aLength) : String

Converts a provided aNumber to the hexadecimal representation. Optionally you can provide a length for 0 left pad.

Sources:

- js/owrap.format.js:3476

<a id="api-ow-format-toldapdate-d3eb3af4"></a>

## ow.format.toLDAPDate

### ow.format.toLDAPDate(aDate) : Number

Converts a javascript Date into a LDAP date (also known as Windows NT time format, Active Directory timestamps)

Sources:

- js/owrap.format.js:4201

<a id="api-ow-format-tonumberspacing-02900603"></a>

## ow.format.toNumberSpacing

### ow.format.toNumberSpacing(aNumber, aSpacer) : String

Returns a number with aSpacer as thousands separator.

(available after ow.loadFormat())

Sources:

- js/owrap.format.js:3662

<a id="api-ow-format-tooctal-165ad7ba"></a>

## ow.format.toOctal

### ow.format.toOctal(aNumber, aLength) : String

Converts a provided aNumber to the octal representation. Optionally you can provide a length for 0 left pad.

Sources:

- js/owrap.format.js:3486

<a id="api-ow-format-toslon-d69c7838"></a>

## ow.format.toSLON

### ow.format.toSLON(aObj, cTheme) : String

Stringifies `aObj` into a Single Line Object Notation using a default scheme for human readability or a
custom `cTheme` map composed of:

- `startMap`: `"("`
- `sepMap`: `", "`
- `endMap`: `")"`
- `sepKV`: `": "`
- `startArr`: `"["`
- `sepArr`: `" | "`
- `endArr`: `"]"`
- `strQuote`: `"'"`

Sources:

- js/owrap.format.js:3851

<a id="api-ow-format-tounixdate-f7cd442b"></a>

## ow.format.toUnixDate

### ow.format.toUnixDate(aDate) : Number

Returns a unix timestamp from the provided javascript aDate.

Sources:

- js/owrap.format.js:4211

<a id="api-ow-format-towedodate-fea0d67f"></a>

## ow.format.toWedoDate

### ow.format.toWedoDate(aStringDate, aFormat) : Map

Shortcut for using `ow.format.toDate` but converting the output into a wedo date.

(available after `ow.loadFormat()`)

Sources:

- js/owrap.format.js:4088

<a id="api-ow-format-transposearraylines-577c5cb1"></a>

## ow.format.transposeArrayLines

### ow.format.transposeArrayLines(anLineArray) : Array

Given anLineArray transposes into a new array of lines.

Sources:

- js/owrap.format.js:4752

<a id="api-ow-format-unescapehtml4-ce721c38"></a>

## ow.format.unescapeHTML4

### ow.format.unescapeHTML4(aString) : String

Uses Apache Commons Lang unescape HTML4 functionality to unconvert aString with HTML4 entities to the original string

Sources:

- js/owrap.format.js:4732

<a id="api-ow-format-withmd-ea8e4bcb"></a>

## ow.format.withMD

### ow.format.withMD(aString, defaultAnsi, aLineWidth, aBgColor) : String

Use aString with simple markdown and convert it to ANSI. Optionally you can add a defaultAnsi string to return back after applying the ansi styles for markdown (use ansiColor function to provide the defaultAnsi), provide aLineWidth to override the detected console width when line width is needed, and provide aBgColor (an ansiColor color name, e.g. "BG&#95;BLUE") to maintain a background color throughout the output and pass it to sub-functions where applicable. Currently supports only: bold, italic, inline code, strikethrough, tables, simple code blocks, line rule, bullets (&#96;&#42;&#96;, &#96;-&#96;, &#96;+&#96;), numbered lines (&#96;1.&#96; or &#96;1)&#96;), task lists (&#96;- &#91; &#93;&#96;, &#96;- &#91;x&#93;&#96;), nested lists, links, block quotes (that can contain lists) and simple LaTeX-like math symbols (e.g. "$&#92;rightarrow$", "$&#92;alpha$", "$&#92;leq$") which are converted to their unicode equivalent. List items are wrapped with a hanging indent, numbers are right-aligned per list and continuation lines are merged into their item. Bullet and task glyphs can be changed with &#96;&#95;&#95;flags.WITHMD.bullets&#96; (one per nesting level) and &#96;&#95;&#95;flags.WITHMD.tasks&#96;.

Sources:

- js/owrap.format.js:5450

<a id="api-ow-format-withsideline-6b45ecda"></a>

## ow.format.withSideLine

### ow.format.withSideLine(aString, aSize, ansiLine, ansiText, aTheme, aExtra) : String

Generates a ansi escaped line with a "left side line" to display `aString` which will be word-wrap given
`aSize` (default to the current console size). Optionally ansi colors for `ansiLine` and `ansiText` can be provided (see ansiColor for possible values)
and `aTheme` (using `ow.format.withSideLineThemes`, for example). For closed rectangle themes `aExtra` map can include a header, footer, headerAlign (
left or right or center) and footerAlign (left or right or center).

Sources:

- js/owrap.format.js:6051

<a id="api-ow-format-withsidelinethemes-1c539475"></a>

## ow.format.withSideLineThemes

### ow.format.withSideLineThemes() : Map

Returns a map of theme name to theme definition for use as the `aTheme` argument of `ow.format.withSideLine` (and the "theme" entries of
`__colorFormat.md`). A theme is a map with the optional characters ltop, tmiddle, rtop (top border), lmiddle, rmiddle (left and right sides),
lbottom, bmiddle, rbottom (bottom border) and tab (replacement for tab characters, default 3 spaces). The top/bottom border is only drawn when
the corner entries are defined. Built-in themes: closedOneSpace, simpleOneSpace, simpleLine, doubleOneSpace, doubleLine, simpleLineWithTips,
simpleLineWithBottomTip, simpleLineWithTopTip, simpleLineWithCTips, simpleLineWithCBottomTip, simpleLineWithCTopTip, simpleLineWithRTips,
simpleLineWithRTopTip, simpleLineWithRBottomTip, doubleLineWithRTips, doubleLineBothSides, closedRect, closedDoubleRect, closedCurvedRect,
openTopRect, openBottomRect, openRect, openTopCurvedRect, openBottomCurvedRect, openCurvedRect, openCurvedSpace and blockCurvedSpace.
Custom themes can be added (built-in themes win on name clashes) by setting `__flags.sideLineCustomThemes` to a map of name to theme before calling it.

Example:

```javascript
__flags.sideLineCustomThemes = { arrow: { lmiddle: ">" } }
print(ow.format.withSideLine("hello", __, "GREEN", __, ow.format.withSideLineThemes().arrow))
```

Sources:

- js/owrap.format.js:5856

