// These historical comparisons use the JavaScript $path backend explicitly.
__flags.ALTERNATIVES.path=false;
// Feasibility probe only: JCF is upstream's development/testing adapter.
loadExternalJars('/tmp/openaf-jmes-bench');
var data = {items:[{name:'a',score:20},{name:'b',score:70}]};
var tests = [
  {name:'lookup', input:data, query:'items[0].name'},
  {name:'filter', input:data, query:'items[?score >= `50`].name'},
  {name:'expref-sort', input:data, query:'sort_by(items, &score)[-1].name'},
  {name:'missing', input:data, query:'items[0].absent'},
  {name:'undefined', input:{x:undefined}, query:'type(x)'},
  {name:'sparse-array', input:{items:[1,,3]}, query:'items[*]'},
  {name:'concatenated-string', input:{x:'a'+String(java.lang.System.nanoTime())}, query:'type(x)'}
];
var output=[];
tests.forEach(function(t) {
  try {
    var js=$path(t.input,t.query);
    var j=String(Packages.bench.JmesBench.directJson(t.input,t.query));
    output.push({name:t.name,js:JSON.stringify(js),java:j,equal:JSON.stringify(js)===j});
  } catch(e) { output.push({name:t.name,error:String(e)}); }
});
output.push({name:'identity',same:Packages.bench.JmesBench.direct(data,'@')===data});
print(JSON.stringify(output,null,2));
io.writeFileString('/tmp/openaf-jmes-bench/direct-results.json',JSON.stringify(output,null,2));
