# oJob  <a href="/"><img align="right" src="images/openaf_small.png"></a>

oJob is an automated OpenAF job executor. It basically tries to modularize and organize script processing hiding most of the complexity of handling execution dependencies, parallel processing, running scripts as daemons, remote coordinated job execution, reusable modules for multiple targets, etc.

A oJob is mainly defined by a YAML file (although it can also be defined in JSON) that looks like a shopping list:

````yaml
jobs:
   - name: Get eggs
   - name: Get sugar
   - name: Get floor
   
   - name: Make cake
     deps:
       - Get eggs
       - Get sugar
       - Get floor

todo:
   - Get eggs
   - Get sugar
   - Get floor
   - Make cake
````

From this yaml file oJob already understands that we need to somehow get eggs, sugar and floor (even in parallel if possible) in order to be ready to prepare a cake.

So basically you have a jobs section that defines each job (for the sake of simplicity of the example we didn't define how to execute each job) and if they have dependencies to start. Then you have a to do section that defines, by order, what needs to happen.

To run it you would just execute:
````bash
ojob myrecipe.yaml
````

In the next chapters will go through how you can add arguments to each job (e.g. how many eggs, how much sugar, …), how you can have jobs chains (e.g. job “Get ingredients” → “Make cake” → “Serve cake” for just a to do “Make cake”), how you can make a production line of cakes with array arguments and more.

# Jobs

A job is simple module unit in oJob, identified by an unique name that can be plug in different ways to reach the end goal. As input they accept arguments, as output they execute the actions you define:

````yaml
jobs:
   - name: Say hello
     exec: >
       print("Hello " + args.who);
       
todo:
   - name: Say hello
     args: 
       who: world
````

As you can see on the example above, the todo list can also contain arguments for a job. And inside a job you have the “args” map available with the args provide in the todo.

Each job definition has the following possible entries:

| Entry | Type | Mandatory? | Description |
|-------|------|------------|-------------|
| name  | _string_ | _yes_ | _The **unique name** of the job._ |
| args  | _map/array_ | _no_ | _A map of arguments to be used by the job. It will be available on openaf code as a "args" map. If instead of a map is defined as an array it will execute the job for each array entry that will represent each job execution map of arguments._ |
| exec  | _string_ | _no_ | _OpenAF code that gets executed for this job. If it throws an exception the job will fail otherwise it will be considered successful._ |
| deps  | _array_ | _no_ | _An array of job dependencies where you refer other jobs by their unique name or a map with the following entries: name, onSuccess, onFail. The onSuccess and onFail can be used to define OpenAF code to execute on the success or failure of the job dependency executions. If the code returns true it will be consider as a satisfied dependency allowing the current job definition to execute, if false it will be consider that the current job definition can't be executed. Additionally theses functions can access the current "args", "job" map and run "id"._ |
| type  | _string_ | _no_ | _The oJob type. By default they are of type "single". But you can specify other types of jobs like shutdown, periodic and "jobs". See more on the job types sub-chapter._ |
| typeArgs | _map_ | _no_ | _A map of arguments to be provided for each job type. Common to all is the typeArg 'single' which tries to force the job to run in a single thread if args is an array. See more on the job types sub-chapter._ |
| from  | _string/array_ | _no_ | _The name of a job (or ordered list) whose execution will be prefixed (like a document header) with the current job execution (e.g. if you want all job executions to execute another job initially)._ |
| to    | _string/array_ | _no_ | _The name of a job (or ordered list) whose execution will be suffixed (like a document footer) with the current job execution (e.g. if you want all job executions to execute another job when they end)._ | 
| help  | _string_ | _no_ | _A help text to be presented whenever you execute "ojob -jobhelp 'My job'"_ |
| lang  | _string_ | _no_ | _The executing language for the "exec" entry. By default languages 'js' (default), 'python' and 'shell' can be used but custom languages can be added using the ojob.langs entry or the typeArgs.langs entry. For 'js' and 'python' job arguments will be available in the "args" variable for other shell based languages job arguments will be converted to environment variables._ |

## Job types

The most used type of job is "simple". All job types, including "simple" have the following typeArgs:

| typeArgs entry | Type | Mandatory? | Description |
|----------------|------|------------|-------------|
| timeout | _number_ | _no_ | _The time interval, in milliseconds, for the entire job execution or between stopWhen function executions. If no stopWhen function is provided and the timeout time is exceeded the job will fail indicating that it exceed the timeout. _ |
| stopWhen | _string_ | _no_ | _Function string that will be evaluated continuously or every timeout time interval. If the function returns true the current job execution will be terminated._ |
| langs | _map_ | _no_ | _Map with lang (language name) and shell (language shell command) to be used as the executing language for the "exec" entry. Job arguments will be available as environment variables._ |

Then for other types there are specific typeArgs available:

### periodic

This job when included on a todo list will execute on a separate thread the job periodically until the ojob ends or it's stopped (if ojob.daemon is set to true). You can optionally provide a cron like expression time. To set this you can provide as typeArgs:

| typeArgs entry | Type | Mandatory? | Description |
|----------------|------|------------|-------------|
| timeInterval | _number_ | _no_ |  _The time interval in milliseconds between each job execution periodic execution._ |
| cron | _string_ | _no_ | _If defined, a minutes-based (e.g. * * * * *) or seconds-based (e.g. * * * * * *) cron-like expression to indicate if the job should run between. This cron expression will be checked for on the start of each timeInterval if defined otherwise a single thread will wait for the next scheduled cron event._ |
| waitForFinish | _boolean_ | _no_ | _If defined and set to true the timeInterval is considered from the end of execution (even if bigger than the defined timeInterval). Thus preventing more than one concurrent execution to occur. If not defined or set to false the timeInterval is considered from the beginning of execution. So even if the first execution didn't end and second will start if the timeInterval has reach it's end._ |

Example:

````yaml
ojob:
   daemon: true

jobs:
   # Say the time regularly
   - name         : Say the time
     type         : periodic
     typeArgs     :
        waitForFinish: false
        cron         : "*/5 * * * * *"
     exec         : >
        print(new Date());

todo:
   - Say the time
````

### subscribe

This job type will execute whenever a set/setAll/unSet operation occurs in a channel (OpenAF channel subscriber). The job execution will have access to the operation, key(s) and value(s) affected.

Example:

````yaml
jobs:
   - name    : Print stuff
     type    : subscribe
     typeArgs:
        chSubscribe: myChannel
     exec    : |
        sprint(args);
        // args.ch - channel name
        // args.op - operation (set/unset/setall)
        // args.k - the key (set/unset) or key fields to use (setall)
        // args.v - the value (set/unset) or array of values (setall)

todo: 
   - Print stuff
````

| typeArgs entry | Type | Mandatory? | Description |
|----------------|------|------------|-------------|
| chSubscribe | String | Yes | The channel name to subscribe for changes. |

### shutdown

This is equivalent to single but it will only be triggered on the end of the oJob script or if a shutdown signal is received. It's ideal use is closing open connections, saving data before a crash, etc... It has no typeArgs available.

Example:

````yaml
jobs:
   - name: Do stuff
     exec: >
       print("I'm doing stuff...");
       // connectionStart()
   
   - name: Close
     type: shutdown
     exec: >
       print("I'm going to die now... bye!");
       // connectionClose()
       
todo:
   
   - Close
   - Do stuff
````

_Why isn't there a “startup” type? That's because you control what runs first in the todo list and with job dependencies or you can use the sequence mode (see oJob settings)._

### jobs

"The mother of all jobs" in the sense that will execute any other provided ojob yaml file with it's jobs and todo. The arguments received by this job will be passed through as arguments all jobs in the ojob yaml file. It has one typeArgs: file. This argument is the file path to the other ojob yaml file.

````yaml
jobs:
   - name    : Do stuff for a date
     type    : jobs
     typeArgs:
        file: lotsOfStuff.yaml
     args    :
        dateToProcess: 20170101
   
   - name    : Done
     deps    :
        - Do stuff for a date
     exec    : >
       print("Finally... everything is done.");
       
todo:
   - Do stuff for a date
   - Done
````

# Todo

This is where you define the list of what needs to be done (e.g. to do). Let's consider the example: 

````yaml
jobs:
   - name: Get eggs
   - name: Get sugar
   - name: Get floor
   
   - name: Make cake
     deps:
       - Get eggs
       - Get sugar
       - Get floor

todo:
   - Get eggs
   - Get sugar
   - Get floor
   - Make cake
````

oJob will try to "Get eggs", "Get sugar", "Get floor" and "Make cake" in parallel. Since "Make cake" depends on the success of "Get eggs", "Get sugar", "Get floor" it won't start until all of them end successfully. This behavior can be changed by the ojob.sequential = true where oJob will honor the order of the todo list and execute subsequent job only when the previous and ended it's execution (but this doesn't disable the job dependencies check).

But each job execution might require different arguments. In this case, different quantities. So on "todo" you can specify arguments to execute each job:

````yaml
todo:
   - name: Get eggs
     args:
        howMany: 2
        size   : L

   - name: Get sugar
     args:
        cups: 1.5

   - Get floor
   - Make cake
```` 

If you instead of a map you provide a list/array then the job will be execute with each list of arguments provided on the list:

````yaml
todo:
   - name: Get eggs
     args:
        howMany: 8
        size   : L

   - name: Get sugar
     args:
        cups: 5

   - Get floor

   - name: Make cake
     args:
        - name           : Chocolate cake
          typeOfChocolate: milk
        - name           : Dark chocolate cake
          typeOfChocolate: dark
````

# Include

This is where you can include other ojob files with more job definitions. This allows for having modular ojob files with different type of jobs. It's basically an array/list of file paths. The files will be searched on the current path and on the installed oPacks. So if you install [oJob-common](https://github.com/OpenAF/oJob-common), for example, you can include existing job definitions in other ojob files:

````yaml
include:
   - oJobSSH.yaml

jobs:
   - name: print remote cpuinfo
     to  : SSH Exec
     args:
       host : some.host
       login: mylogin
       pass : mypassword
       cmd  : >
          cat /proc/cpuinfo

todo:
  - print remote cpuinfo
````

# oJob

This is where you set specific settings on how the ojob should run. Here is a list:

| Entry | Type | Description |
|-------|------|-------------|
| logToFile | _map_ | _Map with the same options as ow.ch.utils.setLogToFile_ |
| log | _map_ | _Map with the same options as setLog_ |
| recordLog | _boolean_ | _Determines if it should use startLog to log into the __log channel._ |
| logArgs | _boolean_ | _If true the arguments provided to each job execution will be logged (defaults to false)._ |
| logToConsole | _boolean_ | _If false ojob logging won't be output to the console (defaults to true)._ |
| logLimit | _number_ | _The number of internal execution logs per job that should be kept (default to 100)._ |
| logJobs | _boolean_ | _If false no job start, end or error will be logged. (default to true)._ |
| unique | _map_ | _Map to ensure that only one instance of ojob runs. The map can define a pidFile (defaults to ojob.pid and will be evaluated as code) and killPrevious (defaults to false)._ |
| sequential | _boolean_ | _If true each todo entry will be executed only when the previous has ended it's execution. Otherwise it will try to execute in parallel._ |
| daemon | _boolean_ | _If true the ojob will behave like a daemon. It will only exit if the process is killed or if executed with the arguments stop, forcestop or restart._ | 
| numThreads | _number_ | _Force the maximum number of threads to use. If not defined it will try to automatically assess an ideal number of threads to use._ |
| async | _boolean_ | _Runs all jobs asynchronously (defaults to false)_ | 
| depsTimeout | _number_ | _If defined establishes a maximum time interval, in ms, that each job will wait for the corresponding job dependencies to be fullfilled. If the time is exceeded the corresponding job will fail._ |
| conAnsi | _boolean_ | _Advanced option to turn off ansi characters use._ |
| conWidth | _number_ | _Advanced option to override screen size detection._ |
| langs | _array_ | List of maps with two entries: lang (a name) and shell (the command to execute). If the job has the "lang" entry it will invoke the "shell" command to execute the "exec" entry. Job arguments will be passed as environment variables._ |

**Note**: Use _sequential = true_ and _numThreads = 1_ for a total sequential execution. Keep in mind that if _numThreads_ is not defined or greater than 1 multiple job executions can still occur despite _sequential = true_ (for example when the job args is an array). The sequential parameter will just ensure that jobs listed in the todo list are executed in the order of the todo list instead of being launched all in parallel.

## channels

This is actually a map to define the channel use in the ojob:

| Entry | Type | Description |
|-------|------|-------------|
| expose | _boolean_ | _Determines if channels should be exposed externally._ | 
| port | _number_ | _If expose = true then defines the host port to use to expose channels._ |
| host | _string_ | _If expose = true then defines the network interface on which to expose channels._ |
| keyStorePath | _string_ | _If expose = true then defines where SSL keys are stored to use HTTPS._ |
| keyPassword | _string_ | _If expose = true and a keyStorePath was defined, defines the password to use to open the corresponding key store._ | 
| permissions | _string_ | _General permissions for anonymous access (r = read, w = write). Defaults to "r"._ |
| list | _array_ | _If expose = true specifies which channels should be exposed (default is all)._ |
| auth | _array_ | _Array of maps to provide http authentication when accessing channels. Each map should have a login, a pass and permissions._ |

# init

For organization proposes if a init entry is used all mapped values will be available during oJob execution in _args.init_ map entry.

# oJob command-line

To execute a ojob you can simple execute:

````bash
ojob myrecipe.yaml
````

You can add arguments that will be available to all jobs in the file as arguments:

````bash
ojob myrecipe.yaml typeOfChocolate=dark nameOfCake=My\ dark\ cake
````

You can also use the following extra options:

| Option | Description |
|--------|-------------|
| -compile | Processes all includes and the current file to produce a single YAML output. |
| -tojson | Processes all includes and the current file to produce a single JSON output. Useful to debug any YAML parsing issues. |
| -jobs | List all the jobs available including the ones defined in includes. |
| -todo | List the final todo list after processing all includes and the current file. | 
| -deps | Tries to provide a human readable representation of the dependencies between all jobs in includes and on the current file. |
| -jobhelp | Display any available help information for a job. Can include extra help of jobs defined in "from" an "to". Example: "ojob example.yaml -jobhelp oJob sh" |
| -nocolor | Removes all processing to determine screen size and use ansi colors. |