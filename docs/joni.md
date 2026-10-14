# Oniguruma regular expressions

`joniRegExp(pattern, options)` compiles a reusable pattern using the bundled Joni
engine and JCodings UTF-8 support. It is available without loading a wrapper.

```javascript
var re = joniRegExp('(?<name>[A-Za-z]+)-([0-9]+)');
re.test('item-42');                      // true
re.match('item-42');
// {text:'item-42', index:0, end:7, captures:['item','42'], groups:{name:'item'}}
re.matchAll('item-42 other-7');           // array of match objects
re.replace('item-42', '$<name>');         // 'item'
re.replaceAll('item-42 other-7', '$2');   // '42 7'
joniRegExp(',').split('a,b,c', 2);        // ['a','b']
$from([{s:'item-42'}, {s:'none'}]).where(row => re.test(row.s)).select();
```

## Patterns and options

Patterns use Oniguruma's Ruby syntax. For example, `joniRegExp('foo\\Kbar')`
matches only `bar` within `foobar`, and `joniRegExp('(?<pair>a\\g<pair>?b)')`
matches nested pairs such as `aabb`. JavaScript string literals require doubled
backslashes. This helper does not change `RegExp`, `javaRegExp`, `$from().match()`,
or `$jq`.

Options are booleans, all defaulting to false:

| Option | Behavior |
| --- | --- |
| `ignoreCase` | Encoding-aware case-insensitive matching |
| `dotAll` | Dot also matches newline (Joni's `MULTILINE` option) |
| `extended` | Ignore pattern whitespace and allow comments outside character classes |

Ruby anchor and inline-option semantics apply: `^` and `$` are line anchors even
without an option; use `\A` and `\z` for whole-input anchors. Inline `(?m)` is
Ruby dot-all behavior. Both numbered and named groups are captured. Duplicate
names resolve to the highest-numbered participating group.

## Results and reuse

`match` returns the first match or `null`; `matchAll` returns an array (possibly
empty); `test` returns a boolean. Match objects contain `text`, `index`, exclusive
`end`, `captures` (group 1 at index 0), and `groups` (named captures). Unmatched
captures are `undefined`; patterns without names return an empty `groups` object.
Offsets are JavaScript UTF-16 positions, so `input.slice(m.index, m.end)` equals
`m.text`, including when the input contains emoji.

Each call has fresh matcher state and starts at the beginning. There is no
`lastIndex`. Empty matches advance by one Unicode code point; a final empty match
can occur once. Patterns compile once per helper; there is no global cache.
Inputs and patterns must be strings without unpaired UTF-16 surrogates. Encoded
byte arrays and transcoding are outside this API.

## Replacement and split

`replace` replaces the first match; `replaceAll` replaces every match. Replacement
strings use JavaScript conventions: `$$`, `$&`, `$1`–`$99`, `$<name>`, and the
prefix/suffix tokens `` $` `` and `$'`. Unmatched captures expand to an empty
string. Nonexistent numbered references remain literal, with JavaScript's
two-digit fallback. Named tokens remain literal when the pattern has no names;
otherwise nonexistent names expand to an empty string.

Callbacks receive `(match, ...captures, offset, input, groups)`; the `groups`
argument is omitted when the pattern has no named captures. Return values are
converted to strings and callback exceptions propagate unchanged. Reusing the
same helper inside a callback is supported.

```javascript
re.replaceAll('item-42 other-7', (text, name, number) => name + ':' + number);
// 'item:42 other:7'
```

`split(input, limit)` follows JavaScript Unicode-mode regex split conventions:
captured separators appear in the output, unmatched captures are `undefined`,
empty separators advance by code point, and `limit` uses JavaScript unsigned
32-bit conversion. The matching dialect remains Oniguruma.

Invalid arguments throw `TypeError`; invalid patterns throw `SyntaxError`.
Matching and substitution are synchronous and results are collected in memory.
No execution-speed improvement over Java or Rhino regex is promised.
