// Run with: openaf -f examples/desktop-view.js
// Change only this selector to "javafx" to use the optional graphical provider.
ow.loadDesktop({ provider: "tui" });
var view = {
  items: [
    { id: "status", type: "text", text: "OpenAF Desktop — shared terminal/graphical view" },
    { id: "name", type: "input", label: "Name", value: "" },
    { id: "language", type: "select", label: "Greeting", options: ["Hello", "Olá"], value: "Hello" },
    { id: "greet", type: "button", label: "Greet" },
    { id: "close", type: "button", label: "Close" }
  ]
};
var win = ow.desktop.window({ title: "OpenAF shared view", view: view });
win.on("message", function(event) {
  var message = event.message;
  if (message.type != "action") return;
  if (message.payload.id == "close") { win.close(); return; }
  var values = message.payload.values;
  view.items[0].text = values.language + ", " + (values.name || "OpenAF") + "!";
  view.items[1].value = values.name;
  view.items[2].value = values.language;
  win.setView(view);
});
win.on("error", function(event) { logErr(event.error.message); });
win.show();
ow.desktop.wait();
