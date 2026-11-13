# ow.server

[Home](../../index.md) / [All APIs](../../all-apis.md) / [ow](../index.md) / [ow.server](index.md)

## Subcategories

- [ow.server.a2a](a2a/index.md)
- [ow.server.auth](auth/index.md)
- [ow.server.cluster](cluster/index.md)
- [ow.server.httpd](httpd/index.md)
- [ow.server.jmx](jmx/index.md)
- [ow.server.jwt](jwt/index.md)
- [ow.server.ldap](ldap/index.md)
- [ow.server.locks](locks/index.md)
- [ow.server.mcp](mcp/index.md)
- [ow.server.openafServer](openafserver/index.md)
- [ow.server.queue](queue/index.md)
- [ow.server.rest](rest/index.md)
- [ow.server.scheduler](scheduler/index.md)
- [ow.server.socket](socket/index.md)
- [ow.server.telemetry](telemetry/index.md)

<a id="api-ow-server-a2a-570a1e07"></a>

## ow.server.a2a

### ow.server.a2a() : ow.server.a2a

Creates an agent registry for Agent-to-Agent (A2A) messaging over MCP. Agents can be registered with metadata and message handlers, then accessed via MCP methods (agents/list, agents/get, agents/send).

Sources:

- js/owrap.server.js:2116

<a id="api-ow-server-authappcheck-eb0fc909"></a>

## ow.server.authAppCheck

### ow.server.authAppCheck(anAppPassword, aReceivedToken, aUserPassword, a2FAToken, useBCrypt) : boolean

Checks the validity of the `aReceivedToken` given `anAppPassword`, corresponding `aUserPasswork` and `a2FAToken` returning
true if it's valid or false otherwise. If `useBCrypt` = 1 then an extra bcrypt function will be added.

Example:

```javascript
ow.loadServer();
$ch("a").expose(1234, "/a", (u, p) => {
   if (u == "a" &&
       ow.server.authAppCheck("...", p, "...", "..."))
     return true;
   else
     return false;
});
```

Sources:

- js/owrap.server.js:407

<a id="api-ow-server-authappgen-6fcbbddd"></a>

## ow.server.authAppGen

### ow.server.authAppGen(anAppPassword, aUserPassword, a2FAToken, numRounds) : String

