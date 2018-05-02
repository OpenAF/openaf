# oPromise <a href="/"><img align="right" src="images/openaf_small.png"></a>

## Introduction

### $do
The custom OpenAF promises (oPromise) can be used through ````$do````. They allow for easy asynchronous execution of a function or a chain of functions providing an object (aPromise) that allows us to manage it. The syntax to use is:

````javascript
$do(aDoFunction, aCatchFunction) : aPromise
````

So 'aDoFunction' is what we want to execute asynchronously. It receives two arguments: a success function and a failure function:

````javascript
$do((success, failure) => {
    try {
       doSomething();
       success("OK");
    } catch(e) {
       failure("NOT OK: " + e.message);
    } 
}, (aError) => {
    logErr("There was an error: " + aError);
})
````

If we call the *success* function with an argument that will indicate that whatever task was meant to execute went okay and the argument, if it exists, is what we want to pass to the next function in chain (if any). The *failure* function would get called if something went wrong and we want to represent that with an argument also. Whenever we use the *failure* function it will call the *aCatchFunction* with the provided argument. Of course, for simplification in OpenAF, we can also write with the same functionality:

````javascript
$do(() => {
   try {
      doSomething();
      return "OK";
   } catch(e) {
      throw "NOT OK: " + e.message;
   }
}, (aError) => {
    logErr("There was an error: " + aError);
});
````

But it really gets useful when we start chaining more functions. So, let's imagine that we want to download a file (*task 1*), then execute an action over that file if the download was successful (*task 2*) and if the processing was okay finish the job (*task 3*). If something goes wrong we want to log that error (*catch task*). Let's code it:

````javascript
var myDownload = $do(() => {
   // Task 1
   log("Downloading file...");
   return downloadFile(); // returns path with file
}).then((aPath) => {
   // Task 2
   log("Processing downloaded file...");
   processFile(aPath);
}).then(() => {
   // Task 3
   log("File downloaded and processed.");
}).catch((anError) => {
   // Catch task
   logErr("Something went wrong: " + anError);
});
````

So we have a "job" where we want to download a file as *task 1*, the path where it was download to it's passed to *task 2* to be processed. If everything goes okay then proceed to *task 3* to say everything was okay. If in any task there is an exception then we want log that. And we want this "job" to run asynchronous on a separated thread of it's own. So we get a myDownload "promise" that will have either of two final states:

* **Fulfilled** (everything went okay)
* **Failed** (there was an exception that wasn't dealt with).

So in our example "myDownload" will always finish as "Fulfilled" since we handle any exception on the "catch task". How do we check the state?

````javascript
if (myDownload.state == myDownload.states.FULFILLED)
   log("The job is done.");
else
   log("The job is not finished...");
````

### $doAll

So, using the previous example, let's say we have several files to download and we want to know when all download & processing jobs are finished. We can create an array of promises objects (like "myDownload") and create a new promise based on that array of promises:

````javascript
var myDownloads = $doAll(arrayOfMyDownload);
````

So the new *myDownloads* promises will only have the state "Fulfilled" when all jobs/promises are "Fulfilled" (of course, equally, if a job/promise "Failed" it will also "Failed" the *myDownloads* promise).

### $doFirst

Let's imagine a different scenario where we want a promise on the "fulfilment" of at least one of my download promises. We can create an array with our racing promises and create a new promise based on that array:

````javascript
var anyDownloads = $doFirst(arrayOfMyDownload);
````

So the promise *anyDownloads* will be "fulfilled" or "failed" based on the result of the first promise to reach an end state.

### $doWait

The promises are executed asynchronously but you might reach the end of the intended code and you just want to wait for the fulfilment or failure of a promise:

````javascript
$doWait(anyDownloads)
````

The $doWait function will synchronously wait (pausing the current thread execution) for the a close state on the provided promise (running on a different thread). 