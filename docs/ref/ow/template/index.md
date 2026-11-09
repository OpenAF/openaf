# ow.template

[Home](../../index.md) / [All APIs](../../all-apis.md) / [ow](../index.md) / [ow.template](index.md)

## Subcategories

- [ow.template.html](html/index.md)
- [ow.template.md](md/index.md)

<a id="api-ow-template-addconditionalhelpers-25a2d6eb"></a>

## ow.template.addConditionalHelpers

### ow.template.addConditionalHelpers()

Adds helper functions equivalent to assemble.io comparison helpers starting with "$" See more in http://assemble.io/helpers/helpers-comparison.html

Sources:

- js/owrap.template.js:402

<a id="api-ow-template-addformathelpers-5127d456"></a>

## ow.template.addFormatHelpers

### ow.template.addFormatHelpers()

Adds all functions of ow.format as helpers with the prefix owFormat&#95;.

Sources:

- js/owrap.template.js:386

<a id="api-ow-template-addhelper-672ec6e7"></a>

## ow.template.addHelper

### ow.template.addHelper(aHelperName, aFunction)

Adds aFunction as aHelperName.

Sources:

- js/owrap.template.js:527

<a id="api-ow-template-addhelpers-878f2efb"></a>

## ow.template.addHelpers

### ow.template.addHelpers(aPrefix, aObject)

Registers all `aObject` functions as helpers. These helpers identifier will be composed by `aPrefix` + Name of the each function.

(available after `ow.loadTemplate()`)

Sources:

- js/owrap.template.js:31

<a id="api-ow-template-addinlinecss2html-e91e0f85"></a>

## ow.template.addInLineCSS2HTML

### ow.template.addInLineCSS2HTML(aHTML, aCustomCSSMap) : String

Given aHTML (usually the result of parseMD2HTML) applies a custom inline css (aCustomCSSMap) usually useful to send HTML to  email clients. This custom map should be composed of a html tag entity tag (e.g. "p") and, as value, the css style to apply (e.g. "color: red;"). The map will be applied to all html entities on aHTML. If aCustomCSSMap is not provided a default one (suited for markdown html) will be applied.

Sources:

- js/owrap.template.js:1436

<a id="api-ow-template-addopenafhelpers-b9444428"></a>

## ow.template.addOpenAFHelpers

### ow.template.addOpenAFHelpers()

Adds custom helpers:

