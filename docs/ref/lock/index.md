# $lock

[Home](../index.md) / [All APIs](../all-apis.md) / [$lock](index.md)

<a id="api-lock-destroy-a77b29c8"></a>

## $lock.destroy

### $lock.destroy()

Given `aLockName` will destroy the provided lock entry.

```javascript
$lock(aLockName).destroy()
```

Sources:

- js/openaf.js:16938

<a id="api-lock-islocked-a3fa052b"></a>

## $lock.isLocked

### $lock.isLocked() : Boolean

Given `aLockName` will return true if locked otherwise false.

```javascript
$lock(aLockName).isLocked()
```

Sources:

- js/openaf.js:16925

<a id="api-lock-lock-10a25e42"></a>

## $lock.lock

### $lock.lock()

Given `aLockName` will lock until unlock is called.

```javascript
$lock(aLockName).lock()
```

Sources:

- js/openaf.js:16899

<a id="api-lock-trylock-03a2f2c2"></a>

## $lock.tryLock

### $lock.tryLock(aFunction, aTimeoutMS) : Boolean

Given `aLockName` only execute `aFunction` when it's able to lock or after `aTimeoutMS`. If it
executed `aFunction` it will return true otherwise false.

```javascript
$lock(aLockName).tryLock(() => { ... })
```

Sources:

- js/openaf.js:16955

<a id="api-lock-unlock-a38ce8ca"></a>

## $lock.unlock

### $lock.unlock()

Given `aLockName` will unlock freeing any previous calls to lock.

```javascript
$lock(aLockName).unlock()
```

Sources:

- js/openaf.js:16912

