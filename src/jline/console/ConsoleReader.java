package jline.console;

import java.io.Closeable;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import jline.Terminal;
import jline.console.completer.Completer;
import jline.console.completer.CompletionHandler;
import jline.console.completer.CandidateListCompletionHandler;
import jline.console.history.History;
import jline.console.history.MemoryHistory;
import openaf.jline.LegacyHistory;
import org.jline.reader.Binding;
import org.jline.reader.Buffer;
import org.jline.reader.EndOfFileException;
import org.jline.reader.LineReader;
import org.jline.reader.LineReaderBuilder;
import org.jline.reader.Reference;
import org.jline.reader.impl.DefaultParser;
import org.jline.terminal.Attributes;

/** Compatibility surface for OpenAF scripts previously using JLine 2. */
public class ConsoleReader implements Closeable {
    private final Terminal terminal;
    private final boolean ownsTerminal;
    private final List<Completer> completers = new CopyOnWriteArrayList<>();
    private final CursorBuffer cursorBuffer = new CursorBuffer();
    private History history = new MemoryHistory();
    private CompletionHandler completionHandler = new CandidateListCompletionHandler();
    private LineReader reader;
    private boolean historyEnabled = true;
    private boolean expandEvents = true;
    private boolean handleUserInterrupt;

    public ConsoleReader() throws IOException { this(Terminal.system(), false); }
    public ConsoleReader(InputStream input, OutputStream output) throws IOException {
        this(new Terminal(new org.jline.terminal.impl.DumbTerminal(input, output)), true);
    }
    public ConsoleReader(Terminal terminal) { this(terminal, false); }
    private ConsoleReader(Terminal terminal, boolean ownsTerminal) {
        this.terminal = terminal;
        this.ownsTerminal = ownsTerminal;
    }
    private synchronized LineReader lineReader() {
        if (reader == null) {
            reader = LineReaderBuilder.builder().terminal(terminal.unwrap())
                .appName("OpenAF").history(new LegacyHistory(history))
                .parser(new DefaultParser().quoteChars(new char[0]).escapeChars(new char[0])
                    .eofOnUnclosedQuote(false).eofOnEscapedNewLine(false)).build();
            reader.option(LineReader.Option.DISABLE_EVENT_EXPANSION, !expandEvents);
            // Keep JS evaluation/multiline decisions in the calling console.
            reader.option(LineReader.Option.BRACKETED_PASTE, true);
            // Accept normal and application cursor sequences (PTYs, Cygwin and
            // terminal emulators can send either after a nested program exits).
            for (String keymap : new String[] { LineReader.EMACS, LineReader.VIINS }) {
                org.jline.keymap.KeyMap<Binding> keys = reader.getKeyMaps().get(keymap);
                keys.bind(new Reference(LineReader.BACKWARD_CHAR), "\033[D", "\033OD");
                keys.bind(new Reference(LineReader.FORWARD_CHAR), "\033[C", "\033OC");
                keys.bind(new Reference(LineReader.UP_LINE_OR_HISTORY), "\033[A", "\033OA");
                keys.bind(new Reference(LineReader.DOWN_LINE_OR_HISTORY), "\033[B", "\033OB");
            }
            reader.setVariable(LineReader.DISABLE_HISTORY, !historyEnabled);
            reader.getWidgets().put(LineReader.COMPLETE_WORD, () -> complete());
            reader.getWidgets().put(LineReader.EXPAND_OR_COMPLETE, () -> complete());
            reader.getWidgets().put(LineReader.EXPAND_OR_COMPLETE_PREFIX, () -> complete());
            reader.getWidgets().put(LineReader.COMPLETE_PREFIX, () -> complete());
        }
        return reader;
    }
    private boolean complete() {
        String line = reader.getBuffer().toString();
        // Legacy offsets are UTF-16; JLine 4's buffer cursor counts code points.
        int cursor = reader.getBuffer().upToCursor().length();
        List<CharSequence> candidates = new ArrayList<>();
        for (Completer completer : completers) {
            int position = completer.complete(line, cursor, candidates);
            if (position != -1) {
                try { return completionHandler.complete(this, candidates, position); }
                catch (IOException e) { throw new java.io.UncheckedIOException(e); }
            }
        }
        return false;
    }
    public void replaceCompletion(int position, String replacement) {
        Buffer buffer = lineReader().getBuffer();
        String before = buffer.upToCursor();
        if (position < 0 || position > before.length()) return;
        buffer.backspace(before.codePointCount(position, before.length()));
        buffer.write(replacement);
    }
    public boolean atEnd() { return lineReader().getBuffer().cursor() == lineReader().getBuffer().length(); }
    public void printColumns(Collection<? extends CharSequence> values) {
        lineReader().printAbove(String.join("    ", values));
    }
    public String readLine() throws IOException { return readLine("", null); }
    public String readLine(String prompt) throws IOException { return readLine(prompt, null); }
    public String readLine(Character mask) throws IOException { return readLine("", mask); }
    public String readLine(String prompt, Character mask) throws IOException {
        synchronized (terminal) {
            LineReader lr = lineReader();
            lr.setVariable(LineReader.DISABLE_HISTORY, !historyEnabled || mask != null);
            String initial = cursorBuffer.toString();
            cursorBuffer.clear();
            try {
                return lr.readLine(prompt == null ? "" : prompt, mask, initial);
            } catch (EndOfFileException e) {
                return null;
            } catch (org.jline.reader.UserInterruptException e) {
                if (handleUserInterrupt) throw new jline.console.UserInterruptException(e.getPartialLine());
                // JLine 2 normally leaves SIGINT to the process handler.
                terminal.restore();
                System.exit(130);
                return null;
            } finally {
                lr.setVariable(LineReader.DISABLE_HISTORY, !historyEnabled);
            }
        }
    }
    public int readCharacter() throws IOException { return readCharacter(true); }
    public int readCharacter(boolean blocking) throws IOException {
        synchronized (terminal) {
            Attributes previous = terminal.unwrap().enterRawMode();
            try { return blocking ? terminal.unwrap().reader().read() : terminal.unwrap().reader().read(1L); }
            finally { terminal.unwrap().setAttributes(previous); }
        }
    }
    public int readCharacter(char... allowed) throws IOException {
        int value;
        while ((value = readCharacter()) >= 0) {
            for (char c : allowed) if (c == value) return value;
            if (allowed.length == 0) return value;
        }
        return value;
    }
    public Terminal getTerminal() { return terminal; }
    public CursorBuffer getCursorBuffer() { return cursorBuffer; }
    public History getHistory() { return history; }
    public synchronized void setHistory(History history) {
        this.history = java.util.Objects.requireNonNull(history);
        if (reader != null) ((org.jline.reader.impl.LineReaderImpl) reader).setHistory(new LegacyHistory(history));
    }
    public void setHistoryEnabled(boolean enabled) {
        historyEnabled = enabled;
        if (reader != null) reader.setVariable(LineReader.DISABLE_HISTORY, !enabled);
    }
    public boolean isHistoryEnabled() { return historyEnabled; }
    public void setExpandEvents(boolean enabled) {
        expandEvents = enabled;
        if (reader != null) reader.option(LineReader.Option.DISABLE_EVENT_EXPANSION, !enabled);
    }
    public boolean getExpandEvents() { return expandEvents; }
    public void setHandleUserInterrupt(boolean enabled) { handleUserInterrupt = enabled; }
    public boolean getHandleUserInterrupt() { return handleUserInterrupt; }
    public boolean addCompleter(Completer completer) { return completers.add(completer); }
    public boolean removeCompleter(Completer completer) { return completers.remove(completer); }
    public Collection<Completer> getCompleters() { return java.util.Collections.unmodifiableList(completers); }
    public CompletionHandler getCompletionHandler() { return completionHandler; }
    public void setCompletionHandler(CompletionHandler handler) { completionHandler = java.util.Objects.requireNonNull(handler); }
    public void print(CharSequence text) { terminal.unwrap().writer().print(text); }
    public void println() { terminal.unwrap().writer().println(); }
    public void println(CharSequence text) { terminal.unwrap().writer().println(text); }
    public void flush() { terminal.unwrap().flush(); }
    public void shutdown() { try { close(); } catch (IOException ignored) { } }
    public void close() throws IOException { if (ownsTerminal) terminal.unwrap().close(); }
}