- `$debug`: calls sprint for the parameter
- `$stringify`: stringify the parameter
- `$stringifyInLine`: stringify in the same line the parameter
- `$toYAML`: returns the YAML version of the parameter
- `$toKYAML`: returns the KYAML version fo the parameter
- `$toJSON`: returns the JSON version of the parameter
- `$toTOON`: returns the TOON version of the parameter
- `$env`: returns the current environment variable identified by the parameter
- `$escape`: returns an escaped version of the parameter
- `$acolor`: returns an ansi color (first argument) escape sequence of the string parameter (second argument)
- `$f`: uses the `$f` format function
- `$ft`: uses the `$ft` format function
- `$path`: uses the `$path` function to query objects
- `$from`: uses the `$from` & fromNLinq to query objects
- `$oafp`: uses the oafp function to parse the provided JSON/SLON string and return the results
- `$toSLON`: returns the `ow.format.toSLON` version of an object
- `$get`: returns the corresponding value for a key on `$get`
- `$getObj`: equivalent to `$get` with the extra parameter for `$$.get` path
- `$dateDiff`: returns a number of seconds for a provided date optionally (second argument) with minutes, hours, days, months, weeks or years and (third argument) a default value
- `$switch`: equivalent to a javascript switch
- `$case`: to be used with `$switch` for each case
- `$default`: to be used with `$switch` for each case
- `$ptable`: returns an ansi ascii printTable representation of an object
- `$mdtable`: returns a markdown table representation of an array object
- `$ptree`: returns an ansi ascii printTree representation of an object
- `$pchart`: returns an ansi ascii line chart with an object and a format string: "unit path:color:legend... [-min:0] [-max:100] [-hsize:40] [-vsize:10]"
- `$pbar`: returns an ansi ascii progress bar with a value and a max value, a min value, a size, an indicator and space char
- `$pbars`: returns an ansi ascii tree of progress bars with a format string: "unit path:color:legend... [-min:0] [-max:100] [-hsize:40]"
- `$output`: returns an `$output` representation of an object (`aObj` as 1st arg and options in slon as 2nd arg)
- `$cjson`: returns an ansi ascii colority representation fo an object
- `$cslon`: returns an ansi ascii colored SLON representation of an object
- `$pmap`: returns an ansi ascii printMap representation of an object
- `$jsmap`: returns a HTML representation of an object
- `$t`: given a template and an object instance, as arguments, will process and return the template
- `$date`: converts the argument provided to date
- `$isoDate`: converts the argument provided to an ISO date string
- `$number`: casts the argument provided to number
- `$boolean`: casts the argument provided to boolean
- `$string`: casts the argument provided to string
- `$keys`: returns an array of keys of the provided map
- `$values`: returns an array of values of the provided map
- `$__`: returns a undefined value
- `$alen`: returns the ansi length of the argument provided
- `$len`: returns the string length of the argument provided
- `$repeat`: shortcut to the OpenAF's repeat function
- `$range`: shortcut to the OpenAF's range function
- `$a2m`: shortcut to the OpenAF's `$a2m` function
- `$a4m`: shortcut to the OpenAF's `$a4m` function
- `$m2a`: shortcut to the OpenAF's `$m2a` function
- `$m4a`: shortcut to the OpenAF's `$m4a` function
- `$nvl`: shortcut to the OpenAF's nvl function
- `$pass`: returns an empty string
- `$p`: returns the provided literal
- `$sline`: shortcut to the OpenAF's format withSideLine
- `$set`: block set of a provided key
- `$concat`: concatenates all arguments as a single value
- `$nl`: returns a new line character

Sources:

- js/owrap.template.js:66

<a id="api-ow-template-addpartial-179d384d"></a>

## ow.template.addPartial

### ow.template.addPartial(aPartialName, aSource)

Registers aSource template as a reusable aPartialName in other templates.

Sources:

- js/owrap.template.js:559

<a id="api-ow-template-compile-22ab6a6d"></a>

## ow.template.compile

### ow.template.compile(aSource, anOptionsMap) : String

Tries to precompile aSource and returns a String that can be used with ow.template.execCompiled. Optionally you can provide anOptionsMap for the Handlebars precompiler (see more on ow.template.saveCompiledHBS).

Sources:

- js/owrap.template.js:743

<a id="api-ow-template-delhelper-ac1929c6"></a>

## ow.template.delHelper

### ow.template.delHelper(aHelperName)

Unregister aHelperName that had been previously added with ow.template.addHelper.

Sources:

- js/owrap.template.js:543

<a id="api-ow-template-delpartial-4a7674d4"></a>

## ow.template.delPartial

### ow.template.delPartial(aPartialName)

Unregisters aPartialName that had been previously added with ow.template.addPartial

Sources:

- js/owrap.template.js:583

<a id="api-ow-template-execcompiled-d41e09b7"></a>

## ow.template.execCompiled

### ow.template.execCompiled(aCompiledObject) : Function

Tries to execute a previously precompiled Handlebars template (for example, using ow.template.compile) and return it as a Handlebars template functions.

Sources:

- js/owrap.template.js:762

<a id="api-ow-template-gettemplate-7a3f833a"></a>

## ow.template.getTemplate

### ow.template.getTemplate(aSource) : Function

Returns a template function, given aSource, that accepts an object as argument and returns the correspoding template filled with the values provided.

Sources:

- js/owrap.template.js:595

<a id="api-ow-template-loadcompiledhbs-cd7e87d2"></a>

## ow.template.loadCompiledHBS

### ow.template.loadCompiledHBS(aFilename) : Function

Tries to load a previously precompiled Handlebars template (for example, using ow.template.saveCompiledHBS) and return it as a Handlebars template functions.

