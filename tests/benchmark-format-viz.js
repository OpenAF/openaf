// Optional reference-machine benchmark, separate from deterministic unit tests.
// java -jar ../openaf.jar -f benchmark-format-viz.js
ow.loadFormat()
var iterations = Number(getEnv("FORMAT_VIZ_BENCH_ITERATIONS") || 200)
var warmup = Number(getEnv("FORMAT_VIZ_BENCH_WARMUP") || 100)
var batches = Number(getEnv("FORMAT_VIZ_BENCH_BATCHES") || 5)
if (!isFinite(iterations) || iterations < 1 || Math.floor(iterations) != iterations || !isFinite(warmup) || warmup < 0 || Math.floor(warmup) != warmup || !isFinite(batches) || batches < 1 || Math.floor(batches) != batches) throw new Error("Invalid benchmark sample counts")
var caps = { width: 100, height: 30, unicode: true, ansi: true, colorMode: "truecolor" }
var opts = { width: 32, height: 10, size: "medium", capabilities: caps, palette: "truecolor" }
var slices = []
for (var i = 0; i < 12; i++) slices.push({label:"C" + i,value:i + 1,color:i % 2 ? "RED" : "BLUE"})
var jobs = [
  {name:"legacySparkline",budget:5,render:function(){return ow.format.printSparkline([1,4,2,5,3],{width:40,palette:"none"})}},
  {name:"legacyHeatmap",budget:15,render:function(){return ow.format.printHeatmap([[1,2,3],[3,2,1]],{width:40,height:10,palette:"none"})}},
  {name:"stackedBar",budget:5,render:function(){return ow.format.printStackedBar([50,30,20],merge(opts,{width:40,height:1}))}},
  {name:"halfblockPie",budget:15,render:function(){return ow.format.printPie([50,30,20],opts)}},
  {name:"braillePie",budget:15,render:function(){return ow.format.printPie(slices,merge(opts,{mode:"braille",legend:"none",width:20,height:8}))}},
  {name:"donut",budget:15,render:function(){return ow.format.printDonut([50,30,20],merge(opts,{centerText:"65%"}))}},
  {name:"divergingBars",budget:10,render:function(){return ow.format.printDivergingBars({down:-10,flat:0,up:30},opts)}},
  {name:"treemap",budget:40,render:function(){return ow.format.printTreemap(slices,merge(opts,{width:40,height:10}))}},
  {name:"enhancedSparkline",budget:5,render:function(){return ow.format.printSparkline([1,3,null,4,7,5],merge(opts,{min:0,max:10,trend:true,markMax:true,highlightLast:true}))}},
  {name:"mixedDashboard",budget:50,render:function(){return ow.format.printDashboard([
    [{type:"pie",data:[50,30,20]},{type:"donut",data:[50,30,20]}],
    [{type:"stackedBar",data:[50,30,20]},{type:"treemap",data:{A:50,B:30,C:20}}]
  ],{width:100,height:30,palette:"truecolor",capabilities:caps})}}
]
var report = { noColor:isDef(getEnv("NO_COLOR")),requestedColorMode:caps.colorMode,runtime:getVersion(),java:String(java.lang.System.getProperty("java.version")),os:String(java.lang.System.getProperty("os.name")),arch:String(java.lang.System.getProperty("os.arch")),warmup:warmup,iterations:iterations,batches:batches,results:[] }
jobs.forEach(function(job) {
  for(var i=0;i<warmup;i++) job.render()
  var samples=[]
  for(var i=0;i<batches;i++) samples.push(ow.format.viz.benchmarkRender(job.render,{iterations:iterations}))
  report.results.push({name:job.name,budgetP95Ms:job.budget,withinBudget:samples.every(function(s){return s.p95Ms<=job.budget}),samples:samples})
})
print(stringify(report))
if (getEnv("FORMAT_VIZ_BENCH_ENFORCE") == "true" && report.results.some(function(r){return !r.withinBudget})) exit(1)
