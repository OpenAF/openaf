# Desktop provider SPI v1

## Ownership and feasibility decision

The core facade is lazy; installed oPacks advertise `desktop-provider.json` with
`id`, `spi: 1`, `entry`, and `version`. Descriptor reading does not load every
provider. Relative entries are confined to their package. Adapters are backend
code, trusted to the same degree as any installed oPack.

The initial JavaFX provider uses **one helper JVM per session**. A macOS ARM64
probe with JavaFX 21.0.12 and Java 25 loaded named modules through a public
ModuleLayer, called Platform.startup successfully, printed that main returned,
and remained alive until a 12-second watchdog terminated it. This fails the
chosen explicit-wait lifetime policy without extra global script-lifetime changes.
The helper uses the supported module path, exits on control-pipe EOF, and leaves
the OpenAF JVM free of JavaFX classes/native libraries. A subsequent Java 21 probe
opened, showed and closed a window and exited with status zero after EOF.

The local Java 27 runtime has no `jdk.jsobject`, required by JavaFX 21. The provider
therefore checks the selected helper JVM and reports how to select another one.
This is a concrete compatibility boundary; do not silently substitute a newer
JavaFX major. Provider classes are compiled with `--release 21`.

## Adapter interface

`registerProvider(adapter)` accepts objects exposing:

- `describe()`: `{id, version, spi:1}` plus optional engine/execution diagnostics.
- `probe(options)`: `{available, reason?}`; no toolkit initialization or downloads.
- `start({sessionId, timeout, options}, emit)`: initialize and return capability map.
- `request(envelope)`: complete one serializable operation; facade runs it off UI.
- `stop()`: idempotent bounded cleanup, including failed initialization.

`request()` may wait on the adapter worker for an out-of-process response. This
is an internal transport boundary, not a synchronous application callback. The
public commands return oPromises. A future asynchronous adapter can queue its
requests behind the same facade contract.

Register custom providers before first operation. Explicit selection never changes
provider; auto tries `javafx`, then `electron`. Cleanup must succeed before auto
tries another candidate. Provider changes never move live windows.

## Protocol

Control request:

```json
{"version":1,"sessionId":"opaque","requestId":"opaque","windowId":"optional","operation":"window.show","payload":{}}
```

Response: same protocol/session/request IDs with `payload` (including explicit
`null`) or `error:{code,message}`. Events omit requestId and carry
`event:{type,windowId,sequence,...}`. The JavaFX adapter uses bounded-time stdin/
stdout requests; stderr contains diagnostics only. EOF requests graceful shutdown.
The parent can terminate only its owned helper after a cleanup deadline.

Commands: `session.start`, `window.create`, `window.show`, `window.hide`,
`window.setTitle`, `window.close`, `dialog.openFile`, `dialog.saveFile`,
`dialog.confirm`, `dialog.alert`. Frontend messaging is owned by the facade;
providers render its already prepared URLs. No cross-process JVM objects exist.

Browser messages carry protocol/session/window IDs, document generation, strictly
increasing sequence, type, and payload. Schemas are application-owned. A navigation
notification invalidates the old window credentials; no automatic replay/rebridge.

Capabilities include windows, dialogs, notifications, tray, messaging,
multipleWindows, rendererSandbox, strictNavigation and networkIsolation.
Unsupported operations fail; security requirements are never silently weakened.
Errors include PROVIDER_UNAVAILABLE, UNSUPPORTED_CAPABILITY, INVALID_ARGUMENT,
INVALID_STATE, TIMEOUT, MESSAGE_TOO_LARGE, QUEUE_FULL, SECURITY_POLICY_UNSUPPORTED,
PROVIDER_FAILED, and callback/load errors in events.

## Lifecycle and threading

Session: uninitialized → starting → running → stopping → stopped; failure is
terminal. The selected provider is immutable. Command and event dispatchers are
bounded, session-owned daemon threads. OpenAF oPromise waits use existing virtual
thread support. Applications retain their lifetime through wait() or their oJob.
A callback must not synchronously wait on another desktop callback/operation.

