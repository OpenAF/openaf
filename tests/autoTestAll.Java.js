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
})();