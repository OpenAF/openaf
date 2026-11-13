# ow.java.cipher

[Home](../../../index.md) / [All APIs](../../../all-apis.md) / [ow](../../index.md) / [ow.java](../index.md) / [ow.java.cipher](index.md)

## Subcategories

- [ow.java.cipher.prototype](prototype/index.md)

<a id="api-ow-java-cipher-asymencrypt-4cdf9d55"></a>

## ow.java.cipher.aSymEncrypt

### ow.java.cipher.aSymEncrypt(aMessage, aPublicKey) : Map

Given aMessage and previously generated aPublicKey will encrypt aMessage with a random symmetric key, encrypt that symmetric key with aPublicKey and return a map with eSymKey (encrypted symmetric key) and eMessage (encrypted message)

Sources:

- js/owrap.java.js:1238

<a id="api-ow-java-cipher-decode2key-fa0b22f7"></a>

## ow.java.cipher.decode2Key

### ow.java.cipher.decode2Key(aKey, isPrivate, anAlgorithm) : Key

Given an encoded base 64 key (with ow.java.cipher.key2encode) returns the corresponding Key object. If the aKey is private isPrivate must be true, if public is must be false. Optionally a key anAlgorithm can be provided (defaults to RSA).

Sources:

- js/owrap.java.js:1489

<a id="api-ow-java-cipher-decode2msg-e8b5f584"></a>

## ow.java.cipher.decode2msg

### ow.java.cipher.decode2msg(aEncodedMessage) : String

Given aEncodedMessage base 64 string returns the original message.

Sources:

- js/owrap.java.js:1478

<a id="api-ow-java-cipher-decodekey-cdb2d914"></a>

## ow.java.cipher.decodeKey

### ow.java.cipher.decodeKey(aString, isPrivate, anAlgorithm) : JavaObject

Decode aString base64 key representation (from encodeKey) into a public or private (isPrivate = true) key optionally specifying anAlgorithm (defaults to RSA)

Sources:

- js/owrap.java.js:1679

<a id="api-ow-java-cipher-decrypt-f0820671"></a>

## ow.java.cipher.decrypt

### ow.java.cipher.decrypt(aEncryptedMessage, aPrivateKey, anAlgorithm) : ArrayBytes

Given a previously encrypted message will return the corresponding decrypted message using aPrivateKey. Optionally a key anAlgorithm can be provided (defaults to RSA).

Sources:

- js/owrap.java.js:1514

<a id="api-ow-java-cipher-decrypt4text-f93286cb"></a>

## ow.java.cipher.decrypt4Text

### ow.java.cipher.decrypt4Text(aString, privateKey) : String

Given aPrivateKey (from ow.java.cipher.readKey4File or genKeyPair) tries to RSA decrypt a base64 encrypted string returning the decrypted string.

Sources:

- js/owrap.java.js:1324

<a id="api-ow-java-cipher-decryptstream-5d2eddb0"></a>

## ow.java.cipher.decryptStream

### ow.java.cipher.decryptStream(aInputStream, aPrivateKey, anAlgorithm) : Stream

Given a previously encrypted aInputStream will return the corresponding decrypted stream using aPrivateKey. Optionally a key anAlgorithm can be provided (defaults to RSA).

Sources:

- js/owrap.java.js:1533

<a id="api-ow-java-cipher-encodecert-09cfac09"></a>

## ow.java.cipher.encodeCert

### ow.java.cipher.encodeCert(aCert) : String

Encodes aCert(ificate) into a base64 PEM representation.

Sources:

- js/owrap.java.js:1646

<a id="api-ow-java-cipher-encodekey-0c580584"></a>

## ow.java.cipher.encodeKey

### ow.java.cipher.encodeKey(aKey, isPrivate) : String

Encodes private (isPrivate = true) or public key into a base64 key representation.

Sources:

- js/owrap.java.js:1662

<a id="api-ow-java-cipher-encrypt-9357f952"></a>

## ow.java.cipher.encrypt

### ow.java.cipher.encrypt(aString, aPublicKey) : ArrayBytes

