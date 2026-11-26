exports.testJSONC = function() {
  function eq(a, b) { ow.test.assert(a, b, "JSONC value") }
  function fails(fn) { var failed = false; try { fn() } catch(e) { failed = true } eq(failed, true) }
  var fixture = { server: { port: 8080 }, urls: ["https://host/*x*/", 'quote"\\'], unicode: "café 中文", empty: {}, nil: null }
  var comments = { "": "Header\nSecond line", "/server": {inline:"Container"}, "/server/port": {before:"HTTP", inline:"Restart"}, "/urls/0": "Primary" }
  var text = af.toJSONC(fixture, comments)
  eq(af.fromJSONC(text), fixture)
  eq(text.indexOf('8080 // Restart') >= 0, true)
  eq(text.indexOf('}, // Container') >= 0, true)
  eq(af.fromJSONC('\uFEFF/* comment\r\n */ [1,// item\r\n2]'), [1,2])
  eq(af.fromJSONC('{"a":[1,/*x*/],"b":2,}', {allowTrailingComma:true}), {a:[1],b:2})
  ;['{"a":1,}', '[,]', '[1,,]', '{"a":,}', '', '// only', '/* open', "{'a':1}", '{a:1}', 'true false'].forEach(function(s) {
    fails(function() { af.fromJSONC(s) })
  })
  ;['[,]', '[1,,]', '{"a":,}', '[tru,]', '[1e,]'].forEach(function(s) { fails(function() { af.fromJSONC(s, {allowTrailingComma:true}) }) })
  ;[null, true, 42, "value", [], {}].forEach(function(v) { eq(af.fromJSONC(af.toJSONC(v)), v) })
  var special = JSON.parse('{"":1,"a/b":2,"m~n":3,"__proto__":4}')
  eq(af.fromJSONC(af.toJSONC(special, {"/":"Empty", "/a~1b":"Slash", "/m~0n":"Tilde", "/__proto__":"Own"})), special)
  ;[{"/missing":"x"}, {"/a~2":"x"}, {"/urls/00":"x"}, {"/urls/-":"x"}, {"/toString":"x"}, {"":{inline:"a\nb"}}, {"":{before:3}}].forEach(function(c) { fails(function() { af.toJSONC(fixture,c) }) })
  fails(function() { af.toJSONC({x:undefined}, {"/x":"Omitted"}) })
  fails(function() { af.toJSONC(undefined) })
  var calls = 0
  eq(af.fromJSONC(af.toJSONC({toJSON:function() { calls++; return {x:1} }}, {"/x":"Serialized"})), {x:1})
  eq(calls, 1)
  var circular = {}; circular.self = circular
  fails(function() { af.toJSONC(circular) })
  eq(af.toJSONC({x:1}, {}, {indent:4}), '{\n    "x": 1\n}')
  eq(JSON.stringify(fixture), JSON.stringify(af.fromJSONC(text)))
  var file = String(java.io.File.createTempFile("openaf-jsonc-", ".jsonc").getAbsolutePath())
  try {
    io.writeFileJSONC(file, fixture, comments)
    eq(io.readFileJSONC(file), fixture)
    var saved = io.readFileString(file)
    fails(function() { io.writeFileJSONC(file, fixture, {"/missing":"x"}) })
    eq(io.readFileString(file), saved)
    io.writeFileJSONC(file, {text:"café"}, {}, {encoding:"UTF-16",indent:4})
    eq(io.readFileJSONC(file, {encoding:"UTF-16"}), {text:"café"})
  } finally { io.rm(file) }
}
