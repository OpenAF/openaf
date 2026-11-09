# ow.test

[Home](../../index.md) / [All APIs](../../all-apis.md) / [ow](../index.md) / [ow.test](index.md)

<a id="api-ow-test-assert-ca165186"></a>

## ow.test.assert

### ow.test.assert(aResult, checkValue, errorMessage, notShowDiff)

Compares `aResult` with `checkValue` using the existing OpenAF `compare` function. Throws `errorMessage` on a mismatch.

When `notShowDiff` is `true`, omits the actual and expected values from the thrown message. Each call counts as one assertion. Available after `ow.loadTest()`.

Sources:

- js/owrap.test.js:222

<a id="api-ow-test-getallprofileavg-2f519b3f"></a>

## ow.test.getAllProfileAvg

### ow.test.getAllProfileAvg() : Map

Returns a map of all profile keys to their average elapsed times in milliseconds. Profiles without completed executions have an `undefined` average.

Sources:

- js/owrap.test.js:560

<a id="api-ow-test-getallprofilehits-154d4499"></a>

## ow.test.getAllProfileHits

### ow.test.getAllProfileHits() : Map

Returns a map of all profile keys to their completed execution counts.

Sources:

- js/owrap.test.js:552

<a id="api-ow-test-getallprofilelast-73a60444"></a>

## ow.test.getAllProfileLast

### ow.test.getAllProfileLast() : Map

Returns a map of all profile keys to their last elapsed times in milliseconds. Profiles without completed executions have an `undefined` last value.

Sources:

- js/owrap.test.js:568

<a id="api-ow-test-getchannel-41a69fb3"></a>

## ow.test.getChannel

### ow.test.getChannel() : Channel

Returns the channel used for compatibility test results. The default session uses `__owTest::tests`; independent sessions use private channels.

The session owns authoritative results. Editing channel entries does not change execution history.

Sources:

- js/owrap.test.js:585

<a id="api-ow-test-getcountassert-d400f3dc"></a>

## ow.test.getCountAssert

### ow.test.getCountAssert() : Number

Returns the current count of assertion calls, including assertions that failed.

Sources:

- js/owrap.test.js:135

<a id="api-ow-test-getcountfail-e0d347d3"></a>

## ow.test.getCountFail

### ow.test.getCountFail() : Number

Returns the current count of tests that failed.

Sources:

- js/owrap.test.js:127

<a id="api-ow-test-getcountpass-ee3d7f1c"></a>

## ow.test.getCountPass

### ow.test.getCountPass() : Number

Returns the current count of tests that passed.

Sources:

- js/owrap.test.js:119

<a id="api-ow-test-getcounttest-dcb5c4f3"></a>

## ow.test.getCountTest

### ow.test.getCountTest() : Number

Returns the current count of executed tests. Assertions are counted separately by `ow.test.getCountAssert()`.

Sources:

- js/owrap.test.js:111

<a id="api-ow-test-getexechistory-3ae5043b"></a>

## ow.test.getExecHistory

### ow.test.getExecHistory() : Array

Returns a detached snapshot of test execution history, including repeated executions.

Sources:

- js/owrap.test.js:607

<a id="api-ow-test-getprofile-bf1c786f"></a>

## ow.test.getProfile

### ow.test.getProfile() : Map

Returns a detached map of profile keys and their `hits`, `sum`, `last`, `start`, `max` and `min` values.

Elapsed times are in integer milliseconds; `start` is a wall-clock timestamp. Timing values without completed samples may be `undefined`.

Sources:

- js/owrap.test.js:476

<a id="api-ow-test-getprofileavg-efdf4c60"></a>

## ow.test.getProfileAvg

### ow.test.getProfileAvg(aProfileKey) : Number

Returns the average elapsed time in milliseconds for `aProfileKey`, or `undefined` when there are no completed executions.

Sources:

- js/owrap.test.js:513

<a id="api-ow-test-getprofilehits-61481ea8"></a>

## ow.test.getProfileHits

### ow.test.getProfileHits(aProfileKey) : Number

Returns the number of completed timer executions for `aProfileKey`, or `0` when no profile exists.

Sources:

- js/owrap.test.js:505

<a id="api-ow-test-getprofilelast-330048ad"></a>

## ow.test.getProfileLast

### ow.test.getProfileLast(aProfileKey) : Number

Returns the last elapsed time in milliseconds for `aProfileKey`, or `undefined` when there are no completed executions.

Sources:

- js/owrap.test.js:521

<a id="api-ow-test-getprofilemax-5dca1fd9"></a>

## ow.test.getProfileMax

### ow.test.getProfileMax(aProfileKey) : Number

Returns the maximum elapsed time in milliseconds for `aProfileKey`, or `undefined` when there are no completed executions.

Sources:

- js/owrap.test.js:529

<a id="api-ow-test-getprofilemin-94a82e78"></a>

## ow.test.getProfileMin

### ow.test.getProfileMin(aProfileKey) : Number

