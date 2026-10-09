// Actual end-to-end $path Java port vs the bundled JS engine. No external dependencies.
var fixtures=[
  {name:'lookup',size:10,query:'items[0].name',count:300},
  {name:'filter-100',size:100,query:'items[?score >= `50`].name',count:100},
  {name:'filter-10000',size:10000,query:'items[?score >= `50`].name',count:5},
  {name:'sort-1000',size:1000,query:'sort_by(items,&score)[-10:].name',count:10},
  {name:'callback-100',size:100,query:'map(&twice(score),items)',count:30},
  {name:'nested',size:10,query:"path(@,'items[0].name')",count:150},
  {name:'unique-query-churn',size:10,query:'items[0].name',count:300,churn:true}
];
var sink, result={java:String(java.lang.System.getProperty('java.version')),architecture:String(java.lang.System.getProperty('os.arch')),jarSHA256:sha256(io.readFileBytes(getOpenAFJar())),rounds:5,rows:[]};
function median(a) {return a.slice().sort(function(a,b) {return a-b;})[Math.floor(a.length/2)];}
fixtures.forEach(function(f) {
  var input={items:[]};
  for(var i=0;i<f.size;i++) input.items.push({name:'item-'+i,score:(i*37)%100});
  var functions={twice:{_signature:[{types:[0]}],_func:function(a) {return a[0]*2;}}};
  var samples={js:[],java:[],javaUncached:[]}, cold={}, serial={js:0,java:0,javaUncached:0};
  function batch(mode,count) {
    __flags.ALTERNATIVES.path=mode!=='js';
    __flags.PATH_CACHE_SIZE=mode==='javaUncached'?0:256;
    var start=java.lang.System.nanoTime();
    for(var i=0;i<count;i++) sink=$path(input,f.query+(f.churn?' '.repeat(++serial[mode]):''),functions);
    return Number(java.lang.System.nanoTime()-start)/1e6/count;
  }
  var outputs={};
  Object.keys(samples).forEach(function(mode) {
    cold[mode]=batch(mode,1); outputs[mode]=JSON.stringify(sink); batch(mode,f.count);
  });
  if(outputs.js!==outputs.java || outputs.js!==outputs.javaUncached) throw new Error('Output mismatch: '+f.name);
  for(var r=0;r<5;r++) {
    var order=Object.keys(samples); if(r%2) order.reverse();
    order.forEach(function(mode) {samples[mode].push(batch(mode,f.count));});
  }
  var medians={}; Object.keys(samples).forEach(function(mode) {medians[mode]=median(samples[mode]);});
  var row={name:f.name,count:f.count,coldMs:cold,msPerOperation:medians,samples:samples};
  result.rows.push(row); print(JSON.stringify(row));
});
io.writeFileString(getEnv('PATH_BENCH_RESULT') || '/tmp/openaf-path/native-results.json',JSON.stringify(result,null,2));
