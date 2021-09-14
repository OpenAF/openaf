package openaf.plugins.HTTPd;

import java.io.IOException;
import java.util.HashMap;

import javax.servlet.AsyncContext;
import javax.servlet.ServletOutputStream;
import javax.servlet.WriteListener;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * 
 * @author Nuno Aguiar
 *
 */
public class AsyncServlet extends HttpServlet {
    public abstract class Servlet {
        abstract public void service(HttpServletRequest request, HttpServletResponse response);
    }

    static public HashMap<String, Servlet> hooks = new HashMap<String, Servlet>();

    protected void service(HttpServletRequest request, HttpServletResponse response) throws IOException {
        AsyncContext async = request.startAsync();
        ServletOutputStream out = response.getOutputStream();
        
        out.setWriteListener(new WriteListener() {
            @Override
            public void onError(Throwable t) {
                getServletContext().log("Async Error", t);
                async.complete();
            }

            @Override
            public void onWritePossible() throws IOException {
                while(out.isReady()) {
                    if (hooks.containsKey(request.getLocalPort() + ":" + request.getRequestURI())) {
                        Servlet s = hooks.get(request.getLocalPort() + ":" + request.getRequestURI());
                        s.service(request, response);
                        async.complete();
                        return;
                    } else {
                        response.setStatus(403);
                        async.complete();
                        return;
                    }

                }
            }
        });
    }
}
