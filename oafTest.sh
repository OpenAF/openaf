#!/bin/sh
set -eu
# Use the built artifact directly; leave any developer _oaf installation intact.
cd "$(dirname "$0")/tests"
rm -f autoTestAll.results.json
java -jar ../openaf.jar --ojob -e autoTestAll.yaml
if [ ! -f autoTestAll.results.json ]; then
    echo 'autoTestAll.results.json missing' >&2
    exit 1
fi
java -Dopenaf.test.worker=true -jar ../openaf.jar -c 'try { var r=io.readFileJSON("autoTestAll.results.json"); exit(r.complete===true && r.count>0 && r.fail===0 && r.infrastructureErrors.length===0 ? 0 : 1); } catch(e) { printErr(e); exit(1); }'
