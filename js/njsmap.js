// Copyright 2025 Nuno Aguiar
// Requires openafsigil.js
// CSS: nJSMap.css 

// As in printTree, use one column for scalars or shared columns for flat records.
function nJSMapArrayColumns(list) {
  if (!Array.isArray(list) || !list.length) return null
  var isScalar = value => value === null || typeof value !== "object"
  if (isScalar(list[0])) return list.every(isScalar) ? [] : null
  var isRecord = value => Object.prototype.toString.call(value) === "[object Object]"
  if (!isRecord(list[0])) return null
  var columns = Object.keys(list[0])
  if (!columns.length) return null
  return list.every(row => isRecord(row) && Object.keys(row).length === columns.length &&
    columns.every(key => Object.prototype.hasOwnProperty.call(row, key) && isScalar(row[key]))) ? columns : null
}

function nJSMapArrayTable(list, columns, start, end, isDark) {
  var escape = value => String(value).replace(/[&<>"']/g, ch => "&#" + ch.charCodeAt(0) + ";")
  var headers = columns.length ? columns : ["Value"]
  var html = '<span class="avalue' + (isDark ? ' njsmap_dark' : '') + '"><table class="njsmap_table njsmap_records"><thead><tr>' +
    headers.map(key => '<th scope="col" class="njsmap_tablehead">' + escape(key) + '</th>').join("") +
    '</tr></thead><tbody>'
  var cell = value => {
    var style = typeof value === "number" ? "Number" : typeof value === "boolean" ? "Bool" : "String"
    return '<td class="njsmap_tablecell"><span class="njsmap_value' + style + '">' + escape(value) + '</span></td>'
  }
  for (var i = start; i < end; i++) {
    var row = list[i]
    html += '<tr>' + (columns.length ? columns.map(key => cell(row[key])).join("") : cell(row)) + '</tr>'
  }
  return html + '</tbody></table></span>'
}

function nJSMap(aValue, aType, isDark) {
    chartObj = void 0;
    // If undefined
    if ($$(aValue).isUnDef()) {
        aValue = "not available";
        aType = "undefined";
    }
    // If object
    var _render = (aValue) => {
        var columns = nJSMapArrayColumns(aValue)
        if (columns) return nJSMapArrayTable(aValue, columns, 0, aValue.length, isDark)
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
                    out += "<td class=\"njsmap_tablehead\" style=\"text-align: center; white-space: normal; word-break: normal; overflow-wrap: normal\"><span style=\"color: " +
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
                out += "<tr><td class=\"njsmap_tablecell\" style=\"text-align: right; vertical-align: top; white-space: normal; word-break: normal; overflow-wrap: normal\"><span style=\"color: " + (isDark ? "lightgray" : "darkblue") + ";font-weight: bold;\">" + i + "</span></td><td class=\"njsmap_tablecell\">" + _render(_v) + "</td></tr>"
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

// Mount a pageable tree from JSON-compatible data. Set collapseAll to start with nested branches closed.
// Toggle njsmap_dark on the target (or an ancestor) to switch the tree's colors.
nJSMap.mount = function(target, value, options) {
  options = options || {}
  target.classList.add("njsmap_tree")
  target.textContent = ""

  // Render each branch separately so collapsed descendants have no DOM nodes.
  var escape = function(value) {
    return String(value).replace(/[&<>"']/g, function(ch) { return "&#" + ch.charCodeAt(0) + ";" })
  }
  var isContainer = function(value) { return value !== null && typeof value == "object" }
  var itemCount = function(list) {
    return list.length + (list.length === 1 ? " item" : " items")
  }
  var label = function(key) {
    var first = key.length ? key.codePointAt(0) : 0
    return key.length ? "&#" + first + ";" + escape(key.slice(first > 65535 ? 2 : 1)) : ""
  }
  var scalar = function(value) {
    return typeof value == "number" || typeof value == "boolean" ? value : "<span>" + escape(value) + "</span>"
  }

  // Keep initial expansion bounded even when the caller prefers an expanded tree.
  var collapseAll = options.collapseAll === true
  var compact = !collapseAll
  if (!collapseAll) {
    var pending = [{ value: value, depth: 0 }], remaining = 1000
    while (pending.length && !collapseAll) {
      var current = pending.pop()
      if (!isContainer(current.value)) continue
      var keys = Object.keys(current.value)
      remaining -= keys.length
      if (remaining < 1000 - 12 || current.depth > 2) compact = false
      if (remaining < 0 || current.depth >= 12) collapseAll = true
      else keys.forEach(function(key) {
        pending.push({ value: current.value[key], depth: current.depth + 1 })
      })
    }
  }

  // Small trees fit inline. Escape labels and leaf text exactly as in the pageable view.
  var compactValue = function(value) {
    if (!isContainer(value)) return scalar(value)
    var columns = nJSMapArrayColumns(value)
    if (columns) return nJSMapArrayTable(value, columns, 0, value.length)
    var keys = Object.keys(value)
    if (!keys.length) return Array.isArray(value) ? "[]" : "{}"
    var display = {}
    keys.forEach(function(key) { display[label(key)] = compactValue(value[key]) })
    return nJSMap(display)
  }

  // Render only the current page of each visible branch.
  var renderBranch = function(target, object, autoExpand, bulkHost) {
    var columns = nJSMapArrayColumns(object)
    var keys = columns ? null : Object.keys(object)
    var length = columns ? object.length : keys.length
    var pageSize = 200, offset = 0
    var rows = document.createElement("div")
    rows.className = "njsmap_tree_rows"
    var branchButtons
    var isExpanded = function(button) { return button.getAttribute("aria-expanded") === "true" }
    var updateBulkControls = function() {
      bulkControls.hidden = branchButtons.length < 2
      var collapse = branchButtons.every(isExpanded)
      var label = (collapse ? "Collapse all items" : "Expand all items") + suffix
      bulkButton.setAttribute("aria-label", label)
      bulkButton.setAttribute("data-collapse", String(collapse))
      bulkButton.title = label
    }
    var showPage = function() {
      var end = Math.min(offset + pageSize, length)
      var display = {}
      if (columns) {
        rows.innerHTML = nJSMapArrayTable(object, columns, offset, end)
      } else {
        for (var i = offset; i < end; i++) {
          var key = keys[i], value = object[key]
          if (compact) {
            display[label(key)] = compactValue(value)
            continue
          }
          var isList = Array.isArray(value)
          display[label(key)] = isContainer(value) ?
            '<button type="button" class="njsmap_tree_toggle" aria-expanded="false" aria-label="Expand ' +
            (isList ? itemCount(value) : "named entries") + '" data-json-open="' + i +
            '">+</button><span class="njsmap_tree_hint"><span aria-hidden="true">' + (isList
              ? '[…]<span class="njsmap_tree_count">' + value.length + '</span>'
              : "{…}") +
            '</span><span></span></span><span class="njsmap_tree_branch" hidden></span>' : scalar(value)
        }
        rows.innerHTML = length ? nJSMap(display) : "Empty"
      }
      // Capture this page's direct children before expanding any nested rows.
      branchButtons = Array.from(rows.querySelectorAll("button[data-json-open]"))
      if (autoExpand) branchButtons.forEach(button => toggleBranch(button, true))
      updateBulkControls()
      if (pageStatus) {
        previous.disabled = offset === 0
        next.disabled = end === length
        pageStatus.textContent = " " + (offset + 1) + "–" + end + " of " + length
      }
    }
    var makeButton = function(symbol, label, action) {
      var button = document.createElement("button")
      button.type = "button"
      button.className = "njsmap_tree_page"
      button.textContent = symbol
      button.setAttribute("aria-label", label)
      button.title = label
      button.addEventListener("click", action)
      return button
    }
    var pageStatus, previous, next
    if (length > pageSize) {
      var controls = document.createElement("p")
      controls.setAttribute("aria-label", "JSON page controls")
      var pageButton = function(symbol, label, step) {
        var button = makeButton(symbol, label, function() { offset += step; showPage() })
        controls.appendChild(button)
        controls.append(" ")
        return button
      }
      previous = pageButton("«", "Previous page", -pageSize)
      next = pageButton("»", "Next page", pageSize)
      pageStatus = document.createElement("span")
      pageStatus.setAttribute("aria-live", "polite")
      controls.appendChild(pageStatus)
      target.appendChild(controls)
    }
    var bulkControls = bulkHost || document.createElement("p")
    if (!bulkHost) bulkControls.className = "njsmap_tree_bulk"
    var toggleItems = function(expand) {
      branchButtons.forEach(function(button) {
        if (isExpanded(button) !== expand) toggleBranch(button, false)
      })
      updateBulkControls()
    }
    var suffix = length > pageSize ? " on this page" : ""
    var bulkButton = makeButton("", "", function() {
      toggleItems(bulkButton.getAttribute("data-collapse") !== "true")
    })
    bulkButton.className += " njsmap_tree_bulk_button"
    if (bulkHost) bulkButton.className += " njsmap_tree_bulk_inline"
    bulkButton.innerHTML = '<svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" ' +
      'stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m4.5 4 3.5 3 3.5-3m-7 5 3.5 3 3.5-3"/></svg>'
    bulkControls.appendChild(bulkButton)
    if (!bulkHost) target.appendChild(bulkControls)
    target.appendChild(rows)

    // Expand in place and discard descendants when a branch closes.
    var toggleBranch = function(button, expandDescendants) {
      var value = object[keys[Number(button.dataset.jsonOpen)]]
      var hint = button.nextElementSibling
      var branch = hint.nextElementSibling
      var bulkHost = hint.lastElementChild
      var expanded = isExpanded(button)
      if (expanded) {
        branch.textContent = ""
        bulkHost.textContent = ""
      } else renderBranch(branch, value, expandDescendants, bulkHost)
      branch.hidden = expanded
      button.textContent = expanded ? "+" : "−"
      button.setAttribute("aria-expanded", String(!expanded))
      var label = Array.isArray(value) ? (expanded ? itemCount(value) : "items") : "named entries"
      button.setAttribute("aria-label", (expanded ? "Expand " : "Collapse ") + label)
    }
    rows.addEventListener("click", function(event) {
      var button = event.target.closest("button[data-json-open]")
      if (!button) return
      event.stopPropagation()
      toggleBranch(button, autoExpand)
      updateBulkControls()
    })
    showPage()
  }
  if (isContainer(value)) renderBranch(target, value, !collapseAll)
  else target.innerHTML = nJSMap(scalar(value))
}
