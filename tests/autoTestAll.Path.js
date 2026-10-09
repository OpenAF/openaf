// Java/JS differential contract tests. The bundled JS engine is the compatibility oracle.
(function() {
  function assertEqual(a, b, message) {
    if (typeof a === 'string' && typeof b === 'string' && a !== b) {
      var i=0; while(i<a.length && a[i]===b[i]) i++;
      ow.test.assert(a.slice(Math.max(0,i-50),i+220),b.slice(Math.max(0,i-50),i+220),message+' at '+i);
    } else ow.test.assert(a, b, message);
  }
  function snapshot(value) {
    var seen = [];
    function visit(x) {
      if (x === undefined) return {scalar:'undefined'};
      if (x === null) return null;
      if (typeof x === 'number') return {number:isNaN(x) ? 'NaN' : x === 0 && 1/x < 0 ? '-0' : String(x)};
      if (typeof x === 'string' || typeof x === 'boolean') return x;
      if (typeof x === 'function') return {function:true};
      if (seen.indexOf(x) >= 0) return {ref:seen.indexOf(x)};
      var id = seen.length; seen.push(x);
      var tag = Object.prototype.toString.call(x), result={id:id, tag:tag};
      if (tag === '[object JavaObject]' || tag === '[object JavaClass]' || tag === '[object JavaPackage]') { result.text=String(x); return result; }
      if (tag === '[object Array]') {
        result.length=x.length; result.items=[];
        for (var i=0;i<x.length;i++) result.items.push(i in x ? visit(x[i]) : {hole:true});
      } else {
        result.entries=Object.keys(x).map(function(k) { return [k,visit(x[k])]; });
        if (tag !== '[object Object]') result.text=String(x);
      }
      return result;
    }
    return JSON.stringify(visit(value));
  }
  function run(engine, setup, query) {
    var f=setup(), result, error;
    try { result=engine(f.input,query,f.functions || {}); }
    catch(e) { error=typeof e === 'object' ? {name:e.name,message:e.message} : {thrown:e}; }
    return snapshot({result:result,error:error,input:f.input,trace:f.trace || []});
  }
  function standard() {
    return {input:{items:[{name:'a',score:20},{name:'b',score:70},{name:'c',score:70}],
      a:{b:{c:4}}, nums:[2,10,-1,0], words:['z','A','ä','a'], mixed:[1,'2',null],
      sparse:[1,,3], nested:[[1,2],null,[3]], yes:true, no:false, nil:null, undef:undefined,
      text:'a'+String(java.lang.System.nanoTime()).slice(0,0)+'ba', unicode:'é中文😀'}};
  }
  var queries = [
    '@','a.b.c','items[0].name','items[-1].name','items[99]','items[*].name','items[].score',
    'items[?score >= `50`].name','items[?score == `70` && name != \'c\'].name','items[?score < `50` || name == \'c\'].name',
    'items[?!(score > `50`)].name','items[?name <= \'b\'].name','items[?score > \'30\'].name',
    'items[?score >= `50`][]','items[0:2].name','items[::-1].name','items[::2].name','items[-9:9].name',
    'items[*].{n:name,s:score}','items[*].[name,score]','items[*].name | [0]','a.*.*',
    '{x:a.b.c,y:missing}','[a, missing, @]','nested[]','sparse[*]','sparse[:]','sparse[]',
    'nil || nums','yes && items','no && items','!nil','!nums','!missing','!`{}`','!`[]`','!`0`',
    '(`1`)','"a".b.c',"'a\\'b'",'`abc`','`{"__proto__":{"x":1}}`','`{"a":[1]}`','`[]`','`null`',
    'abs(`-2`)','avg(nums)','avg(`[]`)','ceil(`1.2`)','floor(`-1.2`)','sum(nums)',
    'contains(text, \'a\')','contains(nums, `10`)','starts_with(text, \'a\')','ends_with(text, \'a\')',
    'length(items)','length(a)','length(unicode)','map(&name, items)','map(&missing, items)',
    'merge(a, `{ "x": 2 }`)','max(nums)','min(nums)','max(words)','min(words)','max(`[]`)','min(`[]`)',
    'max_by(items,&score)','min_by(items,&score)','max_by(items,&name)','min_by(items,&name)',
    'max_by(`[]`,&x)','min_by(`[]`,&x)','type(@)','type(nil)','type(missing)','type(yes)',
    'type(nums)','type(text)','type(`1`)','type(&name)','keys(a)','values(a)','sort(nums)','sort(words)',
    'sort_by(items,&score)[*].name','sort_by(items,&name)[*].name','join(\',\',words)','reverse(nums)',
    'reverse(unicode)','to_array(nums)','to_array(nil)','to_string(@)','to_string(text)',
    'to_number(\'0x10\')','to_number(\'\')','to_number(\'NaN\')','to_number(yes)',
    'not_null(missing,nil,text)','not_null(nil,nil)','undef == missing','sparse == `[1,null,3]`',
    'abs(text)','sum(mixed)','abs()','abs(`1`,`2`)','merge()','not_null()',
    'sort_by(items,&missing)','map(&name,`null`)','unknown(@)','toString(@)','constructor(@)','__proto__(@)','hasOwnProperty(@)','items[::0]',
    '', '[?', 'a.', 'a[', 'a[0', 'a[foo]', 'a[1:foo]', 'a.', '[a,]', '{a:}', '{:a}',
    '()', '()()', '() == `1`', 'a(', '(a', '[a', '{a:a b:c}', 'f(@,@)', 'f(a b)', '(a,b)', 'a..b', 'a.*.[]', 'a + b', 'a = b', '"f"(@)', 'a b', 'a\rb', '`{"x":}`', '"unterminated', "'unterminated", '`unterminated'
  ];
  var atoms=['a.b.c','missing','`null`','`0`','text','yes','nums','items[0].score'];
  atoms.forEach(function(a) { atoms.forEach(function(b) {
    [' == ',' != ',' > ',' <= ',' || ',' && '].forEach(function(op) {queries.push(a+op+b);});
  }); });
  function reference() { loadCompiledLib('jmespath_js'); return jmespath.search; }
  exports.testPathReference = function() {
    var search=reference();
    assertEqual(search({x:1},'x',{}),1,'Reference lookup');
    assertEqual(search([2,10],'sort(@)',{}),[10,2],'Reference lexicographic numeric sort');
    queries.forEach(function(q) { run(search,standard,q); });
    print('Path reference corpus: '+queries.length+' expressions');
  };
  exports.testPathJavaDifferential = function() {
    var search=reference();
    queries.forEach(function(q) {
      assertEqual(run(function(a,b,c) { return af.pathJava(a,b,c); },standard,q),run(search,standard,q),'Path parity: '+q);
    });
    function custom() {
      var trace=[];
      return {input:{rows:[1,2,3]},trace:trace,functions:{
        mark:{_signature:[{types:[$path().any]}],_func:function(a) { trace.push(a[0]); return a[0]; }},
        apply:{_signature:[{types:[$path().expref]},{types:[$path().any]}],_func:function(a) { return this._interpreter.visit(a[0],a[1]); }},
        receiver:{_signature:[{types:[$path().any]}],_func:function(a) { return [this._getTypeName(a[0]),this.callFunction('abs',[-2]),this._typeMatches(0,0,a[0])]; }},
        mutate:{_signature:[{types:[$path().object]}],_func:function(a) { a[0].x=(a[0].x||0)+1; return a[0]; }},
        fail:{_signature:[{types:[$path().any]}],_func:function(a) { trace.push('fail'); throw 'callback failure'; }},
        table:{_signature:[{types:[$path().any]}],_func:function(a) { this.functionTable.abs._func=function() {return 42;}; return this.callFunction('abs',[-1]); }}
      }};
    }
    ["map(&mark(@),rows)","apply(&rows[1],@)","receiver(`1`)","map(&mutate(`{}`),rows)","[mark(`1`),fail(@)]",
      "mark(`false`) && mark(`2`)","mark(`true`) || mark(`2`)","table(@)","sort_by(rows,&mark(@))"].forEach(function(q) {
      assertEqual(run(function(a,b,c) {return af.pathJava(a,b,c);},custom,q),run(search,custom,q),'Custom parity: '+q);
    });
    function mutation() {
      var input={rows:[1,2,3]},trace=[];
      return {input:input,trace:trace,functions:{
        change:{_signature:[{types:[$path().any]}],_func:function(a) {
          trace.push(a[0]); if(a[0]===1) input.rows[1]=9; return true;
        }},
        inspect:{_signature:[{types:[$path().expref]}],_func:function(a) {
          a[0].name='rows'; return this._interpreter.visit(a[0],input);
        }},
        variadic:{_signature:[{types:[$path().number,$path().string],variadic:true}],_func:function(a) {return a;}},
        registry:{_signature:[{types:[$path().any]}],_func:function() {
          this.functionTable={abs:{_signature:[{types:[$path().number]}],_func:function() {return 9;}}};
          return this.callFunction('abs',[-1]);
        }}
      }};
    }
    ['rows[*].change(@)','rows[?change(@)]','inspect(&ignored)',"variadic(`1`,\'x\',`true`)",'registry(@)'].forEach(function(q) {
      assertEqual(run(function(a,b,c) {return af.pathJava(a,b,c);},mutation,q),run(search,mutation,q),'Mutation parity: '+q);
    });
    [function() {var f=Object.create(null);f.custom={_signature:[{types:[1]}],_func:function() {return 1;}};return {input:{},functions:f};},
     function() {return {input:{},functions:{hasOwnProperty:{}}};},
     function() {return {input:{},functions:{custom:{_signature:[{types:[1]}],_func:1}}};},
     function() {return {input:{},functions:{custom:{_signature:[],_func:function() {}}}};}
    ].forEach(function(setup) {
      assertEqual(run(function(a,b,c) {return af.pathJava(a,b,c);},setup,'custom(@)'),run(search,setup,'custom(@)'),'Invalid registry parity');
    });
    function special() {
      var proto={inherited:4}, input=Object.create(proto);
      input['2']=2; input['1']=1; input.a=undefined; input.boxed=new String('abc'); input.nan=NaN; input.inf=Infinity;
      input.minus=-0; input.tagged={length:0}; input.tagged[Symbol.toStringTag]='Array'; input.date=new Date(0); input.java=new java.util.HashMap();
      return {input:input};
    }
    ['inherited','keys(@)','values(@)','boxed','type(boxed)','to_string(boxed)','nan == nan','inf > `0`','minus',
      'type(tagged)','length(tagged)','type(date)','type(java)','java','{x:a} == `{}`','@ == `{}`'].forEach(function(q) {
      assertEqual(run(function(a,b,c) {return af.pathJava(a,b,c);},special,q),run(search,special,q),'Value parity: '+q);
    });
  };
  exports.testPathCacheIsolation = function() {
    var old=__flags.PATH_CACHE_SIZE;
    try {
      __flags.PATH_CACHE_SIZE=2;
      var q='`{"a":[1]}`', first=af.pathJava({},q,{}); first.a.push(2);
      assertEqual(af.pathJava({},q,{}),{a:[1]},'Cached literal leaked');
      for(var i=0;i<6;i++) assertEqual(af.pathJava({},'`'+i+'`',{}),i,'Eviction/reparse');
      assertEqual(af.pathJava({},q,{}),{a:[1]},'Reparsed literal leaked');
      var f={custom:{_signature:[{types:[$path().any]}],_func:function() {return 1;}}};
      assertEqual(af.pathJava({},'custom(@)',f),1,'First custom binding');
      f.custom._func=function() {return 2;};
      assertEqual(af.pathJava({},'custom(@)',f),2,'Stale custom binding');
      [0,256].forEach(function(size) { __flags.PATH_CACHE_SIZE=size; assertEqual(af.pathJava({},q,{}),{a:[1]},'Cache size '+size); });
      var manyNodes='['+Array(4200).fill('a').join(',')+']';
      assertEqual(af.pathJava({a:1},manyNodes,{}).length,4200,'Node-budget bypass must execute');
      var oversized=' '.repeat(17000)+'`1`';
      assertEqual(af.pathJava({},oversized,{}),1,'Oversized query must execute');
      for(var i=0;i<2;i++) {
        var failed=false; try {af.pathJava({},'[?',{});} catch(e) {failed=true;}
        assertEqual(failed,true,'Invalid parse must throw');
      }
    } finally { __flags.PATH_CACHE_SIZE=old; }
    // Isolate prototype/global-function changes from other suites and worker threads.
    var script = "try {\nfunction path(input,q) {return af.pathJava(input,q,{});}\nvar oldKeys=Object.keys, count=0;\nObject.keys=function() {count++;return oldKeys.apply(Object,arguments);};\ntry {path({},'`{\"freezeOwnKeys\":1}`');} finally {Object.keys=oldKeys;}\nif(count!==0) throw new Error('Literal parse invoked user Object.keys '+count+' times');\nvar descriptor=Object.getOwnPropertyDescriptor(Object.prototype,Symbol.toStringTag);\ntry {\n  Object.defineProperty(Object.prototype,Symbol.toStringTag,{value:'Tagged',configurable:true});\n  var q='`{\"a\":[1]}`'; var first=path({},q);first.a.push(2);\n  if(path({},q).a.length!==1) throw new Error('Tagged prototype leaked literal mutation');\n} finally {\n  if(descriptor) Object.defineProperty(Object.prototype,Symbol.toStringTag,descriptor);\n  else delete Object.prototype[Symbol.toStringTag];\n}\nprint('Template independence passed');\n\n} catch(e) {print(\"FAILED: \"+String(e));exit(1);}";
    var child=$sh([String(java.lang.System.getProperty('java.home'))+'/bin/java',
      '--enable-native-access=ALL-UNNAMED','-jar',getOpenAFJar(),'-c',script]).get(0);
    assertEqual(child.exitcode,0,'Template subprocess failed: '+child.stdout+child.stderr);
    assertEqual(child.stdout.indexOf('Template independence passed')>=0,true,'Template completion marker');
  };
  exports.testPathParallel = function() {
    var input=Array.from({length:32},function(_,i) {return i;});
    var results=pForEach(input,function(i) {
      var f={f:{_signature:[{types:[0]}],_func:function(a) {return a[0]+i;}}};
      var literal=af.pathJava({},'`{"v":[]}`',{}); literal.v.push(i);
      return [af.pathJava({x:i},'f(x)',f),af.pathJava({},'`{"v":[]}`',{}).v.length];
    });
    assertEqual(results,input.map(function(i) {return [i*2,0];}),'Concurrent input/function/literal isolation');
  };
  exports.testPathWrapper = function() {
    var old=__flags.ALTERNATIVES.path, referenceRegistry, nestedReference;
    try {
      [false,true].forEach(function(java) {
        __flags.ALTERNATIVES.path=java;
        assertEqual($path({a:1}),{a:1},'Default query');
        assertEqual($path().expref,6,'Type constants');
        assertEqual($path({x:1},"path(@, 'x')"),1,'Nested path');
        assertEqual($path({x:2},"opath('x')"),2,'Root path');
        assertEqual($path({x:2},"[set(`3`,'v'),get('v')]"),[3,3],'Local state');
        var nested=run(function(a,b,c) {return $path(a,b,c);},function() {return {input:{x:2}};},"[set(`3`,'v'),path(@, `\"get('v')\"`)]");
        if(java) assertEqual(nested,nestedReference,'Nested extension outcome'); else nestedReference=nested;
        assertEqual($path({x:1},"assign(@,'y',`2`)"),{x:1,y:2},'Mutation');
        assertEqual($path({},"add(`2`,`3`)"),5,'Extension callback');
        var registry=$path({},'capture(@)',{capture:{_signature:[{types:[$path().any]}],_func:function() {
          var table=this.functionTable;
          return Object.keys(table).map(function(name) {return [name,table[name]._signature,typeof table[name]._func];});
        }}});
        if (java) assertEqual(snapshot(registry),snapshot(referenceRegistry),'Function registry/signature parity');
        else referenceRegistry=registry;

      });
    } finally { __flags.ALTERNATIVES.path=old; }
  };
})();
