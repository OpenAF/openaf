// Run: openaf -f http-json.js -e 'url=http://127.0.0.1:8080/records.json'
try {
  var url = _$(processExpr().url, "url").isString().$_();
  var result = $rest({ throwExceptions: true, connectionTimeout: 5000 }).get(url);
  print(stringify(_$(result, "response").isArray().$_(), __, ""));
} catch (error) {
  printErr("http-json: " + error);
  exit(1);
}