All WebEngine, Stage, DOM and renderer operations execute on the FX Application
Thread. OpenAF application callbacks never execute there. Dialog showAndWait uses
JavaFX's own nested event loop. Closing a window never exits the parent. Runtime
shutdown revokes tokens, closes sockets/server/windows and joins or terminates
only the owned helper. A stop never calls System.exit in the OpenAF process.

The existing HTTPServer/NWU2 backend supplies loopback serving and WebSockets.
Implementation testing found that both NWU servers used SHA-256 for the WebSocket
accept key; RFC 6455 requires SHA-1 for that protocol operation. Both are corrected,
with the RFC vector tested. NWU2 additionally offers an opt-in per-connection
message limit, checked before frame allocation and across fragmented messages;
its unlimited default preserves existing callers. Desktop sets this to 64 KiB.
For the desktop-owned server,
its listener and virtual request workers do not retain the JVM. There is no server
for a simple non-messaging inline HTML window or an external URL.

## Electron implementation mapping (design only)

An optional Electron oPack can launch Electron as an OpenAF-owned child and
implement the same pipe protocol. BrowserWindow maps window commands; dialog maps
file and confirmation requests. Use contextIsolation, renderer sandboxing,
nodeIntegration:false, a minimal preload, sender validation, controlled navigation,
and denied popups. Forward only JSON data. Keep provider-specific options under
`providerOptions.electron` and reject unsupported security policies.

Core owns the authenticated local-content origin and frontend messaging protocol,
so scripts and oJobs keep the same window/event/message APIs. Electron must pass
the mock and process-backed portable contract tests plus its own renderer tests.
It must not enable arbitrary evaluate/require/IPC capabilities to emulate JVM APIs.
Node/Electron dependencies belong only to that future oPack.

## Future standalone application packaging (design only)

Keep packaging outside the stable API. Build per-platform images using jpackage
and an explicitly tested jlink runtime image. OpenAF can remain on the classpath;
JavaFX modules and native libraries must match the target OS/CPU. Include modules
used through reflection and optional OpenAF plugins; jdeps alone is insufficient.

Bundle the application, assets, OpenAF JAR, provider JAR, compatible JVM and pinned
JavaFX artifacts. Sign/notarize macOS bundles, sign Windows executables/installers,
and verify Linux GTK/system-library requirements on target distributions. Build
installers on each platform and audit notices. Do not copy a host native artifact
into another architecture's package. No installer implementation is included in v1.

## Validation boundaries

Mock tests prove facade behavior, not graphical/platform compatibility. Real
JavaFX tests are opt-in, run in bounded disposable processes, and must report
skips. Linux CI may use Xvfb; JavaFX 26's newer headless platform is not required by
the Java 21 baseline. Run the full OpenAF suite and inspect result JSON even if its
runner exits zero. Benchmarks report actual environment/version, parent+helper RSS,
startup, first window, multiple windows, messaging and shutdown; never infer
numbers from artifact size or mock tests.

## Local validation (2026-10-18)

- macOS ARM64: provider JAR compiled with `--release 21`; JavaFX 21.0.12 modules
  were actually launched with Temurin Java 21.0.12.1. Java 25 was also used for the
  initial module-layer/startup feasibility probe.
- Registered core desktop suite: 10/10 passed against the rebuilt JAR on Java 21
  and Java 27. Coverage includes process-backed provider calls, standard WebSocket
  handshakes, frame limits, allowed messages, duplicate sequence, wrong origin,
  wrong destination/generation/type/schema, Host validation, traversal and symlinks.
- Optional provider runner: graphical round trip, two windows, Java-access absence,
  and clean teardown passed. Independent helper checks passed EOF before handshake,
  missing-parent startup and parent-process loss. Installed-oPack descriptor
  discovery passed in an isolated temporary OpenAF installation.
- Full suite: the five-minute watchdog stopped it after 277 reported passes and no
  reported failures, in Channels cache housekeeping. That housekeeping test also
  exceeded a separate 20-second deadline using the installed pre-feature runtime.
  This is incomplete full-suite evidence, not a green full-suite result.
- Other native platforms were not executed locally. Locked Maven artifact
  availability and checksums do not establish Windows/Linux/macOS Intel GUI proof.

