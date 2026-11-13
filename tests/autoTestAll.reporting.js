// Keep CI counters and rich reports derived from the same detached snapshot.
exports.summarize = function(snapshot, runId, jobErrors) {
  var result = Object.assign({}, snapshot, {
    runId: runId,
    pass: 0,
    fail: 0,
    skip: 0,
    count: snapshot.records.length,
    asserts: 0,
    infrastructureErrors: snapshot.infrastructureErrors.concat(jobErrors || [])
  })
  snapshot.records.forEach(function(record) {
    if (record.status === "PASS") result.pass++
    else if (record.status === "SKIP" || record.status === "TODO") result.skip++
    else result.fail++
    result.asserts += record.assertions || 0
  })
  result.exitCode = !result.complete || result.infrastructureErrors.length > 0 || result.count === 0 ? 2 : result.fail > 0 ? 1 : 0
  return result
}