Returns the minimum elapsed time in milliseconds for `aProfileKey`, or `undefined` when there are no completed executions.

Sources:

- js/owrap.test.js:537

<a id="api-ow-test-profilereset-85fd85e7"></a>

## ow.test.profileReset

### ow.test.profileReset(aProfileKey)

Resets the counters and timing statistics for `aProfileKey`. Throws `TestBusyError` while that profile has active timers.

Sources:

- js/owrap.test.js:454

<a id="api-ow-test-reset-e845d238"></a>

## ow.test.reset

### ow.test.reset()

Resets counters, results, suite definitions and profiling state for this session.

Throws `TestBusyError` while tests, timers or a suite run are active, and `SessionPoisonedError` for a poisoned session. Available after `ow.loadTest()`.

Sources:

- js/owrap.test.js:68

<a id="api-ow-test-setkeepstacktrace-dede0afb"></a>

## ow.test.setKeepStackTrace

### ow.test.setKeepStackTrace(aBooleanSetting)

Enables or disables retaining Java exception stack traces in execution records with `aBooleanSetting`. Disabled by default.

Sources:

- js/owrap.test.js:173

<a id="api-ow-test-setmemoryprofile-d66fd1ef"></a>

## ow.test.setMemoryProfile

### ow.test.setMemoryProfile(aBooleanSetting)

Enables or disables process-heap sampling for timers with `aBooleanSetting`. Disabled by default.

Samples do not force garbage collection and are not per-test allocation measurements.

Sources:

- js/owrap.test.js:185

<a id="api-ow-test-setoutput-839a77b8"></a>

## ow.test.setOutput

### ow.test.setOutput(aBooleanSetting)

Enables or disables test output with `aBooleanSetting`. Enabled by default.

Sources:

- js/owrap.test.js:149

<a id="api-ow-test-setshowstacktrace-29b6508e"></a>

## ow.test.setShowStackTrace

### ow.test.setShowStackTrace(aBooleanSetting)

Enables or disables Java exception stack-trace output with `aBooleanSetting`. Enabled by default; output also requires `setOutput(true)`.

Sources:

- js/owrap.test.js:161

<a id="api-ow-test-start-aab632f5"></a>

## ow.test.start

### ow.test.start(aKey) : String

Starts a timer for `aKey` and returns the supplied key. `ow.test.stop(aKey)` stops the most recent matching timer on the current thread.

Nested timers with the same key use a per-thread stack; elapsed time uses a monotonic clock.

Sources:

- js/owrap.test.js:402

<a id="api-ow-test-stop-b64cae81"></a>

## ow.test.stop

### ow.test.stop(aKey) : Number

Stops the most recent active timer for `aKey` on the current thread and returns elapsed time in integer milliseconds.

Without a matching timer, returns `undefined`, or throws `TimerStateError` when the session uses `strict: true`.

Sources:

- js/owrap.test.js:424

<a id="api-ow-test-test-ec196a11"></a>

## ow.test.test

### ow.test.test(aTest, aFunction, aArgMap) : Object

Runs `aFunction` as the test named `aTest`. Names containing `::` provide report grouping.

The callback receives:

1. A function for logging a map, array, string or other result value.
2. The optional `aArgMap`.

Returns the callback result on success and `undefined` on failure under the default `record` policy. A successful callback may also return `undefined`; use `execute()` or `getResults()` for an explicit status. Available after `ow.loadTest()`.

```javascript
ow.loadTest()
ow.test.test("Example::sum", function() {
  ow.test.assert(1 + 1, 2, "Unexpected sum")
})
```

Sources:

- js/owrap.test.js:930

<a id="api-ow-test-testexternally-720006bf"></a>

## ow.test.testExternally

### ow.test.testExternally(aTest, aCommand, aTimeout) : Object

Runs `aCommand` as the test named `aTest`, with an optional `aTimeout` in milliseconds. A nonzero exit code records a failure.

Returns standard output on success and `undefined` on failure under the default `record` policy. A name containing `::` provides report grouping. Available after `ow.loadTest()`.

Sources:

- js/owrap.test.js:966

<a id="api-ow-test-tojunitxml-449be970"></a>

## ow.test.toJUnitXML

### ow.test.toJUnitXML(testSuitesId, testSuitesName) : String

Returns JUnit XML for all recorded executions, using `testSuitesId` and `testSuitesName` as identifiers.

Durations are expressed in seconds; text and attributes are XML-escaped. For one logical testcase per suite test, including retry attempts, use `ow.test.report.junit(run, testSuitesId, testSuitesName)`.

Sources:

- js/owrap.test.report.js:138

<a id="api-ow-test-tomarkdown-0fe67e25"></a>

## ow.test.toMarkdown

### ow.test.toMarkdown() : String

Returns a Markdown summary and per-test result table for all recorded executions in this session.

For a specific suite run or snapshot, use `ow.test.report.markdown(result)`.

Sources:

- js/owrap.test.report.js:124

