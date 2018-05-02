# OpenAF Channels <a href="/"><img align="right" src="images/openaf_small.png"></a>

## What are channels?

By definition channels should allow for the flow of data between functionalities or processes. In a similar fashion, OpenAF channels allow the flow of data between two points or functionalities. These two points can be in on the same OpenAF script or in two different scripts (on the same machine or differents).

Let's consider a simple example: _Imagine that you have a script, called copyFiles.js, that copies files between a SFTP server and a local server. Additionally you have a preProcess.js script that will pre-process the copied files whenever they are copied. How do you make the name of the copied files “flow” to the preProcess.js script? You can build a channel between copyFiles.js and preProcess.js._

## How is data represented on a channel?

 Data in OpenAF channels is represented by a set of key/value pairs. This set can be handle as a Map (where you can invoke get/set methods) or as a Queue (where you can invoke push/pop/shift methods) by the order a key/value was added/modified.

The keys and values used can be simple Strings or JSON Maps.

Using the example: _For every copied file the copyFiles.js script can set a key/value pair like the following_: 

````javascript
Key = { "filename": "someData1234.dat" }
 
Value = { 
    "filename": "someData1234.dat",
    "filepath": "/some/input/folder/someData1234.dat",
    "dateReceived": "2016-12-02 12:34:56",
    "dateCopied": "2016-12-02 12:35:05"
}
````

Then preProcess.js can simply invoke the shift method on the same channel to obtain the first key/value pair added to the channel. 

## How to be notified of a change on a channel?

If a channel allows for the flow of data between two points how would the target point know that the source point as added or changed data in a channel? The answer is channel subscription. For any given OpenAF channel you can subscribe it so a function provided by you can be callback whenever any addition or change is made on a channel.

These subscriptions are non-blocking meaning that changing data on a channel won't be delayed by the subscriptions it holds at any given point. Each subscription will actually be executed on a separate thread in parallel.

At any time you can unsubscribe a previous channel subscript

Using the example: T_he copyFiles.js will add a key/value pair per each file it successfully copies in a “CopiedFiles” channel. The preProcess.js just needs to subscribe the “CopiedFiles” channel. Each time copyFiles.js adds a file, a provided preProcess.js function will be executed without delaying copyFiles.js functionality._

## Channels implementations

OpenAF channels can have different implementations on how the key/value set is stored and shared while maintaining the same interface methods. This means that, as a general rule, whatever implementation a channel uses the get/set/push/pop/etc… methods should be available.

Currently there are several different implementations built-in (on the included OpenWrap Channel library): 

* Big (default)
* DB
* Ignite
* Ops
* Remote
* Cache
* ElasticSearch
* Mvs
* Dummy (for testing)

And some available through oPacks:

* Mongo

The default implementation Big uses the OpenWrap Big Objects functionality (from the OpenWrap Object library). You don't need to know how this functionality works internally. For the sake of simplicity let's assume it's like an internal JavaScript Array of a Map with a Key and Value.

The remote implementation allows for the creation of a channel whose implementation is held on a different OpenAF script that can be accessed for a REST API. We will get into the details of how this is done and setup later but this implementation is important to access channels with local script storage (like the default implementation is). 

### Channel basics

To access the channel functionality you can use functions in the ow.ch (OpenWrap Channel) library or the common shortcuts: $channel or $ch. We will use the $ch to show the channels basics.

The $ch is actually a javascript function that takes the unique name of a channel as it's parameter. This name only needs to be unique in a single OpenAF script.

#### Channel maintenance

Before using a channel you always need to create it. 

````javascript
> $ch("mychannel").create() // default
> $ch("mychannel").create(true, "myimpl", {"option1": "value1"}) // to create a channel with a myimpl implementation
````

You can list the current created channels by: 

````javascript
> $ch().list()
````

When you no longer need a channel and corresponding data you can destroy it by: 

````javascript
> $ch("mychannel").destroy()
````

#### Channel value get/set/unset

You can add/set a key/value on a channel by: 
````javascript
> $ch("mychannel1").set(1, "hello")
> $ch("mychannel1").set(2, "hello")
````

The keys and values can be string, numbers or maps:

````javascript
> $ch("mychannel").set({date: "20100601", person: "me"}, {data: ... })
````

You can add an array of map entries just indicating which map entries should be considered for keys

````javascript
> $ch("mychannel").setAll(["date", "person"], anArrayOfData)
````

To retrieve data you simply use the full key:

````javascript
> $ch("mychannel1").get(1)
> $ch("mychannel").get({date: "20100601", person: "me"})
````

To delete any entry just use the full key again:

````javascript
> $ch("mychannel").unset(1)
> $ch("mychannel").unset({date: "20100601", person: "me"})
````

To get a list of all the keys of a channel:

````javascript
> $ch("mychannel").getKeys()
> $ch("mychannel").getSortedKeys() // by the last changes
````

To get all elements of a channel:

````javascript
> $ch("mychannel").getAll()
````

To get the number of elements in a channel:

````javascript
> $ch("mychannel").size()
````

