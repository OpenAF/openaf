# ow.sec.SBucket

[Home](../../../index.md) / [All APIs](../../../all-apis.md) / [ow](../../index.md) / [ow.sec](../index.md) / [ow.sec.SBucket](index.md)

<a id="api-ow-sec-sbucket-sbucket-b524384d"></a>

## ow.sec.SBucket.SBucket

### ow.sec.SBucket.SBucket(aCh, aMainSecret, sBucket, aLockSecret) : sbucket

Creates a set of sbuckets on aCh using aMainSecret.  Defaults, if provided, to sBucket and aLockSecret.

Sources:

- js/owrap.sec.js:400

<a id="api-ow-sec-sbucket-createbucket-61a729cc"></a>

## ow.sec.SBucket.createBucket

### ow.sec.SBucket.createBucket(sBucket, aLockSecret)

Creates a sbucket with a specific aLockSecret.

Sources:

- js/owrap.sec.js:572

<a id="api-ow-sec-sbucket-destroybucket-c9d3ba0a"></a>

## ow.sec.SBucket.destroyBucket

### ow.sec.SBucket.destroyBucket(sBucket)

Destroys a sBucket.

Sources:

- js/owrap.sec.js:590

<a id="api-ow-sec-sbucket-getbucket-8ff02f58"></a>

## ow.sec.SBucket.getBucket

### ow.sec.SBucket.getBucket(sBucket, aLockSecret) : String

Given a sbucket and aLockSecret retrieves a string representation of the sbucket.

Sources:

- js/owrap.sec.js:678

<a id="api-ow-sec-sbucket-getkeys-495c0af9"></a>

## ow.sec.SBucket.getKeys

### ow.sec.SBucket.getKeys(sBucket, aLockSecret, aKey) : Map

Returns a map with a list of all the sBuckets on the current repo. If a specifc sBucket and aLockSecret isn't provide the current sBucket will have an associated array with the list of corresponding keys.

Sources:

- js/owrap.sec.js:498

<a id="api-ow-sec-sbucket-getnewfn-38df2dde"></a>

## ow.sec.SBucket.getNewFn

### ow.sec.SBucket.getNewFn(sBucket, aLockSecret, aKey, defaultArgs)

For the sBucket with aLockSecret will invoke a function and set arguments using aKey.

Sources:

- js/owrap.sec.js:825

<a id="api-ow-sec-sbucket-getnewobj-7c836371"></a>

## ow.sec.SBucket.getNewObj

### ow.sec.SBucket.getNewObj(sBucket, aLockSecret, aKey, defaultArgs)

For the sBucket with aLockSecret create an object with the arguments in aKey.

Sources:

- js/owrap.sec.js:758

<a id="api-ow-sec-sbucket-getsbucket-34aedd39"></a>

## ow.sec.SBucket.getSBucket

### ow.sec.SBucket.getSBucket() : String

Returns a string representation of the sbucket.

Sources:

- js/owrap.sec.js:697

<a id="api-ow-sec-sbucket-getsnewfn-cd813b26"></a>

## ow.sec.SBucket.getSNewFn

### ow.sec.SBucket.getSNewFn(Key)

Will invoke a function and set arguments using aKey.

Sources:

- js/owrap.sec.js:851

<a id="api-ow-sec-sbucket-getsnewobj-9589bb03"></a>

## ow.sec.SBucket.getSNewObj

### ow.sec.SBucket.getSNewObj(aKey)

Create an object with the arguments in aKey.

Sources:

- js/owrap.sec.js:792

<a id="api-ow-sec-sbucket-getssecret-282167f4"></a>

## ow.sec.SBucket.getSSecret

### ow.sec.SBucket.getSSecret(aKey) : Map

Returns the associated aKey value.

Sources:

- js/owrap.sec.js:529

<a id="api-ow-sec-sbucket-getssecretas-60129e06"></a>

## ow.sec.SBucket.getSSecretAs

### ow.sec.SBucket.getSSecretAs(aEncryptKey, aKey) : Map

Returns the associated aKey encrypted with aEncryptKey.

