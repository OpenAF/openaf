# $sec

[Home](../index.md) / [All APIs](../all-apis.md) / [$sec](index.md)

<a id="api-sec-sec-1db0acf9"></a>

## $sec.$sec

### $sec.$sec(aRepo, dBucket, dLockSecret, aMainSecret, aFile) : $sec

Shortcut for acessing ow.sec.SBuckets given aMainSecret and, optionally, aRepo. A default dBucket and the corresponding dLockSecret can be provided.

Sources:

- js/owrap.sec.js:71

<a id="api-sec-close-fd77b004"></a>

## $sec.close

### $sec.close() : Object

Close the current repository.

Sources:

- js/owrap.sec.js:232

<a id="api-sec-encskey-8903ed55"></a>

## $sec.encSKey

### $sec.encSKey(aKey) : String

Given `aKey` will return the encrypted version of it with the current main secret for the repo.

Example:

```javascript
$sec("test", "b1", $sec("test", __, __, "Password123").encSKey("Password1"), "Password123", "test.yml").set("mysecret", { l:"l", p:"p" })
// ...
$sec("test", "b1", $sec("test", __, __, "Password123").encSKey("Password1"), "Password123", "test.yml").get("mysecret")
```

Sources:

- js/owrap.sec.js:268

<a id="api-sec-get-b4393ee0"></a>

## $sec.get

### $sec.get(aKey, aBucket, aLockSecret) : Object

Retrieves the secret object/string for aKey. Optionally you can provide a specific aBucket and the corresponding aLockSecret.

Sources:

- js/owrap.sec.js:117

<a id="api-sec-getbucket-c9c4ff3a"></a>

## $sec.getBucket

### $sec.getBucket(aBucket, aLockSecret) : String

Retrieves a encrypted SBucket string to be transported to another SBucket repo.  Optionally you can provide a specific aBucket and the corresponding aLockSecret.

Sources:

- js/owrap.sec.js:242

<a id="api-sec-getfn-19da6888"></a>

## $sec.getFn

### $sec.getFn(aKey, aExtraArgs, aBucket, aLockSecret) : Object

Invokes a function using the secret arguments for aKey with non-secret aExtraArgs map (arguments should have the same name as the function help parameters). Optionally you can provide a specific aBucket and the corresponding aLockSecret.

Sources:

- js/owrap.sec.js:144

<a id="api-sec-getobj-ea598d86"></a>

## $sec.getObj

### $sec.getObj(aKey, aExtraArgs, aBucket, aLockSecret) : Object

Creates a new instance of an object using the secret arguments for aKey with non-secret aExtraArgs map (arguments should have the same name as the constructor help parameters). Optionally you can provide a specific aBucket and the corresponding aLockSecret.

Sources:

- js/owrap.sec.js:130

<a id="api-sec-list-ee524da8"></a>

## $sec.list

### $sec.list(aBucket, aLockSecret) : Array

Returns a map with a list of all the sBuckets on the current repo. If a specifc sBucket and aLockSecret isn't provide the current sBucket will have an associated array with the list of corresponding keys.

Sources:

- js/owrap.sec.js:103

<a id="api-sec-procmap-c7db00e7"></a>

## $sec.procMap

### $sec.procMap(aMap, aPath) : Map

Given `aMap` will process it and replace any secKey with the corresponding secret. Optionally you can provide `aPath` to
process only a specific path of the map.

`secKey`, `secRepo`, `secBucket`, `secPass`, `secMainPass`, `secFile`

Sources:

- js/owrap.sec.js:287

<a id="api-sec-set-f375d294"></a>

## $sec.set

### $sec.set(aKey, aObj, aBucket, aLockSecret) : Object

Sets the secret aObj map/string associating it with aKey. Optionally you can provide a specific aBucket and the corresponding aLockSecret.

Sources:

- js/owrap.sec.js:158

<a id="api-sec-setbucket-882b1457"></a>

## $sec.setBucket

### $sec.setBucket(aBucketString, aBucket, aLockSecret) : String

Sets an encrypted SBucket string transported from another SBucket repo (the aLockSecret should be equal) Optionally you can provide a specific aBucket and the corresponding aLockSecret.

Sources:

- js/owrap.sec.js:255

<a id="api-sec-setfn-1dd7e7b9"></a>

## $sec.setFn

### $sec.setFn(aKey, aFn, aArgs, aBucket, aLockSecret) : Object

Sets secret aArgs (map with the arguments names on the aFn help)) for calling aFn (string). Optionally you can provide a specific aBucket and the corresponding aLockSecret.

Sources:

- js/owrap.sec.js:185

<a id="api-sec-setobj-57fa0741"></a>

## $sec.setObj

### $sec.setObj(aKey, aObj, aArgs, aBucket, aLockSecret) : Object

Sets secret aArgs (map with the arguments names on the aObj constructor help)) for constructing aObj (string). Optionally you can provide a specific aBucket and the corresponding aLockSecret.

Sources:

- js/owrap.sec.js:171

<a id="api-sec-unset-9d957978"></a>

## $sec.unset

### $sec.unset(aKey, aBucket, aLockSecret) : Object

Unsets aKey for a SBucket. Optionally you can provide a specific aBucket and the corresponding aLockSecret.

Sources:

- js/owrap.sec.js:199

<a id="api-sec-unsetbucket-9fd37329"></a>

## $sec.unsetBucket

### $sec.unsetBucket(aBucket)

Unsets aBucket from the current repo.

Sources:

- js/owrap.sec.js:212

<a id="api-sec-unsetrepo-0eb8f107"></a>

## $sec.unsetRepo

### $sec.unsetRepo()

Unsets the current repo.

Sources:

- js/owrap.sec.js:222

