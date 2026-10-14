// Bundle entrypoint. The public Ajv constructor remains the draft-07 engine.
const Ajv = require('ajv').default;
const Ajv2019 = require('ajv/dist/2019').default;
const Ajv2020 = require('ajv/dist/2020').default;
const addFormats = require('ajv-formats');
const traverse = require('json-schema-traverse');
traverse.arrayKeywords.prefixItems = true;
traverse.propsKeywords.dependentSchemas = true;
const formatKeyword = require('ajv/dist/vocabularies/format/format').default;

Ajv.OpenAF = {
  version: require('ajv/package.json').version,
  schemaIds: function(engine, schema, key) {
    const ids = [], bases = {};
    if (typeof key === 'string') ids.push(key.replace(/#$/, ''));
    if (schema && typeof schema === 'object') {
      traverse(schema, { allKeys: true }, function(node, pointer, root, parent) {
        let base = parent === undefined ? (schema.$id || key || '') : bases[parent];
        if (parent !== undefined && typeof node.$id === 'string') base = engine.opts.uriResolver.resolve(base || '', node.$id);
        base = (base || '').replace(/#$/, '');
        bases[pointer] = base;
        if (typeof node.$id === 'string' && base.charAt(0) !== '#') ids.push(base);
        ['$anchor', '$dynamicAnchor'].forEach(function(k) {
          if (typeof node[k] === 'string' && base) ids.push(base + '#' + node[k]);
        });
      });
    }
    return ids;
  },
  create: function(draft, options, mode) {
    const Engine = draft === '2020-12' ? Ajv2020 : draft === '2019-09' ? Ajv2019 : Ajv;
    const engine = new Engine(options);
    addFormats(engine, { mode: mode, keywords: false });
    // Preserve explicit format overrides after installing the standard formats.
    if (options.formats) {
      Object.keys(options.formats).forEach(function(name) {
        engine.addFormat(name, options.formats[name]);
      });
    }
    // v6 rejected unknown formats even when other unknown keywords were allowed.
    // v8 couples these behaviors through strictSchema. Isolate format strictness.
    const def = Object.assign({}, formatKeyword);
    def.code = function(cxt, type) {
      const previous = cxt.it.opts.strictSchema;
      cxt.it.opts.strictSchema = true;
      try { return formatKeyword.code(cxt, type); }
      finally { cxt.it.opts.strictSchema = previous; }
    };
    engine.removeKeyword('format');
    engine.addKeyword(def);
    return engine;
  }
};
module.exports = Ajv;
