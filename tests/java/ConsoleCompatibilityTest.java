import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;
import jline.console.ConsoleReader;
import jline.console.completer.*;
import jline.console.history.FileHistory;

/** Run with -ea. Uses real Tab key dispatch through the JLine 4 reader. */
public class ConsoleCompatibilityTest {
    private static void check(boolean ok, String message) {
        if (!ok) throw new AssertionError(message);
    }
    private static ConsoleReader console(String input) throws Exception {
        return new ConsoleReader(new jline.Terminal(new org.jline.terminal.impl.DumbTerminal(
            "test", "xterm", new ByteArrayInputStream(input.getBytes(StandardCharsets.UTF_8)),
            new ByteArrayOutputStream(), StandardCharsets.UTF_8)));
    }
    private static void completion(String initial, String keys, String expected, Completer completer) throws Exception {
        try (ConsoleReader c = console(keys + "\n")) {
            c.setExpandEvents(false);
            ((CandidateListCompletionHandler)c.getCompletionHandler()).setPrintSpaceAfterFullCompletion(false);
            c.addCompleter((b, p, out) -> -1);
            c.addCompleter(completer);
            c.getCursorBuffer().write(initial);
            String actual = c.readLine("> ");
            check(expected.equals(actual), "Completion: expected " + expected + "; got " + actual);
        }
    }
    public static void main(String[] args) throws Exception {
        completion("hel", "\t", "help", new StringsCompleter("help", "history"));
        completion("obj.na", "\t", "obj.name", (b,p,out) -> { out.add("name"); return 4; });
        completion("/mod", "\t", "/model", (b,p,out) -> { out.add("/model"); return 0; });
        completion("read @fo", "\t", "read @folder/", (b,p,out) -> { out.add("folder/"); return 6; });
        completion("use $su", "\t", "use $summary", (b,p,out) -> { out.add("$summary"); return 4; });
        completion("exec(\"OP\", ", "\t", "exec(\"OP\", { name: \"\" })", (b,p,out) -> { out.add("{ name: \"\" })"); return p; });
        completion("exec(\"OP", "\t", "exec(\"OPERATION", (b,p,out) -> { out.add("OPERATION"); return 6; });
        completion("obj.naTAIL", "\033[D\033[D\033[D\033[D\t", "obj.nameTAIL", (b,p,out) -> { out.add("name"); return 4; });
        completion("😀.na", "\t", "😀.name", (b,p,out) -> { check(p == 5, "UTF-16 callback cursor"); out.add("name"); return 3; });
        completion("he", "\t", "hel", new StringsCompleter("help", "hello"));
        try (ConsoleReader c = console("hel\t\n")) {
            c.addCompleter(new StringsCompleter("help"));
            check("help ".equals(c.readLine()), "Default completion adds a space");
        }
        try (ConsoleReader c = console("secret\nnext\n")) {
            check("secret".equals(c.readLine("Password: ", '*')), "Masked read");
            check(c.getHistory().isEmpty(), "Password must not enter history");
            c.setHistoryEnabled(false);
            check("next".equals(c.readLine()), "Second line");
            check(c.getHistory().isEmpty(), "History disabled");
            check(c.readLine() == null, "EOF returns null");
        }
        try (ConsoleReader c = console("")) {
            String settings = c.getTerminal().settings.get("icanon echo");
            c.getTerminal().settings.set("-icanon min 1 -echo");
            check(c.getTerminal().settings.get("icanon echo").startsWith("-icanon -echo"), "Raw terminal settings");
            c.getTerminal().settings.set("sane");
            check(c.getTerminal().settings.get("icanon echo").startsWith("icanon echo"), "sane must restore cooked input");
            c.getTerminal().settings.set(settings);
            check(settings.equals(c.getTerminal().settings.get("icanon echo")), "Restore saved settings");
        }
        Path path = Files.createTempFile("openaf-history", ".txt");
        try {
            Files.writeString(path, "one\ntwo^Jthree\n", StandardCharsets.UTF_8);
            FileHistory history = new FileHistory(path.toFile());
            check(history.size() == 2, "Load legacy history");
            history.add("á😀"); history.flush();
            check(Files.readString(path).equals("one\ntwo^Jthree\ná😀\n"), "Plain history format");
            history.setMaxSize(2);
            try (ConsoleReader c = console("\033[A\n")) {
                c.setHistory(history);
                check("á😀".equals(c.readLine()), "History arrow navigation");
            }
            check(history.size() == 2, "Duplicate suppression and maximum size");
            history.purge();
            check(history.isEmpty() && !Files.exists(path), "Purge history");
        } finally { Files.deleteIfExists(path); }
        System.out.println("ConsoleCompatibilityTest passed");
    }
}
