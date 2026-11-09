# ow.format.cron

[Home](../../../index.md) / [All APIs](../../../all-apis.md) / [ow](../../index.md) / [ow.format](../index.md) / [ow.format.cron](index.md)

<a id="api-ow-format-cron-howmanyago-6c9e9b4c"></a>

## ow.format.cron.howManyAgo

### ow.format.cron.howManyAgo(aCron, lastUpdate, aLimit) : Map

Given aCron expression and a date/unix time of a lastUpdate will return a map with a boolean isDelayed, number of  ms delayedAtLeast, if delayed howManyAgo executions missed and the corresponding missed executions dates in missedTimes. When calculating the missed times there is aLimit (defaults to 100).

Sources:

- js/owrap.format.js:6647

<a id="api-ow-format-cron-iscronmatch-a2d0d0b2"></a>

## ow.format.cron.isCronMatch

### ow.format.cron.isCronMatch(aDate, aCronExpression) : boolean

Returns trues if the provided aDate is a match for the provided aCronExpression. Otherwise returns false.

Sources:

- js/owrap.format.js:6614

<a id="api-ow-format-cron-nextscheduled-bc35998f"></a>

## ow.format.cron.nextScheduled

### ow.format.cron.nextScheduled(expr, count, start, end) : Date

Given a cron expr returns the next Date object when it will occur. If count &#62; 1 it will provide an array of Dates with the next n Dates. If start and end Date are defined they will limit the range on which to provide dates.

Sources:

- js/owrap.format.js:6552

<a id="api-ow-format-cron-parse-70858085"></a>

## ow.format.cron.parse

### ow.format.cron.parse(aCronExpression) : Map

Parses `aCronExpression` and produces a Map with a schedules array and a exceptions array (if any error is found).
Each schedules array item map has a key with all the number possibilities for the given `aCronExpression` provided:

- `s`: seconds (0-59)
- `m`: minutes (0-59)
- `h`: hours (0-23)
- `D`: month day (1-31)
- `M`: month (1-12)
- `d`: week day (1-7)

Example:

`ow.format.cron.parse("0 5 * * *")`; // 5am

Sources:

- js/owrap.format.js:6526

<a id="api-ow-format-cron-prevscheduled-71690761"></a>

## ow.format.cron.prevScheduled

### ow.format.cron.prevScheduled(expr, count, start, end) : Date

Given a cron expr returns the previous Date object when it will occur. If count &#62; 1 it will provide an array of Dates with the previous n Dates. If start and end Date are defined they will limit the range on which to provide dates.

Sources:

- js/owrap.format.js:6563

<a id="api-ow-format-cron-set2localtime-1d87f157"></a>

## ow.format.cron.set2LocalTime

### ow.format.cron.set2LocalTime()

Sets the default system-wide cron expression evaluation to the local time (default is UTC).

Sources:

- js/owrap.format.js:6604

<a id="api-ow-format-cron-set2utc-911c5e48"></a>

## ow.format.cron.set2UTC

### ow.format.cron.set2UTC()

Sets the default system-wide cron expression evaluation to UTC (the default).

Sources:

- js/owrap.format.js:6594

<a id="api-ow-format-cron-sleepuntilnext-1b3c5643"></a>

## ow.format.cron.sleepUntilNext

### ow.format.cron.sleepUntilNext(expr)

Sleeps until the cron expr is expected to be true.

Sources:

- js/owrap.format.js:6584

<a id="api-ow-format-cron-timeuntilnext-8477903c"></a>

## ow.format.cron.timeUntilNext

### ow.format.cron.timeUntilNext(expr) : Number

Returns a number of ms until the cron expr is expected to be true.

Sources:

- js/owrap.format.js:6574

