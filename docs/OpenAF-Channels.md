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
* Simple
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

#### Details specific to each implementation

### DB

*tbc*

### Ignite

The Ignite implementation encapsulates access to an Ignite data grid using functionality from the Ignite plugin. Upon creation the shouldCompress is ignored and the options available are not mandatory:

* *gridName* - The Ignite grid name to access
* *ignite* - A Ignite object from the Ignite plugin that you previously instatiated.

The name of the channel is actually the name of Ignite data grid cache that will be used. All functionality is available.

### Ops

The ops or operations implementation is a special channel that won't store values but will actually execute a specific function for each key and return the corresponding value (e.g. usefull for exposing functionality). That function will receive as argument the value map. On the creation the shouldCompress is obviously ignored and the options is actually the map of functions as demonstrated on the next example:

````javascript
$ch("myops").create(1, "ops", {
    "help": () => { return { "add": "Add an argument a with b" } },
    "add" : (v) => { return { result: v.a + v.b }; }
});
````

The to use it:

````javascript
> $ch("myops").get("help");
{
    "add": "Add an argument a with b"
}
> $ch("myops").set("add", { a: 2, b: 3 });
{
    "result": 5
}
````

Due to the nature of this implementation setAll, pop, shift and unset are not implemented and will just execute returning undefined.

### Cache

The cache implementation lets you define a channel that will use a provided function to retrieve and return the corresponding value given a key. The value will be kept in another OpenAF channel acting as a cache from which the value will be retrieved for a specific TTL (time-to-live) in ms. After the TTL the function will be executed again and the result kept in the other OpenAF channel. This is useful when you know that you will have a lot of gets but it's slow to retrieve each value and a key/value cache mechanism is usefull. 

To create, the shouldCompress option is ignored and the following options can be used:

