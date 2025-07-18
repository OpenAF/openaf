# OpenAF Reference Guide

## Overview

OpenAF is a comprehensive JavaScript framework that extends the Mozilla Rhino JavaScript interpreter with powerful helper functions, wrappers, and utilities for Java environments. This reference guide covers the core extensions and helper libraries provided by OpenAF.

## Table of Contents

1. [Core Helper Functions](#core-helper-functions)
2. [OpenWrap Extensions](#openwrap-extensions)
3. [nLinq - Query Processing](#nlinq---query-processing)
4. [Security Features](#security-features)
5. [Server Management](#server-management)
6. [Template Engine](#template-engine)
7. [Testing Framework](#testing-framework)
8. [Python Integration](#python-integration)
9. [Parsing Utilities](#parsing-utilities)
10. [Data Validation](#data-validation)

---

## Core Helper Functions

OpenAF provides several fundamental helper functions that extend standard JavaScript capabilities:

### $$ - Enhanced Object Inspection

The `$$()` function provides advanced object introspection and manipulation capabilities:

```javascript
// Check object types
$$(myVar).isString()    // Returns true if myVar is a string
$$(myVar).isNumber()    // Returns true if myVar is a number
$$(myVar).isArray()     // Returns true if myVar is an array
$$(myVar).isMap()       // Returns true if myVar is an object/map
$$(myVar).isFunction()  // Returns true if myVar is a function
$$(myVar).isDate()      // Returns true if myVar is a Date
$$(myVar).isDef()       // Returns true if myVar is defined
$$(myVar).isUnDef()     // Returns true if myVar is undefined

// Object property access with dot notation
var obj = { user: { name: "John", age: 30 } };
$$(obj).get("user.name")           // Returns "John"
$$(obj).set("user.email", "john@example.com")  // Sets nested property
$$(obj).unset("user.age")          // Removes property

// Case-insensitive property access
$$(obj).getI("USER.NAME")          // Gets "user.name" case-insensitively
```

### _$ - Parameter Validation

The `_$()` function provides robust parameter validation and type checking:

```javascript
// Basic validation
_$(username, "username").isString().$_();           // Throws if not string
_$(age, "age").isNumber().default(18);              // Defaults to 18 if undefined
_$(email, "email").isString().notEquals("");        // Must be non-empty string

// Chained validations
_$(config, "config")
  .isMap()
  .isNotNull()
  .$_();

// Type conversion
_$(value, "value").toNumber();      // Converts to number
_$(value, "value").toString();      // Converts to string
_$(value, "value").toBoolean();     // Converts to boolean
_$(value, "value").toArray();       // Converts to array
_$(value, "value").toDate();        // Converts to Date

// Advanced validations
_$(id, "id").isUUID();              // Validates UUID format
_$(data, "data").isSchema(schema);  // Validates against JSON schema
_$(items, "items").oneOf([1,2,3]);  // Must be one of specified values
_$(range, "range").between(1, 100); // Must be between 1 and 100
```

---

## OpenWrap Extensions

OpenWrap provides modular extensions to the OpenAF framework through the `ow` namespace:

### ow.format - Formatting Utilities

```javascript
ow.loadFormat();

// String formatting
ow.format.string.genPass(12, ["lowercase", "uppercase", "numbers"]);  // Generate password
ow.format.string.unicode(0x1F37A);        // Unicode character conversion

// Date formatting
ow.format.fromDate(new Date(), "yyyy-MM-dd HH:mm:ss");
ow.format.toDate("2023-12-25", "yyyy-MM-dd");

// Number formatting
ow.format.round(3.14159, 2);              // 3.14
ow.format.toBytesAbbreviation(1048576);   // "1 MB"

// Network utilities
ow.format.testPort("127.0.0.1", 8080, 5000);  // Test if port is open
```

### ow.obj - Object Utilities and REST Client

The `ow.obj` module provides a wide range of utilities for object manipulation, database interaction, and a powerful REST client.

#### REST Client

```javascript
// Simple GET request
var data = ow.obj.rest.jsonGet("https://api.example.com/data");
print(data);

// POST request with JSON data
var postData = { name: "John Doe", email: "john.doe@example.com" };
var res = ow.obj.rest.jsonPost("https://api.example.com/users", postData);
print(res);

// Full response details
var fullResponse = ow.obj.rest.get("https://api.example.com/data");
print("Status Code: " + fullResponse.responseCode);
print("Headers: " + af.toSLON(fullResponse.headers));
print("Content: " + fullResponse.response);
```

### ow.ai - Artificial Intelligence

The `ow.ai` module provides access to AI models and functionalities.

```javascript
// Perform linear regression
var data = [[0, 1], [1, 3], [2, 5]];
var result = ow.ai.regression().linear(data);
print("Linear regression: y = " + result.string);

// Create a values array
var values = ow.ai.valuesArray(5);
values.push(10);
values.push(12);
values.push(11);
print("Moving average: " + values.movingAverage());

// Example of using a generic AI provider (e.g., OpenAI)
// ow.ai.chat({
//   key: "YOUR_API_KEY",
//   type: "openai",
//   model: "gpt-3.5-turbo",
//   messages: [ { role: "user", content: "Hello!" } ]
// })
```

### ow.net - Network Utilities

The `ow.net` module provides a collection of network-related utilities.

```javascript
// Get public IP information
var ipInfo = ow.net.getPublicIP();
print("Public IP: " + ipInfo.ip);
print("Country: " + ipInfo.country);

// Get current time from a time server
var currentTime = ow.net.getActualTime();
print("Current time: " + currentTime);

// Get TLS certificates from a server
var certs = ow.net.getTLSCertificates("openaf.io");
print(certs);
```

### ow.ch - Channels

The `ow.ch` module provides a powerful system for creating and managing channels. Channels can act as in-memory key/value stores, publish/subscribe message brokers, and a foundation for peer-to-peer data exchange and remote execution.

#### Basic Channel Management

```javascript
// Create a new in-memory channel
ow.ch.new("myChannel", "mem");

// Set and get values
ow.ch.set("myChannel", "user:1", { name: "John", age: 30 });
var user = ow.ch.get("myChannel", "user:1");
print(user.name); // John

// Get all keys
var keys = ow.ch.getKeys("myChannel");
print(keys); // ["user:1"]

// Get channel size
var size = ow.ch.size("myChannel");
print(size); // 1

// Destroy a channel
ow.ch.destroy("myChannel");
```

#### Publish/Subscribe

```javascript
// Create a channel for messaging
ow.ch.new("news", "mem");

// Subscribe to the channel
var subId = ow.ch.sub("news", (key, value) => {
  print(`Received news on key '${key}': ${value.title}`);
});

// Publish a message
ow.ch.pub("news", "sports", { title: "Team A wins championship!" });

// Unsubscribe
ow.ch.unsub("news", subId);
```

#### Peer-to-Peer Communication

Channels can be synchronized across different OpenAF instances.

```javascript
// Peer 1 (on port 8080)
ow.ch.initPeer("peer1", 8080);

// Peer 2 (on port 8081)
ow.ch.initPeer("peer2", 8081);
// Add Peer 1 as a known peer
ow.ch.addPeer("http://localhost:8080");

// Now, channels created with the 'big' type will be synchronized
ow.ch.new("sharedData", "big");

// A 'set' on Peer 2 will be reflected on Peer 1
ow.ch.set("sharedData", "someKey", "someValue");
```

---

## nLinq - Query Processing

nLinq provides LINQ-like query capabilities for JavaScript arrays and objects:

### Basic Usage

```javascript
var data = [
  { name: "John", age: 25, city: "New York" },
  { name: "Jane", age: 30, city: "Boston" },
  { name: "Bob", age: 35, city: "Chicago" }
];

// Basic filtering
var adults = $from(data).greater("age", 25).select();
// Returns: [{ name: "Jane", age: 30, city: "Boston" }, { name: "Bob", age: 35, city: "Chicago" }]

// Chained operations
var result = $from(data)
  .contains("city", "New")
  .or()
  .greater("age", 30)
  .select();
```

### Query Methods

```javascript
// Comparison operators
$from(data).equals("name", "John")
$from(data).greater("age", 25)
$from(data).less("age", 40)
$from(data).greaterEquals("age", 30)
$from(data).lessEquals("age", 35)
$from(data).between("age", 25, 35)
$from(data).betweenEquals("age", 25, 35)

// String operations
$from(data).starts("name", "J")
$from(data).ends("name", "n")
$from(data).contains("city", "New")
$from(data).match("name", /^J/)

// Logical operators
$from(data).and()
$from(data).or()
$from(data).not()
$from(data).andNot()
$from(data).orNot()

// Grouping
$from(data).begin()  // Start grouping
$from(data).end()    // End grouping
```

### Aggregation Functions

```javascript
// Statistical operations
$from(data).min("age")        // Returns person with minimum age
$from(data).max("age")        // Returns person with maximum age
$from(data).average("age")    // Returns average age
$from(data).sum("age")        // Returns sum of ages
$from(data).count()           // Returns count of items

// Grouping operations
$from(data).group("city")     // Group by city
$from(data).groupBy("city,age") // Group by multiple fields
$from(data).distinct("city")  // Get unique cities
```

### Data Manipulation

```javascript
// Sorting
$from(data).sort("age")           // Sort by age ascending
$from(data).sort("-age")          // Sort by age descending
$from(data).sort("city", "age")   // Sort by multiple fields

// Limiting and paging
$from(data).limit(5)              // Take first 5 items
$from(data).skip(2)               // Skip first 2 items
$from(data).skipTake(2, 3)        // Skip 2, take 3
$from(data).head(3)               // Take first 3
$from(data).tail(3)               // Take last 3

// Transformations
$from(data).select(item => ({ name: item.name, isAdult: item.age >= 18 }))
$from(data).attach("isAdult", person => person.age >= 18)
$from(data).detach("age")         // Remove age field
```

### Set Operations

```javascript
var data1 = [{ id: 1, name: "John" }, { id: 2, name: "Jane" }];
var data2 = [{ id: 2, name: "Jane" }, { id: 3, name: "Bob" }];

$from(data1).union(data2)         // Union of both arrays
$from(data1).intersect(data2)     // Intersection
$from(data1).except(data2)        // Items in data1 but not in data2
$from(data1).cartesian(data2)     // Cartesian product
```

### Advanced Features

```javascript
// Case sensitivity
$from(data).useCase(true)         // Enable case sensitivity
$from(data).ignoreCase()          // Disable case sensitivity

// Custom functions
$from(data).where(person => person.age > 25 && person.city.startsWith("N"))

// Stream processing
$from(data).stream(batch => {
  // Process batch of items
  print("Processing:" + batch);
});
```

---

## Security Features

### ow.sec - Security Buckets

OpenAF provides secure storage through SBuckets (Secure Buckets):

```javascript
ow.loadSec();

// Initialize secure storage
ow.sec.openMainSBuckets("myMainSecret");

// Using $sec shortcut
var secBucket = $sec("myRepo", "defaultBucket", "lockSecret", "mainSecret");

// Store and retrieve secrets
secBucket.setSecret("myBucket", "lockSecret", "apiKey", { 
  key: "abc123", 
  url: "https://api.example.com" 
});

var secret = secBucket.getSecret("myBucket", "lockSecret", "apiKey");
print(secret.key); // "abc123"

// Close secure storage
ow.sec.closeMainSBuckets();
```

### Features

- **Encrypted Storage**: All data is encrypted using strong encryption
- **Access Control**: Lock secrets provide access control
- **Multiple Repositories**: Support for multiple secure repositories
- **Automatic Cleanup**: Secure cleanup of sensitive data in memory

---

## Server Management

### ow.server - Server Utilities

```javascript
ow.loadServer();

// Process management
var isRunning = ow.server.checkIn("server.pid", 
  function(existingPid) {
    log("Server already running with PID: " + existingPid);
    return false; // Exit if already running
  },
  function() {
    log("Shutting down gracefully...");
    // Cleanup code here
  }
);

// Argument processing
ow.server.processArguments(function(param) {
  if (typeof param === "string") {
    log("Command: " + param);
  } else if (Array.isArray(param)) {
    log("Parameter: " + param[0] + " = " + param[1]);
  }
});

// Example usage with command line: openaf -e "start port=8080 debug=true"
// Will call function with: "start", ["port", "8080"], ["debug", "true"]
```

---

## Template Engine

### ow.template - Handlebars Integration

```javascript
ow.loadTemplate();

// Basic templating
var template = "Hello {{name}}, you are {{age}} years old!";
var data = { name: "John", age: 25 };
var result = ow.template.execTemplate(template, data);
// Result: "Hello John, you are 25 years old!"

// Register custom helpers
ow.template.addHelpers("my", {
  upper: function(str) { return str.toUpperCase(); },
  formatDate: function(date) { return ow.format.fromDate(date, "yyyy-MM-dd"); }
});

// Use custom helpers in templates
var template2 = "Welcome {{my_upper name}} on {{my_formatDate today}};
var result2 = ow.template.execTemplate(template2, { 
  name: "john", 
  today: new Date() 
});
```

### Features

- **Handlebars Integration**: Full Handlebars.js support
- **Custom Helpers**: Easy registration of custom helper functions
- **Markdown Support**: Built-in markdown processing capabilities
- **Source Path Tracking**: Template source location tracking

---

## Testing Framework

### ow.test - Testing Utilities

```javascript
ow.loadTest();

// Basic assertions
ow.test.assert(actual, expected, "Values should be equal");
ow.test.assert(user.name, "John", "User name should be John");

// Test configuration
ow.test.setOutput(true);           // Enable test output (default)
ow.test.setShowStackTrace(true);   // Show Java stack traces
ow.test.setMemoryProfile(true);    // Track memory usage

// Performance profiling
ow.test.profile("myOperation", function() {
  // Code to profile
  someExpensiveOperation();
});

// Get profiling results
var hits = ow.test.getProfileHits("myOperation");
var avgTime = ow.test.getProfileAvg("myOperation");
var maxTime = ow.test.getProfileMax("myOperation");

// Test counters
var totalTests = ow.test.getCountTest();
var passedTests = ow.test.getCountPass();
var failedTests = ow.test.getCountFail();

// Reset counters
ow.test.reset();
```

### Example Test Suite

```javascript
function testUserValidation() {
  ow.test.assert(validateUser({name: "John", age: 25}), true, "Valid user should pass");
  ow.test.assert(validateUser({name: "", age: 25}), false, "Empty name should fail");
  ow.test.assert(validateUser({name: "John", age: -1}), false, "Negative age should fail");
}

testUserValidation();
print("Tests passed: " + ow.test.getCountPass());
print("Tests failed: " + ow.test.getCountFail());
```

---

## Python Integration

### ow.python - Python Interoperability

```javascript
ow.loadPython();

// Set Python interpreter path (optional)
ow.python.setPython("/usr/bin/python3");

// Check Python version
print("Python version:" + ow.python.getVersion());

// Execute Python code with variable exchange
var result = ow.python.exec(
  "c = a + b\nresult = c * 2", 
  { a: 5, b: 3 },           // Input variables
  ["c", "result"]           // Output variables to capture
);

print(result.c);      // 8
print(result.result); // 16

// Execute with persistent map
var pythonMap = { counter: 0, data: [] };
ow.python.execPM(`
counter += 1
data.append("item_" + str(counter))
total = len(data)
`, pythonMap);

print(pythonMap.counter); // 1
print(pythonMap.data);    // ["item_1"]
print(pythonMap.total);   // 1
```

### Server Mode

```javascript
// Start Python server for persistent communication
ow.python.startServer();

// Execute multiple operations efficiently
var result1 = ow.python.exec("x = 10\ny = x * 2", {}, ["y"]);
var result2 = ow.python.exec("z = y + 5", {}, ["z"]); // y persists from previous call

// Stop server when done
ow.python.stopServer();
```

### Features

- **Variable Exchange**: Seamless data exchange between JavaScript and Python
- **Multiple Execution Modes**: Direct execution or persistent server mode
- **Error Handling**: Comprehensive error reporting and exception handling
- **Performance**: Server mode for high-performance repeated operations

---

## Parsing Utilities

OpenAF includes several specialized parsers:

### SLON Parser

SLON (Simple Lightweight Object Notation) is a simplified JSON-like format:

```javascript
// Parse SLON format
var slonData = "[name: John, age: 25, active: true]";
var parsed = SLON.parse(slonData);
print(parsed); // { name: "John", age: 25, active: true }
```

### nLinq Parser

Advanced query parsing for nLinq expressions:

```javascript
// Parse complex nLinq queries
var query = "name.equals('John').and().age.greater(25)";
var parsedQuery = nLinqParse(query);
// Returns parsed query structure for execution
```

---

## Data Validation

### Schema Validation

```javascript
// JSON Schema validation
var schema = {
  type: "object",
  properties: {
    name: { type: "string", minLength: 1 },
    age: { type: "number", minimum: 0 },
    email: { type: "string", format: "email" }
  },
  required: ["name", "age"]
};

var user = { name: "John", age: 25, email: "john@example.com" };

// Validate using $$
var isValid = $$(user).isSchema(schema);

// Validate using _$ with error throwing
_$(user, "user").isSchema(schema).$_();
```

### Custom Validation

```javascript
// Custom validation functions
_$(value, "value").check(v => v > 0 && v < 100, "Value must be between 0 and 100");

// Expression-based validation
_$(user, "user").expr("v.age >= 18", "User must be an adult");
```

---

## Best Practices

### Error Handling

```javascript
try {
  _$(config, "configuration")
    .isMap()
    .isNotNull()
    .$_();
    
  var result = $from(data)
    .equals("status", "active")
    .greater("score", 50)
    .select();
    
} catch (e) {
  printErr("Validation error:" + e);
}
```

### Performance Optimization

```javascript
// Use nLinq streaming for large datasets
$from(largeDataset)
  .equals("type", "premium")
  .stream(function(batch) {
    // Process in batches to avoid memory issues
    processBatch(batch);
  });

// Use Python server mode for repeated operations
ow.python.startServer();
for (var i = 0; i < 1000; i++) {
  var result = ow.python.exec("process_data(" + i + ")", {}, ["result"]);
}
ow.python.stopServer();
```

### Security Best Practices

```javascript
// Always use secure storage for sensitive data
ow.sec.openMainSBuckets(process.env.MASTER_SECRET);
$sec().setSecret("production", "apiKeys", "service1", {
  key: sensitiveApiKey,
  created: new Date()
});

// Validate all inputs
function processUser(userData) {
  _$(userData, "userData")
    .isMap()
    .isNotNull()
    .$_();
    
  _$(userData.email, "email")
    .isString()
    .check(email => email.includes("@"), "Invalid email format")
    .$_();
}
```

---

## Conclusion

OpenAF provides a rich ecosystem of helper functions and utilities that extend JavaScript capabilities in Java environments. The framework emphasizes:

- **Type Safety**: Comprehensive validation and type checking
- **Performance**: Efficient data processing and query capabilities  
- **Security**: Built-in secure storage and data protection
- **Interoperability**: Seamless integration with Python and other systems
- **Developer Experience**: Intuitive APIs and comprehensive error handling

This reference guide covers the core functionality, but OpenAF includes many additional utilities and extensions. Refer to the individual module documentation for complete API details.
