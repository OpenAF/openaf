// Run with node tests/mdtablesort.cjs; executes the browser sorter without a DOM dependency.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const context = vm.createContext({ document: { addEventListener() {} } })
vm.runInContext(fs.readFileSync(process.env.MDTABLESORT_MODULE || path.join(__dirname, '../js/mdtablesort.js'), 'utf8'), context)

function table(values, directions = ['asc'], label = '') {
  const rows = values.map((value, index) => ({
    dataset: { originalIndex: String(index) },
    children: (Array.isArray(value) ? value : [value]).map(text => ({ textContent: String(text) }))
  }))
  const headers = directions.map(sortDirection => ({ textContent: label, dataset: { sortDirection } }))
  const body = {
    querySelectorAll() { return rows.slice() },
    appendChild(row) { rows.splice(rows.indexOf(row), 1); rows.push(row) }
  }
  const header = { querySelectorAll() { return headers } }
  const fixture = { querySelector(selector) { return selector === 'thead tr' ? header : selector === 'tbody' ? body : null } }
  return {
    sort() { context.sortTable(fixture); return rows.map(row => row.children.map(cell => cell.textContent)) },
    reset() { headers.forEach(header => { header.dataset.sortDirection = 'none' }); return this.sort() }
  }
}

function check(input, expected, direction = 'asc') {
  const fixture = table(input, [direction])
  assert.deepEqual(fixture.sort().map(row => row[0]), expected.map(String))
  assert.deepEqual(fixture.reset().map(row => row[0]), input.map(String))
}

check([2, 100], [2, 100])
check([1.5, 1.12], [1.12, 1.5])
check([-2, 1, 100, 0, -20], [-20, -2, 0, 1, 100])
check([2, 100, -1], [100, 2, -1], 'desc')
check(['10', '02', '1'], ['1', '02', '10'])
check(['1,024', '100', '2'], ['2', '100', '1,024'])
check(['5 MB', '10 KB', '2 MB'], ['10 KB', '2 MB', '5 MB'])
check(['2026-11-06', '2025-01-02'], ['2025-01-02', '2026-11-06'])
check(['2026-11-06 10:30:00', '2026-11-06 09:30:00'], ['2026-11-06 09:30:00', '2026-11-06 10:30:00'])
check(['January 2, 2026', 'December 31, 2025'], ['December 31, 2025', 'January 2, 2026'])
check(['1.10.0', '1.2.0', '1.2.0-beta'], ['1.2.0-beta', '1.2.0', '1.10.0'])
check(['b', 'a', 'b'], ['a', 'b', 'b'])
const multi = table([['a', '2'], ['b', '1'], ['a', '100'], ['a', '2']], ['asc', 'desc'])
assert.deepEqual(multi.sort(), [['a', '100'], ['a', '2'], ['a', '2'], ['b', '1']])
assert.deepEqual(multi.reset(), [['a', '2'], ['b', '1'], ['a', '100'], ['a', '2']])
console.log('PASS numeric/date/unit/version sorting, multiple columns, stable ties and original-order reset')

// SemVer 2 precedence, validation, ignored metadata, and arbitrary-size identifiers.
assert.deepEqual(table(['2.4','2.4.2','1.2','2.4.1','docs','2.10','2.8'], ['desc'], 'Object').sort().flat(),
  ['docs','2.10','2.8','2.4.2','2.4.1','2.4','1.2'])
const versions = ['1.0.0-alpha','1.0.0-alpha.1','1.0.0-alpha.beta','1.0.0-beta','1.0.0-beta.2','1.0.0-beta.11','1.0.0-rc.1','1.0.0','1.2.0','1.10.0','2.0.0']
check(versions.slice().reverse(), versions)
check(versions, versions.slice().reverse(), 'desc')
check(['1.0.0+z','1.0.0+a','1.0.0'], ['1.0.0+z','1.0.0+a','1.0.0'])
check(['9007199254740993.0.0','9007199254740992.0.0'], ['9007199254740992.0.0','9007199254740993.0.0'])
check(['1.0.0-9007199254740993','1.0.0-9007199254740992'], ['1.0.0-9007199254740992','1.0.0-9007199254740993'])
check(['1.0.0-a','1.0.0-A','1.0.0-1'], ['1.0.0-1','1.0.0-A','1.0.0-a'])
check(['latest','1.10.0','1.2.0'], ['1.2.0','1.10.0','latest'])
for (const invalid of ['01.0.0','1.01.0','1.0.01','1.0.0-01','1.0.0-a.01','1.0.0-','1.0.0+','1.0.0-a..b','1.0.0+a..b','1.2','1.2.3.4']) assert.equal(context.parseSemVer(invalid), null)
assert.equal(context.compareSemVer(context.parseSemVer('1.0.0+001'), context.parseSemVer('1.0.0+002')), 0)
console.log('PASS SemVer 2 precedence, validation, metadata, large identifiers and mixed values')

// A mixed page can contain a server listing and independently sortable Markdown tables.
function sortHeader(existingControls = false) {
  const children = existingControls ? [{ className: 'sorter-container' }] : []
  return {
    children,
    dataset: {},
    querySelector() { return children.find(child => child.className === 'sorter-container') },
    appendChild(child) { children.push(child) }
  }
}
function listing(header, server = false) {
  return {
    hasAttribute(name) { return server && name === 'data-browse-server-sort' },
    querySelector(selector) { return selector === 'thead tr' ? { querySelectorAll: () => [header] } : null }
  }
}
const serverHeader = sortHeader()
const oldServerHeader = sortHeader(true)
const markdownHeader = sortHeader()
context.document.querySelectorAll = () => [listing(serverHeader, true), listing(oldServerHeader), listing(markdownHeader)]
context.document.createElement = () => ({ dataset: {}, addEventListener() {}, appendChild() {} })
context.document.head = { appendChild() {} }
context.initializeTableSorters()
context.initializeTableSorters()
assert.equal(serverHeader.children.length, 0)
assert.equal(oldServerHeader.children.length, 1)
assert.equal(markdownHeader.children.length, 1)
assert.equal(markdownHeader.dataset.sortDirection, 'none')
console.log('PASS server sort controls are preserved and Markdown initialization is idempotent')
