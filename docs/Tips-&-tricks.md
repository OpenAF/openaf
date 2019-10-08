The idea of this page is to list some useful code snippets. Please always indicate if it needs to use any specific plugin or oPack.

## Variable checks

### Checking if provided file exists

````javascript
function doStuffWithFiles(aFile) {
   aFile = _$(aFile)
           .isString("The aFile argument provided needs to be a string.")
           .check(io.fileExists, "The provided aFile doesn't exist.")
           .$_("You need to provide aFile.");

   ...
}
````

## OpenAF-console

### [Increasing the history size for openaf-console](https://openafs.blogspot.com/2019/08/increasing-history-size-for-openaf.html)



### Quick shell and shell commands from openaf-console

Just create an alias like this in Windows:

````javascript
> alias cmd=sh("cmd " + (__aliasparam.trim().length>0 ? "/c " + __aliasparam : ""), void 0, void 0, true)
````

or like this in cygwin:

````javascript
> alias cmd=sh("bash " + (__aliasparam.trim().length>0 ? "-c " + __aliasparam : ""), void 0, void 0, true)
````

or like this in unix:

````javascript
> alias cmd=sh("stty icanon echo 2>/dev/null && /bin/bash "+(__aliasparam.trim().length>0?" -c "+__aliasparam:"") + " && stty -icanon min 1 -echo 2>/dev/null",void 0,void 0,true)
````

Then to use it if just execute "cmd" you will get the full shell and exit will get you back to openaf-console. If you execute "cmd someCommand" the command will be executed.

_Note: nightly builds include an equivalent openaf-console alias "sh"._

## Operating system

### Clipboard interaction

How to get a string from the operating system clipboard:

````javascript
> var clipboard = java.awt.Toolkit.getDefaultToolkit().getSystemClipboard();
> clipboard.getData(java.awt.datatransfer.DataFlavor.stringFlavor);
````

How to set a string to the operating system clipboard:

````javascript
> var clipboard = java.awt.Toolkit.getDefaultToolkit().getSystemClipboard();
> clipboard.setContents(new java.awt.datatransfer.StringSelection("something on the clipboard"), null)
````