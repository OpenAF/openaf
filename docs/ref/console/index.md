# Console

[Home](../index.md) / [All APIs](../all-apis.md) / [Console](index.md)

<a id="api-console-console-457db645"></a>

## Console.console

### Console.console()

Creates a new instance of the object Console.

Sources:

- src/openaf/plugins/Console.java:36

<a id="api-console-getconsolereader-8137a37f"></a>

## Console.getConsoleReader

### Console.getConsoleReader() : ConsoleReader

Returns the internal ConsoleReader java object.

Sources:

- src/openaf/plugins/Console.java:155

<a id="api-console-isansisupported-aad8c0b4"></a>

## Console.isAnsiSupported

### Console.isAnsiSupported() : boolean

Determines if the console is able to support ansi (returns true) or not (returns false).

Sources:

- src/openaf/plugins/Console.java:166

<a id="api-console-readchar-d3d311cc"></a>

## Console.readChar

### Console.readChar(allowed) : char

Read a character from the console. If allowed is provided only the characters on the string allowed will be considered.

Sources:

- src/openaf/plugins/Console.java:113

<a id="api-console-readcharb-cec2477f"></a>

## Console.readCharB

### Console.readCharB() : int

Low level character read from console with waiting. Will return -1 - EOF or -2 - No character available or the available character

Sources:

- src/openaf/plugins/Console.java:144

<a id="api-console-readcharnb-a1c12e34"></a>

## Console.readCharNB

### Console.readCharNB() : number

Low level character read from the console with no waiting. Will return -1 for EOF or -2 for No character available or the available character

Sources:

- src/openaf/plugins/Console.java:132

<a id="api-console-readline-8c89d178"></a>

## Console.readLine

### Console.readLine(aMaskchar) : String

Read a line from the console. Will provide a mask for introduction of passwords if aMaskchar is provided. Returns the line read. NOTE: Use Console.readLinePrompt if you are using a prompt.

Sources:

- src/openaf/plugins/Console.java:92

<a id="api-console-readlineprompt-725e0a39"></a>

## Console.readLinePrompt

### Console.readLinePrompt(aPrompt, aMaskchar) : String

Read a line from the console providing aPrompt. Will provide a mask for introduction of passwords if aMaskchar is provided. Returns the line read. NOTE: Use this method instead of Console.readLine if you are using a prompt

Sources:

- src/openaf/plugins/Console.java:68

