// Standalone assertions: no OpenAF repository test harness required.
ow.loadTest();
var records = io.readFileJSON("records.json");
ow.test.assert($from(records).equals("status", "active").select(), [{ id: 1, status: "active" }], "active records");
ow.test.assert($from(records).equals("status", "missing").select(), [], "empty selection");
print("filter assertions: ok");
