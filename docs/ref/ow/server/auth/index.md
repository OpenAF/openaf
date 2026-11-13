# ow.server.auth

[Home](../../../index.md) / [All APIs](../../../all-apis.md) / [ow](../../index.md) / [ow.server](../index.md) / [ow.server.auth](index.md)

<a id="api-ow-server-auth-add-75dd18f1"></a>

## ow.server.auth.add

### ow.server.auth.add(aUser, aPass, aKey)

Adds the aUser and aPass to the current authentication list. Optionally a 2FA aKey.

Sources:

- js/owrap.server.js:548

<a id="api-ow-server-auth-check-3b944cf7"></a>

## ow.server.auth.check

### ow.server.auth.check(aUser, aPass) : boolean

Checks if the aUser and aPass provided are authenticated with the current internal list (returns true) or not (returns false). If a 2FA authentication was provided the token should be suffix to the password.

Sources:

- js/owrap.server.js:633

<a id="api-ow-server-auth-del-e91379b3"></a>

## ow.server.auth.del

### ow.server.auth.del(aUser)

Removes the aUSer from the current authentication list.

Sources:

- js/owrap.server.js:587

<a id="api-ow-server-auth-dump-30e05909"></a>

## ow.server.auth.dump

### ow.server.auth.dump() : Map

Dumps the current authentication list into a Map.

Sources:

- js/owrap.server.js:528

<a id="api-ow-server-auth-dumpencrypt-53f5cbea"></a>

## ow.server.auth.dumpEncrypt

### ow.server.auth.dumpEncrypt(aKey) : Map

Dumps the current authentication list into an encrypted string (optionally using an encryption aKey).

Sources:

- js/owrap.server.js:538

<a id="api-ow-server-auth-getextra-fadb1a20"></a>

## ow.server.auth.getExtra

### ow.server.auth.getExtra(aUser) : Object

Gets the extra object associated with aUser (previously set with ow.server.auth.setExtra).

Sources:

- js/owrap.server.js:575

<a id="api-ow-server-auth-initialize-d0d6c760"></a>

## ow.server.auth.initialize

### ow.server.auth.initialize(aPreviousDumpMap, aKey, aCustomFunc)

Initializes with a previous dump from ow.server.auth.dump or ow.server.auth.dumpEncrypt (including an optional aKey if used). Optionally aCustomFunc can be provided as a custom authentication function that receives the provided user and password and should return true if authenticated or false otherwise.

Sources:

- js/owrap.server.js:510

<a id="api-ow-server-auth-is2fa-65d8d636"></a>

## ow.server.auth.is2FA

### ow.server.auth.is2FA(aUser) : boolean

Returns true if aUser has 2FA authentication, false otherwise.

Sources:

- js/owrap.server.js:599

<a id="api-ow-server-auth-islocked-687b6e1f"></a>

## ow.server.auth.isLocked

### ow.server.auth.isLocked(aUser) : boolean

For a given aUser returns if the user is currently considered as lock or not.

Sources:

- js/owrap.server.js:498

<a id="api-ow-server-auth-loadfile-71a90204"></a>

## ow.server.auth.loadFile

### ow.server.auth.loadFile(aFile, aKey)

Loads aFile (previously saved with ow.server.auth.saveFile), optionally providing aKey, (re)initializing  the current authentication information.

Sources:

- js/owrap.server.js:611

<a id="api-ow-server-auth-savefile-5b23fc2c"></a>

## ow.server.auth.saveFile

### ow.server.auth.saveFile(aFile, aKey)

Saves into aFile, optionally providing aKey, the current authentication information. You can use ow.server.auth.loadFile later to reload this info.

Sources:

- js/owrap.server.js:622

<a id="api-ow-server-auth-setcustomfunction-c3970426"></a>

## ow.server.auth.setCustomFunction

### ow.server.auth.setCustomFunction(aCustomFunction)

Sets a custom authentication function that receives the provided user and password and should return true if authenticated or false otherwise.

Sources:

- js/owrap.server.js:465

<a id="api-ow-server-auth-setextra-69ef19bb"></a>

## ow.server.auth.setExtra

### ow.server.auth.setExtra(aUser, aX)

Sets an extra object (aX) to be associated with aUser (for example, the correspondings permissions). You can later retrieve this extra object with ow.server.auth.getExtra.

Sources:

- js/owrap.server.js:561

<a id="api-ow-server-auth-setlocktimeout-e5f7809f"></a>

## ow.server.auth.setLockTimeout

### ow.server.auth.setLockTimeout(aTimeout)

Set the current lock timeout in seconds. Defaults to 15 minutes.

Sources:

- js/owrap.server.js:478

<a id="api-ow-server-auth-settriestolock-35a75456"></a>

## ow.server.auth.setTriesToLock

### ow.server.auth.setTriesToLock(numberOfTries)

Set the current number of wrong tries until a user is locked. Defaults to 3.

Sources:

- js/owrap.server.js:488

