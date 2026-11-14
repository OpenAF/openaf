// Run from the core checkout; optional root is OW_TEST_OPACK_ROOT.
ow.loadTest()
var root=getEnv('OW_TEST_OPACK_ROOT')||String(new java.io.File('../openaf-opacks').getCanonicalPath()),checks=0
function check(v,m){checks++;if(!v)throw new Error(m);}
function raises(fn){var caught=false;try{fn();}catch(e){caught=true;}check(caught,'Expected rejection');}
try {
  var s=ow.test.createSession({output:false}),p=require(root+'/TestProperty/test-property.js').create(s),values=[]
  var result=p.forAll({values:p.gen.integer(-100,100),runs:20,seed:42},function(v){values.push(v);return v>=-100&&v<=100;})
  var again=[];p.forAll({values:p.gen.integer(-100,100),runs:20,seed:42},function(v){again.push(v);});check(JSON.stringify(values)===JSON.stringify(again),'seed replay')
  try{p.forAll({values:p.gen.integer(1,100),seed:42,runs:100},function(){throw null;});throw new Error('missing failure');}catch(e){check(e.name==='PropertyError'&&e.result.counterexample===1,'shrinking and thrown null');}
  raises(function(){p.gen.schema({type:'string',pattern:'x'});})
  p.forAll({values:p.gen.map(p.gen.string({min:1,max:4}),p.gen.integer(0,10),{min:2,max:4}),runs:10,seed:42},function(value){return Object.keys(value).length>=2;});check(true,'map generator')
  var v=require(root+'/TestVerify/test-verify.js').create(s),model={initial:0,transitions:function(n){return n<3?[{action:'inc',state:n+1}]:[];},invariant:function(n){return n<2;}}
  result=v.explore(model);check(result.status==='COUNTEREXAMPLE'&&result.path.length===2,'bounded counterexample')
  model.invariant=function(){return true;};check(v.explore(model).complete,'finite exhaustive graph');check(!v.explore(model,{maxDepth:1}).complete,'depth limit')
  var coverage=require(root+'/TestCoverage/test-coverage.js').create();coverage.register('example.js',[{id:'one',kind:'line',line:1},{id:'two',kind:'line',line:2}]);coverage.hit('example.js','one');check(coverage.lcov().indexOf('DA:2,0')>=0,'uncovered line')
  result=coverage.benchmark(function(){return 1;},{warmup:1,runs:5});check(result.samples===5&&result.p95>=result.min,'benchmark percentiles')
  result=coverage.mutate('1',[{id:'one',start:0,end:1,expected:'1',replacement:'2'}],function(code){return {status:code==='1'?'PASS':'FAIL'};});check(result[0].status==='KILLED','mutation result')
  var contracts=require(root+'/TestContracts/test-contracts.js').create(s);result=contracts.rest({mode:'mock',response:{status:201,body:{id:1}},expect:{status:201,schema:{type:'object',required:['id']}}});check(result.mode==='mock','contract evidence')
  var queue=contracts.queue([{id:1},{id:2}],{order:[1,0,1]});check(queue.receive().id===2&&queue.receive().id===1&&queue.receive().id===2&&queue.size()===0,'duplicate and reordered messages')
  contracts.register('fixture',function(request){return {body:request.value};});result=contracts.run('fixture',{mode:'live',version:'v1',request:{value:5},record:true,redact:function(x){return x;}})
  check(contracts.run('fixture',{mode:'replay',version:'v1',request:{value:5},recording:result.recording,expect:{body:5}}).mode==='replay','record replay')
  raises(function(){contracts.run('fixture',{mode:'replay',version:'v2',request:{value:5},recording:result.recording});})
  var agent=require(root+'/TestAgent/test-agent.js').create(s);check(agent.discover({version:1,tests:[{id:'case',description:'example'}]}).tests.length===1,'manifest validation')
  raises(function(){agent.execute({manifest:{version:1,tests:[]}});});check(agent.tools().length===2,'MCP tool descriptors')
  if(getEnv('OW_TEST_COMMON')){
    var common=String(new java.io.File(getEnv('OW_TEST_COMMON')).getCanonicalPath())
    var module=String(new java.io.File('tests/fixtures/ow-test/suite.js').getCanonicalPath())
    var observed=s.ojob(common+'/oJobTest.yaml',{trusted:true,sourceRoot:getEnv('OW_TEST_SOURCE')==='1'?'.':undefined,job:'oJob Test Suite',args:{files:[module],options:{output:false}},expect:{status:'SUCCESS'}})
    check(observed.output.results.summary.passed===1,'oJob-common standalone suite')
    module=String(new java.io.File('tests/fixtures/ow-test/suite-fail.js').getCanonicalPath())
    check(s.ojob(common+'/oJobTest.yaml',{trusted:true,sourceRoot:getEnv('OW_TEST_SOURCE')==='1'?'.':undefined,job:'oJob Test Suite',args:{files:[module],options:{output:false}},expect:{status:'ERROR'}}).status==='ERROR','oJob-common failure propagation')
  }
  if(getEnv('OW_TEST_Z3')){
    var command=String(getEnv('OW_TEST_Z3')),version=JSON.parse(String(Packages.openaf.OJobLanguageProcess.run(JSON.stringify({command:[command,'--version'],timeout:5000,maxOutputBytes:4096})))).stdout.trim()
    var options={trusted:true,backend:'Z3',version:version,assumptions:[]}
    check(v.smt([command,'-smt2','{input}'],'(declare-const x Int)\n(assert (> x 0))\n(check-sat)',options).status==='sat','SMT sat')
    check(v.smt([command,'-smt2','{input}'],'(assert false)\n(check-sat)',options).status==='unsat','SMT unsat')
    check(v.smt([command,'-smt2','{input}'],'invalid',options).status==='failed','SMT parser failure')
  }
  if(getEnv('OW_TEST_LIVE')==='1'){
    var server=Packages.com.sun.net.httpserver.HttpServer.create(new java.net.InetSocketAddress('127.0.0.1',0),0)
    server.createContext('/orders',new Packages.com.sun.net.httpserver.HttpHandler({handle:function(exchange){var data=af.fromString2Bytes('{"id":1}');exchange.getResponseHeaders().set('Content-Type','application/json');exchange.sendResponseHeaders(201,data.length);exchange.getResponseBody().write(data);exchange.close();}}))
    server.start();try{result=contracts.rest({mode:'live',endpoint:'http://127.0.0.1:'+server.getAddress().getPort()+'/orders',expect:{status:201,body:{id:1}}});check(result.mode==='live','live HTTP evidence');}finally{server.stop(0);}
    var db=new DB('org.h2.Driver','jdbc:h2:mem:contract_'+genUUID().replace(/-/g,''),'sa','')
    try{contracts.register('database',contracts.jdbc(db));result=contracts.run('database',{mode:'live',request:{query:'SELECT ? AS VALUE_TEST',params:[7]}});check(Number(result.response.body.results[0].VALUE_TEST)===7,'prepared JDBC contract');}finally{db.close();}
    var chName='contract::'+genUUID(),ch=$ch(chName).create();try{contracts.register('channel',contracts.channel(ch));result=contracts.run('channel',{mode:'live',request:{operation:'set',key:{id:1},value:{status:'ready'}},expect:{body:{status:'ready'}}});check(result.mode==='live','channel contract');}finally{ch.destroy();}
  }
  print(JSON.stringify({checks:checks,failures:0}));exit(0)
}catch(e){printErr(String(e)+'\n'+e.stack);exit(1);}
