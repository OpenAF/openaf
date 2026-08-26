# Console Java Plugin Reference

The `Console` plugin wraps JLine (`jline.console.ConsoleReader`) and terminal I/O drivers to provide interactive line reading, character masking, non-blocking single-key reads, and ANSI capability checks.

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
| `getConsoleReader()` | *none* | `ConsoleReader` | Returns underlying Java JLine `ConsoleReader` object. |

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