One local benchmark (Java 27 parent, Java 21 helper, macOS ARM64) measured provider
startup 567 ms, first document 2712 ms, second-window command 27 ms, and shutdown
514 ms. Parent baseline RSS was 257760 KiB; parent plus helper with two windows was
542960 KiB (observed incremental RSS 285200 KiB). These are workload/environment
measurements, not performance guarantees or isolated renderer-memory estimates.
The benchmark runner records all 50 round-trip samples. No external-browser GUI
comparison was run; administrative GUI embedding remains deferred.

## Built-in TUI and shared views

Core lazily loads `js/owrap.desktop.ui.js` for a `view` window or explicit `tui`
selection. This contains strict JSON view/event validation, the plain DOM renderer,
and a compact JLine-backed provider using existing `askConsole`, `askKey`,
`ow.format.string.wordWrap`, and `ansiClip`. No additional core dependency or
optional JavaFX oPack change is required: graphical providers already consume the
facade-hosted HTML/bridge. Existing HTML scripts and provider selection are unchanged.

The additional optional SPI capability `nativeViews:true` selects direct
`window.create` payloads containing `view` and `viewRevision`, and
`window.setView` payloads `{view, viewRevision}`. Such a
provider must advertise `declarativeViews:true` and validate/forward only the
shared action/change message contract. Native input events include the current
`viewRevision`; old revisions are retired before validating or dispatching input.
The facade carries the same revision over its authenticated browser bridge. HTML providers need no new operations:
the facade renders views as HTML and uses the existing bridge for replacements.
For HTML providers with messaging, the facade reports `declarativeViews:true`.
`nativeViews` describes this transport choice, not native OS widget rendering.
TUI reports `html:false`, `urls:false`, `localFiles:false`, `dialogs:false`.
Auto selection deliberately excludes TUI; applications must opt in explicitly.

The terminal provider uses a single daemon reader/render loop with a 100 ms input
poll. A per-provider lock serializes window state and rendering; application
callbacks remain on the facade's separate event dispatcher. Terminal raw mode
exists only inside a try/finally, and shutdown joins the reader before releasing
terminal ownership. ANSI controls in application text are removed before output.
Backend OpenAF code and installed adapters remain trusted. No evaluated widget
functions, HTML parsing framework, or browser emulation is added.

Tests: `autoTestAll.DesktopTUI.{yaml,js}` covers native view commands, state
replacement, keyboard events, Unicode editing, tabs, resize, content injection,
message validation, graphical HTML generation, ownership and error cleanup with
injected terminal interfaces. `desktop-tui-pty.py` runs bounded actual-terminal
checks against a built JAR and verifies attributes and redirected stdin.
The existing Desktop/Console suites remain required regression coverage.

Real PTY testing exposed a blocked-close path in the existing independent POSIX
terminal: JLine's timed reader returned, but its pump remained in a native read
on `/dev/tty`, making FileInputStream.close block. The independent terminal now
checks available bytes with a cancellable 25 ms wait before reading. It leaves
VMIN/VTIME untouched, preserves redirected stdin, and permits owned-terminal
close to stop the pump. The shared default console and Windows terminal backends
are unchanged. Real PTY tests exercise this cleanup rather than assuming an
injected mock proves native reader termination.

### TUI implementation validation (macOS ARM64)

The rebuilt JAR passed 23/23 registered DesktopTUI/Desktop/Console tests on both
Java 21 and Java 27. Real POSIX PTY checks passed on both versions: form values,
view replacement, resize, multiple tabs, Ctrl-C preserving parent work, headless
JVM use, control-sequence sanitization, terminal restoration, piped stdin, and
failure without a controlling terminal. The existing console PTY suite passed.
An actual JavaFX 21 helper completed the shared view DOM/input → OpenAF → view
replacement → closure roundtrip with the new core (virtual-display CVDisplayLink
warnings did not prevent that test). Windows and Linux TUI behavior has not been
verified here. These focused results do not claim a full-suite pass; the earlier
full-suite run stopped in the pre-existing Channels housekeeping wait.

The owned TUI caches terminal dimensions and refreshes them on JLine WINCH signals.
This avoids repeatedly launching ExecPty's `stty` size query in the idle/render
loop. Injected test UIs report size directly. Closing the owned JLine terminal
restores its signal handlers along with its input/output resources.
