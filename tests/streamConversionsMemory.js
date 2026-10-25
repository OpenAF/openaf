// Run with a rebuilt JAR, for example:
// java -Xmx128m -Djava.awt.headless=true -jar openaf.jar -f tests/streamConversionsMemory.js
// Generates 256 MiB without retaining it, then verifies both conversions incrementally.
(function() {
  var block = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, 64 * 1024);
  new java.util.Random(42).nextBytes(block);
  var length = 256 * 1024 * 1024;
  var expected = java.security.MessageDigest.getInstance("SHA-256");
  for (var count = 0; count < length; count += block.length) expected.update(block);
  var expectedHex = String(Packages.org.apache.commons.codec.binary.Hex.encodeHexString(expected.digest()));

  function source() {
    var position = 0;
    return new JavaAdapter(java.io.InputStream, {
      read: function(buffer, offset, size) {
        if (position >= length) return -1;
        if (arguments.length == 0) {
          var value = block[position % block.length] & 255;
          position++;
          return value;
        }
        if (arguments.length == 1) { offset = 0; size = buffer.length; }
        if (size == 0) return 0;
        var n = Math.min(Number(size), block.length - position % block.length, length - position);
        java.lang.System.arraycopy(block, position % block.length, buffer, offset, n);
        position += n;
        return n;
      }
    });
  }

  [
    { name: "Base64", encode: function(i, o) { af.toBase64Stream(i, o); }, decode: function(i, o) { af.fromBase64Stream(i, o); } },
    { name: "GZIP", encode: function(i, o) { io.gzipStream(i, o); }, decode: function(i, o) { io.gunzipStream(i, o); } }
  ].forEach(function(test) {
    var file = java.io.File.createTempFile("openaf-stream-memory-", ".bin");
    try {
      test.encode(source(), new java.io.FileOutputStream(file));
      var digest = java.security.MessageDigest.getInstance("SHA-256");
      var consumed = 0;
      var sink = new JavaAdapter(java.io.OutputStream, {
        write: function(buffer, offset, size) {
          if (arguments.length == 1 && typeof buffer == "number") {
            digest.update(java.lang.Byte.valueOf(String(buffer > 127 ? buffer - 256 : buffer)).byteValue());
            consumed++;
          } else {
            if (arguments.length == 1) { offset = 0; size = buffer.length; }
            digest.update(buffer, offset, size);
            consumed += Number(size);
          }
        }
      });
      test.decode(new java.io.FileInputStream(file), sink);
      var actualHex = String(Packages.org.apache.commons.codec.binary.Hex.encodeHexString(digest.digest()));
      if (actualHex != expectedHex || consumed != length) throw test.name + " content mismatch";
      print(test.name + ": verified " + consumed + " bytes; JVM max heap " + java.lang.Runtime.getRuntime().maxMemory());
    } finally {
      if (!file.delete()) throw "Could not delete temporary conversion file: " + file;
    }
  });
})();
