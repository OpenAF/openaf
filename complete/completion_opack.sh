#!/bin/sh

# Flags
F_info=1
F_search=1
F_install=1
F_install__d=0
F_install__force=0
F_install__repo=0
F_install__deps=0
F_install__useunzip=0
F_install__noverify=0
F_install__arg=0
F_erase=1
F_erase__force=0
F_erase__arg=0
F_update=1
F_update__all=0
F_update__noerase=0
F_update__erasefolder=0
F_exec=1
F_list=1
F_pack=1
F_genpack=1
F_add2db=1
F_remove4db=1
F_script=1
F_daemon=1
F_ojob=1
F__cred=1

# Iterate over the arguments
if [ $# -gt 0 ]; then
  FFOUND=0
  for arg in "$@"; do
    if [ "$arg" = "${!#}" ]; then FFOUND=1; break; fi
    # info single option
    if [ "$arg" = "info" ]; then FFOUND=1; F_info=0; fi
    # search single option
    if [ "$arg" = "search" ]; then FFOUND=1; F_search=0; fi
    # install options
    if [ "$arg" = "-d" ]; then FFOUND=1; F_install__d=1; F_install=0; fi
    if [ "$arg" = "-force" ]; then FFOUND=1; F_install__force=1; F_install=0; fi
    if [ "$arg" = "-repo" ]; then FFOUND=1; F_install__repo=1; F_install=0; fi
    if [ "$arg" = "-deps" ]; then FFOUND=1; F_install__deps=1; F_install=0; fi
    if [ "$arg" = "-useunzip" ]; then FFOUND=1; F_install__useunzip=1; F_install=0; fi
    if [ "$arg" = "-noverify" ]; then FFOUND=1; F_install__noverify=1; F_install=0; fi
    if [ "$arg" = "-arg" ]; then FFOUND=1; F_install__arg=1; F_install=0; fi
    # erase options
    if [ "$arg" = "-force" ]; then FFOUND=1; F_erase__force=1; F_erase=0; fi
    if [ "$arg" = "-arg" ]; then FFOUND=1; F_erase__arg=1; F_erase=0; fi
    # update options
    if [ "$arg" = "-all" ]; then FFOUND=1; F_update__all=1; F_update=0; fi
    if [ "$arg" = "-noerase" ]; then FFOUND=1; F_update__noerase=1; F_update=0; fi
    if [ "$arg" = "-erasefolder" ]; then FFOUND=1; F_update__erasefolder=1; F_update=0; fi
    # exec single option
    if [ "$arg" = "exec" ]; then FFOUND=1; F_exec=0; fi
    # list single option
    if [ "$arg" = "list" ]; then FFOUND=1; F_list=0; fi
    # pack single option
    if [ "$arg" = "pack" ]; then FFOUND=1; F_pack=0; fi
    # genpack single option
    if [ "$arg" = "genpack" ]; then FFOUND=1; F_genpack=0; fi
    # add2db single option
    if [ "$arg" = "add2db" ]; then FFOUND=1; F_add2db=0; fi
    # remove4db single option
    if [ "$arg" = "remove4db" ]; then FFOUND=1; F_remove4db=0; fi
    # script single option
    if [ "$arg" = "script" ]; then FFOUND=1; F_script=0; fi
    # daemon single option
    if [ "$arg" = "daemon" ]; then FFOUND=1; F_daemon=0; fi
    # ojob single option
    if [ "$arg" = "ojob" ]; then FFOUND=1; F_ojob=0; fi
    # -cred single option
    if [ "$arg" = "-cred" ]; then FFOUND=1; F__cred=0; fi
  done
fi

# Print completion for info
if [ $F_info -eq 1 ]; then
  echo "info	Provides information about the current package."
  
fi
# Print completion for search
if [ $F_search -eq 1 ]; then
  echo "search	Searches for a keyword on the repository."
  
fi
# Print completion for install
if [ $F_install -eq 1 ]; then
  echo "install	Install a package"
  
  echo "-d	Installation directory for package."
  echo "-force	Force instalation."
  echo "-repo	Use an alternatively repository for dependencies"
  echo "-deps	Automatically try to install dependencies"
  echo "-useunzip	Alternatively use unzip to save memory"
  echo "-noverify	Don't run hash verification on the end"
  echo "-arg	Pass an argument to the pre/post install scripts"
fi
# Print completion for erase
if [ $F_erase -eq 1 ]; then
  echo "erase	Deletes a package on the path specified -only files declared on the package.json will be deleted-"
  
  echo "-force	Force operation even with package dependencies"
  echo "-arg	Pass an argument to the pre/post erase scripts"
fi
# Print completion for update
if [ $F_update -eq 1 ]; then
  echo "update	Updates a package"
  
  echo "-all	Tries to update all packages locally installed"
  echo "-noerase	When updating don't delete the package first"
  echo "-erasefolder	Erase previous version folder while updating to a new version"
fi
# Print completion for exec
if [ $F_exec -eq 1 ]; then
  echo "exec	Executes code from an installed package"
  
fi
# Print completion for list
if [ $F_list -eq 1 ]; then
  echo "list	List installed packages"
  
fi
# Print completion for pack
if [ $F_pack -eq 1 ]; then
  echo "pack	Generates a opack file from a packaging directory"
  
fi
# Print completion for genpack
if [ $F_genpack -eq 1 ]; then
  echo "genpack	Generates a package.json for packaging"
  
fi
# Print completion for add2db
if [ $F_add2db -eq 1 ]; then
  echo "add2db	Add an already installed package to the local OpenPack database"
  
fi
# Print completion for remove4db
if [ $F_remove4db -eq 1 ]; then
  echo "remove4db	Remove a package entry from the local OpenPack database"
  
fi
# Print completion for script
if [ $F_script -eq 1 ]; then
  echo "script	Creates a shell script, on the current path, to execute a opack"
  
fi
# Print completion for daemon
if [ $F_daemon -eq 1 ]; then
  echo "daemon	Creates a shell script, on the current path, to execute an opack as a daemon"
  
fi
# Print completion for ojob
if [ $F_ojob -eq 1 ]; then
  echo "ojob	Creates a shell script, on the current path, to execute an opack as a ojob"
  
fi
# Print completion for -cred
if [ $F__cred -eq 1 ]; then
  echo "-cred	Provide authentication credentials for a remote repository -e.g. user:pass-"
  
fi

# end
if [ $FFOUND -eq 0 ]; then
  echo :4
else
  echo :2
fi

