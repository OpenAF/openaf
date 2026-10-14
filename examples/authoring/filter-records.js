// Run from this directory: openaf -f filter-records.js -e 'input=records.json;status=active'
try {
  var options = processExpr();
  var input = _$(options.input, "input").isString().$_();
  var status = _$(options.status, "status").isString().default("active");
  var records = _$(io.readFileJSON(input), "records").isArray().$_();
  var result = $from(records).equals("status", status).select();
  if (isDef(options.output)) io.writeFileJSON(_$(options.output).isString().$_(), result);
  print(stringify(result, __, ""));
} catch (error) {
  printErr("filter-records: " + error);
  exit(1);
}
