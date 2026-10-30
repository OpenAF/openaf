// Copyright 2026 Nuno Aguiar

(function() {
  exports.testCachedPoolLifecycle = function() {
    plugin("Threads");
    ["initCachedThreadPool", "initFixedThreadPool", "initSingleThreadPool", "initScheduledThreadPool", "initVirtualThreadPerTaskExecutor"].forEach(function(init) {
      var threads = new Threads();
      threads[init](1);
      var original = threads.getExecutorService();
      try {
        threads.initCachedThreadPool();
        ow.test.assert(original.equals(threads.getExecutorService()), true, "Preserve " + init);
        threads.stop(true);
        threads.initCachedThreadPool();
        ow.test.assert(original.equals(threads.getExecutorService()), true, "Do not restart a stopped executor");
      } finally {
        threads.stop(true);
        original.shutdownNow();
      }
    });
    var threads = new Threads();
    var started = new java.util.concurrent.CountDownLatch(1);
    var release = new java.util.concurrent.CountDownLatch(1);
    var interrupted = new java.util.concurrent.CountDownLatch(1);
    threads.initCachedThreadPool();
    var original = threads.getExecutorService();
    try {
      threads.addCachedThread(function() {
        started.countDown();
        try { release.await(); } catch(e) { interrupted.countDown(); }
      });
      ow.test.assert(started.await(5, java.util.concurrent.TimeUnit.SECONDS), true, "Worker started");
      threads.initCachedThreadPool();
      threads.stop(true);
      ow.test.assert(interrupted.await(5, java.util.concurrent.TimeUnit.SECONDS), true, "Stop interrupts original worker");
      ow.test.assert(original.awaitTermination(5, java.util.concurrent.TimeUnit.SECONDS), true, "Original executor terminates");
    } finally {
      release.countDown();
      threads.stop(true);
      original.shutdownNow();
    }
  };
})();
