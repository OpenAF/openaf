# ow.server.telemetry

[Home](../../../index.md) / [All APIs](../../../all-apis.md) / [ow](../../index.md) / [ow.server](../index.md) / [ow.server.telemetry](index.md)

<a id="api-ow-server-telemetry-active-516f8ca4"></a>

## ow.server.telemetry.active

### ow.server.telemetry.active(aSendFunc, aPeriod)

Setup recurrent execution of aSendFunc with the propose of sending ow.metrics for a provided aPeriod (defaults to 60000 ms).

Sources:

- js/owrap.server.js:2392

<a id="api-ow-server-telemetry-passive-b5c10cb4"></a>

## ow.server.telemetry.passive

### ow.server.telemetry.passive(aHTTPdOrPort, aURI, useOpenMetrics, openMetricsPrefix, openMetricsHelp, openMetricsStrict)

Setup a HTTPd server on aHTTPdOrPort (defaults to 7777) on the aURI (defaults to /healthz) to  serve ow.metrics.getAll. If the parameter "s" is present the value will be split by commas and used for ow.metrics.getSome. Optionally if useOpenMetrics = true the default of aURI becomes /metrics and the output becomes open metrics (prometheus) using openMetricsPrefix (defaults to "metric") and uses the openMetricsHelp where each key is a open metric entry associated with map with text (description text), help (help text) and type (metrics type). OpenMetrics responses default to strict OpenMetrics 1.0 text (unknown, gauge and counter scalar families), with the versioned content type and EOF marker. Set openMetricsStrict to false for the legacy Prometheus text output.

Sources:

- js/owrap.server.js:2351

<a id="api-ow-server-telemetry-send2prometheus-512f90b8"></a>

## ow.server.telemetry.send2Prometheus

### ow.server.telemetry.send2Prometheus(aPrometheusGatewayURL, aPrefix, anArrayOfMetricNames) : Function

Returns a function to be used with ow.server.telemetry.active to send metrics to a OpenMetrics/Prometheus gateway using the provided aPrometheusGatewayURL with aPrefix (e.g. "myjobname") and, optionally, an array of metrics (anArrayOfMetricsNames)

Sources:

- js/owrap.server.js:2437

<a id="api-ow-server-telemetry-send2nattrmon-6cdfa580"></a>

## ow.server.telemetry.send2nAttrMon

### ow.server.telemetry.send2nAttrMon(anAttrMonCValsURL, anAttrPrefix, anArrayOfMetricNames) : Function

Returns a function to be used with ow.server.telemetry.active to send metrics to nAttrMon using the provided anAttrMonCValsURL, anAttrPrefix (e.g. "myjobname/") and, optionally, an array of metrics (anArrayOfMetricsNames)

Sources:

- js/owrap.server.js:2409

