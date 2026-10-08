// Run from the directory containing the exported handlers.js.
ow.loadTest();
var handlers = require("handlers.js");
var args = {text: "hello"};
handlers.Normalize(args);
ow.test.assert(args.text, "HELLO", "Normalize changes args.text");
handlers.Normalize(args);
ow.test.assert(args.text, "HELLO", "Normalize is idempotent");
print("module assertions: ok");
