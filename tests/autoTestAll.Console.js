// Compatibility checks intentionally exercise the public Rhino/Java boundary.
exports.testLegacyHistory = function() {
  var path = java.nio.file.Files.createTempFile("openaf-console-history-", ".txt");
  try {
    io.writeFileString(String(path), "one\ntwo^Jthree\n");
    var h = new Packages.jline.console.history.FileHistory(path.toFile());
    ow.test.assert(Number(h.size()), 2, "Legacy history must load without timestamps.");
    h.setMaxSize(2);
    h.add("á😀");
    h.flush();
    var values = [], it = h.iterator();
    while (it.hasNext()) values.push(String(it.next().value()));
    ow.test.assert(values, ["two^Jthree", "á😀"], "History trimming/iteration changed.");
    ow.test.assert(io.readFileString(String(path)).replace(/\r\n/g, "\n"), "two^Jthree\ná😀\n", "History format changed.");
    h.purge();
    ow.test.assert(io.fileExists(String(path)), false, "Purge must delete history.");
  } finally { java.nio.file.Files.deleteIfExists(path); }
};

exports.testCompletionCallback = function() {
  var complete = java.lang.Class.forName("openaf.jline.OpenAFConsoleCompleter").getMethod("complete",
    java.lang.Class.forName("java.lang.String"), java.lang.Integer.TYPE, java.lang.Class.forName("java.util.List"));
  var invoke = (completer, line, cursor, candidates) => complete.invoke(completer, line, java.lang.Integer.valueOf(cursor), candidates);
  var count = 0;
  var c = new Packages.openaf.jline.OpenAFConsoleCompleter(function(buf, cursor, candidates) {
    count++;
    candidates.add("name");
    return Number(cursor - 2);
  });
  var candidates = new java.util.ArrayList();
  ow.test.assert(Number(invoke(c, "😀.na", 5, candidates)), 3, "UTF-16 replacement offset changed.");
  ow.test.assert(count, 1, "Callback must execute exactly once.");
  ow.test.assert(String(candidates.get(0)), "name", "Candidate missing.");
  var none = new Packages.openaf.jline.OpenAFConsoleCompleter(function() { return null; });
  ow.test.assert(Number(invoke(none, "", 0, new java.util.ArrayList())), -1, "Null callback result means no completion.");
  var bad = new Packages.openaf.jline.OpenAFConsoleCompleter(function() { throw "completion sentinel"; });
  try { invoke(bad, "", 0, candidates); } catch(e) { }
  ow.test.assert(Number(invoke(c, "obj.na", 6, new java.util.ArrayList())), 4, "Callback exception must release its Rhino context.");
};

exports.testConsoleFacade = function() {
  plugin("Console");
  var a = new Console(), b = new Console();
  ow.test.assert(a.getConsoleReader().getTerminal().equals(b.getConsoleReader().getTerminal()), true, "Console instances must share the terminal.");
  ow.test.assert(Number(a.getConsoleReader().getTerminal().getWidth()) > 0, true, "Positive fallback width required.");
  var h = a.getConsoleReader().getCompletionHandler();
  h.setPrintSpaceAfterFullCompletion(false);
  ow.test.assert(h.getPrintSpaceAfterFullCompletion(), false, "Legacy completion-spacing setter missing.");
  a.getConsoleReader().getCursorBuffer().write("print(123)");
  ow.test.assert(String(a.getConsoleReader().getCursorBuffer()), "print(123)", "oBook prefill failed.");
  a.getConsoleReader().getCursorBuffer().clear();
  var strings = new Packages.jline.console.completer.StringsCompleter(java.util.Arrays.asList("help", "history"));
  var candidates = new java.util.ArrayList();
  ow.test.assert(Number(strings.complete("hel", 3, candidates)), 0, "CHManager StringsCompleter failed.");
  ow.test.assert(String(candidates.get(0)), "help", "Wrong StringsCompleter candidate.");
};

exports.testLauncherSettings = function() {
  var source = io.readFileString(getOpenAFJar() + "::js/genScripts.js");
  ow.test.assert(source.indexOf("jline.UnixTerminal"), -1, "Launcher must not force JLine 2 UnixTerminal.");
  ow.test.assert(source.indexOf("jline.shutdownhook"), -1, "Legacy shutdown-hook property must be removed.");
  ow.test.assert(source.indexOf("--enable-native-access=ALL-UNNAMED") >= 0, true, "Java 24 native-access flag missing.");
  ow.test.assert(source.indexOf("chcp 65001") >= 0, true, "Windows UTF-8 setup missing.");
};
