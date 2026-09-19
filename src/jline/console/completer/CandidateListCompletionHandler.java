package jline.console.completer;

import java.io.IOException;
import java.util.List;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import jline.console.ConsoleReader;

/** Legacy replacement-offset completion; JLine 4 handles editing and redisplay. */
public class CandidateListCompletionHandler implements CompletionHandler {
    private boolean printSpaceAfterFullCompletion = true;
    public void setPrintSpaceAfterFullCompletion(boolean value) { printSpaceAfterFullCompletion = value; }
    public boolean getPrintSpaceAfterFullCompletion() { return printSpaceAfterFullCompletion; }
    public boolean complete(ConsoleReader reader, List<CharSequence> candidates, int position) throws IOException {
        if (candidates.isEmpty() || position < 0) return false;
        List<String> values = new ArrayList<>();
        for (CharSequence candidate : candidates) values.add(candidate.toString());
        values = new ArrayList<>(new LinkedHashSet<>(values));
        String prefix = values.get(0);
        for (String value : values) {
            int n = 0;
            while (n < prefix.length() && n < value.length() && prefix.charAt(n) == value.charAt(n)) n++;
            prefix = prefix.substring(0, n);
        }
        if (values.size() == 1 && printSpaceAfterFullCompletion && reader.atEnd()
                && !prefix.endsWith(" ")) prefix += " ";
        reader.replaceCompletion(position, prefix);
        if (values.size() > 1) reader.printColumns(values);
        return true;
    }
}
