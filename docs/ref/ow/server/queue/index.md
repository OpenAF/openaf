# ow.server.queue

[Home](../../../index.md) / [All APIs](../../../all-apis.md) / [ow](../../index.md) / [ow.server](../index.md) / [ow.server.queue](index.md)

<a id="api-ow-server-queue-delete-563d622e"></a>

## ow.server.queue.delete

### ow.server.queue.delete(aId)

Tries to delete a queue unique entry identified by aId.

Sources:

- js/owrap.server.js:1629

<a id="api-ow-server-queue-increasevisibility-7520fef5"></a>

## ow.server.queue.increaseVisibility

### ow.server.queue.increaseVisibility(aId, aVisibilityTime)

Tries to set the visibility of a queue aId to now + aVisibilityTime ms. Note: the queue aId should have been already received previously with a specific visibility time.

Sources:

- js/owrap.server.js:1554

<a id="api-ow-server-queue-purge-33ed4a91"></a>

## ow.server.queue.purge

### ow.server.queue.purge()

Tries to delete all queue entries.

Sources:

- js/owrap.server.js:1651

<a id="api-ow-server-queue-receive-fad92025"></a>

## ow.server.queue.receive

### ow.server.queue.receive(aVisibilityTime, aWaitTime, aPoolTime) : Map

Tries to return an object from the queue within a map composed of two entries: idx (the unique index on the queue) and obj (the object/map queued). If aVisibilityTime is defined, the returned entry identified by idx will be returned to the queue if ow.server.queue.delete is not used within aVisibilityTime defined in ms. Optionally you can also provide aWaitTime for how much to wait for an entry to be available on the queue (defaults to 2,5 seconds) and aPoolTime (defaults to 50ms) of queue pooling interval.

Sources:

- js/owrap.server.js:1603

<a id="api-ow-server-queue-send-dcac8853"></a>

## ow.server.queue.send

### ow.server.queue.send(aObject, aId, aTTL, aPriority) : Object

Sends aObject (map) to the queue. Optionally a specific unique aId can be provided and/or aTTL (time to live) for the object in the queue in ms. Optionally aPriority can be provided and will be prefixed to aId. The final unique aId will be returned and used as the sorting based for returning objects from the queue (the lowest first).

Sources:

- js/owrap.server.js:1580

<a id="api-ow-server-queue-size-78c77738"></a>

## ow.server.queue.size

### ow.server.queue.size() : Number

Tries to return an estimative of the current queue size.

Sources:

- js/owrap.server.js:1641

