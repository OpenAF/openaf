package jline;

import java.io.IOException;
import java.nio.charset.Charset;
import org.jline.terminal.Attributes;
import org.jline.terminal.TerminalBuilder;

/** OpenAF's legacy terminal facade. All terminal I/O is owned by JLine 4. */
public final class Terminal {
    private static Terminal system;
    private final org.jline.terminal.Terminal delegate;
    private final Attributes original;
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
            org.jline.terminal.Terminal terminal = TerminalBuilder.builder()
                .name("OpenAF").system(true).dumb(true).ffm(false)
                .classLoader(TerminalBuilder.class.getClassLoader())
                .encoding(Charset.defaultCharset()).build();
            system = new Terminal(terminal);
            Terminal owned = system;
            Runtime.getRuntime().addShutdownHook(new Thread(() -> {
                try { owned.restore(); terminal.close(); } catch (Exception ignored) { }
            }, "OpenAF-terminal-restore"));
        }
        return system;
    }

    public org.jline.terminal.Terminal unwrap() { return delegate; }
    public int getWidth() { return delegate.getColumns() > 0 ? delegate.getColumns() : 80; }
    public int getHeight() { return delegate.getRows() > 0 ? delegate.getRows() : 24; }
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
