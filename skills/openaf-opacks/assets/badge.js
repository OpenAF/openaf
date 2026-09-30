var packPath = getOPackPath("Badgen");
if (isUnDef(packPath)) throw "Install the dependency first: opack install Badgen";
var badges = require("badgen.js");
var svg = badges.badgen({ label: "build", status: "passing", color: "green" });
if (!isString(svg) || svg.indexOf("<svg") < 0) throw "Expected SVG output";
print(svg);
