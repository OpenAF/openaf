// OpenWrap
// Author: Nuno Aguiar
// Dev

OpenWrap.dev = function() {
	return ow.dev;
};

OpenWrap.dev.prototype.loadPoolDB = function() {
	ow.loadCh();
	ow.loadObj();

	ow.ch.__types.pooldb = {
		__o: { },
		create       : function(aName, shouldCompress, options) { 
			this.__o[aName] = options || {};
			
			if (isUnDef(this.__o[aName].dbPool)) {
				this.__o[aName].dbPool = ow.obj.pool.DB("org.h2.Driver", "jdbc:h2:mem:", "sa", "sa");
			}

			if (isUnDef(this.__o[aName].tableName)) {
				throw "Need a specific options.tableName";
			}
		},
		destroy      : function(aName) { },
		size         : function(aName) { 
			var parent = this, res;
			this.__o[aName].dbPool.use((aDb) => {
				res = Number(aDb.q("select count(*) C from " + parent.__o[aName].tableName).results[0].C);
			});

			return res;
		},
		forEach      : function(aName, aFunction, x) { },
		getKeys      : function(aName, full) { },
		getSortedKeys: function(aName, full) { },
		getSet       : function getSet(aName, aMatch, aK, aV, aTimestamp)  { },
		set          : function(aName, ak, av, aTimestamp) { },
		setAll       : function(aName, anArrayOfKeys, anArrayOfMapData, aTimestamp) { },
		get          : function(aName, aKey) { },
		pop          : function(aName) { },
		shift        : function(aName) { },
		unset        : function(aName, aKey) { }
	};
};

OpenWrap.dev.prototype.loadIgnite = function(aGridName, aIgnite, secretKey, isClient) {
	ow.dev.__i = [];

	var initI = () => {
		plugin("Ignite");
		var grid = (isUnDef(aGridName)) ? "default" : aGridName;
		if (isUnDef(aIgnite)) {
			ow.dev.__i[grid] = new Ignite();
			ow.dev.__i[grid].start(aGridName, secretKey, isClient);
		} else {
			ow.dev.__i[grid] = aIgnite;
		}
	};

	oPromise.prototype.thenAny = function(aFunc, aRejFunc, aGridName) {
		if (isUnDef(ow.dev.__i)) initI();
		return this.then(() => {
			var grid = (isUnDef(aGridName)) ? "default" : aGridName;
			return ow.dev.__i[grid].call(ow.dev.__i[grid].getIgnite(), aFunc.toSource().replace(/[^{]*{([\s\S]*)}[^}]*/, "$1").replace(/"/mg, "\\\""));
		}, aRejFunc);
	};


	oPromise.prototype.thenAll = function(aFunc, aRejFunc, aGridName) {
		if (isUnDef(ow.dev.__i)) initI();
		return this.then(() => {
			var grid = (isUnDef(aGridName)) ? "default" : aGridName;
			return ow.dev.__i[grid].broadcast(ow.dev.__i[grid].getIgnite(), aFunc.toSource().replace(/[^{]*{([\s\S]*)}[^}]*/, "$1").replace(/"/mg, "\\\""));
		}, aRejFunc);
	};

	initI();
};

OpenWrap.dev.prototype.crypt = {
	// https://www.devglan.com/java8/rsa-encryption-decryption-java
	encrypt: (plainText, publicKey) => {
		var cipher = javax.crypto.Cipher.getInstance("RSA/ECB/OAEPWITHSHA-512ANDMGF1PADDING");
		cipher.init(javax.crypto.Cipher.ENCRYPT_MODE, publicKey);
		var cipherText = cipher.doFinal(af.fromString2Bytes(plainText));
		return cipherText;
	},
    encrypt2Text: (plainText, publicKey) => {
    	return af.fromBytes2String(af.toBase64Bytes(af.fromBytes2String(this.encrypt(plainText, publicKey))));
    },
   	decrypt4Text: (cipherText, privateKey) => {

   	},
   	saveKey2File: (filename, key, isPrivate) => {
    	var keyFactory = java.security.KeyFactory.getInstance("RSA");
		var spec;
		if (isPrivate) {
			spec = keyFactory.getKeySpec(key, af.getClass("java.security.spec.RSAPrivateKeySpec"));
		} else {
			spec = keyFactory.getKeySpec(key, af.getClass("java.security.spec.RSAPublicKeySpec"));
		}
		var modulus = spec.getModulus();
		var exponent = (isPrivate ? spec.getPrivateExponent() : spec.getPublicExponent() );
		var ostream = new java.io.ObjectOutputStream(new java.io.BufferedOutputStream(new java.io.FileOutputStream(filename)));
		try {
			ostream.writeObject(modulus);
			ostream.writeObject(exponent);
		} catch(e) {
			sprintErr(e);
		} finally {
			ostream.close();
		}
    },
    readKey4File: (filename, isPrivate) => {
		var istream = new java.io.FileInputStream(filename);
		var oistream = new java.io.ObjectInputStream(new java.io.BufferedInputStream(istream));
		var key;
		try {
			var modulus = oistream.readObject();
			var exponent = oistream.readObject();
			var keyFactory = java.security.KeyFactory.getInstance("RSA");
			if (!isPrivate) {
				key = keyFactory.generatePublic(new java.security.spec.RSAPublicKeySpec(modulus, exponent));
			} else {
				key = keyFactory.generatePrivate(new java.security.spec.RSAPrivateKeySpec(modulus, exponent));
			}
		} catch(e) {
			sprintErr(e);
		} finally {
			oistream.close();
		}
		return key;
    },
    key2encode: (key) => {
      	return java.util.Base64.getEncoder().encodeToString(key.getEncoded()).toString();
    },
   	msg2encode: (msg) => {
    	return java.util.Base64.getEncoder().encodeToString(msg);
   	},
    decode2msg: (msg) => {
    	return java.util.Base64.getDecoder().decode(af.fromString2Bytes(msg));
   	},
   	decode2key: (key, isPrivate) => {
		var k = java.util.Base64.getDecoder().decode(af.fromString2Bytes(key));
		var keySpec = new java.security.spec.X509EncodedKeySpec(k);
		var keyFactory = java.security.KeyFactory.getInstance("RSA");
		if (isPrivate) {
			return keyFactory.generatePrivate(keySpec);
		} else {
			return keyFactory.generatePublic(keySpec);
		}
   	},
	decrypt: (cipherText, privateKey) => {
		var cipher = javax.crypto.Cipher.getInstance("RSA/ECB/OAEPWITHSHA-512ANDMGF1PADDING");
		cipher.init(javax.crypto.Cipher.DECRYPT_MODE, privateKey);
		var decryptedText = cipher.doFinal(cipherText);
		return af.fromBytes2String(decryptedText);
	},
	genKeyPair: (size) => {
		var keyPairGen = java.security.KeyPairGenerator.getInstance("RSA");
		keyPairGen.initialize(size);

		var keyPair = keyPairGen.generateKeyPair();
		return {
			publicKey: keyPair.getPublic(),
			privateKey: keyPair.getPrivate()
		}
	}
}