If you need to check and set an entry in one single “transaction” you just need to provide the value map element that needs to be checked and if true set the entry with the new value (usually to ensure that just one thread will actually change an entry):

````javascript
> $ch("mychannel").getSet({status: "toExecute"}, {jobId: 123}, { jobId: 123, runCommand: "processStuff.sh", status: "executing"})
````

Note: Usually it's a good practice to have the key elements as part of the value also thus setAll keeps the key elements also on the value map for each array element. 

#### Using a channel as a queue

Ordering in channels is, by default, over the last modify time stamps. To retrieve the first element removing it from the channel: 

````javascript
> var myvalue = $ch("mychannel").shift()
````

To remove the last:

````javascript
> var myvalue = $ch("mychannel").pop()
````

You can even add new elements using push:

````javascript
> $ch("mychannel").push(myvalue)
````

#### Channel forEach

To execute a function over all elements:

````javascript
> $ch("mychannel").forEach(function(key, value) {
    // do stuff with key and value
})
````

#### Channel subscription

One of the most important functions of a channel is the ability to subscribe it for any change: 

````javascript
> $ch("mychannel").subscribe(function(aChannelName, aOperation, aKeyOrKeys , aValueOrValues) { ... }, onlyFromNowOn)
````

The subscribe function will receive: 
* aChannelName identifying the channel (only useful when you want to use a generic subscribing function);
* aOperation which will have a value of “set”, “setall” or “unset”;
* aKeyOrKeys representing the key or keys for the setall operation;
* aValueOrValues representing the value or values for the setall operation.

Once a function is provided subscribing a channel, it will be executed with a “set” operation for all existing elements (thus syncing all existing channel elements). You can override this behavior by setting onlyFromNowOn to true.

The subscribing function will always run in a separate thread so that the channel basic set, setall and unset operations performance is not directly affected by the number or performance of the subscribing functions. This is currently by design option.

For each subscribe instruction a corresponding UUID will be returned. You can use this UUID to unsubscribe the function from the channel if needed: 

````javascript
> $ch("mychannel").unsubscribe(anUUID)
````

In advanced implementations you can also stop all subscribing functions running (called jobs) by executing:

````javascript
> $ch("mychannel").stopJobs()
````

This is usually only helpful when you want to stop a channel and all subscribing functions quickly. Otherwise if you just want to know when all current jobs finish you can use:

````javascript
> $ch("mychannel").waitForJobs(aLimitTimeout)
````

#### Persisting Channel values

A simple subscribe function is to keep an update filesystem copy of the channel values. There is a simple basic implementation built in. To add the built in subscribe function to a channel just execute:

````javascript
> $ch("mychannel").storeAdd("mychannel.channel", ["date", "person"])
````

This will also check if the file already exists and restore values from it so you need to provide the list of values to use as key. The contents are compressed by default and it's just a simple JSON file meaning you could use this function to read and maintain JSON file based data, for example. You can even create channels with different keys over the same data.

To just restore the values just use:

````javascript
> $ch("mychannel").storeRestore("mychannel.channel", ["date", "person"]) 
````

Do be aware that there is no locking mechanism preventing access to the file and that current implementation (e.g. memory, database, remote, etc…) contents will always override the filesystem values except, of course, on the initial data restore. So changing the file while a channel is “live” won't change it and on the next set/unset/setall all data on the file will be overwritten. For these reasons it's suitable to be used for small/medium size channels depending on the values size and keeping channel data always preserved. If you are looking for a solution to store large sized channels you can either use getAll or forEach to save them when needed or build a more sophisticated subscribe function (for example: keeping each value as a separate file on a folder structured indexed by keys). 

_tbc_

### Exposing channels externally

#### Remote channels

For whatever channel you have created you can expose it externally through a REST protocol. You can achieve this easily by executing for an existing channel:

````javascript
> $ch("mychannel").expose(1234, "/mychannel")
````

This creates a HTTP server on the port 1234 that will respond to REST queries on the URI “/mychannel”. You can create a remote channel on another openaf script or session to communicate with it by executing:

````javascript
> $ch("remoteChannel").createRemote("http://the.other.guy:1234/mychannel")
````

The channel “remoteChannel” can now be used normally. All operations will be relayed back to the original channel. But if you subscribe the “remoteChannel” you won't receive any set/setall/unset operations from “mychannel”.

### Peering channels

_tbc_

### Channels REST API

The next table describe in more detail the REST API to communicate with a exposed/peered channel:

| Channel operation | HTTP Method | URI |
|:------------------|:------------|:----|
| getAll | GET | [base uri]/o/a |
| getKeys | GET | [base uri]/o/k |
| getSortedKeys | GET | [base uri]/o/s |
| getSet | PUT | [base uri]/o/es/m/[match]/k/[key]/t/[timestamp] |
| set | PUT | [base uri]/o/e/k/[key]/t/[timestamp] |
| setAll | PUT | [base uri]/o/a/k/[key]/t/[timestamp] |
| get | GET | [base uri]/o/e/k/[key] |
| unset | DELETE | [base uri]/o/e/k/[key]/t/[timestamp] | 