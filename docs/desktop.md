# Desktop windows and terminal views

`ow.loadDesktop()` loads a small provider-neutral facade. It does not load JavaFX,
start a graphical toolkit, download dependencies, or open a network listener.
The optional `plugin-DesktopJavaFX` oPack supplies graphical windows. The built-in
`tui` provider supplies interactive terminal views without additional dependencies.

## Installation

Install a build of OpenAF containing `ow.loadDesktop`, then install the provider:

```sh
opack install plugin-DesktopJavaFX
```

The provider's explicit install hook selects the current OS/CPU and verifies pinned
JavaFX artifacts with SHA-256. There are no downloads during application execution.
For offline installation, set `OPENAF_DESKTOP_ARTIFACTS` to a directory containing
those exact classifier JARs. See the provider README for source builds.

JavaFX 21.0.12 requires a JVM containing `jdk.jsobject`. Java 21 is the baseline;
Java 25 is also supported by the provider's module check. Newer JVMs which removed
that module require a compatible helper executable:

```javascript
ow.loadDesktop({
  provider: "javafx",
  providerOptions: { javafx: { java: "/path/to/java21/bin/java" } }
});
```

## Standalone script

```javascript
ow.loadDesktop();
var win = ow.desktop.window({
  title: "OpenAF Desktop", width: 900, height: 600,
  html: "<h1>Hello from OpenAF</h1>"
});
win.on("error", function(e) { logErr(e.error.message); });
win.show();
ow.desktop.wait();
```

`window()` returns a handle immediately. `win.created`, `show()`, `hide()`,
`setTitle(title)`, and `close()` return **OpenAF oPromises**, not ECMAScript promises.
Use `.then()`/`.catch()` or `$doWait()` according to normal OpenAF conventions.
Creation, commands, and errors remain asynchronous across process boundaries.
Do not block a desktop callback with `$doWait()` on another desktop command.

Call `wait()` to retain a standalone script until its windows close; it then cleans
up the session. `wait(timeoutMs)` cleans up and raises `TIMEOUT` on deadline.
Existing long-running oJobs keep their normal lifetime and call `shutdown()` when
finished. Window closure never calls `exit()` or terminates unrelated work.
A stopped session is terminal; start a new process to create a fresh session.

## Windows, providers and dialogs

Supply exactly one of `html`, HTTP(S) `url`, `file`, or `view`. Credentials in URLs and
`file:` URLs are rejected. Local files require an explicit root:

```javascript
var win = ow.desktop.window({ file: "index.html", assetRoot: "/my/app/assets" });
```

For shared graphical/terminal content, use `view` as described below.

Other v1 options are `title`, `width`, `height`, `minWidth`, `minHeight`, and
`resizable`. Unknown window options are rejected. Modal windows, menus, fullscreen,
always-on-top, tray, and system notifications are deferred.

`provider` defaults to `auto`: JavaFX, then Electron if installed. Explicit selection
never falls back. A missing provider fails the first operation with installation
advice. There is no external-browser fallback: browsers cannot implement the window
lifetime contract. `start()` explicitly initializes without creating a window and resolves to `info()`.
`info()` returns state, selected identity and actual capabilities (empty before startup).
Provider selection is frozen when the session starts.

All dialogs return oPromises. `openFile(options)` and `saveFile(options)` resolve
to an absolute filename or `null` on cancellation; `confirm(message, options)`
resolves to a boolean, and `alert(message, options)` resolves to `null`.
Options include `title` and `windowId` for an owning window; file dialogs also
accept `initialDirectory` and `initialFileName`. Dialogs have the configured request
deadline (default 30 seconds; `loadDesktop({timeout: ...})` accepts 100–300000 ms).

## Restricted messaging

Messaging is opt-in and available only to facade-hosted HTML or rooted local files.
An arbitrary URL receives no bridge. Declare allowed message types and optionally
JSON schemas validated using existing `ow.obj.schemaValidate` functionality:

```javascript
var win = ow.desktop.window({
  file: "index.html", assetRoot: "/my/app/assets",
  messaging: {
    types: ["clicked", "status"],
    schemas: { clicked: { type: "object", required: ["id"],
      properties: { id: { type: "string" } }, additionalProperties: false } }
  }
});
win.on("message", function(e) {
  if (e.message.type == "clicked") win.send("status", { ready: true });
});
```

The browser API is a small frozen object containing no Java/OpenAF references:

