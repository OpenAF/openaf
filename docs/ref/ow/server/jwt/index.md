# ow.server.jwt

[Home](../../../index.md) / [All APIs](../../../all-apis.md) / [ow](../../index.md) / [ow.server](../index.md) / [ow.server.jwt](index.md)

<a id="api-ow-server-jwt-decode-32257ef9"></a>

## ow.server.jwt.decode

### ow.server.jwt.decode(aToken) : Map

Tries to decode the JWT aToken provided.

Sources:

- js/owrap.server.js:5167

<a id="api-ow-server-jwt-genkey-038400cc"></a>

## ow.server.jwt.genKey

### ow.server.jwt.genKey(aAlgorithm) : JavaObject

Generates a key for the provided aAlgorithm (defaults to HS256). If aAlgorithm is not HS256, HS384 or HS512 the generated object will be a key pair for which you will need to user .getPrivate() for signing and .getPublic() for verify. Possible algorithms: HS256, HS384, HS512, ES256, ES384, ES512, RS256, RS384, RS512, PS256 (java &#62;= 11), PS384 (java &#62;= 11), PS512 (java &#62;= 11)

Sources:

- js/owrap.server.js:5012

<a id="api-ow-server-jwt-sign-01fc276a"></a>

## ow.server.jwt.sign

### ow.server.jwt.sign(aKey, aData) : String

Signs a JWT using `aKey` (either a string or java.security.Key) returning the corresponding encoded JWT. To
add specific claims use `aData` map where you can add custom headers and/or custom claims or used the standard fields.
Expected keys for `aData`:

- `audience` (String)
- `claims` (Map)
- `expiration` (Date)
- `headers` (Map)
- `issuer` (String)
- `id` (String)
- `issuedAt` (Date)
- `issuer` (String)
- `notBefore` (Date)
- `subject` (String)

Sources:

- js/owrap.server.js:5104

<a id="api-ow-server-jwt-verify-ba4a1f75"></a>

## ow.server.jwt.verify

### ow.server.jwt.verify(aSecret1, aToken) : Map

Verifies the JWT provided with aToken using aSecret1 (key (either a string or java.security.Key)). Returns the converted json headers and claims. If any verification fails it will throw a JavaException.

Sources:

- js/owrap.server.js:5049

