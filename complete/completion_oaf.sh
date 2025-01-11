#!/bin/sh

# Flags
F__e=1
F__c=1
F__p=1
F__o=1
F__f=1
F___install=1
F___check=1
F___update=1
F___console=1
F___repack=1
F___daemon=1
F___script=1
F___force=1
F___sb=1
F___py=1
F__h=1
F__v=1
F__helpscript=1

# Iterate over the arguments
if [ $# -gt 0 ]; then
  FFOUND=0
  for arg in "$@"; do
    if [ "$arg" = "${!#}" ]; then FFOUND=1; break; fi
    # -e single option
    if [ "$arg" = "-e" ]; then FFOUND=1; F__e=0; fi
    # -c single option
    if [ "$arg" = "-c" ]; then FFOUND=1; F__c=0; fi
    # -p single option
    if [ "$arg" = "-p" ]; then FFOUND=1; F__p=0; fi
    # -o single option
    if [ "$arg" = "-o" ]; then FFOUND=1; F__o=0; fi
    # -f single option
    if [ "$arg" = "-f" ]; then FFOUND=1; F__f=0; fi
    # --install single option
    if [ "$arg" = "--install" ]; then FFOUND=1; F___install=0; fi
    # --check single option
    if [ "$arg" = "--check" ]; then FFOUND=1; F___check=0; fi
    # --update single option
    if [ "$arg" = "--update" ]; then FFOUND=1; F___update=0; fi
    # --console single option
    if [ "$arg" = "--console" ]; then FFOUND=1; F___console=0; fi
    # --repack single option
    if [ "$arg" = "--repack" ]; then FFOUND=1; F___repack=0; fi
    # --daemon single option
    if [ "$arg" = "--daemon" ]; then FFOUND=1; F___daemon=0; fi
    # --script single option
    if [ "$arg" = "--script" ]; then FFOUND=1; F___script=0; fi
    # --force single option
    if [ "$arg" = "--force" ]; then FFOUND=1; F___force=0; fi
    # --sb single option
    if [ "$arg" = "--sb" ]; then FFOUND=1; F___sb=0; fi
    # --py single option
    if [ "$arg" = "--py" ]; then FFOUND=1; F___py=0; fi
    # -h single option
    if [ "$arg" = "-h" ]; then FFOUND=1; F__h=0; fi
    # -v single option
    if [ "$arg" = "-v" ]; then FFOUND=1; F__v=0; fi
    # -helpscript single option
    if [ "$arg" = "-helpscript" ]; then FFOUND=1; F__helpscript=0; fi
  done
fi

# Print completion for -e
if [ $F__e -eq 1 ]; then
  echo "-e	provide input directly instead of using stdin"
  
fi
# Print completion for -c
if [ $F__c -eq 1 ]; then
  echo "-c	provide javascript code directly"
  
fi
# Print completion for -p
if [ $F__p -eq 1 ]; then
  echo "-p	received streaming input -OS pipe-"
  
fi
# Print completion for -o
if [ $F__o -eq 1 ]; then
  echo "-o	output mode -__pmOut displayed-"
  
fi
# Print completion for -f
if [ $F__f -eq 1 ]; then
  echo "-f	provide a script file directly"
  
fi
# Print completion for --install
if [ $F___install -eq 1 ]; then
  echo "--install	generates scripts to use openaf on the current directory"
  
fi
# Print completion for --check
if [ $F___check -eq 1 ]; then
  echo "--check	checks if this is the current version"
  
fi
# Print completion for --update
if [ $F___update -eq 1 ]; then
  echo "--update	updates to the most current version"
  
fi
# Print completion for --console
if [ $F___console -eq 1 ]; then
  echo "--console	interactive OpenAF console"
  
fi
# Print completion for --repack
if [ $F___repack -eq 1 ]; then
  echo "--repack	repack OpenAF.jar for faster startup times"
  
fi
# Print completion for --daemon
if [ $F___daemon -eq 1 ]; then
  echo "--daemon	executes a script/opack as a daemon"
  
fi
# Print completion for --script
if [ $F___script -eq 1 ]; then
  echo "--script	executes a script/opack"
  
fi
# Print completion for --force
if [ $F___force -eq 1 ]; then
  echo "--force	forces an update"
  
fi
# Print completion for --sb
if [ $F___sb -eq 1 ]; then
  echo "--sb	generates or pre-appends openaf/ojob shebang to a js script or ojob yaml/json"
  
fi
# Print completion for --py
if [ $F___py -eq 1 ]; then
  echo "--py	runs a python script with openaf extensions"
  
fi
# Print completion for -h
if [ $F__h -eq 1 ]; then
  echo "-h	show this help information"
  
fi
# Print completion for -v
if [ $F__v -eq 1 ]; then
  echo "-v	show the version"
  
fi
# Print completion for -helpscript
if [ $F__helpscript -eq 1 ]; then
  echo "-helpscript	show help on a search term on scripting"
  
fi

# end
if [ $FFOUND -eq 0 ]; then
  echo :4
else
  echo :2
fi

