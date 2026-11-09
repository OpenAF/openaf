# ow.obj.syncArray

[Home](../../../index.md) / [All APIs](../../../all-apis.md) / [ow](../../index.md) / [ow.obj](../index.md) / [ow.obj.syncArray](index.md)

<a id="api-ow-obj-syncarray-add-a118efda"></a>

## ow.obj.syncArray.add

### ow.obj.syncArray.add(aObject, aPosition) : boolean

Adds aObject to the internal array/list. If aPosition is provided it will be added at that position, otherwise it will be added at the end.

Sources:

- js/owrap.obj.js:3667

<a id="api-ow-obj-syncarray-addall-c9dde818"></a>

## ow.obj.syncArray.addAll

### ow.obj.syncArray.addAll(anArray, aPosition)

Concatenates anArray with the internal array/list. If aPosition is provided it will be added at that position, otherwise it will be added at the end.

Sources:

- js/owrap.obj.js:3681

<a id="api-ow-obj-syncarray-clear-3920852e"></a>

## ow.obj.syncArray.clear

### ow.obj.syncArray.clear()

Clears the internal array/list.

Sources:

- js/owrap.obj.js:3782

<a id="api-ow-obj-syncarray-foreach-11e26d37"></a>

## ow.obj.syncArray.forEach

### ow.obj.syncArray.forEach(aFunction)

Executes aFunction for each element in the internal array/list. The function should have the signature function(value).

Sources:

- js/owrap.obj.js:3802

<a id="api-ow-obj-syncarray-get-54ec6027"></a>

## ow.obj.syncArray.get

### ow.obj.syncArray.get(aIndex) : Object

Returns the object on the internal array/list on position aIndex.

Sources:

- js/owrap.obj.js:3752

<a id="api-ow-obj-syncarray-getjavaobject-0c47de3f"></a>

## ow.obj.syncArray.getJavaObject

### ow.obj.syncArray.getJavaObject() : Object

Returns the internal java object.

Sources:

- js/owrap.obj.js:3646

<a id="api-ow-obj-syncarray-getunsafejavaobject-3a5ff888"></a>

## ow.obj.syncArray.getUnsafeJavaObject

### ow.obj.syncArray.getUnsafeJavaObject() : Object

Returns the internal java object without synchronization. Use with care&#33; This is useful when you want to use the internal java object directly without the overhead of synchronization.

Sources:

- js/owrap.obj.js:3656

<a id="api-ow-obj-syncarray-indexof-29b8029f"></a>

## ow.obj.syncArray.indexOf

### ow.obj.syncArray.indexOf(aObject) : Number

Returns the position of aObject in the internal array/list.

Sources:

- js/owrap.obj.js:3792

<a id="api-ow-obj-syncarray-isempty-67f0ac1e"></a>

## ow.obj.syncArray.isEmpty

### ow.obj.syncArray.isEmpty() : boolean

Returns true if the internal array/list is empty.

Sources:

- js/owrap.obj.js:3726

<a id="api-ow-obj-syncarray-length-a14947ee"></a>

## ow.obj.syncArray.length

### ow.obj.syncArray.length() : Number

Returns the current size of the internal array/list.

Sources:

- js/owrap.obj.js:3706

<a id="api-ow-obj-syncarray-remove-6547795a"></a>

## ow.obj.syncArray.remove

### ow.obj.syncArray.remove(aIndex) : boolean

Removes the element at aIndex from the internal array/list.

Sources:

- js/owrap.obj.js:3762

<a id="api-ow-obj-syncarray-set-84f396cb"></a>

## ow.obj.syncArray.set

### ow.obj.syncArray.set(aIndex, aObject) : Object

Sets aObject overwriting the previous value at aIndex on the internal array/list.

Sources:

- js/owrap.obj.js:3772

<a id="api-ow-obj-syncarray-sublist-c8e370f6"></a>

## ow.obj.syncArray.subList

### ow.obj.syncArray.subList(aStart, aEnd) : Array

Returns a sublist of the internal array/list from aStart to aEnd (exclusive). If aStart or aEnd are out of bounds it will throw an exception. The returned array will be a new array with the elements from aStart to aEnd.

Sources:

- js/owrap.obj.js:3736

<a id="api-ow-obj-syncarray-toarray-73643c0a"></a>

## ow.obj.syncArray.toArray

### ow.obj.syncArray.toArray() : Array

Returns the internal array/list as a javascript array.

Sources:

- js/owrap.obj.js:3696

<a id="api-ow-obj-syncarray-trimtosize-7e597181"></a>

## ow.obj.syncArray.trimToSize

### ow.obj.syncArray.trimToSize()

Trims the internal array/list to its current size.

Sources:

- js/owrap.obj.js:3716

