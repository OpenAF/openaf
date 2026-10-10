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

exports.testInjectedPrompts = function() {
  var eq = (a,b,msg) => ow.test.assert(a,b,msg), output = [], answers = ["wrong","2"], chars = ["z","\n"];
  var console = {
    readLinePrompt:function() {return answers.shift();},
    readChar:function() {return chars.shift();},
    getConsoleReader:function() {return {getTerminal:function() {return {getWidth:function() {return 100;}};}};}
  };
  var ui = {console:console,ansi:false,write:function(s) {output.push(s);}};
  eq(askChoose("Pick",["one","two"],5,undefined,ui),1,"Numbered choice validation");
  eq(output.length > 0,true,"Injected writer receives numbered menu");
  ui.ansi = true;output=[];
  eq(askChoose("Pick",["one","two"],5,undefined,ui),0,"No-match search retains valid choice");
  eq(output.join("").indexOf("\x1B[?25h") >= 0,true,"Restore cursor");
  eq(askChoose("Empty",[],5,undefined,ui),undefined,"Empty choices cancel safely");
  answers=[null];ui.ansi=false;
  eq(askChoose("EOF",["one"],5,undefined,ui),undefined,"EOF cancels");
  chars=["\x03"];ui.ansi=true;
  eq(askChoose("Cancel",["one"],5,undefined,ui),undefined,"Ctrl-C cancels menu");
};

exports.testPromptFamily = function() {
  var answers = ["bad", "2,1,2", "", null, "value", "secret"], output = [];
  var ui = {ansi:false, write:function(s) {output.push(s);}, console:{
    readLinePrompt:function() {return answers.shift();}, readChar:function() {return "Y";}
  }};
  ow.test.assert(askChooseMultiple("Pick", ["one","two"], __, __, ui), ["one","two"], "Validate and deduplicate numbered selections");
  ow.test.assert(askChooseMultiple("None", ["one"], __, __, ui), [], "Blank selects none");
  ow.test.assert(askChooseMultiple("EOF", ["one"], __, __, ui), __, "EOF cancels multiple selection");
  ow.test.assert(askDef(__, "Value", false, false, ui), "value", "Default prompt uses injected console");
  ow.test.assert(af.decrypt(askStruct([{name:"password",type:"secret"}], ui)[0].answer), "secret", "Structured secrets use injected console");
  ow.test.assert(askStruct([{name:"confirm",type:"char",options:"YN"}], ui)[0].answer, "Y", "Structured char uses injected console");
  ow.test.assert(output.indexOf("confirm: ") >= 0, true, "Char prompt uses injected writer");
  var chars = ["z", " ", "\n"];
  ui.ansi = true;
  ui.console.readChar = function() {return chars.shift();};
  ui.console.getConsoleReader = function() {return {getTerminal:function() {return {getWidth:function() {return 100;}};}};};
  ow.test.assert(askChooseMultiple("Filter", ["one","two"], 0, __, ui), ["one"], "No-match filter keeps valid selection");
  chars = ["\x03"];
  ow.test.assert(askChooseMultiple("Cancel", ["one"], __, __, ui), __, "Ctrl-C cancels multiple selection");
  ui.console.readChar = function() {throw "read failed";};
  output = [];
  var failed = false;
  try {askChooseMultiple("Failure", ["one"], __, __, ui);} catch(e) {failed = true;}
  ow.test.assert(failed, true, "Read error propagates");
  ow.test.assert(output[output.length - 1], "\x1B[?25h", "Read error restores cursor");
  ui.ansi = false;
  ow.loadOJob();
  answers = ["two", "2", "1,2"];
  var result = ow.oJob.askOnHelp({expects:[{name:"text"},{name:"option",options:["one","two"]},{name:"multi",moptions:["one","two"]}]}, ui);
  ow.test.assert(result, {text:"two",option:"two",multi:"one,two"}, "oJob routes all prompts through UI");
};
