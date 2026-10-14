// Copyright 2023 Nuno Aguiar

(function() {
    exports.testCipher = function() {
        var c = new ow.java.cipher();

        var keys = c.genKeyPair(2048);
        var msg = "Hello World!";
        var cmsg = c.decrypt(c.encrypt(msg, keys.publicKey), keys.privateKey);
        ow.test.assert(cmsg, msg, "Problem with encrypting/decrypting a string.");

        cmsg = af.fromInputStream2String(c.decryptStream(af.fromBytes2InputStream(c.encrypt(msg, keys.publicKey)), keys.privateKey));
        ow.test.assert(cmsg, msg, "Problem with encrypting/decrypting a stream");

        cmsg = c.decrypt(c.decode2msg(c.msg2encode(c.encrypt(msg, keys.publicKey))), keys.privateKey);
        ow.test.assert(cmsg, msg, "Problem with encode/decode message.");

        cmsg = c.decrypt(c.decode2msg(c.msg2encode(c.encrypt(msg, c.decode2key(c.key2encode(keys.publicKey), false) ))), c.decode2key(c.key2encode(keys.privateKey), true) );
        ow.test.assert(cmsg, msg, "Problem with encode/decode key");
    };

    exports.testASymCipher = function() {
        var c = new ow.java.cipher();

        var kp = c.genKeyPair();
        var msg = "Hello World!";
        
        var mm = c.aSymEncrypt(msg, kp.publicKey);
        
        var dmsg = af.fromBytes2String(c.aSymDecrypt(mm.eMessage, mm.eSymKey, kp.privateKey));

        ow.test.assert(dmsg, msg, "Problem with asym encrypt/decrypt");
    };

    exports.testSignVerify = function() {
        var c = new ow.java.cipher();

        var keys = c.genKeyPair(2048);
        var msg = "Hello World!";
        var sig = c.sign(keys.privateKey, af.fromString2InputStream(msg));
        var res = c.verify(sig, keys.publicKey, af.fromString2InputStream(msg));

        ow.test.assert(res, true, "Problem with cipher sign/verify functionality (base 64 encoded).");

        sig = c.sign(keys.privateKey, af.fromString2InputStream(msg), true);
        res = c.verify(sig, keys.publicKey, af.fromString2InputStream(msg), true);

        ow.test.assert(res, true, "Problem with cipher sign/verify functionality");
    };

    exports.testGenCerts = function() {
        var c = new ow.java.cipher();

        var keys = c.genKeyPair(2048);
        var res = c.genCert("cn=test123", keys.publicKey, keys.privateKey, new Date(now() + (1000 * 60 * 60 * 24)), void 0, "test.jks", "test123");
        ow.test.assert(isDef(res), true, "Problem with test genCerts.");

        io.rm("test.jks");
    };

    exports.testJavaMaven = function() {
        var m = new ow.java.maven(), calls = [];
        var ctor = ow.java.maven;
        var dir = String(java.nio.file.Files.createTempDirectory("java-maven-"));
        var config = { artifacts: [{ group: "test", id: "sample", version: "latest" },
                                   { group: "test", id: "sample", version: "1.2" }] };
        try {
            io.writeFileYAML(dir + "/.maven.yaml", config);
            ow.java.maven = function() { return {
                getFile: () => calls.push("latest"),
                getFileVersion: (a, t, v) => calls.push(v),
                getLicenseByVersion: () => {}
            }; };
            m.processMavenFile(dir, false, () => {});
            ow.test.assert(calls, ["latest", "1.2"], "latest version dispatch");
        } finally {
            ow.java.maven = ctor;
            io.rm(dir + "/.maven.yaml");
        }
        try {
            ["foo-1.jar", "foo-2.jar", "other-foo-1.jar.backup", "foo-1Xjar", "foo+bar-1.jar", "foo+bar-2.jar"]
                .forEach(n => io.writeFileString(dir + "/" + n, "test"));
            io.mkdir(dir + "/foo-3.jar");
            m.removeOldVersionsSpecific("foo", "foo-{{version}}.jar", "2", dir);
            ow.test.assert(io.fileExists(dir + "/foo-1.jar"), false, "old artifact removed");
            ["foo-2.jar", "other-foo-1.jar.backup", "foo-1Xjar", "foo-3.jar"].forEach(n =>
                ow.test.assert(io.fileExists(dir + "/" + n), true, "preserved " + n));
            m.removeOldVersionsSpecific("foo+bar", "foo+bar-{{version}}.jar", "2", dir, () => false);
            ow.test.assert(io.fileExists(dir + "/foo+bar-1.jar"), true, "cleanup callback veto");
            m.removeOldVersionsSpecific("foo+bar", "foo+bar-{{version}}.jar", "2", dir);
            ow.test.assert(io.fileExists(dir + "/foo+bar-1.jar"), false, "escaped template literal");
            io.writeFileString(dir + "/foo-1.jar", "test");
            m.removeOldVersionsSpecific("foo", "foo-{{ version }}.jar", "2", dir);
            ow.test.assert(io.fileExists(dir + "/foo-1.jar"), false, "spaced version placeholder");
            io.writeFileString(dir + "/foo-1.jar", "test");
            m.removeOldVersionsSpecific("foo", "foo-{{{version}}}.jar", "2", dir);
            ow.test.assert(io.fileExists(dir + "/foo-1.jar"), false, "unescaped version placeholder");
        } finally { io.rm(dir); }
    };

    exports.testJavaJMX = function() {
        var j = Object.create(ow.java.JMX.prototype);
        j.queryNames = () => ["test:type=Pool,name=A", "test:type=Pool,name=B"];
        j.getObject = n => ({ value: n });
        var out = j.getObjects();
        ow.test.assert(Object.keys(out.Pool).sort(), ["A", "B"], "all same-type JMX objects retained");
    };

    exports.testJavaIMAP = function() {
        var m = Object.create(ow.java.IMAP.prototype), count = 2;
        m.getMessageCount = () => count;
        m.getMessage = (f, n) => n;
        ow.test.assert(m.getMessages("Inbox", 5), [2, 1], "one-based range");
        count = 7;
        ow.test.assert(m.getMessages("Inbox", 3), [7, 6, 5], "newest first");
        ow.test.assert(m.getMessages("Inbox", 0), [], "zero limit");
        count = 0;
        ow.test.assert(m.getMessages(), [], "empty mailbox");
        var terms = [];
        m.__getFolder = () => ({ getSortedMessages: (sort, term) => {
            terms.push(term); return [1, 2, 3, 4, 5, 6, 7];
        } });
        m.__translateMsg = v => v;
        ["FROM", "CC", "TO", "SUBJECT", "DATE", "ARRIVAL", "SIZE"].forEach(type => {
            ow.test.assert(m.getSortedMessages("Inbox", type, "test", 5), [1, 2, 3, 4, 5], "sort limit " + type);
        });
        ow.test.assert(String(terms[1].getRecipientType()), "Cc", "CC recipient filter");
        ow.test.assert(String(terms[2].getRecipientType()), "To", "TO recipient filter");
        ow.test.assert(terms[4], null, "DATE without search filter");
        ow.test.assert(m.getSortedMessages("Inbox", "DATE", "", 0), [], "sorted zero limit");
        m = Object.create(ow.java.IMAP.prototype);
        var open = false, opens = 0;
        var folder = { isOpen: () => open, open: () => { open = true; opens++; }, close: () => { open = false; } };
        m.folders = {}; m.ro = true; m.store = { getFolder: () => folder };
        m.__getFolder(); m.close(); m.__getFolder();
        ow.test.assert(opens, 2, "folder reopened after close");
        folder.close(); m.__getFolder();
        ow.test.assert(opens, 3, "externally closed folder reopened");
        var msg = new javax.mail.internet.MimeMessage(javax.mail.Session.getInstance(new java.util.Properties()));
        msg.setText("hello");
        // getSizeLong is IMAPMessage-specific; adapt only that accessor for this MIME fixture.
        var wrap = { getContent: () => msg.getContent(), getMessageNumber: () => 1,
            getFrom: () => [], getAllRecipients: () => [], getReplyTo: () => [], getSubject: () => "test",
            getReceivedDate: () => null, getSentDate: () => null, getEncoding: () => "7bit", getSizeLong: () => 5 };
        ow.test.assert(m.__translateMsg(wrap).bodyParts, 0, "plain-text message metadata");
        var multipart = new javax.mail.internet.MimeMultipart();
        multipart.addBodyPart(new javax.mail.internet.MimeBodyPart());
        wrap.getContent = () => multipart;
        ow.test.assert(m.__translateMsg(wrap).bodyParts, 1, "multipart message metadata");
    };

    exports.testJavaClassVersion = function() {
        [45, 48, 52, 58, 59, 65, 70, 256].forEach(major => {
            var bytes = java.nio.ByteBuffer.allocate(8).putInt(-889275714).putShort(0).putShort(major).array();
            var expected = major <= 48 ? "1." + (major - 44) : String(major - 44);
            ow.test.assert(ow.java.getClassVersion(bytes), expected, "class major " + major);
        });
        ow.test.assert(isUnDef(ow.java.getClassVersion([0, 0, 0, 0, 0, 0, 0, 65])), true, "bad magic");
        ow.test.assert(isUnDef(ow.java.getClassVersion([1])), true, "short header");
    };

    exports.testJavaJsonMemComm = function() {
        var dir = String(java.nio.file.Files.createTempDirectory("java-mem-"));
        var c = new ow.java.jsonMemComm(dir), ctor = ow.java.memComm;
        var hadObj = Object.prototype.hasOwnProperty.call(global, "obj"), oldObj = global.obj;
        var decoy, createdDecoy = false, closes = 0;
        try {
            ow.java.memComm = function(file, size) {
                var tmp = new ctor(file, size), close = tmp.close;
                tmp.close = function() { closes++; return close.call(tmp); };
                return tmp;
            };
            var token = c.send({ message: "café 日本" });
            decoy = token + ".mem";
            if (io.fileExists(decoy)) throw "Unexpected existing decoy file";
            io.writeFileString(decoy, "preserve");
            createdDecoy = true;
            ow.test.assert(closes, 1, "sender payload channel closed");
            ow.test.assert(c.receive()[0].o, { message: "café 日本" }, "payload round trip");
            ow.test.assert(closes, 2, "receiver payload channel closed");
            ow.test.assert(io.fileExists(dir + "/" + decoy), false, "payload removed from queue directory");
            ow.test.assert(io.readFileString(decoy), "preserve", "cwd decoy preserved");
            ow.test.assert(Object.prototype.hasOwnProperty.call(global, "obj"), hadObj, "no global obj created");
            if (hadObj) ow.test.assert(global.obj, oldObj, "existing global obj preserved");
            // Failure paths still release the index lock and close the payload channel.
            ow.java.memComm = function(file, size) {
                var tmp = new ctor(file, size), close = tmp.close;
                tmp.send = () => { throw "test send failure"; };
                tmp.close = function() { closes++; return close.call(tmp); };
                return tmp;
            };
            var failed = false;
            try { c.send({ fail: true }); } catch(e) { failed = true; }
            ow.test.assert(failed, true, "send failure propagated");
            ow.test.assert(isUnDef(c.idx.lck), true, "index lock released on failure");
            ow.test.assert(closes, 3, "payload closed on failure");
        } finally {
            ow.java.memComm = ctor;
            c.idx.close();
            if (createdDecoy && io.fileExists(decoy)) io.rm(decoy);
            io.rm(dir);
        }
    };

    exports.testJavaSSL = function() {
        var oldContext = javax.net.ssl.SSLContext.getDefault();
        var oldFactory = javax.net.ssl.HttpsURLConnection.getDefaultSSLSocketFactory();
        var properties = ["javax.net.ssl.trustStore", "javax.net.ssl.trustStorePassword"];
        var oldProperties = properties.map(p => java.lang.System.getProperty(p));
        var globals = ["__httpSSLSocketFactory", "__httpX509TrustManager"];
        var oldGlobals = globals.map(p => ({ present: Object.prototype.hasOwnProperty.call(global, p), value: global[p] }));
        var file = io.createTempFile("java-trust-", ".jks");
        var input, output;
        try {
            var source = java.security.KeyStore.getInstance(java.security.KeyStore.getDefaultType());
            input = new java.io.FileInputStream(java.lang.System.getProperty("java.home") + "/lib/security/cacerts");
            try { source.load(input, new java.lang.String("changeit").toCharArray()); } finally { input.close(); }
            var trusted = source.getCertificate(source.aliases().nextElement());
            var store = java.security.KeyStore.getInstance(java.security.KeyStore.getDefaultType());
            store.load(null, null); store.setCertificateEntry("trusted", trusted);
            output = new java.io.FileOutputStream(file);
            try { store.store(output, new java.lang.String("secret").toCharArray()); } finally { output.close(); }
            java.lang.System.setProperty(properties[0], file);
            java.lang.System.setProperty(properties[1], "wrong-property-password");
            // Real JVM trust validation rejects these deliberately invalid certificates.
            var cert = (name, sans) => new JavaAdapter(java.security.cert.X509Certificate, {
                getSubjectX500Principal: () => new javax.security.auth.x500.X500Principal("CN=" + name),
                getSubjectAlternativeNames: () => {
                    if (isUnDef(sans)) return null;
                    var list = new java.util.ArrayList();
                    sans.forEach(pair => {
                        var entry = new java.util.ArrayList();
                        entry.add(new java.lang.Integer(pair[0])); entry.add(new java.lang.String(pair[1])); list.add(entry);
                    });
                    return list;
                },
                getEncoded: () => java.nio.ByteBuffer.allocate(1).array(),
                getIssuerX500Principal: () => new javax.security.auth.x500.X500Principal("CN=untrusted"),
                getPublicKey: () => trusted.getPublicKey(),
                checkValidity: () => {}, getVersion: () => 3,
                getSerialNumber: () => java.math.BigInteger.ONE,
                getNotBefore: () => new java.util.Date(0), getNotAfter: () => new java.util.Date(4102444800000),
                getCriticalExtensionOIDs: () => null, getNonCriticalExtensionOIDs: () => null,
                hasUnsupportedCriticalExtension: () => false, getExtensionValue: () => null,
                toString: () => name
            });
            var rejected = (manager, chain) => {
                try { manager.checkServerTrusted(chain, "RSA"); return false; } catch(e) { return true; }
            };
            var allowed = cert("allowed.example.com"), other = cert("unrelated.net");
            ow.java.setIgnoreSSLDomains(["example.com"], "secret");
            var manager = global.__httpX509TrustManager;
            ow.test.assert(rejected(manager, [allowed]), false, "explicit password and CN suffix bypass");
            ow.test.assert(rejected(manager, [other]), true, "bypass does not persist");
            ow.test.assert(rejected(manager, [cert("notexample.com")]), true, "DNS label boundary");
            ow.test.assert(rejected(manager, [other, allowed]), true, "issuer name cannot authorize leaf");
            ow.test.assert(rejected(manager, [cert("unrelated.net", [[2, "api.example.com"]])]), false, "DNS SAN bypass");
            ow.test.assert(rejected(manager, [cert("allowed.example.com", [[2, "unrelated.net"]])]), true, "DNS SAN takes precedence over CN");
            ow.test.assert(rejected(manager, [cert("unrelated.net", [[6, "https://example.com"]])]), true, "URI SAN cannot authorize domain");
            ow.test.assert(rejected(manager, [trusted]), false, "normal trusted certificates accepted");
            java.lang.System.setProperty(properties[1], "secret");
            ow.java.setIgnoreSSLDomains([".example.com"]);
            ow.test.assert(rejected(global.__httpX509TrustManager, [allowed]), false, "leading-dot entry matches subdomains");
            ow.test.assert(rejected(global.__httpX509TrustManager, [cert("example.com")]), true, "leading-dot entry only matches subdomains");
            java.lang.System.setProperty(properties[1], "secret");
            ow.java.setIgnoreSSLDomains([]);
            ow.test.assert(rejected(global.__httpX509TrustManager, [allowed]), true, "empty list validates all");
            ow.java.setIgnoreSSLDomains();
            ow.test.assert(rejected(global.__httpX509TrustManager, [other]), false, "omitted list preserves bypass-all");
        } finally {
            javax.net.ssl.SSLContext.setDefault(oldContext);
            javax.net.ssl.HttpsURLConnection.setDefaultSSLSocketFactory(oldFactory);
            properties.forEach((p, i) => {
                if (oldProperties[i] == null) java.lang.System.clearProperty(p);
                else java.lang.System.setProperty(p, oldProperties[i]);
            });
            globals.forEach((p, i) => {
                if (oldGlobals[i].present) global[p] = oldGlobals[i].value;
                else delete global[p];
            });
            io.rm(file);
        }
    };
})();