Given aPublicKey (from ow.java.cipher.readKey4File or genKeyPair) tries to RSA encrypt aString returning the encrypted ArrayBytes.

Sources:

- js/owrap.java.js:1278

<a id="api-ow-java-cipher-encrypt2text-cee8c2f9"></a>

## ow.java.cipher.encrypt2Text

### ow.java.cipher.encrypt2Text(aString, aPublicKey) : String

Given aPublicKey (from ow.java.cipher.readKey4File or genKeyPair) tries to RSA encrypt aString to a base64 string returning the encrypted string.

Sources:

- js/owrap.java.js:1311

<a id="api-ow-java-cipher-encryptstream-ac266fdd"></a>

## ow.java.cipher.encryptStream

### ow.java.cipher.encryptStream(outputStream, aPublicKey) : Stream

Given aPublicKey (from ow.java.cipher.readKey4File or genKeyPair) tries to RSA encrypt outputStream returning an encrypted stream.

Sources:

- js/owrap.java.js:1296

<a id="api-ow-java-cipher-gencert-876bddea"></a>

## ow.java.cipher.genCert

### ow.java.cipher.genCert(aDn, aPublicKey, aPrivateKey, aValidity, aSigAlgName, aKeyStore, aPassword, aKeyStoreType) : JavaSignature

Generates a certificate with aDn (defaults to "cn=openaf"), using aPublicKey and aPrivateKey, for aValidity date (defaults to a date  one year from now). Optionally you can specify aSigAlgName (defaults to SHA256withRSA), a file based aKeyStore and the corresponding aPassword (defaults to "changeit").

Sources:

- js/owrap.java.js:1702

<a id="api-ow-java-cipher-genkeypair-e89ce85c"></a>

## ow.java.cipher.genKeyPair

### ow.java.cipher.genKeyPair(aKeySize, aAlg) : Map

Given aKeySize (e.g. 2048, 3072, 4096, 7680 and 15360) will return a map with publicKey and privateKey. Optionally you can choose an anAlgorithm (defaults to RSA).

Sources:

- js/owrap.java.js:1550

<a id="api-ow-java-cipher-getcert4file-e5429d53"></a>

## ow.java.cipher.getCert4File

### ow.java.cipher.getCert4File(aFile) : Java

Given a X509 certificate aFile will return the corresponding Java certificate object.

Sources:

- js/owrap.java.js:1628

<a id="api-ow-java-cipher-getcert4string-35fe731b"></a>

## ow.java.cipher.getCert4String

### ow.java.cipher.getCert4String(aString) : Java

Given a X509 certificate string will return the corresponding Java certificate object.

Sources:

- js/owrap.java.js:1610

<a id="api-ow-java-cipher-key2encode-8eb16dca"></a>

## ow.java.cipher.key2encode

### ow.java.cipher.key2encode(aKey) : String

Given aKey (from ow.java.cipher.readKey4File or genKeyPair) returns the base 64 corresponding encoded string.

Sources:

- js/owrap.java.js:1455

<a id="api-ow-java-cipher-msg2encode-117794d8"></a>

## ow.java.cipher.msg2encode

### ow.java.cipher.msg2encode(anEncryptedMessage) : String

Given anEncryptedMessage returns the base 64 encoded string.

Sources:

- js/owrap.java.js:1467

<a id="api-ow-java-cipher-readkey4file-f85d79bd"></a>

## ow.java.cipher.readKey4File

### ow.java.cipher.readKey4File(aFilename, isPrivate, anAlgorithm) : Key

Given a key file previously saved with ow.java.cipher.saveKey2File returns the Key object to use with other functions. If the aKey is private isPrivate must be true, if public is must be false. Optionally a key anAlgorithm can be provided (defaults to RSA).

Sources:

- js/owrap.java.js:1397

<a id="api-ow-java-cipher-readkey4stream-23da137e"></a>

## ow.java.cipher.readKey4Stream

### ow.java.cipher.readKey4Stream(aInputStream, isPrivate, anAlgorithm) : Key

