// A real process boundary used by portable facade tests; no display/toolkit.
var input = new java.io.BufferedReader(new java.io.InputStreamReader(java.lang.System['in'], "UTF-8"));
var line;
while ((line = input.readLine()) != null) {
  var r = JSON.parse(String(line));
  if (r.version != 1 || !r.sessionId || !r.requestId) exit(2);
  if (r.operation == "window.close") print(JSON.stringify({ event: { type: "closed", windowId: r.windowId } }));
  print(JSON.stringify({ version: 1, sessionId: r.sessionId, requestId: r.requestId, payload: r.operation == "dialog.confirm" ? true : null }));
}
