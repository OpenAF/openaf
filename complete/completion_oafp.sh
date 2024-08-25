#!/bin/sh

# Flags
F_in_=1
F_in_ask=0
F_in_base64=0
F_in_ch=0
F_in_csv=0
F_in_db=0
F_indbjdbc_=1
F_indbuser_=1
F_indbpass_=1
F_indbtimeout_=1
F_indblib_=1
F_indbexec_=1
F_in_gb64json=0
F_in_hsperf=0
F_in_ini=0
F_in_json=0
F_in_jsonschema=0
F_in_jwt=0
F_in_lines=0
F_in_llm=0
F_in_llmmodels=0
F_in_ls=0
F_in_md=0
F_in_mdtable=0
F_in_ndjson=0
F_in_oaf=0
F_in_oafp=0
F_in_openmetrics=0
F_in_raw=0
F_in_rawhex=0
F_in_sh=0
F_in_slon=0
F_in_sql=0
F_in_toml=0
F_in_xls=0
F_in_xml=0
F_in_yaml=0
F_out_=1
F_out_base64=0
F_out_ch=0
F_out_chart=0
F_out_cjson=0
F_out_cmd=0
F_out_cslon=0
F_out_csv=0
F_out_ctable=0
F_out_ctree=0
F_out_db=0
F_out_envs=0
F_envscmd_=1
F_envsprefix_=1
F_out_gb64json=0
F_out_grid=0
F_out_html=0
F_out_ini=0
F_out_json=0
F_out_jwt=0
F_out_lines=0
F_out_log=0
F_out_map=0
F_out_md=0
F_out_mdtable=0
F_out_mdyaml=0
F_out_ndjson=0
F_out_openmetrics=0
F_out_pjson=0
F_out_prettyjson=0
F_out_pxml=0
F_out_raw=0
F_out_schart=0
F_out_slon=0
F_out_sql=0
F_out_stable=0
F_out_table=0
F_out_template=0
F_out_toml=0
F_out_tree=0
F_out_xls=0
F_out_xml=0
F_out_yaml=0
F__h=1
F_help_=1
F_help_filters=0
F_help_template=0
F_help_examples=0
F_file_=1
F_cmd_=1
F_data_=1
F_from_=1
F_sql_=1
F_sqlfilter_=1
F_sqlfiltertables_=1
F_path_=1
F_csv_=1
F_outkey_=1
F_outfile_=1
F_outfileappend_=1
F_pause_=1
F_color_=1
F_url_=1
F_urlmethod_=1
F_urlparams_=1
F_urldata_=1
F_chs_=1
F_loop_=1
F_loopcls_=1
F_libs_=1
F__examples=1
F_examples_=1
F_version_=1
F__v=1

