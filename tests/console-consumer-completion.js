// Run from the OpenAF checkout with -f; consumes the unchanged sibling sources.
// Only completion callbacks are evaluated. No agent, server or backend is started.
try {
  ow.loadTest();
  var callbackSource = function(path) {
    var ast = new Packages.org.mozilla.javascript.Parser().parse(io.readFileString(path), path, 1);
    var found;
    ast.visit(new JavaAdapter(Packages.org.mozilla.javascript.ast.NodeVisitor, {
      visit: function(node) {
        if (node instanceof Packages.org.mozilla.javascript.ast.NewExpression &&
            String(node.getTarget().toSource()).endsWith("OpenAFConsoleCompleter")) {
          found = String(node.getArguments().get(0).toSource());
        }
        return true;
      }
    }));
    if (isUnDef(found)) throw "No completion callback in " + path;
    return found;
  };
  var tab = function(fn, initial, expected, keys) {
    var input = new java.io.ByteArrayInputStream(af.fromString2Bytes((keys || "\t") + "\n"));
    var output = new java.io.ByteArrayOutputStream();
    var nativeTerminal = new Packages.org.jline.terminal.impl.DumbTerminal("test", "xterm", input, output, java.nio.charset.StandardCharsets.UTF_8);
    var reader = new Packages.jline.console.ConsoleReader(new Packages.jline.Terminal(nativeTerminal));
    try {
      reader.setExpandEvents(false);
      reader.getCompletionHandler().setPrintSpaceAfterFullCompletion(false);
      reader.addCompleter(new Packages.openaf.jline.OpenAFConsoleCompleter(fn));
      reader.getCursorBuffer().write(initial);
      ow.test.assert(String(reader.readLine("> ")), expected, "Actual consumer Tab completion: " + initial);
    } finally { nativeTerminal.close(); }
  };

  // OpenAF console: actual callback, deterministic scope/description fixtures.
  var CONSOLESUBCOMMANDS = { edit: ["last"] }, CONSOLECOMMANDS = ["help"], __alias = {};
  var __scope = function() { return []; }, __desc = function() { return ["name"]; };
  var openafCallback = eval("(" + callbackSource("js/openafconsole.js") + ")");
  tab(openafCallback, "hel", "help");
  tab(openafCallback, "edit la", "edit last");
  tab(openafCallback, "obj.na", "obj.name");
  tab(openafCallback, "obj.naTAIL", "obj.nameTAIL", "\033[D\033[D\033[D\033[D\t");

  // mini-a: use its current callback, with local discovery results instead of IO.
  var getFileCompletions = function() { return ["folder/"]; };
  var canStartInlineShortcut = function() { return true; };
  var countImmediateBackslashes = function() { return 0; };
  var customSkillSlashCommands = { summary: {} };
  var getAllSlashCommandNames = function() { return ["model"]; };
  var miniCallback = eval("(" + callbackSource("../mini-a/mini-a-con.js") + ")");
  tab(miniCallback, "/mod", "/model");
  tab(miniCallback, "read @fo", "read @folder/");
  tab(miniCallback, "use $su", "use $summary");

  // OpenCLI: completion must preserve quotes and insert full argument templates.
  var __openCliOpsKeys = ["OPERATION"];
  var __raidhelp = function() { return { arguments: [{ name: "name", type: "String", mandatory: true }] }; };
  var opencliCallback = eval("(" + callbackSource("../opencli/js/openafconsole.opencli.js") + ")");
  tab(opencliCallback, 'exec("OP', 'exec("OPERATION');
  tab(opencliCallback, 'exec("OPERATION", ', 'exec("OPERATION", { name: "" })');
  print("Consumer completion tests passed (OpenAF, mini-a, OpenCLI).");
} catch(e) { printErr(e); exit(1); }
