# ow.debug

[Home](../../index.md) / [All APIs](../../all-apis.md) / [ow](../index.md) / [ow.debug](index.md)

<a id="api-ow-debug-debug-0d6a7597"></a>

## ow.debug.debug

### ow.debug.debug(aCode, args, aReturnCode, aPrefix) : String

Parses `aCode` for debug comments and replaces the appropriate code. The comments code that can be used are:

```javascript
//@  This is a checkpoint on the code you want to know it was reached
//#  assertVarA == assertVarB
//?  printVarA
//?s printInSLONVarA
//?y printInYAMLVarA
//?t printInTableVarA
//?r printInTreeVarA
//{  begin of unique block with prefix
//}  end of unique block with prefix
//[  begin of unique profile block
//]  end of unique profile block
//{[ begin of unique profile block with prefix
//]} end of unique profile block with prefix
//+  incrementVarA
//-  decrementVarA
```

If `aReturnCode` is true instead of executing the code, the code will just be returned. Customization can be provided through `args`
or the global map variable OAF_DEBUG_ARGS accepting the following entries:

- `lineColor` (string) defaults to FG(220)
- `textColor` (string) defaults to BG(230),BLACK
- `lineError` (string) defaults to FG(220)
- `textError` (string) defaults to BG(196),FG(255),BOLD
- `theme` (string) defaults to doubleLineBothSides
- `emoticons` (boolean) defaults to true
- `signs` (map) the emoticons to use (checkpoint, assert, print, error and time)
- `includeTime` (boolean) defaults to false

Sources:

- js/owrap.debug.js:107

<a id="api-ow-debug-load-01b76f22"></a>

## ow.debug.load

### ow.debug.load(aScript)

Equivalent to OpenAF's "load" but registering the debug preparser. The comments code that can be used are:

```javascript
//@  This is a checkpoint on the code you want to know it was reached
//#  assertVarA == assertVarB
//?  printVarA
//?s printInSLONVarA
//?y printInYAMLVarA
//[  begin of unique profile block
//]  end of unique profile block
```

Sources:

- js/owrap.debug.js:48

<a id="api-ow-debug-register-5296e019"></a>

## ow.debug.register

### ow.debug.register()

Registers the debug preparser.

Sources:

- js/owrap.debug.js:12

<a id="api-ow-debug-require-020c36d2"></a>

## ow.debug.require

### ow.debug.require(aScript, force)

Equivalent to OpenAF's "require" but registering the debug preparser. The comments code that can be used are:

```javascript
//@  This is a checkpoint on the code you want to know it was reached
//#  assertVarA == assertVarB
//?  printVarA
//?s printInSLONVarA
//?y printInYAMLVarA
//?t printInTableVarA
//?r printInTreeVarA
//{  begin of unique block with prefix
//}  end of unique block with prefix
//[  begin of unique profile block
//]  end of unique profile block
//{[ begin of unique profile block with prefix
//]} end of unique profile block with prefix
//+  incrementVarA
//-  decrementVarA
```

Sources:

- js/owrap.debug.js:73

<a id="api-ow-debug-unregister-ac5ffa59"></a>

## ow.debug.unregister

### ow.debug.unregister()

Unregisters the debug preparser.

Sources:

- js/owrap.debug.js:34

