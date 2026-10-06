package jline;

import java.io.IOException;
import java.nio.charset.Charset;
import org.jline.terminal.Attributes;
import org.jline.terminal.TerminalBuilder;
import org.jline.terminal.Size;
import org.jline.nativ.CLibrary;
import org.jline.nativ.Kernel32;

/** OpenAF's legacy terminal facade. All terminal I/O is owned by JLine 4. */
public final class Terminal {
    private static Terminal system;
    private final org.jline.terminal.Terminal delegate;
    private final Attributes original;
    private boolean systemTerminal;
    private volatile int width = 80;
    private volatile int height = 24;
    public final Settings settings;

    public Terminal(org.jline.terminal.Terminal terminal) {
        delegate = terminal;
        original = new Attributes(terminal.getAttributes());
        settings = new Settings();
    }

    public static synchronized Terminal system() throws IOException {
        if (system == null) {
            // No forced Unix backend: JNI selects the native OS, including Windows Java
            // launched from Cygwin. A dumb terminal also supports redirected stdin.
            TerminalBuilder builder = TerminalBuilder.builder()
                .name("OpenAF").system(true).dumb(true).ffm(false)
                .classLoader(TerminalBuilder.class.getClassLoader())
                .encoding(Charset.defaultCharset());
            // Skip JLine's grapheme cluster auto-probe (DECRQM "\e[?2027$p" & co.): terminals
            // without DECRQM support echo the trailing "p" on screen. Opt in with
            // -Dorg.jline.terminal.graphemeCluster=true.
            if (System.getProperty(TerminalBuilder.PROP_GRAPHEME_CLUSTER) == null) builder.graphemeCluster(false);
            org.jline.terminal.Terminal terminal = builder.build();
            system = new Terminal(terminal);
            system.systemTerminal = true;
            Terminal owned = system;
            Runtime.getRuntime().addShutdownHook(new Thread(() -> {
                try { owned.restore(); terminal.close(); } catch (Exception ignored) { }
            }, "OpenAF-terminal-restore"));
        }
        return system;
    }

    public org.jline.terminal.Terminal unwrap() { return delegate; }
    // Shutdown callbacks may still format output after the JVM terminal hook closes
    // JLine. Keep size queries usable without reopening the terminal or changing it.
    public int getWidth() {
        refreshSize();
        return width;
    }
    public int getHeight() {
        refreshSize();
        return height;
    }
    private void refreshSize() {
        try {
            Size size = delegate.getSize();
            int columns = size.getColumns(), rows = size.getRows();
            if (systemTerminal && (columns <= 0 || rows <= 0)) {
                Size outputSize = outputSize();
                if (columns <= 0) columns = outputSize.getColumns();
                if (rows <= 0) rows = outputSize.getRows();
            }
            if (columns > 0) width = columns;
            if (rows > 0) height = rows;
        } catch (IllegalStateException closed) { }
    }

    // A pipe on stdin makes JLine use a dumb terminal even when stdout is a TTY.
    // Query only stdout, without opening a reader or changing terminal attributes.
    // Redirected output must not inherit the dimensions of an unrelated stderr/TTY.
    private static Size outputSize() {
        try {
            if (System.getProperty("os.name", "").startsWith("Windows")) {
                Kernel32.CONSOLE_SCREEN_BUFFER_INFO info = new Kernel32.CONSOLE_SCREEN_BUFFER_INFO();
                long handle = Kernel32.GetStdHandle(Kernel32.STD_OUTPUT_HANDLE);
                if (Kernel32.GetConsoleScreenBufferInfo(handle, info) != 0)
                    return new Size(info.windowWidth(), info.windowHeight());
            } else if (CLibrary.isatty(1) == 1) {
                CLibrary.WinSize size = new CLibrary.WinSize();
                if (CLibrary.ioctl(1, CLibrary.TIOCGWINSZ, size) == 0)
                    return new Size(Short.toUnsignedInt(size.ws_col), Short.toUnsignedInt(size.ws_row));
            }
        } catch (LinkageError | RuntimeException unavailable) {
            // Native support is optional; keep the last known size or defaults.
        }
        return new Size(0, 0);
    }
    public String getOutputEncoding() { return delegate.outputEncoding().name(); }
    public boolean isSupported() { return !delegate.getType().startsWith("dumb"); }
    public boolean isAnsiSupported() { return isSupported() || "dumb-color".equals(delegate.getType()); }
    public boolean isEchoEnabled() { return delegate.echo(); }
    public void setEchoEnabled(boolean enabled) { delegate.echo(enabled); }
    public void restore() { delegate.setAttributes(original); }
    public void reset() { restore(); }

    /** The stty subset used by OpenAF and mini-a, implemented without shell commands. */
    public final class Settings {
        public String get(String flags) {
            Attributes a = delegate.getAttributes();
            return (a.getLocalFlag(Attributes.LocalFlag.ICANON) ? "icanon" : "-icanon")
                + " " + (a.getLocalFlag(Attributes.LocalFlag.ECHO) ? "echo" : "-echo")
                + " min " + a.getControlChar(Attributes.ControlChar.VMIN)
                + " time " + a.getControlChar(Attributes.ControlChar.VTIME);
        }
        public void set(String flags) {
            if ("sane".equals(flags.trim())) {
                // stty sane enables cooked input even when a launcher entered
                // raw mode before Java started. Shutdown still restores exactly.
                Attributes sane = new Attributes(original);
                sane.setLocalFlag(Attributes.LocalFlag.ICANON, true);
                sane.setLocalFlag(Attributes.LocalFlag.ECHO, true);
                sane.setLocalFlag(Attributes.LocalFlag.ISIG, true);
                sane.setLocalFlag(Attributes.LocalFlag.IEXTEN, true);
                sane.setInputFlag(Attributes.InputFlag.ICRNL, true);
                sane.setInputFlag(Attributes.InputFlag.INLCR, false);
                sane.setInputFlag(Attributes.InputFlag.IGNCR, false);
                sane.setOutputFlag(Attributes.OutputFlag.OPOST, true);
                sane.setOutputFlag(Attributes.OutputFlag.ONLCR, true);
                sane.setControlChar(Attributes.ControlChar.VMIN, 1);
                sane.setControlChar(Attributes.ControlChar.VTIME, 0);
                delegate.setAttributes(sane);
                return;
            }
            Attributes a = delegate.getAttributes();
            String[] words = flags.trim().split("\\s+");
            for (int i = 0; i < words.length; i++) {
                switch (words[i]) {
                    case "icanon": a.setLocalFlag(Attributes.LocalFlag.ICANON, true); break;
                    case "-icanon": a.setLocalFlag(Attributes.LocalFlag.ICANON, false); break;
                    case "echo": a.setLocalFlag(Attributes.LocalFlag.ECHO, true); break;
                    case "-echo": a.setLocalFlag(Attributes.LocalFlag.ECHO, false); break;
                    case "min": a.setControlChar(Attributes.ControlChar.VMIN, Integer.parseInt(words[++i])); break;
                    case "time": a.setControlChar(Attributes.ControlChar.VTIME, Integer.parseInt(words[++i])); break;
                    default: throw new IllegalArgumentException("Unsupported terminal setting: " + words[i]);
                }
            }
            delegate.setAttributes(a);
        }
    }
}
