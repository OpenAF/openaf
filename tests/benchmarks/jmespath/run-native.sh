#!/bin/sh
# Run from the repository root after building openaf.jar. No downloads required.
set -eu
path_bench_java=${PATH_BENCH_JAVA:-java}
path_bench_dir=${PATH_BENCH_DIR:-/tmp/openaf-path-bench}
mkdir -p "$path_bench_dir"
for path_bench_run in 1 2 3; do
  rm -f "$path_bench_dir/results-native-run$path_bench_run.json"
  PATH_BENCH_RESULT="$path_bench_dir/results-native-run$path_bench_run.json" \
    "$path_bench_java" --enable-native-access=ALL-UNNAMED -jar openaf.jar \
    -f tests/benchmarks/jmespath/native.js > "$path_bench_dir/run$path_bench_run.log" 2>&1
  test -s "$path_bench_dir/results-native-run$path_bench_run.json"
done