Sources:

- js/owrap.template.js:781

<a id="api-ow-template-loadhbss-cb523f57"></a>

## ow.template.loadHBSs

### ow.template.loadHBSs(aMapOfHBSs) : Function

Given a map where the key is a hbs template key and the value is the filepath of a HBS file, will pre-compile the HBS files and return a function(key, data). This function can be used to execute a the pre-compiled templates using the hbs template key and passing the corresponding data map to be used on that template returning the template parsed. Note: the filepath can indicate a file inside a zip file like 'some/path/a.zip::file'.

Sources:

- js/owrap.template.js:655

<a id="api-ow-template-loadpartialhbs-375c3b94"></a>

## ow.template.loadPartialHBS

### ow.template.loadPartialHBS(aMapOfParialHBSs)

Given a map where the key is a partial hbs template key and the value is the filepath of a HBS file, will load it and add it as a template partial. Note: the filepath can indicate a file inside a zip file like 'some/path/a.zip::file'.

Sources:

- js/owrap.template.js:681

<a id="api-ow-template-parse-c8a43525"></a>

## ow.template.parse

### ow.template.parse(aSource, someData) : String

Returns the results of using someData to the template defined on the aSource provided. Note: for parallel processing you should use ow.template.compile since Handlebars might not be thread-safe.

Sources:

- js/owrap.template.js:614

<a id="api-ow-template-parsehbs-236370fe"></a>

## ow.template.parseHBS

### ow.template.parseHBS(aFilename, someData) : String

Returns the results of using someData with the template defined on aFilename (tip: use the extension hbs).

Sources:

- js/owrap.template.js:635

<a id="api-ow-template-parsemd2html-a636dcd9"></a>

## ow.template.parseMD2HTML

### ow.template.parseMD2HTML(aMarkdownString, isFull, removeMaxWidth, extraDownOptions, forceDark) : String

Given `aMarkdownString` will parse it with showdown (using the github flavor) and return the HTML in a string. If `isFull` = true
it will produce a complete HTML with references for the highlight library+css and github markdown css included internally in OpenAF.
If `removeMaxWidth` = true it will remove the max-width css style. You can provide `extraDownOptions` to be used with showdown and
`forceDark` to force the dark mode.
Example:

```javascript
ow.server.httpd.route(hs, ow.server.httpd.mapRoutesWithLibs(hs, {
   "/md": (req) => { return hs.replyOKHTML(ow.template.parseMD2HTML(io.readFileString("README.md"), true)) }
}), (req) => { return hs.replyOKText("nothing here...");})
```

Sources:

- js/owrap.template.js:800

<a id="api-ow-template-savecompiledhbs-33898e36"></a>

## ow.template.saveCompiledHBS

### ow.template.saveCompiledHBS(aFilename, aSource, anOptionsMap)

Tries to precompile `aSource` and save the result into `aFilename` (tip: use the extension hbsc).
This can later be loaded again using `ow.template.loadCompiledHBS`, for example.
Optionally you can provide `anOptionsMap` for the Handlebars precompiler (see more on the options for Handlebars.precompile).
Example:

```javascript
var source = "My name is {{myname}}. I'm a\n{{#each role}}\t- {{this}}\n{{/each}}";
ow.template.saveCompiledHBS("myroles.hbsc", source, {
   "knownHelpers": { each: true }, "knownHelpersOnly": true
});
```

Sources:

- js/owrap.template.js:721

<a id="api-ow-template-savehbs-b9c4b4fb"></a>

## ow.template.saveHBS

### ow.template.saveHBS(aFilename, aSource)

Saves aSource Handlebars template into aFilename (tip: use the extension hbs).

Sources:

- js/owrap.template.js:711

<a id="api-ow-template-unloadpartialhbss-c749d3ee"></a>

## ow.template.unloadPartialHBSs

### ow.template.unloadPartialHBSs(aMapOFPartialHBSs)

Given the same map provided to ow.template.loadPartialHBS will actually unload them as template partials.

Sources:

- js/owrap.template.js:699

