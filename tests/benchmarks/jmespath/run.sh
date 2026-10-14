#!/bin/sh
# Run from the repository root. Downloads benchmark-only dependencies into /tmp.
set -eu
bench_dir=/tmp/openaf-jmes-bench
mkdir -p "$bench_dir"
fetch() {
  if [ ! -f "$bench_dir/$2" ]; then
    curl -fL --max-time 60 "https://repo.maven.apache.org/maven2/$1" -o "$bench_dir/$2.tmp"
    mv "$bench_dir/$2.tmp" "$bench_dir/$2"
  fi
}
fetch io/burt/jmespath-core/0.6.0/jmespath-core-0.6.0.jar jmespath-core.jar
fetch io/burt/jmespath-jackson/0.6.0/jmespath-jackson-0.6.0.jar jmespath-jackson.jar
fetch com/fasterxml/jackson/core/jackson-core/2.22.2/jackson-core-2.22.2.jar jackson-core-2.22.2.jar
fetch com/fasterxml/jackson/core/jackson-databind/2.22.2/jackson-databind-2.22.2.jar jackson-databind-2.22.2.jar
fetch com/fasterxml/jackson/core/jackson-annotations/2.22/jackson-annotations-2.22.jar jackson-annotations-2.22.jar
javac -cp "$bench_dir/*" -d "$bench_dir" tests/benchmarks/jmespath/JmesBench.java
jar cf "$bench_dir/bench.jar" -C "$bench_dir" bench
java -jar openaf.jar -f tests/benchmarks/jmespath/bench.js
java -jar openaf.jar -f tests/benchmarks/jmespath/direct-probe.js
