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

## 11. Advanced Parameter Validation
```yaml
jobs:
- name: "API Endpoint"
  check:
    in:
      endpoint: isString.match(/^https?:\/\//)
      method  : isString.oneOf(['GET', 'POST', 'PUT', 'DELETE']).default('GET')
      timeout : toNumber.isNumber.between(1000, 60000).default(30000)
      headers : isMap.default({})
      retries : toNumber.isNumber.between(0, 5).default(3)
    out:
      statusCode: isNumber.between(100, 599)
      responseTime: isNumber.min(0)
      success: toBoolean.isBoolean.default(false)
  exec: | #js
    var start = now();
    try {
      var response = $rest().get(args.endpoint, args.headers);
      args.statusCode = response.responseCode;
      args.success = response.responseCode < 400;
    } catch(e) {
      args.statusCode = 0;
      args.success = false;
    }
    args.responseTime = now() - start;
```

## 12. LLM-Powered Data Processing
```yaml
help:
  text: "Process data files using AI analysis"
  expects:
  - name: inputFiles
    desc: "Array of file paths to process"
  - name: prompt
    desc: "Analysis prompt for the LLM"

ojob:
  metrics:
    passive: true
    port: 9101

jobs:
- name: "AI Data Processor"
  check:
    in:
      inputFiles: isArray.minLength(1)
      prompt    : isString.minLength(10)
      model     : isString.default("gpt-3.5-turbo")
      batchSize : toNumber.isNumber.between(1, 100).default(10)
    out:
      processedCount: isNumber.min(0)
      results       : isArray
      errors        : isArray.default([])
  exec: | #js
    ow.loadAI();
    var llm = ow.ai.gpt({
      type: "openai",
      key: $sec("openai", "key"),
      model: args.model
    });
    
    args.results = [];
    args.processedCount = 0;
    
    args.inputFiles.forEach(file => {
      try {
        var data = io.readFileJSON(file);
        var analysis = llm.prompt(args.prompt + "\n\nData: " + JSON.stringify(data));
        args.results.push({ file: file, analysis: analysis });
        args.processedCount++;
      } catch(e) {
        args.errors.push({ file: file, error: e.message });
      }
    });
```

## 13. Telemetry-Enabled Service Monitor
```yaml
ojob:
  daemon: true
  timeInterval: 30000
  
  metrics:
    passive: true
    port: 9102
    uri: "/metrics"
    
    add:
      servicesUp: | #js
        return { value: $get("healthyServices") || 0 }
      responseTime: | #js
        return { value: $get("avgResponseTime") || 0 }
    
    openmetrics:
      url: "http://pushgateway:9091/metrics/job/service-monitor"
      period: 60000
      metrics: ["servicesUp", "responseTime"]

init:
  services:
  - { name: "api", url: "http://api:8080/health" }
  - { name: "db", url: "http://db:5432/health" }
  - { name: "cache", url: "http://cache:6379/ping" }

jobs:
- name: "Health Check"
  check:
    in:
      timeout: toNumber.default(5000)
    out:
      healthyCount: isNumber.min(0)
      totalResponseTime: isNumber.min(0)
  exec: | #js
    var healthy = 0, totalTime = 0;
    
    args.init.services.forEach(service => {
      var start = now();
      try {
        var response = $rest({timeout: args.timeout}).get(service.url);
        if (response.responseCode < 400) healthy++;
        totalTime += (now() - start);
      } catch(e) {
        logWarn("Service " + service.name + " unhealthy: " + e.message);
      }
    });
    
    args.healthyCount = healthy;
    args.totalResponseTime = totalTime;
    $set("healthyServices", healthy);
    $set("avgResponseTime", totalTime / args.init.services.length);
    
  daemonFunc: | #js
    $job("Health Check");
```

## 14. Integrity-Protected Configuration
```yaml
ojob:
  integrity:
    list:
    - config/prod.yaml: sha256:abc123...
    - config/secrets.yaml: sha256:def456...
    strict: true
    warn: false

include:
- config/prod.yaml
- config/secrets.yaml

jobs:
- name: "Secure Job"
  check:
    in:
      apiKey    : isString.minLength(32)
      environment: isString.oneOf(['dev', 'staging', 'prod'])
      debug     : toBoolean.default(false)
  exec: | #js
    // Configuration files verified before this runs
    log("Running in " + args.environment + " environment");
```

---
See also: `ojob-security.md` for hardening and `openaf-flags.md` for tuning.
