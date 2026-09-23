package openaf.jline;

import java.io.IOException;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ListIterator;
import jline.console.history.History;
import jline.console.history.FileHistory;
import jline.console.history.PersistentHistory;
import org.jline.reader.LineReader;

/** Exposes the same legacy history to JLine 4 without changing its disk format. */
public final class LegacyHistory implements org.jline.reader.History {
    private final History history;
    private LineReader reader;
    public LegacyHistory(History history) { this.history = history; }
    public void attach(LineReader reader) { this.reader = reader; }
    public void load() { } // FileHistory's constructor already loads it.
    public void save() throws IOException {
        if (history instanceof PersistentHistory) ((PersistentHistory) history).flush();
    }
    public void purge() throws IOException {
        if (history instanceof PersistentHistory) ((PersistentHistory) history).purge();
        else history.clear();
    }
    public void write(Path path, boolean incremental) throws IOException {
        if (path == null) { save(); return; }
        FileHistory copy = new FileHistory(path.toFile(), false);
        for (History.Entry e : history) copy.add(e.value());
        copy.flush();
    }
    public void append(Path path, boolean incremental) throws IOException {
        if (path == null) { save(); return; }
        FileHistory copy = new FileHistory(path.toFile());
        for (History.Entry e : history) copy.add(e.value());
        copy.flush();
    }
    public void read(Path path, boolean incremental) throws IOException {
        if (path != null) for (History.Entry e : new FileHistory(path.toFile())) history.add(e.value());
    }
    public int size() { return history.size(); }
    public int index() { return history.index(); }
    public int first() { return history.isEmpty() ? history.index() : history.entries().next().index(); }
    public int last() { return first() + size() - 1; }
    public String get(int index) { return history.get(index).toString(); }
    public void add(Instant time, String line) {
        if (!line.isEmpty() && (reader == null || !Boolean.TRUE.equals(reader.getVariable(LineReader.DISABLE_HISTORY)))) {
            history.add(line.replace("\n", "^J"));
        }
        history.moveToEnd();
    }
    public ListIterator<Entry> iterator(int index) {
        ListIterator<History.Entry> entries = history.entries(index);
        return new ListIterator<Entry>() {
            private Entry wrap(History.Entry e) {
                return new Entry() {
                    public int index() { return e.index(); }
                    public Instant time() { return Instant.EPOCH; }
                    public String line() { return e.value().toString(); }
                };
            }
            public boolean hasNext() { return entries.hasNext(); }
            public Entry next() { return wrap(entries.next()); }
            public boolean hasPrevious() { return entries.hasPrevious(); }
            public Entry previous() { return wrap(entries.previous()); }
            public int nextIndex() { return entries.nextIndex(); }
            public int previousIndex() { return entries.previousIndex(); }
            public void remove() { throw new UnsupportedOperationException(); }
            public void set(Entry e) { throw new UnsupportedOperationException(); }
            public void add(Entry e) { throw new UnsupportedOperationException(); }
        };
    }
    public String current() { return history.current().toString(); }
    public boolean previous() { return history.previous(); }
    public boolean next() { return history.next(); }
    public boolean moveToFirst() { return history.moveToFirst(); }
    public boolean moveToLast() { return history.moveToLast(); }
    public boolean moveTo(int index) { return history.moveTo(index); }
    public void moveToEnd() { history.moveToEnd(); }
    public void resetIndex() { history.moveToEnd(); }
}
