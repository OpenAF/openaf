#!/bin/sh

# --------------------------------------
echo "Starting OpenAF test execution..."

# -------------------------
echo "Installing OpenAF..."
rm -rf _oaf
mkdir -p _oaf
cp openaf.jar _oaf
cd _oaf
java -jar openaf.jar --install

if [ -f ojob ]; then
    echo "OpenAF installed successfully."
else
    echo "OpenAF installation failed, exiting."
    exit 1
fi

# ----------------------------
echo "Running OpenAF tests..."
cd ..
cd tests
../_oaf/ojob autoTestAll.yaml

# If autoTestAll.results.json exist execute oaf
if [ -f autoTestAll.results.json ]; then
    ../_oaf/oaf -c "_r=io.readFileJSON('autoTestAll.results.json');if (_r.fail>0) exit(1); else exit(0)"
    if [ $? -ne 0 ]; then
        echo "Test execution failed, exiting with error."
        exit 1
    else
        echo "Test executed successfully."
    fi
else
    echo "autoTestAll.results.json not found, skipping oaf execution."
fi