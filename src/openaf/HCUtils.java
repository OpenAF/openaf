package openaf;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.nio.file.Files;
import java.nio.file.StandardOpenOption;

import org.apache.hc.client5.http.async.methods.AbstractBinResponseConsumer;
import org.apache.hc.core5.http.ContentType;
import org.apache.hc.core5.http.HttpException;
import org.apache.hc.core5.http.HttpRequest;
import org.apache.hc.core5.http.HttpResponse;
import org.apache.hc.core5.http.nio.support.BasicRequestProducer;
import org.apache.hc.client5.http.async.methods.SimpleRequestProducer;
import org.apache.hc.client5.http.async.methods.SimpleResponseConsumer;
import org.apache.hc.client5.http.async.methods.SimpleHttpRequest;
import org.apache.hc.core5.http.nio.StreamChannel;
import org.apache.hc.core5.http.nio.entity.AbstractBinAsyncEntityProducer;
import org.apache.hc.core5.http.nio.entity.FileEntityProducer;

/**
 * 
 * @author Nuno Aguiar
 * 
 */

public class HCUtils {
    protected Exception exception = null;
    protected InputStream stream = null;
    protected HttpResponse response = null;

    public HCUtils() {

    }

    public Exception getException() {
        return exception;
    }

    public HttpResponse getResponse() {
        return response;
    }

    public InputStream getStream() {
        return stream;
    }

    public SimpleRequestProducer getProducer(SimpleHttpRequest r) {
        return SimpleRequestProducer.create(r);
    }

    public SimpleResponseConsumer getConsumer() {
        return SimpleResponseConsumer.create();
    }

    public BasicRequestProducer getFileProducer(HttpRequest r, File f, ContentType ct, boolean chunked) {
        return new BasicRequestProducer(r, new FileEntityProducer(f, ct, chunked));
    }

    public AbstractBinAsyncEntityProducer getEntityProducer(InputStream is, int fragmentSizeHint, ContentType contentType) {
        return new AbstractBinAsyncEntityProducer(fragmentSizeHint, contentType) {
            protected boolean eof = false;
            
            @Override
            public void failed(Exception cause) {
                exception = cause;
                cause.printStackTrace();
                releaseResources();
            }

            @Override
            public boolean isRepeatable() {
                return true;
            }

            @Override
            protected int availableData() {
                if (eof) return -1;
                try {
                    if (is.available() > 0) return is.available(); else return 1;
                } catch (IOException e) {
                    return 0;
                }
            }

            @Override
            protected void produceData(StreamChannel<ByteBuffer> channel) throws IOException {
                if (!eof) {
                    ByteBuffer tbuf = ByteBuffer.allocate(fragmentSizeHint);
                    int res = is.read(tbuf.array());
                    if (res >= 0) {
                        channel.write(tbuf);
                    } else {
                        eof = true;
                    }
                } else {
                    channel.endStream();
                    releaseResources();
                }
            }
        };
    }

    public BasicRequestProducer getStreamRequestProducer(HttpRequest r, InputStream is) {
        return new BasicRequestProducer(r, null);
    }

    public AbstractBinResponseConsumer<Void> getStreamConsumer() {
        return new AbstractBinResponseConsumer<Void>() {
            protected File _f;
            protected FileChannel _fc;
            protected FileOutputStream _fos;

            @Override
            protected void start(
                    final HttpResponse res,
                    final ContentType contentType) throws HttpException, IOException {
                response = res;

                _f = File.createTempFile("__oaf", ".temp");
                _f.deleteOnExit();
                _fos = new FileOutputStream(_f);
                _fc = _fos.getChannel();
            }

            @Override
            protected int capacityIncrement() {
                return Integer.MAX_VALUE;
            }

            @Override
            protected Void buildResult() {
                return null;
            }

            @Override
            protected void data(final ByteBuffer data, final boolean endOfStream) throws IOException {
                if (data.hasRemaining()) {
                    _fc.write(data);
                }
                if (endOfStream) {
                    _fc.close();
                    _fos.close();
                    stream = Files.newInputStream(_f.toPath(), StandardOpenOption.DELETE_ON_CLOSE);
                }
            }

            @Override
            public void failed(final Exception cause) {
                exception = cause;
                cause.printStackTrace();
            }

            @Override
            public void releaseResources() {
            }
        };
    }
}