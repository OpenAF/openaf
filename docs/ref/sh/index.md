# $sh

[Home](../index.md) / [All APIs](../all-apis.md) / [$sh](index.md)

<a id="api-sh-cb-1200ee91"></a>

## $sh.cb

### $sh.cb(aCallbackFunc) : $sh

When executing aCmd (with .get) use aCallbackFunc function.

Sources:

- js/openaf.js:17399

<a id="api-sh-cp-f61de09e"></a>

## $sh.cp

### $sh.cp(aSource, aTarget) : $sh

Immediately copies aSource to aTarget before executing aCmd (with .exec).

Sources:

- js/openaf.js:17471

<a id="api-sh-dontwait-3f2ef162"></a>

## $sh.dontWait

### $sh.dontWait(aBooleanValue) : $sh

If aBooleanValue = true the execution won't wait for output (default: false).

Sources:

- js/openaf.js:17351

<a id="api-sh-envs-4fd12271"></a>

## $sh.envs

### $sh.envs(aMap, includeExisting) : $sh

Uses aMap of strings as the environment variables map. If includeExisting = true it will include the current environment variables also, with values explicitly provided in aMap taking precedence.

Sources:

- js/openaf.js:17363

<a id="api-sh-exec-cf084c05"></a>

## $sh.exec

### $sh.exec(aIdx) : Object

Immediately copies the result of executing aCmd string or array (and any other commands in queue added using sh). If aIdx is provided it will return the map entry for the corresponding command on the array otherwise it will return the array.

Sources:

- js/openaf.js:17604

<a id="api-sh-exit-b8551bd1"></a>

## $sh.exit

### $sh.exit(aFunc) : $sh

Sets aFunc function to execute after the execution of aCmd (with .exec).

Sources:

- js/openaf.js:17629

<a id="api-sh-exitcb-ecc9ee20"></a>

## $sh.exitcb

### $sh.exitcb(aFunction) : $sh

When executing aCmd if aFunction is provided it will be called to determine if the execution should continue or not. If aFunction returns "destroy" the execution will try to be destroyed. If aFunction returns "force" the execution will be forced to stop.

Sources:

- js/openaf.js:17410

<a id="api-sh-get-777fdb80"></a>

## $sh.get

### $sh.get(aIdx) : Object

Immediately copies the result of executing aCmd string or array (and any other commands in queue added using sh). If aIdx is provided it will return the map entry for the corresponding command on the array otherwise it will return the array.

Sources:

- js/openaf.js:17504

<a id="api-sh-getjsslon-78f9bad8"></a>

## $sh.getJsSlon

### $sh.getJsSlon(aIdx) : Object

Immediately copies the result of executing aCmd string or array (and any other commands in queue added using sh) trying to parse it as json or slon. If aIdx is provided it will return the map entry for the corresponding command on the array otherwise it will return the array.

Sources:

- js/openaf.js:17558

<a id="api-sh-getjson-23f5f3a4"></a>

## $sh.getJson

### $sh.getJson(aIdx) : Object

Immediately copies the result of executing aCmd string or array (and any other commands in queue added using sh) trying to parse it as json (will ingore non json content). If aIdx is provided it will return the map entry for the corresponding command on the array otherwise it will return the array.

Sources:

- js/openaf.js:17535

<a id="api-sh-getyaml-9f76e168"></a>

## $sh.getYaml

### $sh.getYaml(aIdx) : Object

Immediately copies the result of executing aCmd string or array (and any other commands in queue added using sh) trying to parse it as yaml. If aIdx is provided it will return the map entry for the corresponding command on the array otherwise it will return the array.

Sources:

- js/openaf.js:17581

<a id="api-sh-mkdir-f933197f"></a>

## $sh.mkdir

### $sh.mkdir(aDir) : $sh

Immediately creates aDir before executing aCmd (with .exec).

Sources:

- js/openaf.js:17449

<a id="api-sh-mv-b2ef4658"></a>

## $sh.mv

### $sh.mv(aSource, aTarget) : $sh

Immediately moves aSource to aTarget before executing aCmd (with .exec).

Sources:

- js/openaf.js:17460

<a id="api-sh-prefix-a2e0f5ce"></a>

## $sh.prefix

### $sh.prefix(aPrefix, aTemplate) : $sh

When executing aCmd (with .get) it will use ow.format.streamSHPrefix with aPrefix and optionally aTemplate.

Sources:

- js/openaf.js:17422

<a id="api-sh-pwd-e3250be2"></a>

## $sh.pwd

### $sh.pwd(aPwd) : $sh

When executing aCmd (with .exec) use aPwd as the current working directory.

Sources:

- js/openaf.js:17388

<a id="api-sh-rename-fb712f14"></a>

## $sh.rename

### $sh.rename(aSource, aTarget) : $sh

Immediately renames aSource to aTarget before executing aCmd (with .exec).

Sources:

- js/openaf.js:17482

<a id="api-sh-rm-a41da627"></a>

## $sh.rm

### $sh.rm(aFilePath) : $sh

Immediately removes aFilePath before executing aCmd (with .exec).

Sources:

- js/openaf.js:17493

<a id="api-sh-sh-aeaa2bef"></a>

## $sh.sh

### $sh.sh(aCmd, aIn) : $sh

When executing aCmd (with .exec) sets additional aCmds (with the optional corresponding aIn) to use.

Sources:

- js/openaf.js:17377

<a id="api-sh-timeout-25d8e09e"></a>

## $sh.timeout

### $sh.timeout(aTimeout) : $sh

When executing aCmd (with .exec) uses aTimeout.

Sources:

- js/openaf.js:17438

<a id="api-sh-useencoding-911029a4"></a>

## $sh.useEncoding

### $sh.useEncoding(aEncoding) : $sh

Forces the aEncoding to be used.

Sources:

- js/openaf.js:17340

