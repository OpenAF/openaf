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
            // If the array is nested, work with the inner array.
            let innerArray = Array.isArray(aValue[0]) ? aValue[0] : aValue;
            var _keys = Array.from(_determineKeys(innerArray));
            var out = "";
            // Test the first element (or its first element if nested) to see if it is a map.
            let firstItem = Array.isArray(aValue[0]) ? aValue[0][0] : aValue[0];
            if ($$(firstItem).isMap()) {
                out += "<table class=\"njsmap_table\"><tr>";
                for (var i in _keys) {
                    out += "<td class=\"njsmap_tablehead\" style=\"text-align: center\"><span style=\"color: " +
                        (isDark ? "lightgray" : "darkblue") +
                        ";font-weight: bold;\">" + _keys[i] + "</span></td>";
                }
                out += "</tr>";
            } else {
                out += "<table class=\"njsmap_table\">";
            }
            // Iterate over the original array. If nested, assume each element is an inner array of maps.
            for (var x in aValue) {
                out += "<tr>";
                // Check if this row is a nested array.
                let row = Array.isArray(aValue[x]) ? aValue[x] : [aValue[x]];
                // If row element is not a map, render it centered.
                if (!($$(row[0]).isMap())) {
                    out += "<td class=\"njsmap_tablecell\" style=\"text-align: center\"><span style=\"color: " +
                        (isDark ? "lightgray" : "darkblue") +
                        ";font-weight: bold;\">" + row[0] + "</span></td>";
                } else {
                    for (var y in _keys) {
                        var _v = "";
                        if (row[0] != null && row[0][_keys[y]] != null) {
                            if ("undefined" != row[0][_keys[y]])
                                _v = row[0][_keys[y]];
                            if ("undefined" == typeof _v)
                                _v = "";
                        }
                        out += "<td class=\"njsmap_tablecell\" style=\"text-align: left\">" + _render(_v) + "</td>";
                    }
                }
                out += "</tr>";
            }
            out += "</table>";
            return out;
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