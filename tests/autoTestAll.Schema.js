// Copyright 2026 Nuno Aguiar
(function() {
  var assert = function(actual, expected, message) { ow.test.assert(actual, expected, message); };
  var throws = function(fn, text) {
    var error;
    try { fn(); } catch(e) { error = e; }
    assert(isDef(error), true, "Expected validation/compilation to fail: " + text);
    if (isDef(text)) assert(String(error).indexOf(text) >= 0, true, "Unexpected error: " + error);
    return error;
  };
  var child = function(code) {
    var result = $sh([String(java.lang.System.getProperty("java.home")) + "/bin/java",
      "--enable-native-access=ALL-UNNAMED", "-Dopenaf.cds.training=true", "-jar", getOpenAFJar(), "-c",
      "try { ow.loadObj(); ow.loadTest(); " + code + "; print('SCHEMA_CHILD_OK'); } catch(e) { printErr(String(e)); exit(1); }"])
      .timeout(60000).get(0);
    assert(result.exitcode, 0, "Schema subprocess failed: " + result.stdout + result.stderr);
    assert(result.stdout.indexOf("SCHEMA_CHILD_OK") >= 0, true, "Schema subprocess did not complete: " + result.stdout);
  };
  var d19 = "https://json-schema.org/draft/2019-09/schema";
  var d20 = "https://json-schema.org/draft/2020-12/schema";

  exports.testHelpers = function() {
    ow.loadObj();
    var schema = { type: "object", properties: { id: { type: "integer" } }, required: ["id"] };
    assert(ow.obj.schemaCheck(schema), true, "Valid schema was rejected.");
    assert(ow.obj.schemaCheck({ type: "long" }), false, "Invalid schema was accepted.");
    assert(ow.obj.schemaValidate(schema, { id: 3 }), true, "Valid data was rejected.");
    var validate = ow.obj.schemaCompile(schema);
    assert(validate({ id: "3" }), false, "Coercion must be disabled by default.");
    assert(validate.errors[0].instancePath, "/id", "Expected v8 instancePath.");
    assert(typeof throws(function() { ow.obj.schemaValidate(schema, { id: "3" }); }, "args/id"), "string", "Invalid data must throw a string.");
    throws(function() { ow.obj.schemaValidate(schema, { id: "3" }, { dataVar: "payload" }); }, "payload/id");
    assert($$({ id: 3 }).isSchema(schema), true, "$$ valid schema failed.");
    throws(function() { $$({}).isSchema(schema); }, "required");
    _$( { id: 3 }, "data").isSchema(schema).$_();
    throws(function() { _$({}, "data").isSchema(schema, "bad payload").$_(); }, "bad payload");
    assert(ow.obj.schemaCompile(true)("anything"), true, "True schema failed.");
    assert(ow.obj.schemaCompile(false)("anything"), false, "False schema failed.");
  };

  exports.testDefaultsAndData = function() {
    ow.loadObj();
    var data = { min: 3, actual: 5 };
    var schema = { type: "object", properties: {
      name: { type: "string", default: "anonymous" },
      min: { type: "number" }, actual: { type: "number", minimum: { $data: "1/min" } }
    } };
    assert(ow.obj.schemaValidate(schema, data), true, "$data constraint failed.");
    assert(data.name, "anonymous", "Defaults must modify the original data.");
    assert(ow.obj.schemaCompile(schema)({ min: 8, actual: 5 }), false, "$data constraint was ignored.");
    assert(ow.obj.schemaCompile({ type: "number" })(NaN), true, "Preserve v6 draft-07 non-finite number behavior.");
    assert(ow.obj.schemaCompile({ definitions: { x: { type: "string" } }, $ref: "#/definitions/x", minLength: 5 })("a"), true, "Draft-07 $ref siblings must remain ignored.");
    assert(ow.obj.schemaCompile({ type: ["string", "number"], customAnnotation: true })(3), true, "Permissive schema compilation changed.");
    assert(ow.obj.schemaCompile({ type: "string", pattern: "\\a" })("a"), true, "Draft-07 legacy regular expressions changed.");
  };

  exports.testRegistryAndCache = function() {
    ow.loadObj();
    var base = { $id: "https://example.com/openaf-schema-cache", type: "integer" };
    var fn = ow.obj.schemaCompile(base);
    assert(ow.obj.schemaCompile(clone(base)) === fn, true, "Equivalent schemas must reuse compiled validators.");
    ow.obj.schemaAdd("openaf-registry-base", base);
    assert(ow.obj.schemaValidate("openaf-registry-base", 5), true, "Registered key failed.");
    assert(ow.obj.schemaValidate(base.$id, 5), true, "Registered $id failed.");
    ow.obj.schemaAdd("openaf-registry-ref", { $ref: base.$id });
    assert(ow.obj.schemaValidate("openaf-registry-ref", 5), true, "Registered reference failed.");
    throws(function() { ow.obj.schemaAdd("openaf-registry-base", { type: "string" }); }, "already exists");
    ow.obj.schemaAdd("openaf-registry-temp", { type: "string" });
    ow.obj.schemaRemove("openaf-registry-temp");
    assert(ow.obj.schemaCompile(clone(base)) === fn, true, "Removing another schema must not break content caching.");
    ow.obj.schemaRemove("openaf-registry-ref");
    ow.obj.schemaRemove("openaf-registry-base");
    ow.obj.schemaRemove(base.$id);
    ow.obj.schemaAdd("openaf-registry-base", { type: "string" });
    assert(ow.obj.schemaValidate("openaf-registry-base", "new"), true, "Re-registration failed.");
    ow.obj.schemaRemove(/^openaf-registry-/);
    throws(function() { ow.obj.schemaValidate("openaf-registry-base", 5); }, "not registered");
    throws(function() { ow.obj.schemaCompile({ $ref: "https://example.com/missing-openaf-schema" }); }, "resolve reference");
    var pending = { $id: "https://example.com/openaf-pending", $ref: "https://example.com/openaf-later" };
    throws(function() { ow.obj.schemaCompile(pending); }, "resolve reference");
    throws(function() { ow.obj.schemaAdd("openaf-registry-cross", { $schema: d20, $id: pending.$id, type: "integer" }); }, "already registered");
    ow.obj.schemaAdd("openaf-registry-later", { $id: "https://example.com/openaf-later", type: "integer" });
    assert(ow.obj.schemaCompile(clone(pending))(3), true, "Retry with an equivalent schema must work after adding its missing reference.");
    ow.obj.schemaRemove(pending.$id);
    ow.obj.schemaRemove("openaf-registry-later");
    ow.obj.schemaRemove("https://example.com/openaf-later");
  };

  exports.testDrafts = function() {
    ow.loadObj();
    var s19 = { $schema: d19 + "#", $id: "https://example.com/openaf-schema-19", type: "object",
      properties: { a: { type: "number" } }, dependentRequired: { a: ["b"] },
      allOf: [{ properties: { b: { type: "string" } } }], unevaluatedProperties: false };
    assert(ow.obj.schemaCheck(s19), true, "2019-09 schema check failed.");
    var v19 = ow.obj.schemaCompile(s19);
    assert(v19({ a: 1, b: "x" }), true, "2019-09 valid data failed.");
    assert(v19({ a: 1 }), false, "dependentRequired was ignored.");
    assert(v19({ b: "x", c: true }), false, "unevaluatedProperties was ignored.");
    var s20 = { $schema: d20, $id: "https://example.com/openaf-schema-20", type: "array",
      prefixItems: [{ type: "string" }, { type: "integer" }], items: false };
    assert(ow.obj.schemaCheck(s20), true, "2020-12 schema check failed.");
    var v20 = ow.obj.schemaCompile(s20);
    assert(v20(["x", 1]), true, "2020-12 valid tuple failed.");
    assert(v20(["x", "1"]), false, "prefixItems was ignored.");
    assert(v20(["x", 1, 2]), false, "2020-12 items:false was ignored.");
    ow.obj.schemaAdd("openaf-schema-19", s19);
    ow.obj.schemaAdd("openaf-schema-20", s20);
    assert(ow.obj.schemaValidate("openaf-schema-19", { a: 1, b: "x" }), true, "2019 named routing failed.");
    assert(ow.obj.schemaValidate("openaf-schema-20", ["x", 1]), true, "2020 named routing failed.");
    assert(ow.obj.schemaValidate({ type: "integer" }, 7), true, "Newer drafts changed the default engine.");
    throws(function() { ow.obj.schemaAdd("openaf-schema-20", { type: "string" }); }, "already registered");
    throws(function() { ow.obj.schemaCompile({ $id: s20.$id, type: "string" }); }, "already registered");
    throws(function() { ow.obj.schemaCompile({ $ref: s20.$id }); }, "Cross-draft");
    throws(function() { ow.obj.schemaCompile({ $schema: "https://example.com/unknown-draft" }); }, "Unsupported");
    ow.obj.schemaAdd("openaf-schema-20-ref", { $schema: d20, $ref: s20.$id });
    assert(ow.obj.schemaValidate("openaf-schema-20-ref", ["x", 1]), true, "Same-draft reference failed.");
    var sibling = { $schema: d20, $defs: { x: { type: "string" } }, $ref: "#/$defs/x", minLength: 3 };
    assert(ow.obj.schemaCompile(sibling)("a"), false, "New draft $ref sibling must be validated.");
    var recursive20 = { $schema: d20, $dynamicAnchor: "node", type: "object", properties: {
      value: { type: "integer" }, child: { $dynamicRef: "#node" }
    } };
    var recursiveValidator = ow.obj.schemaCompile(recursive20);
    assert(recursiveValidator({ value: 1, child: { value: 2 } }), true, "Dynamic reference failed.");
    assert(recursiveValidator({ value: 1, child: { value: "bad" } }), false, "Dynamic reference was ignored.");
    var nested = { $schema: d20, $id: "https://example.com/openaf-schema-parent", $defs: {
      child: { $id: "child", type: "integer" }
    } };
    ow.obj.schemaAdd("openaf-schema-parent", nested);
    assert(ow.obj.schemaValidate("https://example.com/child", 3), true, "Nested $id lookup failed.");
    throws(function() { ow.obj.schemaAdd("openaf-schema-other", { $id: "https://example.com/child", type: "string" }); }, "already registered");
    ["openaf-schema-19", "openaf-schema-20", "openaf-schema-20-ref", "openaf-schema-parent"].forEach(function(key) { ow.obj.schemaRemove(key); });
    [s19.$id, s20.$id, nested.$id, "https://example.com/child"].forEach(function(key) { ow.obj.schemaRemove(key); });
  };

  exports.testFormatsAndGenerator = function() {
    ow.loadObj();
    var values = { email: ["a@example.com", "bad"], uri: ["https://example.com", "bad uri"],
      uuid: ["123e4567-e89b-12d3-a456-426614174000", "bad"], date: ["2026-10-03", "bad"],
      "date-time": ["2026-10-03T12:30:00Z", "bad"], ipv4: ["127.0.0.1", "999.0.0.1"],
      ipv6: ["::1", "bad"], hostname: ["example.com", "bad host"] };
    Object.keys(values).forEach(function(format) {
      var v = ow.obj.schemaCompile({ type: "string", format: format });
      assert(v(values[format][0]), true, "Valid " + format + " failed.");
      assert(v(values[format][1]), false, "Invalid " + format + " passed.");
    });
    throws(function() { ow.obj.schemaCompile({ type: "string", format: "openaf-unknown-format" }); }, "unknown format");
    assert(ow.obj.schemaCompile({ type: "string", format: "date-time" })("2026-10-03 12:30:00Z"), false, "Documented v8 date-time change must remain visible.");
    // Fast mode retains v6's deliberately permissive date validation.
    assert(ow.obj.schemaCompile({ type: "string", format: "date" })("2026-02-31"), true, "Fast format mode changed.");
    assert(ow.obj.schemaCompile({ type: "string", minLength: 2 })("😀"), false, "Unicode character length changed.");
    var generated = ow.obj.schemaGenerator({ name: "Alice", age: 3, email: "a@example.com" }, "https://example.com/openaf-generated", ["name"]);
    assert(generated.$schema, "http://json-schema.org/draft-07/schema#", "Generator draft changed.");
    assert(ow.obj.schemaCheck(generated), true, "Generated schema is invalid.");
    assert(ow.obj.schemaValidate(generated, { name: "Bob", age: 4, email: "b@example.com" }), true, "Generated schema failed validation.");
    ow.obj.schemaRemove(generated.$id);
  };

  exports.testConfiguration = function() {
    child("var tests=require('autoTestAll.Schema.js'); tests.configurationCases()");
  };
  // Runs only in the isolated configuration subprocess, never as a full-suite job.
  exports.configurationCases = function() {
    var reset = function(options) { delete global.__ajvState; delete global.__ajv; ow.obj.schemaInit(options); };
    reset({});
    var data = {};
    ow.obj.schemaValidate({ properties: { x: { default: 3 } } }, data);
    assert(isUnDef(data.x), true, "Explicit options must replace OpenAF defaults.");
    ow.obj.schemaInit({ useDefaults: true });
    assert(isUnDef(global.__ajv.opts.useDefaults), true, "Initialization must remain first-call-wins.");
    reset({ useDefaults: true, coerceTypes: true, allErrors: true });
    data = { n: "3" };
    ow.obj.schemaValidate({ properties: { n: { type: "integer" }, x: { default: 3 } } }, data);
    assert(data, { n: 3, x: 3 }, "Explicit defaults/coercion failed.");
    var message = throws(function() { ow.obj.schemaValidate({ required: ["a", "b"] }, {}, { dataVar: "body", separator: " | " }); }, " | ");
    assert(String(message).indexOf("body") >= 0, true, "Error dataVar was ignored.");
    reset({ format: "full" });
    assert(ow.obj.schemaCompile({ type: "string", format: "date" })("2026-02-31"), false, "Full format translation failed.");
    reset({ format: false });
    assert(ow.obj.schemaCompile({ type: "string", format: "email" })("bad"), true, "Disabled format translation failed.");
    reset({ format: false, validateFormats: true });
    assert(ow.obj.schemaCompile({ type: "string", format: "email" })("bad"), false, "Explicit v8 option must win.");
    reset({ jsonPointers: false });
    throws(function() { ow.obj.schemaValidate({ properties: { a: { type: "integer" } } }, { a: "bad" }); }, "args.a");
    reset({ jsonPointers: false, jsPropertySyntax: false });
    throws(function() { ow.obj.schemaValidate({ properties: { a: { type: "integer" } } }, { a: "bad" }); }, "args/a");
    reset({ strict: true });
    assert(ow.obj.schemaCompile({ type: "number" })(NaN), false, "Explicit strict option must control number validation.");
    reset({ strictNumbers: true });
    assert(ow.obj.schemaCompile({ type: "number" })(Infinity), false, "Explicit strictNumbers must win.");
    reset({ strictKeywords: true });
    throws(function() { ow.obj.schemaCompile({ type: "string", openafUnknownKeyword: true }); }, "unknown keyword");
    reset({ strictDefaults: true });
    throws(function() { ow.obj.schemaCompile({ type: "string", openafUnknownKeyword: true }); }, "unknown keyword");
    reset({ strictKeywords: true, strict: false });
    assert(ow.obj.schemaCompile({ openafUnknownKeyword: true })(3), true, "Explicit strict option must win.");
    reset({ unicodeRegExp: true, ignoreKeywordsWithRef: false });
    throws(function() { ow.obj.schemaCompile({ type: "string", pattern: "\\a" }); });
    assert(ow.obj.schemaCompile({ definitions: { x: { type: "string" } }, $ref: "#/definitions/x", minLength: 3 })("a"), false, "Explicit reference policy must win.");
    reset({ formats: { email: /^special$/, "openaf-custom": /^ok$/ } });
    assert(ow.obj.schemaCompile({ type: "string", format: "email" })("special"), true, "Standard format override lost.");
    assert(ow.obj.schemaCompile({ type: "string", format: "openaf-custom" })("ok"), true, "Custom format failed.");
    reset({ $data: true });
    assert(ow.obj.schemaCompile({ properties: { f: { type: "string" }, v: { type: "string", format: { $data: "1/f" } } } })({ f: "unknown", v: "ok" }), false, "Dynamic unknown formats must fail.");
    reset({ schemas: { preset: { $schema: d20, type: "integer" } } });
    assert(ow.obj.schemaValidate("preset", 3), true, "Initial schema registration must select its draft.");
    ow.obj.schemaRemove();
    throws(function() { ow.obj.schemaValidate("preset", 3); }, "not registered");
    assert(ow.obj.schemaCheck({ $schema: d20, type: "integer" }), true, "Removal must retain meta-schemas.");
    ["missingRefs", "cache", "nullable", "schemaId", "sourceCode"].forEach(function(option) {
      delete global.__ajvState; delete global.__ajv;
      var options = {}; options[option] = false;
      throws(function() { ow.obj.schemaInit(options); }, "unsupported");
      assert(isUnDef(global.__ajvState), true, "Failed initialization must not publish state.");
    });
    reset({});
    var s = { $id: "https://example.com/remove-object", type: "integer" };
    ow.obj.schemaCompile(s);
    ow.obj.schemaRemove(clone(s));
    throws(function() { ow.obj.schemaValidate(s.$id, 3); }, "not registered");
  };

  exports.testSourceAndNative = function() {
    child("af.runFromClass(af.newScriptInstance('ajv_js')); if(Ajv.OpenAF.version!=='8.20.0') throw 'Wrong compiled Ajv'; var t=require('autoTestAll.Schema.js'); t.testHelpers(); t.testDrafts()");
    child("load(getOpenAFJar()+'::js/ajv.js'); var t=require('autoTestAll.Schema.js'); t.testHelpers(); t.testFormatsAndGenerator(); t.testDrafts()");
  };
  exports.testSigil = function() {
    child("var sigil = newFn('', io.readFileString(getOpenAFJar()+'::js/openafsigil.js') + '\\nreturn { check: $$, chain: _$ };')(); var schema={type:'integer'}; if(! sigil.check(3).isSchema(schema)) throw 'Sigil valid schema failed'; var failed=false; try{sigil.check('bad').isSchema(schema)}catch(e){failed=true} if(!failed) throw 'Sigil invalid schema must throw'; failed=false; try{sigil.chain('bad').isSchema(schema,'sigil-invalid').$_()}catch(e){failed=String(e).indexOf('sigil-invalid')>=0} if(!failed) throw 'Sigil custom error failed'");
  };
})();
