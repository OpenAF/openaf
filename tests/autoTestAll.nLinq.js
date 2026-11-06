// Regression coverage for query results and set-operation compatibility.
exports.testGrouping = function() {
  var rows = [{ k: 1, v: 10 }, { k: 1, v: 20 }, { k: 2, v: 30 }, { k: 2, v: 40 }]
  var grouped = $from(rows).group("k")
  ow.test.assert(grouped[1], rows.slice(0, 2), "Numeric groups retain every row")
  ow.test.assert(grouped[1][0] === rows[0], true, "Grouping retains row identity")
  ow.test.assert($from(rows).sumBy("k", "v"), [{ k: "1", _sum: 30 }, { k: "2", _sum: 70 }], "Numeric sums retain every row")
  ow.test.assert($from(rows).countBy("k"), [{ k: "1", _count: 2 }, { k: "2", _count: 2 }], "Numeric counts retain every row")
  ow.test.assert($from(rows).averageBy("k", "v"), [{ k: "1", _avg: 15 }, { k: "2", _avg: 35 }], "Numeric averages retain every row")
  ;[1, "1", true, false, null, undefined, "__proto__", "constructor", "toString"].forEach(function(key) {
    var members = [{ k: key, sub: 3 }, { k: key, sub: 3 }]
    var result = $from(members).group("k")
    ow.test.assert(Object.prototype.hasOwnProperty.call(result, String(key)), true, "Group is an own property: " + key)
    ow.test.assert(result[String(key)], members, "Repeated grouping key: " + key)
    var nested = $from(members).groupBy("k,sub")
    ow.test.assert(Object.prototype.hasOwnProperty.call(nested, String(key)), true, "Nested group is an own property: " + key)
    ow.test.assert(nested[String(key)][3], members, "Nested group retains all rows: " + key)
  })
  ow.test.assert($from([]).group("k"), {}, "Empty grouping")
  ow.test.assert($from([1, 1, 2]).group(), { "1": [1, 1], "2": [2] }, "Primitive grouping")
}

exports.testPagination = function() {
  var input = [1, 2, 3, 4, 5, 6]
  ;[[0, 2], [2, 2], [3, 1], [9, 2], [1, -2], [-3, 2], [2, 0]].forEach(function(page) {
    var expected = $from(input).skipTake(page[0], page[1]).select()
    ow.test.assert($from(input).greater(0).skipTake(page[0], page[1]).select(), expected, "An all-pass filter preserves pagination: " + page)
  })
  ow.test.assert($from(input).greater(2).skipTake(1, 2).select(), [4, 5], "Filter then skip then take")
  ow.test.assert($from(input).greater(9).skipTake(1, 2).select(), [], "No matches")
  var calls = 0
  var result = $from(input).where(function(value) { calls++; return value % 2 === 0 }).skipTake(1, 1).select()
  ow.test.assert(result, [4], "Callback filter pagination")
  ow.test.assert(calls, input.length, "Pagination preserves predicate evaluation")
}

exports.testSetOperations = function() {
  function sameRows(actual, expected, message) {
    ow.test.assert(actual.length, expected.length, message + " length")
    actual.forEach(function(value, index) {
      ow.test.assert(value === expected[index] || (typeof value === "number" && isNaN(value) && typeof expected[index] === "number" && isNaN(expected[index])), true, message + " order/identity " + index)
    })
  }
  var a = { a: 1, b: 2 }, b = { b: 2, a: 1 }, c = { a: 3 }, d = { a: 4 }
  var left = [a, a, c, undefined, null, NaN], right = [b, d, d, null]
  sameRows($from(left).intersect(right).select(), [a, a, null, NaN], "Intersection preserves canonical equality and duplicates")
  sameRows($from(left).except(right).select(), [c, undefined], "Difference preserves order and identity")
  sameRows($from(left).union(right).select(), left.concat([d, d]), "Union keeps duplicate new RHS rows")
  sameRows($from(left).union([]).select(), left, "Empty RHS union")
  sameRows($from([]).intersect(right).select(), [], "Empty intersection")
  sameRows($from(left).except([]).select(), left, "Empty RHS difference")
  var sparse = new Array(1)
  sameRows($from([undefined]).intersect(sparse).select(), [], "Sparse RHS does not contain undefined")
  sameRows($from([undefined]).except(sparse).select(), [undefined], "Sparse RHS preserves explicit undefined")
  var sparseUnion = $from(sparse).union([undefined]).select()
  ow.test.assert(sparseUnion.length, 2, "Sparse union retains hole and explicit undefined")
  ow.test.assert(Object.keys(sparseUnion), ["1"], "Union preserves sparse ownership")
  var nested = { x: { a: 1, b: 2 } }, reordered = { x: { b: 2, a: 1 } }
  sameRows($from([nested]).intersect([reordered]).select(), [nested], "Nested map keys normalize")
  var arrayMap = { x: [{ a: 1, b: 2 }] }, arrayReordered = { x: [{ b: 2, a: 1 }] }
  sameRows($from([arrayMap]).intersect([arrayReordered]).select(), [], "Nested array serialization retains existing equality")
}