Generates an application token to be used for server communication given `anAppPassword` (encrypted or not),
an application user password (`aUserPassword` encrypted or not) and an application `a2FAToken`. Optionally you
can specify the `numRounds` for the bcrypt function used (if absent, bcrypt won't be used).

Example:

```javascript
ow.loadServer();
$ch("a").createRemote("http://some.server:1234/a", __, (h) => {
   h.login("user", ow.server.authAppGen("...", "...", "..."));
});
```

Sources:

- js/owrap.server.js:357

<a id="api-ow-server-checkin-529fa7f4"></a>

## ow.server.checkIn

### ow.server.checkIn(aPidFile, onAlreadyRunning, onShutdown, anExitCode) : Boolean

Will check if a server for the give `aPidFile` is running or not. Will return false if it's running
and server start shouldn't proceed. Will return true if nothing is running and server start should proceed.
Optionally you can provide an `onShutdown` function to execute any code needed upon controlled shutdown
of the server and provide an `onAlreadyRunning` function (that will received the corresponding `aPidFile`).
If the `onAlreadyRunning` function returns false the process will exit with -1 (or the `anExitCode` provided),
if true will continue processing. The `aPidFile` parameter can be overridden by setting the OAF_PIDFILE
environment variable.
Example:

```javascript
var params = processExpr();
ow.server.checkIn("server.pid", function(aPid) {
   log("there is another me " + aPid + " already running... bye!");
   if (isDefined(params.restart)) {
      log("I will kill him!");
      pidKill(ow.server.getPid(aPid), true);
      return true;
   } else {
      log("... I will die now...");
      return false;
   }
}, function() {
   log("I'm going to die....");
});

ow.server.daemon();
```

(available after `ow.loadServer()`)

Sources:

- js/owrap.server.js:10

<a id="api-ow-server-cluster-28e0c38c"></a>

## ow.server.cluster

### ow.server.cluster(aHost, aPort, nodeTimeout, aNumberOfTries, aTryTimeout, aImplOptions, aListImplementation) : Object

Creates a new instance of a simple cluster nodes management code. Each cluster node should create its own instance providing `aHost` address
on which it can be contacted, a corresponding `aPort`, a `nodeTimeout` in ms (defaults to 30000), a `aNumberOfTries` to contact a cluster node (defaults to 3),
a `aTryTimeout` in ms waiting for a reply from another cluster node (defaults to 500ms), a custom cluster list implementation options and a custom map of functions
implementing a cluster list retrieval. If no `aListImplementation` is provided it defaults to an internal file based implementation that expects
the following options: LOCKTIMEOUT, how much a lock should be honored in ms (e.g. more that 60000ms and it's unexpected that the lock it's still there and no other
cluster node has been found); CLUSTERFILE, the filepath to the cluster file; CLUSTERFILELOCK, the filepath to the cluster file lock file.

To provide another custom `aListImplementation` it should contain the following methods:

- `clusterLock()`: locking the access to the cluster nodes list
- `clusterUnLock()`: unlocking the access to the cluster nodes list
- `clusterGetList()`: returns the current cluster nodes list
- `clusterPutList(aList)`: sets a new cluster nodes list (an array with maps containing host, port and date (last contact date))
- `clusterSendMsg(aHost, aMsg)`: sends `aMsg` to a specific `aHost` or all (is `aHost` = "all")
- `clusterSetMsgHandler(aT, aHFn)`: sets `aHFn` function (receives (implementationOptionsMap, `aMsg`) ) to handle any messages that contain { t: `aT` }
- `clusterCanLock(aLockName)`: asks all nodes if `aLockName` can be locked on cluster.locks
- `clusterCanUnLock(aLockName)`: asks all nodes if `aLockName` can be unlocked on cluster.locks
- `clusterLocks()`: returns the current cluster node locks implementation (`ow.server.locks`)

Sources:

- js/owrap.server.js:2468

<a id="api-ow-server-clusterchspeersimpl-492946a3"></a>

## ow.server.clusterChsPeersImpl

### ow.server.clusterChsPeersImpl

This `ow.server.cluster` implementation will cluster one or more cluster servers keeping the cluster connection details on
a cluster channel (defaults to `__cluster::[name of cluster]`). It's meant to be provided to `ow.server.cluster` like this:

```javascript
var mts = new ow.server.cluster("1.2.3.4", 1234, __, __, __, { name: "testCluster" }, ow.server.clusterChsPeersImpl)
```

There are several implementation options:

- `name` (String, mandatory) The clusters name.
- `serverOrPort` (Number or HTTPd) Port or http server object where the cluster node channels will be available.
- `protocol` (String) The transport protocol use to reach other cluster (defaults to http).
- `path` (String) The path where other cluster nodes channel is reachable (defaults to `'/__m'`).
- `authFunc` (Function) Optional authentication function (see more in `ow.ch.server.peer`).
- `unAuthFunc` (Function) Optional failed authentication function (see more in `ow.ch.server.peer`).
- `maxTime` (Number) Optional retry max time (see more in `ow.ch.server.peer`).
- `maxCount` (Number) Optional max count of retries (see more in `ow.ch.server.peer`).
- `ch` (String) The cluster local channel (defaults to "`__cluster::[name of cluster]`").
- `chs` (Array) Array of names of channels or maps with each channel name and path. These channels will be automatically peered and unpeered with other cluster nodes. The path, if not provided, defaults to "/[name of channel]".
- `chErrs` (String) The cluster local errors channel (default is none).

Sources:

- js/owrap.server.js:2785

<a id="api-ow-server-daemon-dd1a6506"></a>

## ow.server.daemon

### ow.server.daemon(aTimePeriod, aPeriodicFunction)

Will start an infinite cycle to keep a server running. If aTimePeriod (in ms) is not provided a default of 5 seconds will be considered. Optionally you can provide aPeriodicFunction to run every aTimePeriod. If this aPeriodicFunction returns true, the infinite cycle is broken. (available after ow.loadServer())

Sources:

- js/owrap.server.js:107

<a id="api-ow-server-getpid-236f142b"></a>

## ow.server.getPid

### ow.server.getPid(aPidFile) : String

Retrieve the server pid on the given aPidFile. (available after ow.loadServer())

Sources:

- js/owrap.server.js:179

<a id="api-ow-server-jsonrpc-6019a1c3"></a>

## ow.server.jsonRPC

### ow.server.jsonRPC(data, mapOfFns) : Map

Processes a JSON-RPC request (data) using the provided mapOfFns where each key is the method name and the value is the function to be executed. The data should be a map with the following entries: jsonrpc (should be "2.0"), method (the method name to be executed), params (optional, the parameters to be passed to the method) and id (optional, the request id). Returns a map with the following entries: jsonrpc (should be "2.0"), id (the request id), result (the result of the method execution) or error (if the method is unknown or if the request is invalid).

Sources:

- js/owrap.server.js:1670

<a id="api-ow-server-ldap-55ba3af5"></a>

## ow.server.ldap

### ow.server.ldap(aServer, aUsername, aPassword) : Object

Creates a `ow.server.ldap` object for the given `aServer`, `aUsername` and `aPassword`. Example:

```javascript
var ldapAdServer = "ldap://ldap.forumsys.com:389";
var ldapUsername = "cn=read-only-admin,dc=example,dc=com";
var ldapPassword = "password";

var ldap = new ow.server.ldap(ldapAdServer, ldapUsername, ldapPassword);
var res = ldap.search("dc=example,dc=com", "(uid=*)");

print(beautifier(res));
```

Sources:

- js/owrap.server.js:689

<a id="api-ow-server-locks-64aae9c1"></a>

## ow.server.locks

### ow.server.locks(justInternal, aCh, aOptions)

Creates a lock managing object instance. You can optional make it internal (using a &#95;&#95;openAFLocks::local simple channel) or global using a &#95;&#95;openAFLocks:global ignite channel. Optional you can also provide an already created channel aCh. aOptions is forwarded to new global Ignite channels.

Sources:

- js/owrap.server.js:1253

<a id="api-ow-server-mcp-a9aa8cea"></a>

## ow.server.mcp

### ow.server.mcp

Shared Model Context Protocol version negotiation helpers used by ow.server.mcpStdio, ow.server.httpd.replyJSONRPC/replyMCP and OpenAF's oJob-based MCP servers (httpdMCP/stdioMCP shortcuts). Implements the 2026-07-28 "modern" stateless per-request protocol era alongside the legacy initialize-handshake eras (2024-11-05, 2025-06-18) without changing any default (legacy) behavior -- modern-era handling is only exercised by call sites that opt into it.

Sources:

- js/owrap.server.js:1732

<a id="api-ow-server-mcpstdio-3c6f4175"></a>

## ow.server.mcpStdio

### ow.server.mcpStdio(initData, fnsMeta, fns, lgF, opts)

Processes a MCP (Model Context Protocol) request using standard input/output. The `initData` is a map with initial data to be sent to the client, `fnsMeta` is an array of function metadata and `fns` is a map of functions to be executed.
The `lgF` is a function that will be used to log messages. If not provided, it will default to a function that writes logs to a file named "log.ndjson".
The `initData` should contain the server information and capabilities. The `fnsMeta` should contain metadata about the functions available, such as their names and descriptions. The `fns` should contain the actual functions that can be called by the client.
The function will listen for incoming MCP requests on standard input and respond accordingly.

`opts`.rawToolResults (default false) preserves MCP content/structuredContent/isError envelopes returned by tools.
`opts` is an optional map: { modern: false } (default). When modern is true this also serves the 2026-07-28
stateless/per-request MCP protocol era (per-request _meta protocol version, server/discover, resultType,
ttlMs/cacheScope on list results, UnsupportedProtocolVersionError) side-by-side with the legacy
initialize-handshake era used above, for any request that carries a modern _meta protocol version.
When modern is false (the default) behavior is 100% unchanged from previous releases.

Example usage:

```javascript
     ow.server.mcpStdio({
			serverInfo: {
				name: "MyServer",
				title: "My Server",
				version: "1.0.0"
			},
			capabilities: {
				prompts: {
					listChanged: true
				},
				tools: {
					listChanged: true
				}
			}
		}, [{
		name: "ping",
		description: "Ping the server"
	}, {
		name: "get_user",
		description: "Get user information",
		input_schema: {
			type: "object",
			properties: {
				userId: {
					type: "string",
					description: "The ID of the user to retrieve"
				}
			},
			required: ["userId"]
		}
	}], {
		ping: params => {
			return "Pong! Server is running."
		},
		get_user: params => {
			return {
				name: "Alice",
				userId: params.userId
			}
		}
	})
```

Sources:

- js/owrap.server.js:1894

<a id="api-ow-server-processarguments-e580913c"></a>

## ow.server.processArguments

### ow.server.processArguments(aRouterFunction, aMainSeparator, aSubSeparator) : Array

Processes the `__expr` (-e or opack arguments) value for arguments splitting first by `aMainSeparator` (if not defined
defaults to " ") and then splitting by `aSubSeparator` (if not defined defaults to "="). Example with

```javascript
__expr = "opensomething exec count=5=123 some=1";

ow.server.processArguments(function(aParam) { ... });
```

Will produce function calls where `aParam` will have the following values:

```text
"opensomething"
"exec"
[ "count", "5", "123" ]
[ "some", "1" ]
```

(available after `ow.loadServer()`)

Sources:

- js/owrap.server.js:71

<a id="api-ow-server-queue-79c13b6f"></a>

## ow.server.queue

### ow.server.queue(aStamp, aName, aChName)

Creates an instance to handle a queue on a channel named "queue::&#91;aName&#93;" or using aChName. The queue entries  will be identified on the channel with aStamp map (defaults to &#123;&#125;) ignoring all other entries. aStamp allows the use of generic channels with other non-queue entries. aName will default to "queue" if not provided.

Sources:

- js/owrap.server.js:1489

<a id="api-ow-server-simplecheckin-7adcd62f"></a>

## ow.server.simpleCheckIn

### ow.server.simpleCheckIn(aName)

If aName is provided it will check for 'aName.pid'. If the pid is running it will stop the current execution unless  stop or restart is provided as a script parameter. If stop is provided as a script parameter it will stop execution and try to kill the existing pid (force stop will try to kill it anyway). If restart is provided as a script parameter it will continue execution and try to kill the existing pid.

Sources:

- js/owrap.server.js:127

