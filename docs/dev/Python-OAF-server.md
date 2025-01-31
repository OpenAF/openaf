# Python OAF Server

## Messages between client and server

The client should connect to the provided socket TCP port and interact using JSON. 

### Evaluate code

| Element | Mandatory | Description |
|---------|-----------|-------------|
| e       | Yes | Expression to evaluate |
| t       | Yes | Token to authorize access |

The result will the literal result value of the expression evaluation. If there is an exception during the expression evaluation it will be returned as "__OAF__Exception: <exception text>".

**Example 1:**

Client:

```json
{ e: "2 + 2", t: "123abc" }
```

Server:

```json
4
```

**Example 2:**

Client:

```json
{ e: "({ x: 123, y: 'abc' })}", t: "123abc" }
```

Server:

```json
{"x":123,"y","abc"}
```