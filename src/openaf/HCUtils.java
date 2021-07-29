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

    public BasicRequestProducer getStreamProducer(HttpRequest r) {
        return new BasicRequestProducer(r, null);
    }

    public AbstractBinResponseConsumer<Void> getStreamConsumer() {
        return new AbstractBinResponseConsumer<Void>() {
            protected File _f;
            protected FileChannel _fc;

            @Override
            protected void start(
                    final HttpResponse res,
                    final ContentType contentType) throws HttpException, IOException {
                response = res;

                _f = File.createTempFile("test", "openaf");
                _f.deleteOnExit();
                _fc = new FileOutputStream(_f).getChannel();
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