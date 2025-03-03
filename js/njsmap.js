// Copyright 2025 Nuno Aguiar
// Requires openafsigil.js
// CSS: nJSMap.css 

function nJSMap(aValue, aType, isDark) {
    chartObj = void 0;
    // If undefined
    if ($$(aValue).isUnDef()) {
        aValue = "not available";
        aType = "undefined";
    }
    // If object
    var _render = (aValue) => {
        if (!(typeof aValue === 'object') && !(typeof aValue === 'string' && !isNaN(Date.parse(aValue))) ) {
            if (typeof aValue === 'number') return "<span class=\"njsmap_valueNumber\" style=\"color: " + (isDark ? "#a2b5cd" : "midnightblue") + "\">" + aValue + "</span>";
            if (typeof aValue === 'string') {
                // If url
                if (aValue.startsWith("http")) 
                    return "<span class=\"njsmap_valueString\" style=\"color: " + (isDark ? "#528b8b" : "DarkSlateGray") + "\"><a style=\"color: " + (isDark ? "#528b8b" : "DarkSlateGray") + "\" href=\"" + aValue + "\" target=\"_blank\">" + aValue + "</a></span>"
                else
                    return "<span class=\"njsmap_valueString\" style=\"color: " + (isDark ? "#528b8b" : "DarkSlateGray") + "\">" + aValue + "</span>"
            }
            if (typeof aValue == "boolean") return "<span class=\"njsmap_valueBool\" style=\"color: " + (isDark ? "#8AB6D6" : "steelblue") + "\">" + aValue + "</span>";
            return aValue;
        } else {
            // if date
            if (
                (typeof aValue === 'object' && typeof aValue.getDate === 'function') ||
                (typeof aValue === 'string' && !isNaN(Date.parse(aValue)))
            ) {
                var dateObj = typeof aValue === 'string' ? new Date(aValue) : aValue
                return "<span class=\"njsmap_valueDate\" style=\"color: " + (isDark ? "#88AAFF" : "#0000AA") +
                    "\">" + dateObj.toISOString().replace("Z", "").replace("T", " ") + "</span>"
            }
        }

        var _determineKeys = ar => {
            return ar.reduce((keys, map) => {
                if ("[object Object]" == Object.prototype.toString.call(map)) {
                    for (var key in map) {
                        keys.add(key)
                    }
                }
                return keys
            }, new Set())
        }

        var out = "";
        if (Array.isArray(aValue) && aValue.length > 0) {
            var _keys = Array.from(_determineKeys(aValue))
            var out = "";
            if ($$(aValue[0]).isMap()) {
                out += "<table class=\"njsmap_table\"><tr>";
                for(var i in _keys) {
                    out += "<td class=\"njsmap_tablehead\" style=\"text-align: center\"><span style=\"color: " + (isDark ? "lightgray" : "darkblue") + ";font-weight: bold;\">" + _keys[i] + "</span></td>";
                }
                out += "</tr>";
            } else {
                out += "<table class=\"njsmap_table\">";
            }
            for(var x in aValue) {
                out += "<tr>";
                if (!($$(aValue[x]).isMap()) && !(Array.isArray(aValue[x]))) {
                    out += "<td class=\"njsmap_tablecell\" style=\"text-align: center\"><span style=\"color: " + (isDark ? "lightgray" : "darkblue") + ";font-weight: bold;\">" + aValue[x] + "</span></td>";
                } else {
                    for (var y in _keys) {
                        var _v = ""
                        if (aValue[x] != null && aValue[x][_keys[y]] != null) {
                            if ("undefined" != aValue[x][_keys[y]]) _v = aValue[x][_keys[y]]
                            if ("undefined" == typeof _v) _v = ""
                        }
                        out += "<td class=\"njsmap_tablecell\" style=\"text-align: left\">" + _render(_v) + "</td>";
                    }
                }
                out += "</tr>";
            }
            out += "</table>";
        } else {
            var out = "<table class=\"njsmap_table\">";
            for (var i in aValue) {
                var _v = ""
                if (aValue[i] != null) {
                    if ("undefined" != aValue[i]) _v = aValue[i]
                    if ("undefined" == typeof _v) _v = ""
                }
                out += "<tr><td class=\"njsmap_tablecell\" style=\"text-align: right; vertical-align: top\"><span style=\"color: " + (isDark ? "lightgray" : "darkblue") + ";font-weight: bold;\">" + i + "</span></td><td class=\"njsmap_tablecell\">" + _render(_v) + "</td></tr>";
            }
            out += "</table>";
        }
        return out;
    };
    if ($$(aValue).isObject()) {
        var out = "";
        out += _render(aValue);
        aValue = out;
    }
    switch(aType) {
        case "date"     : return (new Date(aValue)).toLocaleString() + "";
        case "undefined": return "<span class=\"avalueNA\">" + aValue + "</span>";
        default:
            return "<span class=\"avalue\">" + aValue + "</span>";
    }
}