#!/bin/sh

# Flags

# Iterate over the arguments
if [ $# -gt 0 ]; then
  FFOUND=0
  for arg in "$@"; do
    if [ "$arg" = "${!#}" ]; then FFOUND=1; break; fi
  done
fi


# end
if [ $FFOUND -eq 0 ]; then
  echo :4
else
  echo :2
fi

