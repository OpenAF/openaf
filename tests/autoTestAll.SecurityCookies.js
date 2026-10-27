// Copyright 2026 Nuno Aguiar

(function() {
    exports.testHostOnlyCookieBinding = function() {
        ow.loadObj()
        var channel = "security-cookie-" + genUUID()
        var http = new ow.obj.http(__, __, __, __, __, __, __, { delayBuild: true })
        var legacyHttp
        try {
            http.client = http.client.build()
            http.setCookieStore(channel)

            var origin = Packages.okhttp3.HttpUrl.get("https://origin.example/path")
            var cookie = Packages.okhttp3.Cookie.parse(origin, "session=secret; Path=/; Secure")
            http.client.cookieJar().saveFromResponse(origin, java.util.Collections.singletonList(cookie))

            var originCookies = http.client.cookieJar().loadForRequest(origin)
            var otherCookies = http.client.cookieJar().loadForRequest(Packages.okhttp3.HttpUrl.get("https://other.example/path"))
            ow.test.assert(originCookies.length, 1, "A host-only cookie should remain available to its original host.")
            ow.test.assert(otherCookies.length, 0, "A host-only cookie must not be rebound to another request host.")

            var domainOrigin = Packages.okhttp3.HttpUrl.get("https://example.test/path")
            var domainCookie = Packages.okhttp3.Cookie.parse(domainOrigin, "wide=value; Domain=example.test; Path=/; Secure")
            http.client.cookieJar().saveFromResponse(domainOrigin, java.util.Collections.singletonList(domainCookie))
            http.client.cookieJar().loadForRequest(Packages.okhttp3.HttpUrl.get("https://unrelated.test/path"))
            var domainCookies = http.client.cookieJar().loadForRequest(Packages.okhttp3.HttpUrl.get("https://child.example.test/path"))
            ow.test.assert(domainCookies.length, 1, "An unrelated request must not delete a valid domain cookie.")

            legacyHttp = new ow.obj.http(__, __, __, __, __, __, __, { delayBuild: true })
            legacyHttp.client = legacyHttp.client.build()
            legacyHttp.setCookieStore(channel + "-legacy")
            legacyHttp.__cookies = {
                forEach: function(fn) {
                    fn({ name: "legacy", domain: "legacy.example", path: "/", secure: true, hostOnly: true }, {
                        name: new java.lang.String("legacy"),
                        domain: new java.lang.String("legacy.example"),
                        path: new java.lang.String("/"),
                        secure: true,
                        hostOnly: true,
                        value: new java.lang.String("legacy=secret; Path=/; Secure")
                    })
                },
                unset: function() {}
            }
            var legacyOther = legacyHttp.client.cookieJar().loadForRequest(Packages.okhttp3.HttpUrl.get("https://other.example/path"))
            var legacyOrigin = legacyHttp.client.cookieJar().loadForRequest(Packages.okhttp3.HttpUrl.get("https://legacy.example/path"))
            ow.test.assert(legacyOther.length, 0, "Legacy host-only records must not be rebound to another host.")
            ow.test.assert(legacyOrigin.length, 1, "Legacy host-only records should remain available to their stored host.")
        } finally {
            try { if (isDef(legacyHttp)) legacyHttp.close() } catch(e) {}
            try { http.close() } catch(e) {}
            try { $ch(channel + "-legacy").destroy() } catch(e) {}
            $ch(channel).destroy()
        }
    }
})()
