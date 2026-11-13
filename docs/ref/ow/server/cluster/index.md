# ow.server.cluster

[Home](../../../index.md) / [All APIs](../../../all-apis.md) / [ow](../../index.md) / [ow.server](../index.md) / [ow.server.cluster](index.md)

<a id="api-ow-server-cluster-all-dbfda344"></a>

## ow.server.cluster.all

### ow.server.cluster.all(aFunction, includeMe) : Object

Tries to execute aFunction providing a map with all of the cluster list host + port. If the aFunction throws an exception another cluster will be used. If no cluster could be used an exception is thrown. Optionally includeMe = true enables executing on the current cluster node itself. If succcessfully returns whatever the aFunction returns.

Sources:

- js/owrap.server.js:2611

<a id="api-ow-server-cluster-any-bc21ca9d"></a>

## ow.server.cluster.any

### ow.server.cluster.any(aFunction, includeMe) : Object

Tries to execute aFunction providing a map with one of the cluster list host + port. If the aFunction throws an exception another cluster will be used. If no cluster could be used an exception is thrown. Optionally includeMe = true enables executing on the current cluster node itself. If succcessfully returns whatever the aFunction returns.

Sources:

- js/owrap.server.js:2582

<a id="api-ow-server-cluster-canlock-99a1e92c"></a>

## ow.server.cluster.canLock

### ow.server.cluster.canLock(aLockName) : boolean

Sends messages to all other cluster nodes to reach quorum if can lock aLockName or not. Returns true if yes.

Sources:

- js/owrap.server.js:2657

<a id="api-ow-server-cluster-canunlock-15208c52"></a>

## ow.server.cluster.canUnLock

### ow.server.cluster.canUnLock(aLockName) : boolean

Sends messages to all other cluster nodes to reach quorum if can unlock aLockName or not. Returns true if yes.

Sources:

- js/owrap.server.js:2667

<a id="api-ow-server-cluster-checkin-4c33438e"></a>

## ow.server.cluster.checkIn

### ow.server.cluster.checkIn()

Checks in the current cluster node.

Sources:

- js/owrap.server.js:2750

<a id="api-ow-server-cluster-checkout-4ea003f5"></a>

## ow.server.cluster.checkOut

### ow.server.cluster.checkOut()

Checks out the current cluster node.

Sources:

- js/owrap.server.js:2767

<a id="api-ow-server-cluster-locks-f2d11a36"></a>

## ow.server.cluster.locks

### ow.server.cluster.locks() : owServerLocks

Returns the current cluster node ow.server.locks instance.

Sources:

- js/owrap.server.js:2677

<a id="api-ow-server-cluster-sendmsg-1e3f2ba0"></a>

## ow.server.cluster.sendMsg

### ow.server.cluster.sendMsg(aHostMap, aMessageMap)

Sends aMessageMap to a specific aHostMap (map composed of a host and a port) or to all cluster nodes if aHostMap = "all". The aMessageMap should contain a "t" key for message topic. The topics "l", "u", "cl", "dl", "cu" and "du" are reserved for cluster lock management.

Sources:

- js/owrap.server.js:2634

<a id="api-ow-server-cluster-sendtoothers-7f8806b7"></a>

## ow.server.cluster.sendToOthers

### ow.server.cluster.sendToOthers(aData, aSendToOtherFn) : Object

Tries to send to another cluster node aData using aSendToOtherFn that receives, as parameter, a aData and a Map with HOST and PORT of another cluster node to try. In case of failure the function should throw an exception in case of success the function should return an object that will be returned. If no result can be obtained an object with result: 0 will be returned.

Sources:

- js/owrap.server.js:2556

<a id="api-ow-server-cluster-setmsghandler-24c6ec34"></a>

## ow.server.cluster.setMsgHandler

### ow.server.cluster.setMsgHandler(aMessageTopic, aHandlerFunction)

Sets aHandlerFunction to be called whenever the current node receives a message with aMessageTopic. The aHandlerFunction  receives the implementation options and the message.

Sources:

- js/owrap.server.js:2646

<a id="api-ow-server-cluster-verify-2fe72b92"></a>

## ow.server.cluster.verify

### ow.server.cluster.verify(addNewHostMap, delHostMap, customLoad)

Verifies if all cluster nodes ports are reachable and updates the cluster file. If a cluster node is not reachable it will try to a specific number of times after timing out on a specific timeout (see default values in help ow.server.cluster).

Sources:

- js/owrap.server.js:2698

<a id="api-ow-server-cluster-whenunlocked-a0a4e196"></a>

## ow.server.cluster.whenUnLocked

### ow.server.cluster.whenUnLocked(aLockName, aFn, aTryTimeout, aNumRetries) : boolean

A wrapper for ow.server.locks.lock that will try to lock aLockName after check in the cluster if it can be locked, execute the provide function and then unlock it even in case an exception is raised. Returns if the lock was successfull (true) or not (false).

Sources:

- js/owrap.server.js:2687

