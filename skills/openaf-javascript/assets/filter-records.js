// Run: openaf -f filter-records.js -e 'input=records.json;status=active'
var options = processExpr();
var input = _$(options.input, "input").isString().$_();
var status = _$(options.status, "status").isString().default("active");
var records = _$(io.readFileJSON(input), "records").isArray().$_();
var result = $from(records).equals("status", status).select();
print(stringify(result, __, ""));
