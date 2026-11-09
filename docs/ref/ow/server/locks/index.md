# ow.server.locks

[Home](../../../index.md) / [All APIs](../../../all-apis.md) / [ow](../../index.md) / [ow.server](../index.md) / [ow.server.locks](index.md)

<a id="api-ow-server-locks-clear-92766863"></a>

## ow.server.locks.clear

### ow.server.locks.clear(aLockName)

Clears an existing aLockName. Note: This might also unlock an inuse lock.

Sources:

- js/owrap.server.js:1454

<a id="api-ow-server-locks-extendtimeout-0587b494"></a>

## ow.server.locks.extendTimeout

### ow.server.locks.extendTimeout(aLockName, aTryTimeout) : Objet

Tries to extend the lock timeout (or adds a timeout if doesn't exist) with aTryTimeout for aLockName.

Sources:

- js/owrap.server.js:1403

<a id="api-ow-server-locks-islocked-7ac097d7"></a>

## ow.server.locks.isLocked

### ow.server.locks.isLocked(aLockName) : Map

Returns the lock record; its value property indicates whether the lock is held. Storage errors propagate to the caller.

Sources:

- js/owrap.server.js:1311

<a id="api-ow-server-locks-lock-06a09a28"></a>

## ow.server.locks.lock

### ow.server.locks.lock(aLockName, aTryTimeout, aNumRetries, aLockTimeout) : boolean

Locks the lock aLockName optionally using a specific aTryTimeout and aNumRetries instead of the defaults ones (see ow.server.locks.setTryTimeout and ow.server.locks.setRetries). A aLockTimeout can optionally be provided after which the lock will expire. If successfull in locking returns true, otherwiser returns false.

Sources:

- js/owrap.server.js:1335

<a id="api-ow-server-locks-setretries-deca98f3"></a>

## ow.server.locks.setRetries

### ow.server.locks.setRetries(aNumber)

Sets the number of tries for checking if a lock is free waiting a specific time on each (see ow.server.locks.setRetries). Defaults to 5.

Sources:

- js/owrap.server.js:1300

<a id="api-ow-server-locks-settrytimeout-a30d5fda"></a>

## ow.server.locks.setTryTimeout

### ow.server.locks.setTryTimeout(aTimeout)

Sets the default wait time (in ms) for each try (see ow.server.locks.setRetries) checking if a lock is free. Defaults to 500 ms.

Sources:

- js/owrap.server.js:1289

<a id="api-ow-server-locks-unlock-91313c9b"></a>

## ow.server.locks.unlock

### ow.server.locks.unlock(aLockName)

Tries to unlock aLockName.

Sources:

- js/owrap.server.js:1429

<a id="api-ow-server-locks-whenunlocked-b579225e"></a>

## ow.server.locks.whenUnLocked

### ow.server.locks.whenUnLocked(aLockName, aFunction, aTryTimeout, aNumRetries) : boolean

A wrapper for ow.server.locks.lock that will try to lock aLockName, execute the provide function and then unlock it even in case an exception is raised. Returns if the lock was successfull (true) or not (false).

Sources:

- js/owrap.server.js:1465