Sources:

- js/owrap.sec.js:562

<a id="api-ow-sec-sbucket-getsecret-03120b31"></a>

## ow.sec.SBucket.getSecret

### ow.sec.SBucket.getSecret(sBucket, aLockSecret, aKey) : Map

Given a sbucket and a specific aLockSecret will return the associated aKey.

Sources:

- js/owrap.sec.js:473

<a id="api-ow-sec-sbucket-getsecretas-22f45020"></a>

## ow.sec.SBucket.getSecretAs

### ow.sec.SBucket.getSecretAs(sBucket, aLockSecret, aEncryptKey, aKey) : Map

Given a sbucket and a specific aLockSecret will return the associated aKey encrypted with aEncryptKey.

Sources:

- js/owrap.sec.js:539

<a id="api-ow-sec-sbucket-setbucket-0e6a365b"></a>

## ow.sec.SBucket.setBucket

### ow.sec.SBucket.setBucket(sBucket, aLockSecret, aBucketString)

Given a sbucket, aLockSecret will set the sbucket to the provided aBucketString.

Sources:

- js/owrap.sec.js:707

<a id="api-ow-sec-sbucket-setnewfn-329eca45"></a>

## ow.sec.SBucket.setNewFn

### ow.sec.SBucket.setNewFn(sBucket, aLockSecret, aKey, aFn, args)

For the sBucket with aLockSecret will set aKey to use aFn with the arguments map ($fnDev4Help).

Sources:

- js/owrap.sec.js:802

<a id="api-ow-sec-sbucket-setnewobj-7388e710"></a>

## ow.sec.SBucket.setNewObj

### ow.sec.SBucket.setNewObj(sBucket, aLockSecret, aKey, aObject, args)

For the sBucket with aLockSecret will set aKey to create aObject with the arguments map ($fnDev4Help).

Sources:

- js/owrap.sec.js:735

<a id="api-ow-sec-sbucket-setsbucket-0cc21c09"></a>

## ow.sec.SBucket.setSBucket

### ow.sec.SBucket.setSBucket(aBucketString)

Set the current sbucket to the provided aBucketString.

Sources:

- js/owrap.sec.js:725

<a id="api-ow-sec-sbucket-setsnewfn-57733620"></a>

## ow.sec.SBucket.setSNewFn

### ow.sec.SBucket.setSNewFn(aKey, aFn, args)

For the sBucket with aLockSecret will set aKey to use aFn with the arguments map ($fnDev4Help).

Sources:

- js/owrap.sec.js:815

<a id="api-ow-sec-sbucket-setsnewobj-30461a82"></a>

## ow.sec.SBucket.setSNewObj

### ow.sec.SBucket.setSNewObj(aKey, aObject, args)

Will set aKey to create aObject with the arguments map ($fnDev4Help).

Sources:

- js/owrap.sec.js:748

<a id="api-ow-sec-sbucket-setssecret-a4ee33e4"></a>

## ow.sec.SBucket.setSSecret

### ow.sec.SBucket.setSSecret(aKey, aObj)

Sets aKey to aObj (string or map)

Sources:

- js/owrap.sec.js:630

<a id="api-ow-sec-sbucket-setsecret-d7d1624a"></a>

## ow.sec.SBucket.setSecret

### ow.sec.SBucket.setSecret(sBucket, aLockSecret, aKey, aObj)

Given a sbucket and aLockSecret will set aKey to aObj (string or map)

Sources:

- js/owrap.sec.js:602

<a id="api-ow-sec-sbucket-unsetssecret-5866f3a3"></a>

## ow.sec.SBucket.unsetSSecret

### ow.sec.SBucket.unsetSSecret(aKey)

Unsets aKey.

Sources:

- js/owrap.sec.js:668

<a id="api-ow-sec-sbucket-unsetsecret-2ea79be2"></a>

## ow.sec.SBucket.unsetSecret

### ow.sec.SBucket.unsetSecret(sBucket, aLockSecret, aKey)

Given a sbucket and aLockSecret will unset aKey.

Sources:

- js/owrap.sec.js:640

