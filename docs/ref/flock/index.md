# $flock

[Home](../index.md) / [All APIs](../all-apis.md) / [$flock](index.md)

<a id="api-flock-destroy-073875b2"></a>

## $flock.destroy

### $flock.destroy()

Given `aLockFile` will destroy the provided lock entry.

```javascript
$flock(aLockFile).destroy()
```

Sources:

- js/openaf.js:16576

<a id="api-flock-islocallocked-efef711b"></a>

## $flock.isLocalLocked

### $flock.isLocalLocked() : Boolean

Given `aLockFile` will return true if locked in the current OpenAF instance otherwise false (see also isLocked).

```javascript
$flock(aLockFile).isLocalLocked()
```

Sources:

- js/openaf.js:16542

<a id="api-flock-islocked-ad59e751"></a>

## $flock.isLocked

### $flock.isLocked() : Boolean

Given `aLockFile` will return true if locked in the current OpenAF instance or on the filesystem (by using `$flock.tryLock`) otherwise false (see also isLocalLocked).

```javascript
$flock(aLockFile).isLocked()
```

Sources:

- js/openaf.js:16561

<a id="api-flock-lock-fdc2ef5f"></a>

## $flock.lock

### $flock.lock()

Given `aLockFile` will use the file to filesystem lock until unlock is called.

```javascript
$flock(aLockFile).lock()
```

Sources:

- js/openaf.js:16495

<a id="api-flock-trylock-48fdfc41"></a>

## $flock.tryLock

### $flock.tryLock(aFunction) : Boolean

Given `aLockFile` only execute `aFunction` if it's unlocked. If it
executed `aFunction` it will return true otherwise false.

```javascript
$flock(aLockFile).tryLock(() => { ... })
```

Sources:

- js/openaf.js:16601

<a id="api-flock-unlock-81243d85"></a>

## $flock.unlock

### $flock.unlock()

Given `aLockFile` will unlock freeing any previous calls to lock.

```javascript
$flock(aLockFile).unlock()
```

Sources:

- js/openaf.js:16518