```javascript
openafDesktop.onMessage(function(message) {
  if (message.type === "status") document.body.textContent = "Ready";
});
openafDesktop.ready.then(function() {
  openafDesktop.send("clicked", { id: "start" });
});
```

`onMessage()` returns an unsubscribe function. `win.on(event, fn)` returns a
subscription ID; `win.off(id)` removes it. Window events are `ready`, `message`,
`closed` and `error`. Application events are `error` and `shutdown`.
Callbacks are serialized outside the JavaFX thread. Commands are FIFO; there is no
cross-window event-order guarantee. `closed` is terminal and emitted once.
Callback exceptions are reported and do not stop other listeners.

Payloads must contain JSON data: no Java objects, functions, cycles, sparse arrays,
non-finite numbers, or reserved prototype keys. Message payloads are limited to
64 KiB UTF-8; document/configuration payloads to 8 MiB. Queues are bounded by count
and bytes. Overload raises `QUEUE_FULL` or fails the session; it never silently
replays an application operation. Navigation revokes messaging credentials.

## Security and limitations

Rendered content has no Java bridge, reflection API, filesystem API, or process
execution API. An application grants specific operations by writing its OpenAF
message handlers. All same-origin scripts in a bridge-enabled document share that
authority: a token cannot distinguish a legitimate script from injected code.
Only enable messaging for application-owned content.

The loopback service validates Host, WebSocket Origin, per-window credentials,
message destination, sequence, type, size, and optional schema. Local paths are
canonicalized and confined to the supplied asset root. Hosted content receives
CSP, no-store, no-referrer and nosniff headers; popups and webpage modal prompts
are disabled. No remote origin is automatically authorized.

JavaFX is **not a renderer sandbox or network firewall**. Its capability report
sets `rendererSandbox`, `strictNavigation`, and `networkIsolation` to false.
Requesting a true security requirement through `security` fails with
`SECURITY_POLICY_UNSUPPORTED`. In particular, redirects and remote subresources
must not be assumed to be comprehensively intercepted. A helper process isolates
lifecycle; it runs with the user's OS permissions.

WebView is WebKit, not Chromium. Test application HTML against the pinned engine;
do not assume WebRTC, service workers, WebGPU, DRM, codecs, or identical CSS behavior.
There is no mandatory frontend framework. Headless installations need no desktop
provider or dependencies.

The existing administrative OpenAF GUI is not embedded by v1. Its endpoint
authentication, CSRF protection and process ownership require a separate change.

## Shared graphical and terminal views

Select TUI explicitly; `auto` continues to try JavaFX then Electron and never takes
control of the terminal as a fallback:

```javascript
ow.loadDesktop({ provider: "tui" }); // Use "javafx" for the same view in a GUI.
var view = { items: [
  { id: "status", type: "text", text: "Ready" },
  { id: "name", type: "input", label: "Name", value: "" },
  { id: "mode", type: "select", label: "Mode", options: ["one", "two"], value: "one" },
  { id: "go", type: "button", label: "Continue" }
] };
var win = ow.desktop.window({ title: "Shared view", view: view });
win.on("message", function(event) {
  if (event.message.type != "action") return;
  var values = event.message.payload.values;
  view.items[0].text = "Hello " + values.name + " (" + values.mode + ")";
  view.items[1].value = values.name;
  view.items[2].value = values.mode;
  win.setView(view);
});
win.show();
ow.desktop.wait();
```

See [the complete example](../examples/desktop-view.js). Changing the provider
selector is sufficient; no frontend scripts are needed. Shared views are rendered
as safe DOM elements through the existing authenticated HTTP/WebSocket bridge in
JavaFX (and future HTML providers). TUI uses the same event contract directly,
without HTTP, JavaFX, a helper process, or extra libraries.

The deliberately small version 1 view is `{version:1, items:[...]}`; version may
be omitted. Items require a unique identifier (`[A-Za-z][A-Za-z0-9_-]*`, up to 64
characters; reserved prototype identifiers are rejected) and one of:

| Type | Fields | Behavior |
| --- | --- | --- |
| `text` | `text` | Plain text, including newlines; no HTML/ANSI execution |
| `button` | `label` | Emits `action` when activated |
| `input` | `label`, `value` (default empty) | Single-line text; emits `change` on commit |
| `select` | `label`, `options`, `value` (default first option) | String choices; emits `change` when selected |