| Option | Mandatory | Type | Description |
|--------|-----------|------|-------------|
| func | Yes | Function | The function that receives a key and returns the corresponding value to be returned and cached for a TTL. |
| ttl | No | Number | The cache time-to-live in ms (defaults to 5 seconds) |
| ch | No | String | The name of the secundary OpenAF channel to store the cached values. This channel can already exist (for example if you don't want to cache values in memory). Defaults to the current name suffixed with "::__cache". Note: Upon "destroy" of the cache channel this channel will be also destroyed. |

The set/setAll functions will actually ignore the value provided and call the function with the key provided updating the cache value and ignoring/reseting the current TTL.

### ElasticSearch

The ElasticSearch implementation encapsulates the access to an ElasticSearch server/cluster. Pretty much all OpenAF channel functionality is available and there are some extensions to enable the use of ElasticSearch functionality. On creation, the shouldCompress is ignored but the options map should contain:

| Option | Mandatory | Type | Description |
|--------|-----------|------|-------------|
| index | Yes | String/Function | The ES index string or a function that returns the name (see also ow.ch.utils.getElasticIndex) |
| idKey | No | String | If the ES index uses an id field you can specify it (defaults to '_id') |
| url | Yes | String | The URL string to access the ES cluster/server using HTTP/HTTPs |
| user | No | String | If the ES cluster/server requires authentication credentials, you can specify the username. |
| pass | No | String | If the ES cluster/server requires authentication credentials, you can specify the password (encrypted or not). |

Examples:

````javascript
> $ch("myvalues").create(1, "elasticsearch", { url: "http://es.local", index: "myvalues" });
> $ch("values").create(1, "elasticsearch", { url: "http://es.local", index: ow.ch.utils.getElasticIndex("value", ow.ch.utils.getElasticIndex("values", "yyyy.w"))});
````

The getAll/getKeys functions accept an extra argument to provide an ES query map to restrict the results.

Nevertheless please use the ElasticSearch oPack that encapsulates more functionality not available through the OpenAF channel implementation and enables the easy creation of ElasticSearch channels.

### MVS

MVS or MVStore is the a "persistent, log structured key-value store" which is the actual storage subsystem of H2. It's fast, small and a good alternative to keeping channel data in memory at all althought it can also keep it in-memory. The shouldCompress option specifies if the entire data structure should be compress by MVS or not. Pretty much all channels functionality is available. Additionally you can specify on the options map:

| Option | Mandatory | Type | Description |
|--------|-----------|------|-------------|
| file   | No | String | Specifies the file where MVS will store data to. If not defined it stores data in-memory. |
| compact | No | Boolean | If yes upon channel creation/destruction it will run the MVS compact operation over the file trying to save storage space. |
| map | No | String/Function | If not defined defaults to the string "default". Each file can contain several "collections" or maps of values. If defined as a function, the function will receive the key in use as an argument and it should return the map name to use (e.g. usefull for sharding) and a default map name when a key is not provided. |

Examples:

````javascript
> $ch("test").create(1, "mvs"); // Creates an in-memory mvs channel for map 'default'
> $ch("mymap").create(1, "mvs", { map: "mymap" }); // Creates an in-memory mvs channel for map 'mymap'
````

````javascript
// Creates a mvs file 'myfile.db' with a map 'mymap'
$ch("myfile").create(1, "mvs", { file: "myfile.db", map: "mymap" });

// Creates a mvs file 'myfile.db' with distributing values using the field date from the key to map names like "logs-yyyy.MM.dd"
var func = (key) => { 
    key = _$(key).isMap().default({}); 
    var d = _$(key.date).isDate().default(new Date); 
    
    return "logs-" + ow.format.fromDate(d, "yyyy.MM.dd"); 
};
$ch("myfile").create(1, "mvs", { file: "myfile.db", map: func });
````

**Note:** function based map channels should only be used for adding/modifying values. For accessing you should create specific channels for the specific map name. Keep in mind that MVS supports concurrent read and write.

There are utilitary functions for mvs files in ow.ch.utils.mvs.* namely:

* *list(aFile)* - returning an array with all maps contained on a MVS file.
* *remove(aFile, aMapToRemove)* - deleting any map contained on a MVS file.
* *rename(aFile, oldMapName, newMapName)* - to rename an existing map contained on a MVS file.

### Simple

The simple implementation instead of using the OpenWrap Big Objects uses plain javascript objects (e.g. arrays and maps). It benefits on add/modify performance but uses more memory in the overall for large or varying size values. All functionality is available and similar behaviour to the default implementation should be expected althought the shouldCompress option is ignored.

To create one just:

````javascript
> $ch("test").create(1, "simple")
````

### Dummy

In this implementation all functionality will simple return without executing anything. It's mainly use for testing proposes.

### Mongo (through oPack)

Please check the Mongo oPack documentation (tbc).

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

Peering is an advance mode of using remote channels where instead of unidirectional communication between from a source channel to a target channel there is actually bidirectional communication trying to keep both channels up to date.

On side A you simply execute (similar to *expose*):

````javascript
> $ch("mychannelOnA").peer(8010, "/mychannel", [ "http://the.other.guy:8011/mychannel" ]);
````

and on the other side B:

````javascript
> $ch("mychannelOnB").peer(8011, "/mychannel", [ "http://the.original.guy:8010/mychannel" ]);
````

If you look carefully on will notice the peer is actually contained on an array because you can actually have a list of peers (that should include all for each side). Let's add a side C:

On side A:

````javascript
> $ch("mychannelOnA").peer(8010, "/mychannel", [ "http://the.other.guy:8011/mychannel", "http://the.extra.guy:8012/mychannel" ]);
````

on side B:

````javascript
> $ch("mychannelOnB").peer(8011, "/mychannel", [ "http://the.original.guy:8010/mychannel", "http://the.extra.guy:8012/mychannel" ]);
````

and on side C:

````javascript
> $ch("mychannelOnC").peer(8012, "/mychannel", [ "http://the.original.guy:8010/mychannel", "http://the.other.guy:8011/mychannel" ]);
````

The peering functionality is a little similar to the Ignite type with the following differences:

* Subscribers will get triggered in each side upon data change
* Each side should mirrors all data
* Static list of peers

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