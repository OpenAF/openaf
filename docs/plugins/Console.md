# Console Java Plugin Reference

The `Console` plugin uses JLine 4.4.3 behind OpenAF's compatible `jline.console.ConsoleReader` facade to provide interactive line reading, character masking, non-blocking single-key reads, and ANSI capability checks.

---

## Loading Syntax

```javascript
plugin("Console");
var con = new Console();
```

---

## API Methods

| Method | Parameters | Return Type | Description |
| :--- | :--- | :--- | :--- |
| `readLinePrompt(prompt, maskChar)` | `String, [String]` | `String` | Displays `prompt` and reads a line; masks input if `maskChar` is provided (e.g. `"*"`). |
| `readLine(maskChar)` | `[String]` | `String` | Reads input line without prompt prefix; optional masking. |
| `readChar(allowed)` | `[String]` | `char` | Reads a single keypress. Restricts to allowed characters if string provided. |
| `readCharNB()` | *none* | `int` | Non-blocking raw character read (`-1` on EOF, `-2` if no character is available). |
| `readCharB()` | *none* | `int` | Blocking raw character read (`-1` on EOF, `-2` on none). |
| `isAnsiSupported()` | *none* | `boolean` | Checks if current terminal supports ANSI color escape sequences. |
| `getConsoleReader()` | *none* | `ConsoleReader` | Returns the legacy-compatible Java `ConsoleReader` facade. |

---

## Practical Code Example

```javascript
plugin("Console");
var con = new Console();

var user = con.readLinePrompt("Enter username: ", "");
var pass = con.readLinePrompt("Enter password: ", "*");
var choice = con.readChar("ynYN");

if (con.isAnsiSupported()) {
  print("\u001b[32mInput accepted!\u001b[0m");
}
```

## JLine 4 compatibility

Existing OpenAF, mini-a, CHManager and OpenCLI scripts can keep their current APIs.
OpenAF supplies the legacy history, string/argument completers and cursor-buffer
classes used by these scripts; the JLine 2 dependency and terminal backend are
removed. This is compatibility for the supported OpenAF usage, not a complete
implementation of every JLine 2 class.

- `OpenAFConsoleCompleter(function(buffer, cursor, candidates) { ... })` retains
  UTF-16 cursor/replacement offsets, first-successful-completer ordering and the
  `setPrintSpaceAfterFullCompletion(false)` setting. Callbacks execute once.
- `FileHistory` retains plain-text files, `^J` multiline entries, size limits,
  iteration, `flush()` and `purge()`. Password input does not enter history.
- Console instances share one terminal and input reader, including blocking and
  non-blocking character reads. EOF remains `null` for lines and `-1` for raw
  reads; a non-blocking read with no input returns `-2`.
- Terminal dimensions, encoding and ANSI checks remain available. The public
  `settings` facade supports `icanon`, `-icanon`, `echo`, `-echo`, `min`, `time`,
  and restoring cooked input with `sane`; `get()` returns a restorable
  representation of those attributes. It is not a general-purpose stty wrapper.
- JNI selects the native terminal on macOS, Linux and Windows. Redirected input
  uses JLine's dumb-terminal fallback. The runtime minimum remains Java 21.
  Generated launchers include native access on Java 24+, Windows UTF-8 setup,
  and Unix terminal-restoration traps. Old `jline.terminal` and
  `jline.shutdownhook` properties no longer select or disable the backend.

For direct Java 24+ invocation, use `--enable-native-access=ALL-UNNAMED`.
The compatibility layer owns cleanup independently of the obsolete JLine 2
shutdown-hook setting.

## Regression checks

The normal oJob suite includes `autoTestAll.Console.yaml`. Additional checks,
run from the repository root against the newly built JAR:

```sh
mkdir -p /tmp/openaf-console-tests
javac --release 21 -cp openaf.jar -d /tmp/openaf-console-tests tests/java/ConsoleCompatibilityTest.java tests/java/JLineRepackTest.java
java --enable-native-access=ALL-UNNAMED -ea -cp /tmp/openaf-console-tests:openaf.jar ConsoleCompatibilityTest
java -ea -cp /tmp/openaf-console-tests:openaf.jar JLineRepackTest
java --enable-native-access=ALL-UNNAMED -jar openaf.jar -f tests/console-consumer-completion.js
python3 tests/console-pty.py openaf.jar
python3 tests/console-pty.py openaf.jar.orig --nested
node tests/console-launchers.cjs
```

The consumer check expects the sibling `mini-a` and `opencli` checkouts. It
extracts their actual callbacks and supplies local discovery fixtures without
starting agents or contacting backends. The nested check uses a disposable manifest override to bypass automatic repacking and registers the Console plugin directly. The PTY check requires POSIX; Windows
runtime checks should cover Cmd/PowerShell/Windows Terminal and Windows Java
launched from Cygwin. Use `;` instead of `:` for the Java classpath on Windows.
