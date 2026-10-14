#!/bin/sh
# Run from the repository root after building openaf.jar. No downloads.
set -eu
jq_bench_dir=${JQ_BENCH_DIR:-/tmp/openaf-jq-bench}
jq_bench_java=${JQ_BENCH_JAVA:-java}
mkdir -p "$jq_bench_dir"
javac --release 21 -cp 'lib/*' -d "$jq_bench_dir" tests/benchmarks/jq/JqBench.java
jar cf "$jq_bench_dir/bench.jar" -C "$jq_bench_dir" bench
JQ_BENCH_DIR="$jq_bench_dir" "$jq_bench_java" --enable-native-access=ALL-UNNAMED -jar openaf.jar -f tests/benchmarks/jq/bench.js
