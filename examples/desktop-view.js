// Run with: openaf -f examples/desktop-view.js
// Change only this selector to "javafx" to use the optional graphical provider.
ow.loadDesktop({ provider: "tui", providerOptions: { tui: { theme: "default", border: "rounded" } } });
var view = {
  title: "OpenAF Desktop",
  subtitle: "Shared terminal & graphical declarative view",
  align: "left",
  spacing: 1,
  items: [
    { id: "status", type: "text", text: "OpenAF Desktop — shared terminal/graphical view", style: { bold: true, fg: "#89dceb" } },
    { id: "sep", type: "divider", label: "Configuration" },
    { id: "name", type: "input", label: "Name", value: "", placeholder: "Enter your name..." },
    { id: "language", type: "select", label: "Greeting", options: ["Hello", "Olá", "こんにちは"], value: "Hello" },
    { id: "greet", type: "button", label: "Greet", align: "center" },
    { id: "close", type: "button", label: "Close", align: "center" }
  ]
};
var win = ow.desktop.window({ title: "OpenAF shared view", view: view });
win.on("message", function(event) {
  var message = event.message;
  if (message.type != "action") return;
  if (message.payload.id == "close") { win.close(); return; }
  var values = message.payload.values;
  view.items[0].text = values.language + ", " + (values.name || "OpenAF") + "!";
  view.items[2].value = values.name;
  view.items[3].value = values.language;
  win.setView(view);
});
win.on("error", function(event) { logErr(event.error.message); });
win.show();
ow.desktop.wait();
