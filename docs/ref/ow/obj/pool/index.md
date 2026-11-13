# ow.obj.pool

[Home](../../../index.md) / [All APIs](../../../all-apis.md) / [ow](../../index.md) / [ow.obj](../index.md) / [ow.obj.pool](index.md)

<a id="api-ow-obj-pool-af-8becfe2e"></a>

## ow.obj.pool.AF

### ow.obj.pool.AF(url, timeout, conTimeout, dontUseTransaction)

Creates a pool setting with ow.obj.pool.setFactoryAF.

Sources:

- js/owrap.obj.js:1229

<a id="api-ow-obj-pool-db-ea5f478b"></a>

## ow.obj.pool.DB

### ow.obj.pool.DB(driver, url, login, pass, keepAliveFn, timeout)

Creates a pool setting with ow.obj.pool.setFactoryDB.

Sources:

- js/owrap.obj.js:1237

<a id="api-ow-obj-pool-raiddb-a110886f"></a>

## ow.obj.pool.RAIDDB

### ow.obj.pool.RAIDDB(aAF, con, keepAlive, url, pass, useCIR, driver)

Creates a pool setting with ow.obj.pool.setFactoryRAIDDB.

Sources:

- js/owrap.obj.js:1233

<a id="api-ow-obj-pool-ssh-ccad13f0"></a>

## ow.obj.pool.SSH

### ow.obj.pool.SSH(host, port, login, pass, idkey, withCompression)

Creates a pool setting with ow.obj.pool.setFactorySSH.

Sources:

- js/owrap.obj.js:1241

<a id="api-ow-obj-pool-add-cafaa174"></a>

## ow.obj.pool.add

### ow.obj.pool.add(aObject, inUse)

Adds aObject to the current pool. Optionally you can indicate if it should be add has checkout (inUse = true).

Sources:

- js/owrap.obj.js:832

<a id="api-ow-obj-pool-checkin-357e2775"></a>

## ow.obj.pool.checkIn

### ow.obj.pool.checkIn(aObject, shouldKeep)

Returns the aObject instance back to the pool removing the mark that is in use. If shouldKeep = false the object instance will be removed from the pool (trying to call the closeFunction and ignoring any exception).

Sources:

- js/owrap.obj.js:1083

<a id="api-ow-obj-pool-checkout-a4c3ce5d"></a>

## ow.obj.pool.checkOut

### ow.obj.pool.checkOut() : Object

Tries to obtain an object instance from the pool and returns it marking it as in use. Throws an exception if no object is available even after retrying.

Sources:

- js/owrap.obj.js:1044

<a id="api-ow-obj-pool-create-afb6923b"></a>

## ow.obj.pool.create

### ow.obj.pool.create() : Object

Creates an object pool with the ability to provide objects produce by a factory method and to close the objects when needed (if defined to have minimum and maximum number of objects in the pool). It's possible also to define a keep alive function.

Sources:

- js/owrap.obj.js:739

<a id="api-ow-obj-pool-setfactory-79366593"></a>

## ow.obj.pool.setFactory

### ow.obj.pool.setFactory(aFactoryFunction, aCloseFunction, aKeepaliveFunction)

Sets the functions to use to create new object instances with a aFactoryFunction (this function should return a new object instance each time is called). aCloseFunction to be called whenever an object instances needs to be terminated. And an optionally aKeepaliveFunction, that receives a object instances as an argument, and should perform the necessary procedures to keep the object instance "alive" (think connections that timeout after not being used for a long time).

Sources:

- js/owrap.obj.js:859

<a id="api-ow-obj-pool-setfactoryaf-abe53b9f"></a>

## ow.obj.pool.setFactoryAF

### ow.obj.pool.setFactoryAF(anURL, aTimeout, aConnectionTimeout, dontUseTransaction)

Setups: a factory function to create an AF object using anURL and tries to send a Ping operation; a close function to close the AF object connection; a keep alive function that sends a Ping operation.

Sources:

- js/owrap.obj.js:1142

<a id="api-ow-obj-pool-setfactorydb-86e8f0c6"></a>

## ow.obj.pool.setFactoryDB

### ow.obj.pool.setFactoryDB(aDriver, aURL, aLogin, aPassword, aKeepAliveFunction, aTimeoutInMs)

Setups: a factory function to create an DB object using aDriver, aURL, aLogin and aPassword; a close function to close the DB object connection; a keep alive function that tries to execute a select from dual.

Sources:

- js/owrap.obj.js:1186

<a id="api-ow-obj-pool-setfactoryraiddb-b838536b"></a>

