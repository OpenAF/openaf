// Copyright 2026 Nuno Aguiar

(function() {
    function startServer(port, state) {
        plugin("HTTPServer")
        var httpd = new HTTPd(port, "127.0.0.1", __, __, __, __, 5000, "java")
        httpd.add("/auth", function(req) {
            var authorization = req.header.authorization
            if (isDef(authorization)) state.authorizations.add(String(authorization))
            if (isUnDef(authorization)) return httpd.reply("Authentication required", "text/plain", 401, { "WWW-Authenticate": "Basic realm=\"security-test\"" })
            return httpd.reply(String(authorization), "text/plain", 200, {})
        })
        return httpd
    }

    exports.testCredentialIsolation = function() {
        plugin("HTTP")

        var firstPort = findRandomOpenPort()
        var secondPort = findRandomOpenPort()
        while (secondPort == firstPort) secondPort = findRandomOpenPort()
        var firstState = { authorizations: new java.util.concurrent.LinkedBlockingQueue() }
        var secondState = { authorizations: new java.util.concurrent.LinkedBlockingQueue() }
        var first = startServer(firstPort, firstState)
        var second = startServer(secondPort, secondState)
        var originalDefault = java.net.Authenticator.getDefault()

        try {
            var authenticated = new HTTP()
            authenticated.login("victim", "secret")
            ow.test.assert(java.net.Authenticator.getDefault() === originalDefault, true, "HTTP.login should not replace the JVM default authenticator.")

            var response = authenticated.exec("http://127.0.0.1:" + firstPort + "/auth")
            ow.test.assert(response.responseCode, 200, "Connection-local Basic authentication should still succeed.")
            ow.test.assert(String(firstState.authorizations.poll(5, java.util.concurrent.TimeUnit.SECONDS)).startsWith("Basic "), true, "The intended origin did not receive Basic credentials.")

			try { authenticated.exec("http://127.0.0.1:" + secondPort + "/auth") } catch(e) {}
			ow.test.assert(secondState.authorizations.isEmpty(), true, "Default credentials leaked to a second origin through the same HTTP instance.")

            var unauthenticated = new HTTP()
            try { unauthenticated.exec("http://127.0.0.1:" + secondPort + "/auth") } catch(e) {}
            ow.test.assert(secondState.authorizations.isEmpty(), true, "Credentials leaked to a separate HTTP instance and origin.")

			var scoped = new HTTP()
			scoped.login("scoped", "secret", false, "http://127.0.0.1:" + secondPort + "/auth")
			var scopedResponse = scoped.exec("http://127.0.0.1:" + secondPort + "/auth")
			ow.test.assert(scopedResponse.responseCode, 200, "Explicitly scoped credentials should authenticate their configured origin.")
			ow.test.assert(String(secondState.authorizations.poll(5, java.util.concurrent.TimeUnit.SECONDS)).startsWith("Basic "), true, "The scoped origin did not receive its credentials.")
            ow.test.assert(java.net.Authenticator.getDefault() === originalDefault, true, "HTTP requests should preserve the JVM default authenticator.")
        } finally {
            first.stop()
            second.stop()
        }
    }
})()
