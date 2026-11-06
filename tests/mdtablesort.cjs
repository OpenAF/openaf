// Run with node tests/mdtablesort.cjs; executes the browser sorter without a DOM dependency.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const context = vm.createContext({ document: { addEventListener() {} } })
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/mdtablesort.js'), 'utf8'), context)

function table(values, directions = ['asc']) {
  const rows = values.map((value, index) => ({
    dataset: { originalIndex: String(index) },
    children: (Array.isArray(value) ? value : [value]).map(text => ({ textContent: String(text) }))
  }))
  const headers = directions.map(sortDirection => ({ dataset: { sortDirection } }))
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
