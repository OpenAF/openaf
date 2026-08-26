# OpenAF Interactive Notebooks (oBook) Guide

`ow.oBook` is OpenAF's interactive notebook and tutorial system. It allows developers and operators to run Markdown-based interactive guides, step-by-step walkthroughs, and executable tutorials directly in the OpenAF terminal or REPL.

---

## Table of Contents
1. [Overview](#overview)
2. [Running oBook Tutorials](#running-obook-tutorials)
3. [Authoring oBook Markdown Guides](#authoring-obook-markdown-guides)
4. [oBook Architecture & JavaScript API (`ow.oBook.book`)](#obook-architecture--javascript-api-owobookbook)
5. [Interactive REPL Navigation & Keyboard Controls](#interactive-repl-navigation--keyboard-controls)

---

## Overview

`oBook` transforms standard Markdown documentation into an interactive terminal notebook. When executing an `oBook`, explanations are printed using rich terminal formatting, while embedded JavaScript code blocks are automatically staged into the terminal REPL prompt for execution or step-by-step confirmation.

Key capabilities:
* Interactive terminal walkthroughs of Markdown documents.
* Automatic staging of single-line and multi-line code blocks into the REPL prompt.
* Variable context persistence between notebook steps.
* Terminal sidebar rendering and syntax highlighting.
* Dependency auto-inclusion (`*requires <opack> >= <version>*`).

---

## Running oBook Tutorials

Launch an `oBook` tutorial from the command line:

```bash
# Run an oBook markdown file
openaf --obook guide.md

# Or execute via global obook helper
oaf --exec "obook('tutorial.md', true)"
```

---

## Authoring oBook Markdown Guides

An `oBook` guide is standard GitHub Flavored Markdown with specific annotations for step management, dependencies, and code blocks:

````markdown
# Welcome to OpenAF Basics Tutorial

*requires oafp >= 20230101*

In this tutorial, you will learn how to create channels and query data.

## Step 1: Create a Channel

Run the following code block to create a simple in-memory channel:

```javascript
ow.ch.create("users", true, "simple");
$ch("users").set({ id: 1 }, { id: 1, name: "Alice", role: "admin" });
```

## Step 2: Query the Channel

Now let me query the channel data:

```javascript
var admin = $ch("users").get({ id: 1 });
print("User: " + admin.name);
```
````

### Special oBook Syntax & Directives

| Directive | Purpose | Example |
| :--- | :--- | :--- |
| `*requires <package> >= <ver>*` | Automatically installs or includes required oPack. | `*requires oafp >= 20230101*` |
| ```` ```javascript ```` | Executable JS code block staged into prompt. | Standard code block. |
| `<!-- obook: pause -->` | Halts execution until user presses Enter. | Pause before next section. |
| `<!-- obook: silent -->` | Executes code block automatically without confirmation. | Background setup tasks. |

---

## oBook Architecture & JavaScript API (`ow.oBook.book`)

### `ow.oBook.book(aBook, exitOnEnd)`
Instantiates an `oBook` instance.

* **`aBook`**: File path, Markdown string, or pre-parsed section array.
* **`exitOnEnd`**: Boolean (default `false`). If `true`, invokes `exit(0)` when the notebook completes.

### API Methods
* `bookStart()`: Renders top start banner `(📖 obook start)` with curved border theme.
* `bookEnd()`: Restores console hooks and renders end banner `(📖 obook end)`.
* `parse()`: Scans dependencies, strips code blocks, and builds step array `{ text, code }`.
* `printPart(partId)`: Formats step header `[partId/total]`, prints text box, and stages code block into REPL buffer.
* `interaction()`: Handles terminal keyboard inputs for navigation.

### Global Helper Function
```javascript
// Instantiates global._obook and registers REPL console hooks
obook("tutorial.md", true);
```

---

## Interactive REPL Navigation & Keyboard Controls

When `oBook` executes in an interactive terminal, the user can navigate steps using single keypresses:

| Keypress | Action |
| :--- | :--- |
| **`[Enter]`** or **`[Space]`** | Advance to next step / execute staged code block. |
| **`[Down Arrow]`** | Advance to next step. |
| **`[Up Arrow]`** | Go back to previous step. |
| **`[Ctrl+U]`** | Suspend oBook execution and drop back to interactive OpenAF console prompt. |
| **`'q'`** or **`[Escape]`** | Quit oBook. |
