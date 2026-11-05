// Copyright 2026 Nuno Aguiar
(function() {
  exports.testTextCodecs = function() {
    var text = "hello € 世界\n", expected = af.fromString2Bytes(text);
    [false, true].forEach(function(gzip) {
      var input = __streamCodec.textInput(text);
      var value = __streamCodec.use([input], () => __streamCodec.encodeToString(input, gzip));
      ow.test.assert(value, af.fromBytes2String(af.toBase64Bytes(gzip ? io.gzip(expected) : expected)), "Encoded text parity");
      input = __streamCodec.textInput(value, "US-ASCII");
      ow.test.assert(__streamCodec.use([input], () => __streamCodec.decodeToString(input, gzip)), text, "Decoded text parity");
    });
    var oldEncode = af.toBase64Stream, oldDecode = af.fromBase64Stream;
    var oldGzip = io.gzipStream, oldGunzip = io.gunzipStream;
    try {
      af.toBase64Stream = undefined; af.fromBase64Stream = undefined;
      io.gzipStream = undefined; io.gunzipStream = undefined;
      [false, true].forEach(function(gzip) {
        var input = __streamCodec.textInput(text);
        var encoded = __streamCodec.use([input], () => __streamCodec.encodeToString(input, gzip));
        input = __streamCodec.textInput(encoded);
        ow.test.assert(__streamCodec.use([input], () => __streamCodec.decodeToString(input, gzip)), text, "Older-runtime codec fallback");
      });
    } finally {
      af.toBase64Stream = oldEncode; af.fromBase64Stream = oldDecode;
      io.gzipStream = oldGzip; io.gunzipStream = oldGunzip;
    }
  };
  exports.testImageConsumers = function() {
    ow.loadAI(); ow.loadTemplate();
    var path = io.createTempDir("stream-images-");
    var png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/aXcAAAAASUVORK5CYII=";
    try {
      var file = path + "/fixture.png";
      var output = io.writeFileStream(file);
      __streamCodec.use([output], () => output.write(af.fromBase64(png)));
      ow.test.assert(__streamCodec.encodeFile(file), png, "File Base64");
      ow.test.assert(ow.template.html.inlineSrc(file, "prefix", "suffix"), "prefixdata:image/png;base64," + png + "suffix", "Inline source");
      var gpt = $llm({type:"openai",key:"fixture",model:"fixture"}).getGPT().model, sent;
      gpt._request = function(uri, body) { sent = body; return { choices:[{finish_reason:"stop",message:{content:"ok"}}] }; };
      var saved = io.readFileBytes;
      try {
        io.readFileBytes = function() { throw new Error("Whole-file byte reads forbidden"); };
        gpt.promptImage("Describe", file);
        ow.test.assert(sent.messages[0].content[1].image_url.url, "data:image/png;base64," + png, "AI image bytes and MIME");
      } finally { io.readFileBytes = saved; }
    } finally { io.rm(path); }
  };
  exports.testHTTPTemplates = function() {
    ow.loadObj(); ow.loadTemplate();
    var saved = ow.obj.http, closed = 0, content = "stream fixture €";
    try {
      ow.obj.http = function() {
        return {
          getStream: function() { return __streamCodec.textInput(content, "UTF-8"); },
          responseType: function() { return "text/plain"; },
          close: function() { closed++; }
        };
      };
      var encoded = af.fromBytes2String(af.toBase64Bytes(af.fromString2Bytes(content, "UTF-8")));
      ow.test.assert(ow.template.html.inlineSrcURL("http://fixture.invalid/file", "[", "]"),
        "[data:text/plain;base64," + encoded + "]", "URL streams into inline source");
      var html = ow.template.html.genStaticVersion('<img src="http://fixture.invalid/file">');
      ow.test.assert(html.indexOf("data:text/plain;base64," + encoded) >= 0, true, "Static HTML uses streamed bodies");
      ow.test.assert(closed >= 2, true, "HTTP clients closed after consumption");
    } finally { ow.obj.http = saved; }
  };
  exports.testGenericOutput = function() {
    var data = {x:"€",a:[1,2]}, encoded = $output(data, {__format:"gb64json"}, undefined, true);
    ow.test.assert(jsonParse(af.fromBytes2String(io.gunzip(af.fromBase64(encoded)))), data, "Return contract");
    var original = java.lang.System.out, capture = new java.io.ByteArrayOutputStream();
    var stream = new java.io.PrintStream(capture, true, "UTF-8");
    try {
      java.lang.System.setOut(stream);
      $output(data, {__format:"gb64json"});
      ow.test.assert(String(capture.toString("UTF-8")).trim(), encoded, "Direct output matches return output");
      stream.write(33); stream.flush();
      ow.test.assert(capture.size() > encoded.length, true, "Output stream remains open");
    } finally { java.lang.System.setOut(original); stream.close(); }
  };
})();
