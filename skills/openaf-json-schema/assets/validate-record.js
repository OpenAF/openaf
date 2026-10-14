ow.loadObj();
ow.loadTest();
ow.obj.schemaInit({ useDefaults: false, allErrors: true });
var validate = ow.obj.schemaCompile({
  type: "object",
  properties: { count: { type: "integer", minimum: 0 } },
  required: ["count"],
  additionalProperties: false
});
ow.test.assert(validate({ count: 2 }), true, "valid record");
ow.test.assert(validate({ count: -1 }), false, "invalid record");
if (!isArray(validate.errors) || validate.errors.length === 0) throw "Missing validation errors";
print("schema: ok");