## ow.obj.pool.setFactoryRAIDDB

### ow.obj.pool.setFactoryRAIDDB(anAF, aConn, aKeepAlive, aURL, aPassword, useCIR, aDriver)

Setups: a factory function to create an DB object using anAF and aConn connection name from the RAID/WAF server; a close function to close the DB object connection; a keep alive function that tries to execute a select from dual (you can override this function providing aKeepAlive function that receives a database object as argument).

Sources:

- js/owrap.obj.js:1160

<a id="api-ow-obj-pool-setfactoryssh-5170e796"></a>

## ow.obj.pool.setFactorySSH

### ow.obj.pool.setFactorySSH(aHost, aPort, aLogin, aPass, anIdentificationKey, withCompression)

Setups: a factory function to create an SSH object using aHost, aPort, aLogin, aPass, anIdentificationKey, withCompression; a close function to close the SSH object connection; a keep alive function that tries to execute a command "true".

Sources:

- js/owrap.obj.js:1211

<a id="api-ow-obj-pool-setincrementsof-a605c67b"></a>

## ow.obj.pool.setIncrementsOf

### ow.obj.pool.setIncrementsOf(aNumberOfInstances)

Sets the number of increments in object instances on the pool in case that a new object instances is needed

Sources:

- js/owrap.obj.js:779

<a id="api-ow-obj-pool-setkeepalive-24b4f3d6"></a>

## ow.obj.pool.setKeepalive

### ow.obj.pool.setKeepalive(aTimeInSeconds)

Sets the aTimeInSeconds for the keep alive function to be called for all object instances in the pool. After setting to aTimeInSeconds &#62; 0 the keep alive cycle will be started. Otherwise any existing keep alive cycle will be stopped. Note: don't forget to use ow.obj.pool.stop to keep the keep alive thread from running after you no longer need it.

Sources:

- js/owrap.obj.js:888

<a id="api-ow-obj-pool-setkeepaliveinms-368d86f0"></a>

## ow.obj.pool.setKeepaliveInMs

### ow.obj.pool.setKeepaliveInMs(aTimeInMs)

Sets the aTimeInMs for the keep alive function to be called for all object instances in the pool. After setting to aTimeInMs &#62; 0 the keep alive cycle will be started. Otherwise any existing keep alive cycle will be stopped. Note: don't forget to use ow.obj.pool.stop to keep the keep alive thread from running after you no longer need it.

Sources:

- js/owrap.obj.js:900

<a id="api-ow-obj-pool-setmax-8e40fba9"></a>

## ow.obj.pool.setMax

### ow.obj.pool.setMax(aMaxNumberOfInstances)

Sets the maximum number of object instances the pool can have.

Sources:

- js/owrap.obj.js:775

<a id="api-ow-obj-pool-setmin-efd59252"></a>

## ow.obj.pool.setMin

### ow.obj.pool.setMin(aNumberOfInstances)

Sets the minimum number of object instances the pool should have. These will be created upon ow.obj.pool.start.

Sources:

- js/owrap.obj.js:770

<a id="api-ow-obj-pool-setretry-6db36080"></a>

## ow.obj.pool.setRetry

### ow.obj.pool.setRetry(numberOfRetries)

Sets the number of retries to obtain a free object from the pool.

Sources:

- js/owrap.obj.js:762

<a id="api-ow-obj-pool-settimeout-25e02891"></a>

## ow.obj.pool.setTimeout

### ow.obj.pool.setTimeout(aTimeoutInMs)

Sets a timeout in ms between each retry to obtain a free object from the pool.

Sources:

- js/owrap.obj.js:766

<a id="api-ow-obj-pool-start-97e0cdab"></a>

## ow.obj.pool.start

### ow.obj.pool.start()

Starts the object pool by creating the minimal number of object instances.

Sources:

- js/owrap.obj.js:1009

<a id="api-ow-obj-pool-stop-091a2f6b"></a>

## ow.obj.pool.stop

### ow.obj.pool.stop()

Stops the object pool closing all object instances and any keep alive cycle.

Sources:

- js/owrap.obj.js:1023

<a id="api-ow-obj-pool-use-6dbaf71d"></a>

## ow.obj.pool.use

### ow.obj.pool.use(aFunction)

Executes aFunction providing, as an argument, an object instance from the pool (equivalent to ow.obj.pool.checkOut). After the execution the object instance will be returned to the pool (equivalent to ow.obj.pool.checkIn). If the aFunction returns false the provided object instance will be removed from the pool (interpreting as something is wrong  with it).

Sources:

- js/owrap.obj.js:1108

