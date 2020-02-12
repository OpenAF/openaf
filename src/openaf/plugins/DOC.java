package openaf.plugins;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.List;

import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.Undefined;
import org.mozilla.javascript.annotations.JSConstructor;
import org.mozilla.javascript.annotations.JSFunction;

/**
 * DOC plugin
 * 
 * @author Nuno Aguiar
 * 
 */
public class DOC extends ScriptableObject {
    private static final long serialVersionUID = -9058684071530344846L;
    protected boolean read_only;
    protected File aFile;
    protected XWPFDocument doc;

    @Override
    public String getClassName() {
        return "DOC";
    }

    @JSConstructor
    public void newDOC(Object arg, String password, boolean readOnly) throws IOException {
        doc = null;

        if (arg instanceof String) {
            // It's a filename
            try {
                this.read_only = readOnly;
                this.aFile = new File((String) arg);
                if (readOnly) {
                    // doc = DocumentFactory.create(new FileInputStream(new File((String) arg)),
                    // password);
                    doc = new XWPFDocument(new FileInputStream(new File((String) arg)));
                } else {
                    doc = new XWPFDocument(new FileInputStream(new File((String) arg)));
                }
            } catch (Exception e) {

            }
        }

        if (arg instanceof byte[]) {
            try {

            } catch (Exception e) {
                doc = new XWPFDocument(new ByteArrayInputStream((byte[]) arg));
            }
        }

        if (doc == null) {
            doc = new XWPFDocument();
        }
    }

    @JSFunction
    public void close() throws IOException {
        doc.close();
    }

    @JSFunction
    public XWPFDocument getDocument() {
        return doc;
    }

    @JSFunction
    public List<XWPFParagraph> getParagraphs() {
        return doc.getParagraphs();
    }

    @JSFunction
    public void writeParagraph(String aString) {
        XWPFParagraph para = doc.createParagraph();
        XWPFRun run = para.createRun();

        run.setText(aString);
    }

    @JSFunction
    public void writeFile(Object file) throws FileNotFoundException, IOException {
        doc.write(new FileOutputStream((String) file));
    }
}