Given a key on aInputStream previously saved with ow.java.cipher.saveKey2Stream returns the Key object to use with other functions. If the aKey is private isPrivate must be true, if public is must be false. Optionally a key anAlgorithm can be provided (defaults to RSA).

Sources:

- js/owrap.java.js:1424

<a id="api-ow-java-cipher-readkey4string-143dc597"></a>

## ow.java.cipher.readKey4String

### ow.java.cipher.readKey4String(aString, isPrivate, anAlgorithm) : Key

Given a key on aString previously saved with ow.java.cipher.saveKey2String returns the Key object to use with other functions. If the aKey is private isPrivate must be true, if public is must be false. Optionally a key anAlgorithm can be provided (defaults to RSA).

Sources:

- js/owrap.java.js:1411

<a id="api-ow-java-cipher-savekey2file-c8be4e37"></a>

## ow.java.cipher.saveKey2File

### ow.java.cipher.saveKey2File(aFilename, aKey, isPrivate, anAlgorithm)

Given a public or private aKey (from ow.java.cipher.readKey4File or genKeyPair) tries to save it to aFilename. If the aKey is private isPrivate must be true, if public is must be false. Optionally a key anAlgorithm can be provided (defaults to RSA).

Sources:

- js/owrap.java.js:1337

<a id="api-ow-java-cipher-savekey2stream-666350f4"></a>

## ow.java.cipher.saveKey2Stream

### ow.java.cipher.saveKey2Stream(aOutputStream, isPrivate, anAlgorithm) : String

Given a public or private aKey (from ow.java.cipher.readKey4File or genKeyPair) tries to return output to aOutputStream. If the aKey is private isPrivate must be true, if public is must be false. Optionally a key anAlgorithm can be provided (defaults to RSA).

Sources:

- js/owrap.java.js:1364

<a id="api-ow-java-cipher-savekey2string-f3123667"></a>

## ow.java.cipher.saveKey2String

### ow.java.cipher.saveKey2String(aKey, isPrivate, anAlgorithm) : String

Given a public or private aKey (from ow.java.cipher.readKey4File or genKeyPair) tries to return a string representation. If the aKey is private isPrivate must be true, if public is must be false. Optionally a key anAlgorithm can be provided (defaults to RSA).

Sources:

- js/owrap.java.js:1350

<a id="api-ow-java-cipher-sign-0917bda5"></a>

## ow.java.cipher.sign

### ow.java.cipher.sign(aPrivateKey, aInputStream, inBytes) : Object

Tries to sign the contents from aInputStream using aPrivateKey. Return the signature in an array of bytes or, if inBytes = true, has a base 64 encoded string.

Sources:

- js/owrap.java.js:1570

<a id="api-ow-java-cipher-symdecrypt-f98cdbf0"></a>

## ow.java.cipher.symDecrypt

### ow.java.cipher.symDecrypt(anEncryptedMessage, aKey) : ArrayBytes

Returns the decrypted anEncryptedMessage using aKey (used to encrypt with symEncrypt)

Sources:

- js/owrap.java.js:1225

<a id="api-ow-java-cipher-symencrypt-2c4ab497"></a>

## ow.java.cipher.symEncrypt

### ow.java.cipher.symEncrypt(aMessage, aKey) : ArrayBytes

Returns a symmetric encrypted aMessage using a previously generated aKey (using ow.java.cipher.symGenKey).

Sources:

- js/owrap.java.js:1206

<a id="api-ow-java-cipher-symgenkey-d81d2436"></a>

## ow.java.cipher.symGenKey

### ow.java.cipher.symGenKey(aSize) : ArrayBytes

Returns a generated symmetric key with aSize (defaults to aSize)

Sources:

- js/owrap.java.js:1193

<a id="api-ow-java-cipher-verify-149c445f"></a>

## ow.java.cipher.verify

### ow.java.cipher.verify(signatureToVerify, aPublicKey, aInputStream, isBytes) : boolean

Given aInputStream and aPublicKey will verify if the signatureToVerify is valid. Optionally isBytes = true  the signatureToVerify is an array of bytes instead of base 64 encoded.

Sources:

- js/owrap.java.js:1591

