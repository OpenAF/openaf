#!/bin/sh

# Flags
_G_EXACT_CHOSEN=0
F_info=1
F_search=1
F_install=1
F_install_SEEN=0
F_install__d=1
F_install__force=1
F_install__repo=1
F_install__deps=1
F_install__useunzip=1
F_install__noverify=1
F_install__arg=1
F_erase=1
F_erase_SEEN=0
F_erase__force=1
F_erase__arg=1
F_update=1
F_update_SEEN=0
F_update__all=1
F_update__noerase=1
F_update__erasefolder=1
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
FFOUND=0
if [ $# -gt 0 ]; then
  _n=$#
  _i=0
  for arg in "$@"; do
    _i=$((_i+1))
    if [ $_i -eq $_n ]; then FFOUND=1; break; fi
    # info single option
    if [ "$arg" = "info" ]; then FFOUND=1; F_info=0; fi
    # search single option
    if [ "$arg" = "search" ]; then FFOUND=1; F_search=0; fi
    # install subcommand
    if [ "$arg" = "install" ]; then FFOUND=1; F_install=0; F_install_SEEN=1; _G_EXACT_CHOSEN=1; fi
    if [ $F_install_SEEN -eq 1 ] && [ "$arg" = "-d" ]; then FFOUND=1; F_install__d=0; fi
    if [ $F_install_SEEN -eq 1 ] && [ "$arg" = "-force" ]; then FFOUND=1; F_install__force=0; fi
    if [ $F_install_SEEN -eq 1 ] && [ "$arg" = "-repo" ]; then FFOUND=1; F_install__repo=0; fi
    if [ $F_install_SEEN -eq 1 ] && [ "$arg" = "-deps" ]; then FFOUND=1; F_install__deps=0; fi
    if [ $F_install_SEEN -eq 1 ] && [ "$arg" = "-useunzip" ]; then FFOUND=1; F_install__useunzip=0; fi
    if [ $F_install_SEEN -eq 1 ] && [ "$arg" = "-noverify" ]; then FFOUND=1; F_install__noverify=0; fi
    if [ $F_install_SEEN -eq 1 ] && [ "$arg" = "-arg" ]; then FFOUND=1; F_install__arg=0; fi
    # erase subcommand
    if [ "$arg" = "erase" ]; then FFOUND=1; F_erase=0; F_erase_SEEN=1; _G_EXACT_CHOSEN=1; fi
    if [ $F_erase_SEEN -eq 1 ] && [ "$arg" = "-force" ]; then FFOUND=1; F_erase__force=0; fi
    if [ $F_erase_SEEN -eq 1 ] && [ "$arg" = "-arg" ]; then FFOUND=1; F_erase__arg=0; fi
    # update subcommand
    if [ "$arg" = "update" ]; then FFOUND=1; F_update=0; F_update_SEEN=1; _G_EXACT_CHOSEN=1; fi
    if [ $F_update_SEEN -eq 1 ] && [ "$arg" = "-all" ]; then FFOUND=1; F_update__all=0; fi
    if [ $F_update_SEEN -eq 1 ] && [ "$arg" = "-noerase" ]; then FFOUND=1; F_update__noerase=0; fi
    if [ $F_update_SEEN -eq 1 ] && [ "$arg" = "-erasefolder" ]; then FFOUND=1; F_update__erasefolder=0; fi
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
if [ $_G_EXACT_CHOSEN -eq 0 ] && [ $F_info -eq 1 ]; then
  printf '%s\t%s\n' 'info' 'Provides information about the current package.'
fi
# Print completion for search
if [ $_G_EXACT_CHOSEN -eq 0 ] && [ $F_search -eq 1 ]; then
  printf '%s\t%s\n' 'search' 'Searches for a keyword on the repository.'
fi
# Print completion for install
if [ $_G_EXACT_CHOSEN -eq 0 ] && [ $F_install -eq 1 ]; then
  printf '%s\t%s\n' 'install' 'Install a package'
fi
if [ $F_install_SEEN -eq 1 ]; then
  if [ $F_install__d -eq 1 ]; then
    printf '%s\t%s\n' '-d' 'Installation directory for package.'
  fi
  if [ $F_install__force -eq 1 ]; then
    printf '%s\t%s\n' '-force' 'Force instalation.'
  fi
  if [ $F_install__repo -eq 1 ]; then
    printf '%s\t%s\n' '-repo' 'Use an alternatively repository for dependencies'
  fi
  if [ $F_install__deps -eq 1 ]; then
    printf '%s\t%s\n' '-deps' 'Automatically try to install dependencies'
  fi
  if [ $F_install__useunzip -eq 1 ]; then
    printf '%s\t%s\n' '-useunzip' 'Alternatively use unzip to save memory'
  fi
  if [ $F_install__noverify -eq 1 ]; then
    printf '%s\t%s\n' '-noverify' 'Don'\''t run hash verification on the end'
  fi
  if [ $F_install__arg -eq 1 ]; then
    printf '%s\t%s\n' '-arg' 'Pass an argument to the pre/post install scripts'
  fi
fi
# Print completion for erase
if [ $_G_EXACT_CHOSEN -eq 0 ] && [ $F_erase -eq 1 ]; then
  printf '%s\t%s\n' 'erase' 'Deletes a package on the path specified -only files declared on the package.json will be deleted-'
fi
if [ $F_erase_SEEN -eq 1 ]; then
  if [ $F_erase__force -eq 1 ]; then
    printf '%s\t%s\n' '-force' 'Force operation even with package dependencies'
  fi
  if [ $F_erase__arg -eq 1 ]; then
    printf '%s\t%s\n' '-arg' 'Pass an argument to the pre/post erase scripts'
  fi
fi
# Print completion for update
if [ $_G_EXACT_CHOSEN -eq 0 ] && [ $F_update -eq 1 ]; then
  printf '%s\t%s\n' 'update' 'Updates a package'
fi
if [ $F_update_SEEN -eq 1 ]; then
  if [ $F_update__all -eq 1 ]; then
    printf '%s\t%s\n' '-all' 'Tries to update all packages locally installed'
  fi
  if [ $F_update__noerase -eq 1 ]; then
    printf '%s\t%s\n' '-noerase' 'When updating don'\''t delete the package first'
  fi
  if [ $F_update__erasefolder -eq 1 ]; then
    printf '%s\t%s\n' '-erasefolder' 'Erase previous version folder while updating to a new version'
  fi
fi
# Print completion for exec
if [ $_G_EXACT_CHOSEN -eq 0 ] && [ $F_exec -eq 1 ]; then
  printf '%s\t%s\n' 'exec' 'Executes code from an installed package'
fi
# Print completion for list
if [ $_G_EXACT_CHOSEN -eq 0 ] && [ $F_list -eq 1 ]; then
  printf '%s\t%s\n' 'list' 'List installed packages'
fi
# Print completion for pack
if [ $_G_EXACT_CHOSEN -eq 0 ] && [ $F_pack -eq 1 ]; then
  printf '%s\t%s\n' 'pack' 'Generates a opack file from a packaging directory'
fi
# Print completion for genpack
if [ $_G_EXACT_CHOSEN -eq 0 ] && [ $F_genpack -eq 1 ]; then
  printf '%s\t%s\n' 'genpack' 'Generates a package.json for packaging'
fi
# Print completion for add2db
if [ $_G_EXACT_CHOSEN -eq 0 ] && [ $F_add2db -eq 1 ]; then
  printf '%s\t%s\n' 'add2db' 'Add an already installed package to the local OpenPack database'
fi
# Print completion for remove4db
if [ $_G_EXACT_CHOSEN -eq 0 ] && [ $F_remove4db -eq 1 ]; then
  printf '%s\t%s\n' 'remove4db' 'Remove a package entry from the local OpenPack database'
fi
# Print completion for script
if [ $_G_EXACT_CHOSEN -eq 0 ] && [ $F_script -eq 1 ]; then
  printf '%s\t%s\n' 'script' 'Creates a shell script, on the current path, to execute a opack'
fi
# Print completion for daemon
if [ $_G_EXACT_CHOSEN -eq 0 ] && [ $F_daemon -eq 1 ]; then
  printf '%s\t%s\n' 'daemon' 'Creates a shell script, on the current path, to execute an opack as a daemon'
fi
# Print completion for ojob
if [ $_G_EXACT_CHOSEN -eq 0 ] && [ $F_ojob -eq 1 ]; then
  printf '%s\t%s\n' 'ojob' 'Creates a shell script, on the current path, to execute an opack as a ojob'
fi
# Print completion for -cred
if [ $_G_EXACT_CHOSEN -eq 0 ] && [ $F__cred -eq 1 ]; then
  printf '%s\t%s\n' '-cred' 'Provide authentication credentials for a remote repository -e.g. user:pass-'
fi

# end
if [ $FFOUND -eq 0 ]; then
  echo :4
else
  echo :2
fi

