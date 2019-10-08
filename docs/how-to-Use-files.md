# How to - Use files

All the functions to read and write files are organized under the object "IO" that can easily be use throw the variable "io".

## Read files

### Read a text file to a string

````javascript
var a_string = io.readFileString("abc123.txt");
````

All the contents of the "abc123.txt" file will assigned to the variable "a_string".

If the file is in a zip file you can use the shortcut ('::'):

````javascript
var a_string = io.readFileString("aZipFile.zip::abc123.txt")
````

### Read a text file as an array of strings

````javascript
var an_array = io.readFileAsArray("abc123.txt");
print(an_array[0]); // Print the first line
print(an_array[1]); // Print the second line
````

The variable "an_array" will have an entry for each line on the file "abc123.txt".

### Read a json file

````javascript
var a_json = io.readFile("abc123.json");
print(a_json.something); // prints the element 'something' from the json object
````

If the file is in a zip file you can use the shortcut ('::'):

````javascript
var a_json = io.readFile("aZipFile.zip::abc123.txt");
````

### Read a yaml file

````javascript
var a_json = io.readFileYAML("abc123.yaml");
print(a_json.something); // prints the element 'something' from the json object
````

Reads a json object from a YAML file.

## Write files

### Write a string to a text file

````javascript
var a_string = "The first line\nThe second line";
io.writeFileString("abc123.txt", a_string);
````

If you want to append lines instead of rewriting the entire file:

````javascript
io.writeFileString("abc123.log", "Another line\n", void 0, true);
````

### Write a text array to a text file

````javascript
var lines = [];
lines.push("The first line");
lines.push("The second line");
io.writeFileAsArray("abc123.txt", lines);
````

### Write a json object to a text file

````javascript
var obj = { x: -1, y: 1 };
io.writeFile("abc123.json", obj);
````

### Write a json object to a yaml file

````javascript
var obj = { x: -1, y: 1 };
io.writeFileYAML("abc123.yaml", obj);
````

## Handle newline delimited JSON files

### Read Newline delimited JSON from a text file

````javascript
io.readLinesNDJSON("abc123.json", (line) => { sprint(line); });
````

### Write a Newline delimited JSON to a text file

````javascript
var logline = { date: now(), level: "INFO", message: "a log message" };
io.writeLineNDJSON("abc123.json", logline);
````