# Iterate over the arguments
if [ $# -gt 0 ]; then
  for arg in "$@"; do
    if [ "$arg" = "${!#}" ]; then break; fi
    # in= options
    if [ "$arg" = "in=ask" ]; then F_in_ask=1; F_in_=0; fi
    if [ "$arg" = "in=base64" ]; then F_in_base64=1; F_in_=0; fi
    if [ "$arg" = "in=ch" ]; then F_in_ch=1; F_in_=0; fi
    if [ "$arg" = "in=csv" ]; then F_in_csv=1; F_in_=0; fi
    if [ "$arg" = "in=db" ]; then F_in_db=1; F_in_=0; fi
    if [ "${arg#indbjdbc=}" != "$arg" ]; then F_indbjdbc_=0; fi
    if [ "${arg#indbuser=}" != "$arg" ]; then F_indbuser_=0; fi
    if [ "${arg#indbpass=}" != "$arg" ]; then F_indbpass_=0; fi
    if [ "${arg#indbtimeout=}" != "$arg" ]; then F_indbtimeout_=0; fi
    if [ "${arg#indblib=}" != "$arg" ]; then F_indblib_=0; fi
    if [ "${arg#indbexec=}" != "$arg" ]; then F_indbexec_=0; fi
    if [ "$arg" = "in=gb64json" ]; then F_in_gb64json=1; F_in_=0; fi
    if [ "$arg" = "in=hsperf" ]; then F_in_hsperf=1; F_in_=0; fi
    if [ "$arg" = "in=ini" ]; then F_in_ini=1; F_in_=0; fi
    if [ "$arg" = "in=json" ]; then F_in_json=1; F_in_=0; fi
    if [ "$arg" = "in=jsonschema" ]; then F_in_jsonschema=1; F_in_=0; fi
    if [ "$arg" = "in=jwt" ]; then F_in_jwt=1; F_in_=0; fi
    if [ "$arg" = "in=lines" ]; then F_in_lines=1; F_in_=0; fi
    if [ "$arg" = "in=llm" ]; then F_in_llm=1; F_in_=0; fi
    if [ "$arg" = "in=llmmodels" ]; then F_in_llmmodels=1; F_in_=0; fi
    if [ "$arg" = "in=ls" ]; then F_in_ls=1; F_in_=0; fi
    if [ "$arg" = "in=md" ]; then F_in_md=1; F_in_=0; fi
    if [ "$arg" = "in=mdtable" ]; then F_in_mdtable=1; F_in_=0; fi
    if [ "$arg" = "in=ndjson" ]; then F_in_ndjson=1; F_in_=0; fi
    if [ "$arg" = "in=oaf" ]; then F_in_oaf=1; F_in_=0; fi
    if [ "$arg" = "in=oafp" ]; then F_in_oafp=1; F_in_=0; fi
    if [ "$arg" = "in=openmetrics" ]; then F_in_openmetrics=1; F_in_=0; fi
    if [ "$arg" = "in=raw" ]; then F_in_raw=1; F_in_=0; fi
    if [ "$arg" = "in=rawhex" ]; then F_in_rawhex=1; F_in_=0; fi
    if [ "$arg" = "in=sh" ]; then F_in_sh=1; F_in_=0; fi
    if [ "$arg" = "in=slon" ]; then F_in_slon=1; F_in_=0; fi
    if [ "$arg" = "in=sql" ]; then F_in_sql=1; F_in_=0; fi
    if [ "$arg" = "in=toml" ]; then F_in_toml=1; F_in_=0; fi
    if [ "$arg" = "in=xls" ]; then F_in_xls=1; F_in_=0; fi
    if [ "$arg" = "in=xml" ]; then F_in_xml=1; F_in_=0; fi
    if [ "$arg" = "in=yaml" ]; then F_in_yaml=1; F_in_=0; fi
    # out= options
    if [ "$arg" = "out=base64" ]; then F_out_base64=1; F_out_=0; fi
    if [ "$arg" = "out=ch" ]; then F_out_ch=1; F_out_=0; fi
    if [ "$arg" = "out=chart" ]; then F_out_chart=1; F_out_=0; fi
    if [ "$arg" = "out=cjson" ]; then F_out_cjson=1; F_out_=0; fi
    if [ "$arg" = "out=cmd" ]; then F_out_cmd=1; F_out_=0; fi
    if [ "$arg" = "out=cslon" ]; then F_out_cslon=1; F_out_=0; fi
    if [ "$arg" = "out=csv" ]; then F_out_csv=1; F_out_=0; fi
    if [ "$arg" = "out=ctable" ]; then F_out_ctable=1; F_out_=0; fi
    if [ "$arg" = "out=ctree" ]; then F_out_ctree=1; F_out_=0; fi
    if [ "$arg" = "out=db" ]; then F_out_db=1; F_out_=0; fi
    if [ "$arg" = "out=envs" ]; then F_out_envs=1; F_out_=0; fi
    if [ "${arg#envscmd=}" != "$arg" ]; then F_envscmd_=0; fi
    if [ "${arg#envsprefix=}" != "$arg" ]; then F_envsprefix_=0; fi
    if [ "$arg" = "out=gb64json" ]; then F_out_gb64json=1; F_out_=0; fi
    if [ "$arg" = "out=grid" ]; then F_out_grid=1; F_out_=0; fi
    if [ "$arg" = "out=html" ]; then F_out_html=1; F_out_=0; fi
    if [ "$arg" = "out=ini" ]; then F_out_ini=1; F_out_=0; fi
    if [ "$arg" = "out=json" ]; then F_out_json=1; F_out_=0; fi
    if [ "$arg" = "out=jwt" ]; then F_out_jwt=1; F_out_=0; fi
    if [ "$arg" = "out=lines" ]; then F_out_lines=1; F_out_=0; fi
    if [ "$arg" = "out=log" ]; then F_out_log=1; F_out_=0; fi
    if [ "$arg" = "out=map" ]; then F_out_map=1; F_out_=0; fi
    if [ "$arg" = "out=md" ]; then F_out_md=1; F_out_=0; fi
    if [ "$arg" = "out=mdtable" ]; then F_out_mdtable=1; F_out_=0; fi
    if [ "$arg" = "out=mdyaml" ]; then F_out_mdyaml=1; F_out_=0; fi
    if [ "$arg" = "out=ndjson" ]; then F_out_ndjson=1; F_out_=0; fi
    if [ "$arg" = "out=openmetrics" ]; then F_out_openmetrics=1; F_out_=0; fi
    if [ "$arg" = "out=pjson" ]; then F_out_pjson=1; F_out_=0; fi
    if [ "$arg" = "out=prettyjson" ]; then F_out_prettyjson=1; F_out_=0; fi
    if [ "$arg" = "out=pxml" ]; then F_out_pxml=1; F_out_=0; fi
    if [ "$arg" = "out=raw" ]; then F_out_raw=1; F_out_=0; fi
    if [ "$arg" = "out=schart" ]; then F_out_schart=1; F_out_=0; fi
    if [ "$arg" = "out=slon" ]; then F_out_slon=1; F_out_=0; fi
    if [ "$arg" = "out=sql" ]; then F_out_sql=1; F_out_=0; fi
    if [ "$arg" = "out=stable" ]; then F_out_stable=1; F_out_=0; fi
    if [ "$arg" = "out=table" ]; then F_out_table=1; F_out_=0; fi
    if [ "$arg" = "out=template" ]; then F_out_template=1; F_out_=0; fi
    if [ "$arg" = "out=toml" ]; then F_out_toml=1; F_out_=0; fi
    if [ "$arg" = "out=tree" ]; then F_out_tree=1; F_out_=0; fi
    if [ "$arg" = "out=xls" ]; then F_out_xls=1; F_out_=0; fi
    if [ "$arg" = "out=xml" ]; then F_out_xml=1; F_out_=0; fi
    if [ "$arg" = "out=yaml" ]; then F_out_yaml=1; F_out_=0; fi
    # -h single option
    if [ "$arg" = "-h" ]; then F__h=0; fi
    # help= options
    if [ "$arg" = "help=filters" ]; then F_help_filters=1; F_help_=0; fi
    if [ "$arg" = "help=template" ]; then F_help_template=1; F_help_=0; fi
    if [ "$arg" = "help=examples" ]; then F_help_examples=1; F_help_=0; fi
    # file= single option
    if [ "$arg" = "file=" ]; then F_file_=0; fi
    # cmd= single option
    if [ "$arg" = "cmd=" ]; then F_cmd_=0; fi
    # data= single option
    if [ "$arg" = "data=" ]; then F_data_=0; fi
    # from= single option
    if [ "$arg" = "from=" ]; then F_from_=0; fi
    # sql= single option
    if [ "$arg" = "sql=" ]; then F_sql_=0; fi
    # sqlfilter= single option
    if [ "$arg" = "sqlfilter=" ]; then F_sqlfilter_=0; fi
    # sqlfiltertables= single option
    if [ "$arg" = "sqlfiltertables=" ]; then F_sqlfiltertables_=0; fi
    # path= single option
    if [ "$arg" = "path=" ]; then F_path_=0; fi
    # csv= single option
    if [ "$arg" = "csv=" ]; then F_csv_=0; fi
    # outkey= single option
    if [ "$arg" = "outkey=" ]; then F_outkey_=0; fi
    # outfile= single option
    if [ "$arg" = "outfile=" ]; then F_outfile_=0; fi
    # outfileappend= single option
    if [ "$arg" = "outfileappend=" ]; then F_outfileappend_=0; fi
    # pause= single option
    if [ "$arg" = "pause=" ]; then F_pause_=0; fi
    # color= single option
    if [ "$arg" = "color=" ]; then F_color_=0; fi
    # url= single option
    if [ "$arg" = "url=" ]; then F_url_=0; fi
    # urlmethod= single option
    if [ "$arg" = "urlmethod=" ]; then F_urlmethod_=0; fi
    # urlparams= single option
    if [ "$arg" = "urlparams=" ]; then F_urlparams_=0; fi
    # urldata= single option
    if [ "$arg" = "urldata=" ]; then F_urldata_=0; fi
    # chs= single option
    if [ "$arg" = "chs=" ]; then F_chs_=0; fi
    # loop= single option
    if [ "$arg" = "loop=" ]; then F_loop_=0; fi
    # loopcls= single option
    if [ "$arg" = "loopcls=" ]; then F_loopcls_=0; fi
    # libs= single option
    if [ "$arg" = "libs=" ]; then F_libs_=0; fi
    # -examples single option
    if [ "$arg" = "-examples" ]; then F__examples=0; fi
    # examples= single option
    if [ "$arg" = "examples=" ]; then F_examples_=0; fi
    # version= single option
    if [ "$arg" = "version=" ]; then F_version_=0; fi
    # -v single option
    if [ "$arg" = "-v" ]; then F__v=0; fi
  done
fi

# Print completion for in=
if [ $F_in_ -eq 1 ]; then
  echo "in=	The input type -if not provided it will try to be auto-detected-"
  
  echo "in=ask	Interactively asks questions to an user -using JSON/SLON for OpenAF's askStruct-"
  echo "in=base64	A base64 text format"
  echo "in=ch	An OpenAF channel format"
  echo "in=csv	A CSV format -auto-detected-"
  echo "in=db	A JDBC query to a database"
  echo "in=gb64json	Equivalent to in=base64 and base64gzip=true"
  echo "in=hsperf	A Java hsperfdata* file -requires file=hsperfdata_user/123-"
  echo "in=ini	INI/Properties format"
  echo "in=json	A JSON format -auto-detected-"
  echo "in=jsonschema	Given a JSON schema format tries to generate sample data for it"
  echo "in=jwt	Decodes and/or verifies a JSON Web Token -JWT-"
  echo "in=lines	A given string/text to be processed line by line"
  echo "in=llm	A large language model input -uses 'llmenv' or 'llmoptions'-"
  echo "in=llmmodels	Lists the large language models available -using 'llmenv' or 'llmoptions'-"
  echo "in=ls	Returns a list of files and folders for a given directory path or zip or tar or tgz file"
  echo "in=md	A Markdown format"
  echo "in=mdtable	A Markdown table format"
  echo "in=ndjson	A NDJSON format"
  echo "in=oaf	Takes an OpenAF scripting code to execute and use the result as input"
  echo "in=oafp	Takes a JSON/SLON map input as parameters for calling a sub oafp process -arrays will call multiple oafp processes-"
  echo "in=openmetrics	An OpenMetrics/Prometheus compatible format"
  echo "in=raw	Passes the input directly to transforms and output"
  echo "in=rawhex	Tries to read the input char by char converting into lines with the hexadecimal representation"
  echo "in=sh	Executes a shell command returning stdout, stderr and exitcode as a map"
  echo "in=slon	A SLON format -auto-detected-"
  echo "in=sql	One or more SQLs statements to AST -Abstract Syntax Tree- or beautified SQL"
  echo "in=toml	TOML format"
  echo "in=xls	A XLSx compatible file -requires file=abc.xlsx-"
  echo "in=xml	An XML format -auto-detected-"
  echo "in=yaml	A YAML format -auto-detected-"
fi
if [ $F_in_db -eq 1 ]; then
  if [ $F_indbjdbc_ -eq 1 ]; then
    echo "indbjdbc=	The JDBC URL to access the input database"
  fi
  if [ $F_indbuser_ -eq 1 ]; then
    echo "indbuser=	The JDBC access user"
  fi
  if [ $F_indbpass_ -eq 1 ]; then
    echo "indbpass=	The JDBC access password"
  fi
  if [ $F_indbtimeout_ -eq 1 ]; then
    echo "indbtimeout=	The JDBC access timeout"
  fi
  if [ $F_indblib_ -eq 1 ]; then
    echo "indblib=	Use a JDBC driver oPack generated by ojob.io/db/getDriver"
  fi
  if [ $F_indbexec_ -eq 1 ]; then
    echo "indbexec=	If true the input SQL is not a query but a DML statement"
  fi
fi
# Print completion for out=
if [ $F_out_ -eq 1 ]; then
  echo "out=	The output format -default ctree-"
  
  echo "out=base64	A base64 text format"
  echo "out=ch	An OpenAF channel format"
  echo "out=chart	A line-chart like chart -usefull together with 'loop'-"
  echo "out=cjson	A JSON forcely colored format"
  echo "out=cmd	Executes a command for each input data entry"
  echo "out=cslon	A SLON format forcely colored"
  echo "out=csv	A CSV format -only for list outputs-"
  echo "out=ctable	A table-like forcely colored format -only for list outputs-"
  echo "out=ctree	A tree-like forcely colored format"
  echo "out=db	Output to a JDBC database"
  echo "out=envs	Tries to output the input data as OS environment variables setting commands"
  echo "out=gb64json	Equivalent to out=base64 and base64gzip=true"
  echo "out=grid	A multiple output ascii grid -usefull together with 'loop'-"
  echo "out=html	An HTML format"
  echo "out=ini	A INI/Properties format -arrays are not supported-"
  echo "out=json	A JSON format without spacing"
  echo "out=jwt	Signs map data into a JSON Web Token -JWT-"
  echo "out=lines	Given an array of strings prints each line"
  echo "out=log	If input has Logstash compatible fields outputs a human-readable log"
  echo "out=map	A rectangle map format"
  echo "out=md	A Markdown format"
  echo "out=mdtable	A Markdown table format -only for list outputs-"
  echo "out=mdyaml	A multi document YAML format -only for list outputs-"
  echo "out=ndjson	A NDJSON format"
  echo "out=openmetrics	Converts a map or list to OpenMetrics/Prometheus compatible format"
  echo "out=pjson	A JSON format with spacing -equivalent to prettyjson-"
  echo "out=prettyjson	A JSON format with spacing"
  echo "out=pxml	Tries to output the input data into pretty xml"
  echo "out=raw	Tries to output the internal representation -string or json- of the input transformed data"
  echo "out=schart	A static line-chart like chart -for a fixed list/array of values-"
  echo "out=slon	A SLON format"
  echo "out=sql	Outputs a series of SQL statements for an input list/array data"
  echo "out=stable	A table-like format with separation -only for list outputs-"
  echo "out=table	A table-like format without size constraints -only for list outputs-"
  echo "out=template	A Handlebars template format"
  echo "out=toml	A TOML format -arrays will have outkey=list-"
  echo "out=tree	A tree-like format"
  echo "out=xls	A XLSx output format"
  echo "out=xml	An XML format"
  echo "out=yaml	A YAML format"
fi
if [ $F_out_envs -eq 1 ]; then
  if [ $F_envscmd_ -eq 1 ]; then
    echo "envscmd=	If defined will output the provided command to set each environment variable -defaults to 'export' or 'set' in Windows-"
  fi
  if [ $F_envsprefix_ -eq 1 ]; then
    echo "envsprefix=	If defined uses the provided prefix for each environment variable key -defaults to 'OAFP'-"
  fi
fi
# Print completion for -h
if [ $F__h -eq 1 ]; then
  echo "-h	Shows the help document"
  
fi
# Print completion for help=
if [ $F_help_ -eq 1 ]; then
  echo "help=	If true will show the help document or other available -e.g. filters, template-"
  
  echo "help=filters	Shows the filters help"
  echo "help=template	Shows the template help"
  echo "help=examples	Shows examples"
fi
# Print completion for file=
if [ $F_file_ -eq 1 ]; then
  echo "file=	The file to parse -if not provide stdin is used-"
  
fi
# Print completion for cmd=
if [ $F_cmd_ -eq 1 ]; then
  echo "cmd=	Alternative to file and stdin to execute a command -e.g. kubectl, docker- to get the file contents"
  
fi
# Print completion for data=
if [ $F_data_ -eq 1 ]; then
  echo "data=	Alternative to file, stdin and cmd to provide data input"
  
fi
# Print completion for from=
if [ $F_from_ -eq 1 ]; then
  echo "from=	An OpenAF nLinq path expression to filter output"
  
fi
# Print completion for sql=
if [ $F_sql_ -eq 1 ]; then
  echo "sql=	A SQL expression to filter output"
  
fi
# Print completion for sqlfilter=
if [ $F_sqlfilter_ -eq 1 ]; then
  echo "sqlfilter=	Enables the forcing of the sql filter parser -values: auto, simple, advanced-"
  
fi
# Print completion for sqlfiltertables=
if [ $F_sqlfiltertables_ -eq 1 ]; then
  echo "sqlfiltertables=	A JSON/SLON array composed of 'table' name and 'path' to each table's data to be used with the sqlfilter"
  
fi
# Print completion for path=
if [ $F_path_ -eq 1 ]; then
  echo "path=	A JMESPath expression to filter output"
  
fi
# Print completion for csv=
if [ $F_csv_ -eq 1 ]; then
  echo "csv=	If type=csv, the CSV options to use"
  
fi
# Print completion for outkey=
if [ $F_outkey_ -eq 1 ]; then
  echo "outkey=	If defined the map/list output will be prefix with the provided key"
  
fi
# Print completion for outfile=
if [ $F_outfile_ -eq 1 ]; then
  echo "outfile=	If defined all output will be written to the provided file"
  
fi
# Print completion for outfileappend=
if [ $F_outfileappend_ -eq 1 ]; then
  echo "outfileappend=	If 'true' and outfile=true the output will be appended on the provided file"
  
fi
# Print completion for pause=
if [ $F_pause_ -eq 1 ]; then
  echo "pause=	If 'true' will try to pause contents in alternative to _less -r_"
  
fi
# Print completion for color=
if [ $F_color_ -eq 1 ]; then
  echo "color=	If 'true' will force colored output if available"
  
fi
# Print completion for url=
if [ $F_url_ -eq 1 ]; then
  echo "url=	Retrieves data from the provided URL"
  
fi
# Print completion for urlmethod=
if [ $F_urlmethod_ -eq 1 ]; then
  echo "urlmethod=	If 'url' is provided defines the http method to use if different from GET"
  
fi
# Print completion for urlparams=
if [ $F_urlparams_ -eq 1 ]; then
  echo "urlparams=	If 'url' is provided extra parameters -equivalent to OpenAF's $rest- can be provided in JSON/SLON"
  
fi
# Print completion for urldata=
if [ $F_urldata_ -eq 1 ]; then
  echo "urldata=	If 'url' is provided a JSON/SLON/text data can be provided"
  
fi
# Print completion for chs=
if [ $F_chs_ -eq 1 ]; then
  echo "chs=	A JSON/SLON map or array composed of an OpenAF channel 'name', 'type' and optional 'options'"
  
fi
# Print completion for loop=
if [ $F_loop_ -eq 1 ]; then
  echo "loop=	If defined will loop the processing by the number of seconds provided"
  
fi
# Print completion for loopcls=
if [ $F_loopcls_ -eq 1 ]; then
  echo "loopcls=	If 'true' and loop is defined it will clear the screen -or file- on each loop cycle"
  
fi
# Print completion for libs=
if [ $F_libs_ -eq 1 ]; then
  echo "libs=	Comma delimited list of installed OpenAF's oPacks to consider to extend oafp's inputs, transformations and outputs"
  
fi
# Print completion for -examples
if [ $F__examples -eq 1 ]; then
  echo "-examples	Will access an internet based list of oafp examples and list them"
  
fi
# Print completion for examples=
if [ $F_examples_ -eq 1 ]; then
  echo "examples=	Will search the provided keyword or 'category::subcategory' in the internet based list of oafp examples"
  
fi
# Print completion for version=
if [ $F_version_ -eq 1 ]; then
  echo "version=	Alternative way to change the input to a map with the tool's version"
  
fi
# Print completion for -v
if [ $F__v -eq 1 ]; then
  echo "-v	Changes the input to a map with the tool's version info"
  
fi

# end
echo :4
