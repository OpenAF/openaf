# oJob Recipes

[Index](./index.md) | [oJob Reference](./ojob.md) | [Security](./ojob-security.md) | [Flags](./openaf-flags.md) | [Recipes](./ojob-recipes.md) | [Advanced](./openaf-advanced.md)

Reusable, composable examples to accelerate authoring. Copy & adapt.

## 1. File Ingestion with Parallel Processing
```yaml
help:
  text   : "Ingest all JSON files and produce a merged report"
  expects:
  - name: inDir
    desc: Input folder
  - name: outFile
    desc: Output aggregated JSON

init:
  batch: 25

ojob:
  async  : false
  metrics:
    passive: true
    port   : 9101

jobs:
- name: List Files
  each: [ Process Batch ]
  exec: | #js
    var all = io.listFilenames(args.inDir).filter(f => f.endsWith('.json'));
    var batches=[];
    for (var i=0;i<all.length;i+=args.init.batch) batches.push(all.slice(i,i+args.init.batch));
    batches.forEach((b,idx)=> each({ files:b, idx, inDir:args.inDir, outFile:args.outFile }));

- name    : Process Batch
  typeArgs:
    lock: aggregate
  exec    : | #js
    var accum = [];
    args.files.forEach(f=>{
      var p = args.inDir + '/' + f;
      try { accum.push(io.readFileJSON(p)); } catch(e) { logWarn('Skip '+f+': '+e); }
    });
    var outPath = args.outFile;
    var existing = io.fileExists(outPath) ? io.readFileJSON(outPath) : [];
    io.writeFileJSON(outPath, existing.concat(accum));

- name: Report
  deps: [ List Files ]
  exec: | #js
    log('Total records: ' + io.readFileJSON(args.outFile).length);

todo:
- List Files
- Report
```

## 2. Reliable Scheduled Pull with Retry (cronCheck)
```yaml
jobs:
- name    : Pull Remote
  type    : periodic
  typeArgs:
    cron         : "0 */1 * * * *"    # every minute
    waitForFinish: true
    cronCheck    :
      active   : true
      ch       : oJob::cron
      retries  : 5
      retryWait: 3000
  exec    : | #js
    var r = ow.obj.rest.get('https://httpbin.org/status/200,500');
    if (r.responseCode != 200) throw 'HTTP '+r.responseCode;
```

## 3. Conditional Deployment Steps
```yaml
todo:
- (if    ): "args.env == 'prod'"
  ((then)):
  - (runfile): deploy-prod.yaml
  ((else)):
  - (runfile): deploy-dev.yaml
```

## 4. Secure Secret Injection
```yaml
todo:
- (secget     ): "db.password"
  ((secRepo  )): main
  ((secBucket)): prod
- (run        ): Init DB
  ((args     )):
    password: "{{$get 'db.password'}}"
```

## 5. Data Transformation Pipeline (No Custom JS)
```yaml
todo:
- (fileget  ): data.csv
  ((out    )): raw
- (oafp     ): raw
  ((from   )): csv
  ((to     )): json
  ((outPath)): records
- (query    ): "[?status=='ACTIVE']"
  ((from   )): records
  ((to     )): active
- (output   ): active
  ((format )): json
```

## 6. Parallel Function Fan-out
```yaml
jobs:
- name: Prepare
  exec: | #js
    args.targets = ['a','b','c','d'];

- name: Fan Out
  args: | #js
    (args.targets.map(t => ({ target: t })))
  exec: | #js
    log('Processing '+args.target);

- name: Aggregate
  deps: [ Fan Out ]
  exec: | #js
    log('All fan-out executions complete');

todo:
- Prepare
- Fan Out
- Aggregate
```

## 7. Lock-Protected Critical Section
```yaml
jobs:
- name    : Critical Task
  typeArgs:
    lock: global
  exec    : | #js
    // Only one instance at a time regardless of async scheduling
    doSomething();
```

## 8. Graceful Singleton Service
```yaml
ojob:
  unique      :
    pidFile     : service.pid
    killPrevious: false
  daemon      : true
  timeInterval: 5000
  daemonFunc  : | #js
    log('Heartbeat ' + new Date());
```

## 9. Template-driven File Generation
```yaml
todo:
- (template): "Hello {{name}}"  
  ((data  )): { name: "World" }
  ((out   )): generated.txt
```

## 10. Metrics Enrichment
```yaml
ojob:
  metrics:
    add:
      progress: | #js
        return { value: $get('processed') || 0 }

jobs:
- name: Work
  exec: | #js
    var c = ($get('processed') || 0) + 1;
    $set('processed', c);
```

---
See also: `ojob-security.md` for hardening and `openaf-flags.md` for tuning.
