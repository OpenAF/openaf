// Independent assertions: a broken ow.test must not mark its own regression suite green.
__flags.OAF_PRECOMPILE_LEVEL = 0
ow.loadTest()
if (getEnv('OW_TEST_SOURCE') === '1') {
  loadLib('js/owrap.test.js')
  ow.test = undefined
  ow.test = new OpenWrap.test();
  ['assert', 'run', 'report', 'async', 'mock', 'ojob'].forEach(function(name) {
    var file = 'js/owrap.test.' + name + '.js'
    if (io.fileExists(file)) loadLib(file)
  })
  ow.loadObj()
  loadLib('js/owrap.obj.js')
  Object.setPrototypeOf(ow.obj, OpenWrap.obj.prototype)
}
var checks = 0, failures = []
function check(value, message) { checks++; if (!value) throw new Error(message); }
function raises(fn, name) { var e, caught = false; try { fn(); } catch (x) { e=x; caught=true; } check(caught && (!name || e.name===name), 'Expected '+name+', got '+e); }
function test(name, fn) { try { fn(); print('PASS '+name); } catch(e) { failures.push(name+': '+e+'\n'+e.stack); printErr('FAIL '+failures[failures.length-1]); } }
function session() { return ow.test.createSession({output:false}); }
test('legacy returns and snapshots', function() {
  var s=session(); check(s.test('ok',function(){return 42;})===42,'return value')
  check(s.test('bad',function(){throw 'bad';})===undefined,'record policy')
  s.test('undefined',function(){}); var a=s.getExecHistory(); a[0].hits=999
  check(s.getExecHistory()[0].hits===1,'detached history'); s.test('ok',function(){})
  check(s.getCountTest()===4 && s.getCountPass()===3 && s.getCountFail()===1,'legacy counters')
  check(s.getResults().records[2].status==='PASS','undefined success')
  raises(function(){s.test('throws',function(){throw new Error('body');},undefined,{failurePolicy:'throw'});},'Error')
})
test('profile reentrancy and idempotence',function(){
  var s=session(); check(s.getProfileMin('absent')===undefined,'missing min')
  s.start('x');s.start('x');s.stop('x');s.stop('x');s.stop('x')
  var t=s.timer('x');t.stop();t.stop();check(s.getProfileHits('x')===3,'independent frames')
  check(s.getProfileMax('x')>=s.getProfileMin('x'),'min/max receiver')
  var active=s.timer('x');raises(function(){s.reset();},'TestBusyError');active.stop();s.reset()
})
test('assertions and serialization',function(){
  var s=session(),a={};a.self=a;var b={};b.self=b;s.assertDeepEqual(a,b);s.assertEqual(NaN,NaN)
  raises(function(){s.assertDeepEqual({}, {a:undefined});},'AssertionError')
  raises(function(){s.assertDeepEqual([undefined],new Array(1));},'AssertionError')
  var re=/a/g;re.lastIndex=5;s.assertMatch('a',re);check(re.lastIndex===5,'regexp unchanged')
  check(s.assertThrows(function(){throw undefined;})===undefined,'throw undefined')
  s.assertApprox(1.001,1,.01);raises(function(){s.assertApprox(1,1,'0.1');});s.assertContains([{a:1}],{a:1})
  var r=s.execute('cycle',function(){return {cycle:a,token:'secret'};})
  check(r.returnValue.token==='[REDACTED]' && r.returnValue.cycle.self.type==='reference','bounded/redacted values')
})
test('nested failures and cleanup',function(){
  var s=session(),order=[]
  var r=s.execute('parent',function(c){c.defer(function(){order.push(1);});c.defer(function(){order.push(2);throw new Error('cleanup');});s.execute('child',function(){throw new Error('child');});})
  check(r.status==='ERROR'&&r.errors.length===2,'aggregate nested/cleanup errors');check(order.join(',')==='2,1','cleanup LIFO')
  check(s.test('legacy parent',function(){s.test('legacy child',function(){throw 'child';});return 'ok';})==='ok','legacy propagation preserved')
})
test('suite lifecycle retries and filters',function(){
  var s=session(),events=[],tries=0
  s.suite('suite',function(t){
    t.beforeAll(function(){events.push('all');});t.afterAll(function(){events.push('end');})
    t.beforeEach(function(){events.push('before');});t.afterEach(function(){events.push('after');})
    t.fixture('value',function(c){c.defer(function(){events.push('dispose');});return 3;})
    t.test('flaky',function(c){check(c.fixture('value')===3,'fixture');if(tries++===0)c.assertEqual(1,2);},{retries:1})
    t.skip('skip');t.todo('todo')
  })
  var r=s.run();check(r.exitCode===0&&r.tests[0].flaky,'flaky success');check(r.summary.attempts===2&&r.summary.tests===3,'attempt vs logical counts')
  check(events.join(',')==='all,before,after,dispose,before,after,dispose,end','lifecycle order')
  check(s.run({names:['absent']}).summary.tests===0,'filter hooks')
})
test('hook failures and fail fast',function(){
  var s=session(),cleaned=false;s.suite('broken',function(t){t.beforeAll(function(){throw 'setup';});t.afterAll(function(){cleaned=true;});t.test('blocked',function(){throw 'must not execute';});})
  var r=s.run();check(r.exitCode===2&&r.tests[0].status==='BLOCKED'&&cleaned,'blocked suite cleanup')
  s=session();s.suite('fast',function(t){t.test('bad',function(c){c.assertEqual(1,2);});t.test('cancelled',function(){throw 'must not execute';});})
  r=s.run({failurePolicy:'failFast'});check(r.tests[1].status==='CANCELLED','fail fast')
})
test('report escaping counts and repeatability',function(){
  var s=session();check(s.toJUnitXML().indexOf('tests="0"')>=0,'empty report')
  s.execute('A::<&|\u0000',function(c){c.assertEqual(1,2,'<failure>');});s.execute('B::pass',function(){});s.execute('B::again',function(){})
  var xml=s.toJUnitXML();check(xml.indexOf('tests="3"')>=0&&xml.indexOf('&lt;')>=0&&xml.indexOf('\u0000')<0,'valid report')
  var factory=javax.xml.parsers.DocumentBuilderFactory.newInstance();factory.setFeature('http://apache.org/xml/features/disallow-doctype-decl',true)
  var doc=factory.newDocumentBuilder().parse(new java.io.ByteArrayInputStream(af.fromString2Bytes(xml)))
  check(doc.getElementsByTagName('testcase').getLength()===3,'XML testcase count')
  check(s.toMarkdown().indexOf('&#124;')>=0,'markdown escape');check(xml===s.toJUnitXML(),'pure report')
})
test('schema isolation',function(){
  var s=session(),v={};s.assertSchema(v,{type:'object',properties:{x:{type:'integer',default:1}}});check(v.x===undefined,'no defaults')
  raises(function(){s.assertSchema({x:'1'},{type:'object',properties:{x:{type:'integer'}}});},'AssertionError')
  var a=ow.obj.schemaCreate({useDefaults:true}),b=ow.obj.schemaCreate();var schema={type:'object',properties:{x:{default:2}}},x={},y={};a.inspect(schema,x);b.inspect(schema,y);check(x.x===2&&y.x===undefined,'independent engines')
})
test('async and timeout',function(){
  var s=session(),n=0;check(s.eventually(function(){return ++n;},{equals:3,interval:1,timeout:1000})===3,'eventual')
  var r=s.execute('async',function(c){return c.spawn(function(){return 7;});});check(r.status==='PASS'&&r.returnValue===7,'owned task')
  r=s.execute('timeout',function(){java.lang.Thread.sleep(200);},{timeout:10});check(r.status==='TIMEOUT'&&s.getResults().complete,'cooperative timeout')
  r=s.execute('bounded',function(){return 1;},{timeout:1000});check(r.status==='PASS','timeout context')
})
test('concurrent history and timers',function(){
  var s=session(),pool=java.util.concurrent.Executors.newFixedThreadPool(4),tasks=[]
  try {for(var i=0;i<20;i++)tasks.push(pool.submit(new java.util.concurrent.Callable({call:function(){s.execute('same',function(c){c.assertEqual(1,1);});return null;}})));tasks.forEach(function(f){f.get(10,java.util.concurrent.TimeUnit.SECONDS);});}
  finally {pool.shutdownNow();}
  check(s.getCountTest()===20&&s.getCountPass()===20&&s.getProfileHits('same')===20,'atomic completions');check(s.getExecHistory()[0].executions.length===20,'history size')
})
test('mock ownership and restoration',function(){
  var s=session(),service={charge:function(n){return n*2;}},original=service.charge
  var r=s.execute('mock',function(c){var h=c.mock(service,'charge',[{returns:7},{throws:new Error('down')}]);check(service.charge(1)===7,'sequence return');c.assertThrows(function(){service.charge(2);},'down');c.assertCalled(service,'charge',2);check(h.calls()[1].error.message.indexOf('down')>=0,'call error');})
  check(r.status==='PASS'&&service.charge===original,'automatic restoration')
  r=s.execute('restore on failure',function(c){c.spy(service,'charge');service.charge(3);c.assertCalled(service,'charge',1);throw 'failed';});check(service.charge===original,'failure restoration')
  r=s.execute('java',function(c){c.mock(new java.util.ArrayList(),'add',function(){});});check(r.status==='ERROR','Java mutation rejected')
})
test('parallel suites preserve declaration order',function(){
  var s=session();for(var i=0;i<8;i++)(function(i){s.suite('suite'+i,function(t){t.test('case',function(c){c.assertEqual(i,i);});});})(i)
  var r=s.run({workers:4});check(r.exitCode===0&&r.summary.tests===8,'parallel suites');check(r.tests[0].name==='suite0::case'&&r.tests[7].name==='suite7::case','deterministic report order')
})
test('Java cyclic containers and schema registrations',function(){
  var s=session(),a=new java.util.ArrayList(),b=new java.util.ArrayList();a.add(a);b.add(b);s.assertDeepEqual(a,b)
  var schemas=ow.obj.schemaCreate();schemas.schemaCompile({$id:'urn:ow-test:value',type:'number'});check(schemas.inspect('urn:ow-test:value',1).valid,'compiled schema id');schemas.schemaRemove('urn:ow-test:value');raises(function(){schemas.inspect('urn:ow-test:value',1);})
})
test('workflow isolation and real outcomes',function(){
  var s=session(),options={trusted:true,job:'ProcessOrder',args:{items:[1,2]},mocks:{Inventory:{available:true}},expect:{status:'SUCCESS',jobsExecuted:['ProcessOrder']}}
  if(getEnv('OW_TEST_SOURCE')==='1')options.sourceRoot=String(new java.io.File('.').getCanonicalPath())
  var r=s.ojob('tests/fixtures/ow-test/orders.yaml',options);check(r.output.status==='CONFIRMED'&&r.evidenceMode==='mixed','mocked composed job');check(r.output.items.length===2,'workflow input arrays preserved')
  options.job='Broken';options.mocks={};options.expect={status:'ERROR',errors:1};r=s.ojob('tests/fixtures/ow-test/orders.yaml',options);check(r.status==='ERROR','caught workflow failure')
  raises(function(){s.ojob('tests/fixtures/ow-test/orders.yaml',{});},'PermissionError')
})
test('timeout cleanup waits for actual termination',function(){
  var s=session(),release=new java.util.concurrent.atomic.AtomicBoolean(false),cleaned=new java.util.concurrent.atomic.AtomicBoolean(false)
  var r=s.execute('noncooperative',function(c){c.defer(function(){cleaned.set(true);});while(!release.get()){try{java.lang.Thread.sleep(5);}catch(ignore){}}},{timeout:20})
  try{check(r.status==='TIMEOUT'&&!s.getResults().complete&&!cleaned.get(),'unsafe cleanup deferred');raises(function(){s.execute('reuse',function(){});},'SessionPoisonedError');raises(function(){s.reset();},'SessionPoisonedError');}finally{release.set(true);}
  s.eventually(function(){return cleaned.get();},{equals:true,interval:5,timeout:2000})
})
test('hook deadlines and external exit status',function(){
  var s=session();s.suite('deadline',function(t){t.beforeAll(function(){java.lang.Thread.sleep(100);});t.test('blocked',function(){});});var r=s.run({timeout:10});check(r.exitCode===2&&r.tests[0].status==='BLOCKED','hook deadline')
  var command=[String(java.lang.System.getProperty('java.home'))+'/bin/java','-Dopenaf.test.worker=true','-jar',getOpenAFJar(),'-c','exit(7)']
  s=session();s.testExternally('external',command,5000);check(s.getCountFail()===1&&s.getProfileHits('external')===1&&s.getExecHistory()[0].exitCode===7,'external exactly once')
})
test('published result schema',function(){
  var s=session();s.suite('schema',function(t){t.test('pass',function(c){c.assertEqual(1,1);});t.todo('later');});s.run();var validation=ow.obj.schemaCreate().inspect(io.readFileJSON('docs/schemas/ow-test-results.schema.json'),s.getResults());check(validation.valid,JSON.stringify(validation.errors))
})
test('temporary resources and reporter loading',function(){
  var s=session(),directory
  var r=s.execute('temporary',function(c){directory=c.tmpDir();io.writeFileString(directory+'/data.txt','fixture');var ch=c.channel();ch.set({id:1},{value:2});c.assertEqual(ch.get({id:1}).value,2);})
  check(r.status==='PASS'&&!io.fileExists(directory),'recursive temporary cleanup')
  check(typeof s.report.json(s.getResults())==='string','report facade')
})
test('legacy profile and channel compatibility',function(){
  var s=session();s.setMemoryProfile(true);s.setShowStackTrace(false);s.setKeepStackTrace(true)
  check(s.test('arguments',function(setResult,args){setResult({value:args.value});return args.value;},{value:3})===3,'legacy callback arguments')
  var history=s.getExecHistory()[0].executions[0];check(typeof history.diffMem==='number'&&typeof history.startTotalMem==='number','legacy memory fields')
  s.getChannel();s.test('published',function(){});check(Number(s.getChannel().get('published').hits.get())===1,'raw channel atomic counters')
  check(s.getAllProfileHits().arguments===1&&s.getAllProfileLast().arguments>=0&&s.getAllProfileAvg().arguments>=0,'receiver-local profile enumeration')
  s.getChannel().destroy()
})
test('invalid run budgets reject before scheduling',function(){
  var s=session();s.suite('configuration',function(t){t.test('case',function(){});})
  raises(function(){s.run({retries:-1});});raises(function(){s.run({failurePolicy:'typo'});});raises(function(){s.run({tags:'fast'});});raises(function(){s.assertApprox(1,1,{absolute:NaN});});check(s.getCountTest()===0,'no misleading pass for invalid configuration')
})
test('dynamic setup skips are non-failing',function(){
  var s=session(),cleaned=false;s.suite('skip all',function(t){t.beforeAll(function(c){c.skip('environment');});t.afterAll(function(){cleaned=true;});t.test('case',function(){throw 'not executed';});});var r=s.run();check(r.exitCode===0&&r.tests[0].status==='SKIP'&&cleaned,'beforeAll skip')
  s=session();s.suite('skip each',function(t){t.beforeEach(function(c){c.skip('fixture');});t.test('case',function(){throw 'not executed';});});r=s.run();check(r.exitCode===0&&r.tests[0].status==='SKIP','beforeEach skip')
})
var report={checks:checks,failures:failures.length,errors:failures,complete:true}
io.writeFileJSON('tests/framework-results.json',report)
print(JSON.stringify({checks:checks,failures:failures.length}))
if(failures.length)exit(1);else exit(0)