Views contain at most 128 items and 64 KiB of UTF-8 JSON. Text is limited to 8192
characters, labels and select options to 256, input values to 4096. Select options
are unique (1–128 entries). Control values cannot contain terminal control codes.
Unknown fields, executable widgets, Java objects, and HTML interpolation are rejected.
TUI additionally strips control codes from displayed labels, titles, and text.

Events use `win.on("message", fn)` and contain
`{message:{type:"action"|"change", payload:{id:"controlId", values:{...}}}}`.
`values` contains the current values of every input/select. The facade validates
IDs, control types, complete value sets, lengths, and select choices before
calling application code. View revisions retire input racing a replacement; stale
input is discarded rather than interpreted against the new controls. Input commits on Enter in TUI and on the browser's
normal change/blur event in GUI. Buttons activate with Enter or mouse click.

`win.setView(nextView)` replaces the entire view asynchronously, including values,
and resets TUI focus/scroll. `win.send("view", nextView)` is equivalent. Preserve
values from the event snapshot when building a replacement if edits should remain.
No implicit DOM patches or application JavaScript run. Other `send` message types
and a custom `messaging` option are rejected for view windows; HTML windows retain
the existing custom messaging API. GUI replacements require the frontend bridge
to be connected; replacing from an action handler satisfies this. A successful
replacement acknowledges dispatch, not completion of a display refresh.

### Terminal behavior

TUI requires an ANSI controlling terminal. It opens an independent terminal with
`askConsole()` and never consumes redirected stdin or writes frames to redirected
stdout. Missing terminals and non-ANSI terminals fail clearly. Java 21+ remains
supported; no dependency or JVM startup flag is added. Headless JVMs can use TUI
when a controlling terminal is available; graphical display variables are irrelevant.
Loading `ow.desktop` or its TUI code does not open a terminal.

One desktop session owns the terminal at a time. Windows are logical tabs sharing
one reader, terminal, and render loop. `show()` selects a tab, `hide()` removes it
from view, and `close()` closes only that window. Titles identify tabs. Graphical
pixel dimensions and resizability are presentation hints; TUI uses the terminal's
current rows and columns and detects size changes. Supported keys:

- Tab/Shift-Tab or Down/Up: focus next/previous control.
- Enter: activate a button or commit an input/select value.
- Left/Right: change the focused selection.
- Printable characters/Backspace: append/delete text in the focused input.
- Page Up/Page Down: scroll long content.
- Ctrl-N/Ctrl-P: select the next/previous window tab.
- Ctrl-W: close the active window; Ctrl-C: close all desktop windows.

Ctrl-C is handled as terminal input and never calls `exit()` or cancels unrelated
OpenAF work. With redirected/closed terminal input, EOF closes desktop windows.
Standalone `wait()` then shuts down normally. Explicit `shutdown()` also stops the
reader, restores terminal attributes/cursor/alternate screen, and closes only the
owned terminal. A borrowed terminal used by tests is restored but not closed.
Keep application output in the view while it is active; independent logging to the
same physical terminal can disrupt its display. Restore occurs on explicit cleanup,
read failure, and OpenAF's normal shutdown hook; forcible process termination is
subject to the normal terminal limitations.

`info().capabilities` reports `declarativeViews`, `nativeViews`, `html`, `urls`,
`localFiles`, and existing desktop capabilities. TUI reports no dialogs, system
notifications, tray, or browser renderer sandbox. It enforces strict navigation
and network isolation because views execute no navigation or network requests.
It is not an operating-system sandbox for the trusted OpenAF backend.

Native dialogs, mouse interaction, password widgets, rich tables/charts, layouts,
HTML-to-terminal conversion, arbitrary webpage JavaScript, and non-ANSI line-mode
interaction are deliberately deferred. Existing formatting helpers can support
future read-only widgets without introducing executable widget bodies.

Run the registered `autoTestAll.DesktopTUI.yaml` suite for injected-terminal tests.
For real POSIX terminal coverage, including attribute restoration and piped stdin:

```sh
python3 tests/desktop-tui-pty.py openaf.jar
JAVA=/path/to/java21/bin/java python3 tests/desktop-tui-pty.py openaf.jar
```

For the opt-in graphical shared-view smoke test, run `tests/desktop-view-javafx.js`
with `OPENAF_DESKTOP_PROVIDER_ROOT` pointing to a built provider checkout (omit it
for an installed oPack), and optionally `OPENAF_DESKTOP_JAVA` selecting Java 21.
This exercises actual DOM controls, messaging, replacement, and clean closure.
