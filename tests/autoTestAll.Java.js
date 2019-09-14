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
})();