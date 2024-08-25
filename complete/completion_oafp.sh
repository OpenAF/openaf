#!/bin/sh

# Flags
F_in_=1
F_in__in_ask=0
F_in__in_base64=0
F_in__in_ch=0
F_in__in_ch_inch=1
F_in__in_ch_inchall=1
F_in__in_csv=0
F_in__in_csv_csv_=1
F_in__in_db=0
F_in__in_db_indbjdbc_=1
F_in__in_db_indbuser_=1
F_in__in_db_indbpass_=1
F_in__in_db_indbtimeout_=1
F_in__in_db_indblib_=1
F_in__in_db_indbexec_=1
F_in__in_gb64json=0
F_in__in_hsperf=0
F_in__in_ini=0
F_in__in_json=0
F_in__in_json_jsondesc_=1
F_in__in_json_jsonprefix_=1
F_in__in_jsonschema=0
F_in__in_jwt=0
F_in__in_jwt_injwtverify_=1
F_in__in_jwt_injwtsecret_=1
F_in__in_jwt_injwtpubkey_=1
F_in__in_jwt_injwtalg_=1
F_in__in_jwt_injwtraw_=1
F_in__in_lines=0
F_in__in_lines_linesjoin_=1
F_in__in_lines_linesvisual_=1
F_in__in_lines_linesvisualsepre_=1
F_in__in_llm=0
F_in__in_llmmodels=0
F_in__in_ls=0
F_in__in_ls_lsext_=1
F_in__in_ls_lsrecursive_=1
F_in__in_ls_lsposix_=1
F_in__in_md=0
F_in__in_md_inmdtablejoin_=1
F_in__in_mdtable=0
F_in__in_ndjson=0
F_in__in_ndjson_ndjsonjoin_=1
F_in__in_ndjson_ndjsonfilter_=1
F_in__in_oaf=0
F_in__in_oafp=0
F_in__in_openmetrics=0
F_in__in_raw=0
F_in__in_rawhex=0
F_in__in_rawhex_inrawhexline_=1
F_in__in_sh=0
F_in__in_sh_inshformat_=1
F_in__in_slon=0
F_in__in_sql=0
F_in__in_sql_sqlparse_=1
F_in__in_sql_sqloptions_=1
F_in__in_toml=0
F_in__in_xls=0
F_in__in_xls_xlssheet_=1
F_in__in_xls_xlsevalformulas_=1
F_in__in_xls_xlscol_=1
F_in__in_xls_xlsrow_=1
F_in__in_xml=0
F_in__in_xml_xmlignored_=1
F_in__in_xml_xmlprefix_=1
F_in__in_xml_xmlfiltertag_=1
F_in__in_yaml=0
F_out_=1
F_out__out_base64=0
F_out__out_base64_base64gzip_=1
F_out__out_ch=0
F_out__out_ch_ch_=1
F_out__out_ch_chkey_=1
F_out__out_ch_chunset_=1
F_out__out_chart=0
F_out__out_chart_chart_=1
F_out__out_chart_chartcls_=1
F_out__out_cjson=0
F_out__out_cmd=0
F_out__out_cmd_outcmd_=1
F_out__out_cmd_outcmdjoin_=1
F_out__out_cmd_outcmdseq_=1
F_out__out_cmd_outcmdnl_=1
F_out__out_cmd_outcmdparam_=1
F_out__out_cslon=0
F_out__out_csv=0
F_out__out_csv_format_=1
F_out__out_csv_withHeader_=1
F_out__out_csv_withHeaders_=1
F_out__out_csv_quoteMode_=1
F_out__out_csv_withDelimiter_=1
F_out__out_csv_withEscape_=1
F_out__out_csv_withNullString_=1
F_out__out_ctable=0
F_out__out_ctree=0
F_out__out_db=0
F_out__out_db_dbjdbc_=1
F_out__out_db_dbuser_=1
F_out__out_db_dbpass_=1
F_out__out_db_dbtimeout_=1
F_out__out_db_dblib_=1
F_out__out_db_dbtable_=1
F_out__out_db_dbnocreate_=1
F_out__out_db_dbicase_=1
F_out__out_db_dbbatchsize_=1
F_out__out_envs=0
F_out__out_envs_envscmd_=1
F_out__out_envs_envsprefix_=1
F_out__out_gb64json=0
F_out__out_grid=0
F_out__out_grid_grid_=1
F_out__out_html=0
F_out__out_html_htmlcompact_=1
F_out__out_html_htmlpart_=1
F_out__out_html_htmlopen_=1
F_out__out_html_htmlwait_=1
F_out__out_ini=0
F_out__out_json=0
F_out__out_jwt=0
F_out__out_jwt_jwtsecret_=1
F_out__out_jwt_jwtprivkey_=1
F_out__out_jwt_jwtalg_=1
F_out__out_lines=0
F_out__out_log=0
F_out__out_log_logprintall_=1
F_out__out_map=0
F_out__out_md=0
F_out__out_md_mdtemplate_=1
F_out__out_mdtable=0
F_out__out_mdyaml=0
F_out__out_ndjson=0
F_out__out_openmetrics=0
F_out__out_openmetrics_metricsprefix_=1
F_out__out_openmetrics_metricstimestamp_=1
F_out__out_pjson=0
F_out__out_prettyjson=0
F_out__out_pxml=0
F_out__out_raw=0
F_out__out_schart=0
F_out__out_schart_schart_=1
F_out__out_slon=0
F_out__out_sql=0
F_out__out_sql_sqltable_=1
F_out__out_sql_sqlicase_=1
F_out__out_sql_sqlnocreate_=1
F_out__out_stable=0
F_out__out_table=0
F_out__out_template=0
F_out__out_template_template_=1
F_out__out_template_templatepath_=1
F_out__out_template_templatedata_=1
F_out__out_toml=0
F_out__out_tree=0
F_out__out_xls=0
F_out__out_xls_xlsfile_=1
F_out__out_xls_xlssheet_=1
F_out__out_xls_xlsformat_=1
F_out__out_xls_xlsopen_=1
F_out__out_xls_xlsopenwait_=1
F_out__out_xml=0
F_out__out_yaml=0
F__h=1
F_help_=1
F_help__help_filters=0
F_help__help_template=0
F_help__help_examples=0
F_file_=1
F_cmd_=1
F_data_=1
F_from_=1
F_sql_=1
F_sqlfilter_=1
F_sqlfiltertables_=1
F_path_=1
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
F_arraytomap_=1
F_arraytomapkeepkey_=1
F_arraytomapkey_=1
F_cmlt_=1
F_cmlt__cmltch_=0
F_cmlt__cmltsize_=0
F_correcttypes_=1
F_denormalize_=1
F_diff_=1
F_diff__difftheme_=0
F_diff__diffnlines_=0
F_diff__diffwords_=0
F_diff__diffwordswithspace_=0
F_diff__difflines_=0
F_diff__diffsentences_=0
F_diff__diffchars_=0
F_flatmap_=1
F_getlist_=1
F_jsonschema_=1
F_jsonschemacmd_=1
F_jsonschemagen_=1
F_kmeans_=1
F_llmprompt_=1
F_llmprompt__llmcontext_=0
F_llmprompt__llmenv_=0
F_llmprompt__llmoptions_=0
F_llmprompt__llmconversation_=0
F_llmprompt__llmimage_=0
F_maptoarray_=1
F_maptoarraykey_=1
F_merge_=1
F_normalize_=1
F_regression_=1
F_regression__regressionpath_=0
F_regression__regressionx_=0
F_regression__regressionoptions_=0
F_regression__regressionforecast_=0
F_removedups_=1
F_removenulls_=1
F_searchkeys_=1
F_searchvalues_=1
F_sortmapkeys_=1
F_trim_=1

# Iterate over the arguments
if [ $# -gt 0 ]; then
  for arg in "$@"; do
    if [ "$arg" = "${!#}" ]; then break; fi
    # in= options
    if [ "$arg" = "in=ask" ]; then F_in__in_ask=1; F_in_=0; fi
    if [ "$arg" = "in=base64" ]; then F_in__in_base64=1; F_in_=0; fi
    if [ "$arg" = "in=ch" ]; then F_in__in_ch=1; F_in_=0; fi
    if [ "${arg#inch}" != "$arg" ]; then F_in__in_ch_inch=0; fi
    if [ "${arg#inchall}" != "$arg" ]; then F_in__in_ch_inchall=0; fi
    if [ "$arg" = "in=csv" ]; then F_in__in_csv=1; F_in_=0; fi
    if [ "${arg#csv=}" != "$arg" ]; then F_in__in_csv_csv_=0; fi
    if [ "$arg" = "in=db" ]; then F_in__in_db=1; F_in_=0; fi
    if [ "${arg#indbjdbc=}" != "$arg" ]; then F_in__in_db_indbjdbc_=0; fi
    if [ "${arg#indbuser=}" != "$arg" ]; then F_in__in_db_indbuser_=0; fi
    if [ "${arg#indbpass=}" != "$arg" ]; then F_in__in_db_indbpass_=0; fi
    if [ "${arg#indbtimeout=}" != "$arg" ]; then F_in__in_db_indbtimeout_=0; fi
    if [ "${arg#indblib=}" != "$arg" ]; then F_in__in_db_indblib_=0; fi
    if [ "${arg#indbexec=}" != "$arg" ]; then F_in__in_db_indbexec_=0; fi
    if [ "$arg" = "in=gb64json" ]; then F_in__in_gb64json=1; F_in_=0; fi
    if [ "$arg" = "in=hsperf" ]; then F_in__in_hsperf=1; F_in_=0; fi
    if [ "$arg" = "in=ini" ]; then F_in__in_ini=1; F_in_=0; fi
    if [ "$arg" = "in=json" ]; then F_in__in_json=1; F_in_=0; fi
    if [ "${arg#jsondesc=}" != "$arg" ]; then F_in__in_json_jsondesc_=0; fi
    if [ "${arg#jsonprefix=}" != "$arg" ]; then F_in__in_json_jsonprefix_=0; fi
    if [ "$arg" = "in=jsonschema" ]; then F_in__in_jsonschema=1; F_in_=0; fi
    if [ "$arg" = "in=jwt" ]; then F_in__in_jwt=1; F_in_=0; fi
    if [ "${arg#injwtverify=}" != "$arg" ]; then F_in__in_jwt_injwtverify_=0; fi
    if [ "${arg#injwtsecret=}" != "$arg" ]; then F_in__in_jwt_injwtsecret_=0; fi
    if [ "${arg#injwtpubkey=}" != "$arg" ]; then F_in__in_jwt_injwtpubkey_=0; fi
    if [ "${arg#injwtalg=}" != "$arg" ]; then F_in__in_jwt_injwtalg_=0; fi
    if [ "${arg#injwtraw=}" != "$arg" ]; then F_in__in_jwt_injwtraw_=0; fi
    if [ "$arg" = "in=lines" ]; then F_in__in_lines=1; F_in_=0; fi
    if [ "${arg#linesjoin=}" != "$arg" ]; then F_in__in_lines_linesjoin_=0; fi
    if [ "${arg#linesvisual=}" != "$arg" ]; then F_in__in_lines_linesvisual_=0; fi
    if [ "${arg#linesvisualsepre=}" != "$arg" ]; then F_in__in_lines_linesvisualsepre_=0; fi
    if [ "$arg" = "in=llm" ]; then F_in__in_llm=1; F_in_=0; fi
    if [ "$arg" = "in=llmmodels" ]; then F_in__in_llmmodels=1; F_in_=0; fi
    if [ "$arg" = "in=ls" ]; then F_in__in_ls=1; F_in_=0; fi
    if [ "${arg#lsext=}" != "$arg" ]; then F_in__in_ls_lsext_=0; fi
    if [ "${arg#lsrecursive=}" != "$arg" ]; then F_in__in_ls_lsrecursive_=0; fi
    if [ "${arg#lsposix=}" != "$arg" ]; then F_in__in_ls_lsposix_=0; fi
    if [ "$arg" = "in=md" ]; then F_in__in_md=1; F_in_=0; fi
    if [ "${arg#inmdtablejoin=}" != "$arg" ]; then F_in__in_md_inmdtablejoin_=0; fi
    if [ "$arg" = "in=mdtable" ]; then F_in__in_mdtable=1; F_in_=0; fi
    if [ "$arg" = "in=ndjson" ]; then F_in__in_ndjson=1; F_in_=0; fi
    if [ "${arg#ndjsonjoin=}" != "$arg" ]; then F_in__in_ndjson_ndjsonjoin_=0; fi
    if [ "${arg#ndjsonfilter=}" != "$arg" ]; then F_in__in_ndjson_ndjsonfilter_=0; fi
    if [ "$arg" = "in=oaf" ]; then F_in__in_oaf=1; F_in_=0; fi
    if [ "$arg" = "in=oafp" ]; then F_in__in_oafp=1; F_in_=0; fi
    if [ "$arg" = "in=openmetrics" ]; then F_in__in_openmetrics=1; F_in_=0; fi
    if [ "$arg" = "in=raw" ]; then F_in__in_raw=1; F_in_=0; fi
    if [ "$arg" = "in=rawhex" ]; then F_in__in_rawhex=1; F_in_=0; fi
    if [ "${arg#inrawhexline=}" != "$arg" ]; then F_in__in_rawhex_inrawhexline_=0; fi
    if [ "$arg" = "in=sh" ]; then F_in__in_sh=1; F_in_=0; fi
    if [ "${arg#inshformat=}" != "$arg" ]; then F_in__in_sh_inshformat_=0; fi
    if [ "$arg" = "in=slon" ]; then F_in__in_slon=1; F_in_=0; fi
    if [ "$arg" = "in=sql" ]; then F_in__in_sql=1; F_in_=0; fi
    if [ "${arg#sqlparse=}" != "$arg" ]; then F_in__in_sql_sqlparse_=0; fi
    if [ "${arg#sqloptions=}" != "$arg" ]; then F_in__in_sql_sqloptions_=0; fi
    if [ "$arg" = "in=toml" ]; then F_in__in_toml=1; F_in_=0; fi
    if [ "$arg" = "in=xls" ]; then F_in__in_xls=1; F_in_=0; fi
    if [ "${arg#xlssheet=}" != "$arg" ]; then F_in__in_xls_xlssheet_=0; fi
    if [ "${arg#xlsevalformulas=}" != "$arg" ]; then F_in__in_xls_xlsevalformulas_=0; fi
    if [ "${arg#xlscol=}" != "$arg" ]; then F_in__in_xls_xlscol_=0; fi
    if [ "${arg#xlsrow=}" != "$arg" ]; then F_in__in_xls_xlsrow_=0; fi
    if [ "$arg" = "in=xml" ]; then F_in__in_xml=1; F_in_=0; fi
    if [ "${arg#xmlignored=}" != "$arg" ]; then F_in__in_xml_xmlignored_=0; fi
    if [ "${arg#xmlprefix=}" != "$arg" ]; then F_in__in_xml_xmlprefix_=0; fi
    if [ "${arg#xmlfiltertag=}" != "$arg" ]; then F_in__in_xml_xmlfiltertag_=0; fi
    if [ "$arg" = "in=yaml" ]; then F_in__in_yaml=1; F_in_=0; fi
    # out= options
    if [ "$arg" = "out=base64" ]; then F_out__out_base64=1; F_out_=0; fi
    if [ "${arg#base64gzip=}" != "$arg" ]; then F_out__out_base64_base64gzip_=0; fi
    if [ "$arg" = "out=ch" ]; then F_out__out_ch=1; F_out_=0; fi
    if [ "${arg#ch=}" != "$arg" ]; then F_out__out_ch_ch_=0; fi
    if [ "${arg#chkey=}" != "$arg" ]; then F_out__out_ch_chkey_=0; fi
    if [ "${arg#chunset=}" != "$arg" ]; then F_out__out_ch_chunset_=0; fi
    if [ "$arg" = "out=chart" ]; then F_out__out_chart=1; F_out_=0; fi
    if [ "${arg#chart=}" != "$arg" ]; then F_out__out_chart_chart_=0; fi
    if [ "${arg#chartcls=}" != "$arg" ]; then F_out__out_chart_chartcls_=0; fi
    if [ "$arg" = "out=cjson" ]; then F_out__out_cjson=1; F_out_=0; fi
    if [ "$arg" = "out=cmd" ]; then F_out__out_cmd=1; F_out_=0; fi
    if [ "${arg#outcmd=}" != "$arg" ]; then F_out__out_cmd_outcmd_=0; fi
    if [ "${arg#outcmdjoin=}" != "$arg" ]; then F_out__out_cmd_outcmdjoin_=0; fi
    if [ "${arg#outcmdseq=}" != "$arg" ]; then F_out__out_cmd_outcmdseq_=0; fi
    if [ "${arg#outcmdnl=}" != "$arg" ]; then F_out__out_cmd_outcmdnl_=0; fi
    if [ "${arg#outcmdparam=}" != "$arg" ]; then F_out__out_cmd_outcmdparam_=0; fi
    if [ "$arg" = "out=cslon" ]; then F_out__out_cslon=1; F_out_=0; fi
    if [ "$arg" = "out=csv" ]; then F_out__out_csv=1; F_out_=0; fi
    if [ "${arg#format=}" != "$arg" ]; then F_out__out_csv_format_=0; fi
    if [ "${arg#withHeader=}" != "$arg" ]; then F_out__out_csv_withHeader_=0; fi
    if [ "${arg#withHeaders=}" != "$arg" ]; then F_out__out_csv_withHeaders_=0; fi
    if [ "${arg#quoteMode=}" != "$arg" ]; then F_out__out_csv_quoteMode_=0; fi
    if [ "${arg#withDelimiter=}" != "$arg" ]; then F_out__out_csv_withDelimiter_=0; fi
    if [ "${arg#withEscape=}" != "$arg" ]; then F_out__out_csv_withEscape_=0; fi
    if [ "${arg#withNullString=}" != "$arg" ]; then F_out__out_csv_withNullString_=0; fi
    if [ "$arg" = "out=ctable" ]; then F_out__out_ctable=1; F_out_=0; fi
    if [ "$arg" = "out=ctree" ]; then F_out__out_ctree=1; F_out_=0; fi
    if [ "$arg" = "out=db" ]; then F_out__out_db=1; F_out_=0; fi
    if [ "${arg#dbjdbc=}" != "$arg" ]; then F_out__out_db_dbjdbc_=0; fi
    if [ "${arg#dbuser=}" != "$arg" ]; then F_out__out_db_dbuser_=0; fi
    if [ "${arg#dbpass=}" != "$arg" ]; then F_out__out_db_dbpass_=0; fi
    if [ "${arg#dbtimeout=}" != "$arg" ]; then F_out__out_db_dbtimeout_=0; fi
    if [ "${arg#dblib=}" != "$arg" ]; then F_out__out_db_dblib_=0; fi
    if [ "${arg#dbtable=}" != "$arg" ]; then F_out__out_db_dbtable_=0; fi
    if [ "${arg#dbnocreate=}" != "$arg" ]; then F_out__out_db_dbnocreate_=0; fi
    if [ "${arg#dbicase=}" != "$arg" ]; then F_out__out_db_dbicase_=0; fi
    if [ "${arg#dbbatchsize=}" != "$arg" ]; then F_out__out_db_dbbatchsize_=0; fi
    if [ "$arg" = "out=envs" ]; then F_out__out_envs=1; F_out_=0; fi
    if [ "${arg#envscmd=}" != "$arg" ]; then F_out__out_envs_envscmd_=0; fi
    if [ "${arg#envsprefix=}" != "$arg" ]; then F_out__out_envs_envsprefix_=0; fi
    if [ "$arg" = "out=gb64json" ]; then F_out__out_gb64json=1; F_out_=0; fi
    if [ "$arg" = "out=grid" ]; then F_out__out_grid=1; F_out_=0; fi
    if [ "${arg#grid=}" != "$arg" ]; then F_out__out_grid_grid_=0; fi
    if [ "$arg" = "out=html" ]; then F_out__out_html=1; F_out_=0; fi
    if [ "${arg#htmlcompact=}" != "$arg" ]; then F_out__out_html_htmlcompact_=0; fi
    if [ "${arg#htmlpart=}" != "$arg" ]; then F_out__out_html_htmlpart_=0; fi
    if [ "${arg#htmlopen=}" != "$arg" ]; then F_out__out_html_htmlopen_=0; fi
    if [ "${arg#htmlwait=}" != "$arg" ]; then F_out__out_html_htmlwait_=0; fi
    if [ "$arg" = "out=ini" ]; then F_out__out_ini=1; F_out_=0; fi
    if [ "$arg" = "out=json" ]; then F_out__out_json=1; F_out_=0; fi
    if [ "$arg" = "out=jwt" ]; then F_out__out_jwt=1; F_out_=0; fi
    if [ "${arg#jwtsecret=}" != "$arg" ]; then F_out__out_jwt_jwtsecret_=0; fi
    if [ "${arg#jwtprivkey=}" != "$arg" ]; then F_out__out_jwt_jwtprivkey_=0; fi
    if [ "${arg#jwtalg=}" != "$arg" ]; then F_out__out_jwt_jwtalg_=0; fi
    if [ "$arg" = "out=lines" ]; then F_out__out_lines=1; F_out_=0; fi
    if [ "$arg" = "out=log" ]; then F_out__out_log=1; F_out_=0; fi
    if [ "${arg#logprintall=}" != "$arg" ]; then F_out__out_log_logprintall_=0; fi
    if [ "$arg" = "out=map" ]; then F_out__out_map=1; F_out_=0; fi
    if [ "$arg" = "out=md" ]; then F_out__out_md=1; F_out_=0; fi
    if [ "${arg#mdtemplate=}" != "$arg" ]; then F_out__out_md_mdtemplate_=0; fi
    if [ "$arg" = "out=mdtable" ]; then F_out__out_mdtable=1; F_out_=0; fi
    if [ "$arg" = "out=mdyaml" ]; then F_out__out_mdyaml=1; F_out_=0; fi
    if [ "$arg" = "out=ndjson" ]; then F_out__out_ndjson=1; F_out_=0; fi
    if [ "$arg" = "out=openmetrics" ]; then F_out__out_openmetrics=1; F_out_=0; fi
    if [ "${arg#metricsprefix=}" != "$arg" ]; then F_out__out_openmetrics_metricsprefix_=0; fi
    if [ "${arg#metricstimestamp=}" != "$arg" ]; then F_out__out_openmetrics_metricstimestamp_=0; fi
    if [ "$arg" = "out=pjson" ]; then F_out__out_pjson=1; F_out_=0; fi
    if [ "$arg" = "out=prettyjson" ]; then F_out__out_prettyjson=1; F_out_=0; fi
    if [ "$arg" = "out=pxml" ]; then F_out__out_pxml=1; F_out_=0; fi
    if [ "$arg" = "out=raw" ]; then F_out__out_raw=1; F_out_=0; fi
    if [ "$arg" = "out=schart" ]; then F_out__out_schart=1; F_out_=0; fi
    if [ "${arg#schart=}" != "$arg" ]; then F_out__out_schart_schart_=0; fi
    if [ "$arg" = "out=slon" ]; then F_out__out_slon=1; F_out_=0; fi
    if [ "$arg" = "out=sql" ]; then F_out__out_sql=1; F_out_=0; fi
    if [ "${arg#sqltable=}" != "$arg" ]; then F_out__out_sql_sqltable_=0; fi
    if [ "${arg#sqlicase=}" != "$arg" ]; then F_out__out_sql_sqlicase_=0; fi
    if [ "${arg#sqlnocreate=}" != "$arg" ]; then F_out__out_sql_sqlnocreate_=0; fi
    if [ "$arg" = "out=stable" ]; then F_out__out_stable=1; F_out_=0; fi
    if [ "$arg" = "out=table" ]; then F_out__out_table=1; F_out_=0; fi
    if [ "$arg" = "out=template" ]; then F_out__out_template=1; F_out_=0; fi
    if [ "${arg#template=}" != "$arg" ]; then F_out__out_template_template_=0; fi
    if [ "${arg#templatepath=}" != "$arg" ]; then F_out__out_template_templatepath_=0; fi
    if [ "${arg#templatedata=}" != "$arg" ]; then F_out__out_template_templatedata_=0; fi
    if [ "$arg" = "out=toml" ]; then F_out__out_toml=1; F_out_=0; fi
    if [ "$arg" = "out=tree" ]; then F_out__out_tree=1; F_out_=0; fi
    if [ "$arg" = "out=xls" ]; then F_out__out_xls=1; F_out_=0; fi
    if [ "${arg#xlsfile=}" != "$arg" ]; then F_out__out_xls_xlsfile_=0; fi
    if [ "${arg#xlssheet=}" != "$arg" ]; then F_out__out_xls_xlssheet_=0; fi
    if [ "${arg#xlsformat=}" != "$arg" ]; then F_out__out_xls_xlsformat_=0; fi
    if [ "${arg#xlsopen=}" != "$arg" ]; then F_out__out_xls_xlsopen_=0; fi
    if [ "${arg#xlsopenwait=}" != "$arg" ]; then F_out__out_xls_xlsopenwait_=0; fi
    if [ "$arg" = "out=xml" ]; then F_out__out_xml=1; F_out_=0; fi
    if [ "$arg" = "out=yaml" ]; then F_out__out_yaml=1; F_out_=0; fi
    # -h single option
    if [ "$arg" = "-h" ]; then F__h=0; fi
    # help= options
    if [ "$arg" = "help=filters" ]; then F_help__help_filters=1; F_help_=0; fi
    if [ "$arg" = "help=template" ]; then F_help__help_template=1; F_help_=0; fi
    if [ "$arg" = "help=examples" ]; then F_help__help_examples=1; F_help_=0; fi
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
    # arraytomap= single option
    if [ "$arg" = "arraytomap=" ]; then F_arraytomap_=0; fi
    # arraytomapkeepkey= single option
    if [ "$arg" = "arraytomapkeepkey=" ]; then F_arraytomapkeepkey_=0; fi
    # arraytomapkey= single option
    if [ "$arg" = "arraytomapkey=" ]; then F_arraytomapkey_=0; fi
    # cmlt= options
    if [ "$arg" = "cmltch=" ]; then F_cmlt__cmltch_=1; F_cmlt_=0; fi
    if [ "$arg" = "cmltsize=" ]; then F_cmlt__cmltsize_=1; F_cmlt_=0; fi
    # correcttypes= single option
    if [ "$arg" = "correcttypes=" ]; then F_correcttypes_=0; fi
    # denormalize= single option
    if [ "$arg" = "denormalize=" ]; then F_denormalize_=0; fi
    # diff= options
    if [ "$arg" = "difftheme=" ]; then F_diff__difftheme_=1; F_diff_=0; fi
    if [ "$arg" = "diffnlines=" ]; then F_diff__diffnlines_=1; F_diff_=0; fi
    if [ "$arg" = "diffwords=" ]; then F_diff__diffwords_=1; F_diff_=0; fi
    if [ "$arg" = "diffwordswithspace=" ]; then F_diff__diffwordswithspace_=1; F_diff_=0; fi
    if [ "$arg" = "difflines=" ]; then F_diff__difflines_=1; F_diff_=0; fi
    if [ "$arg" = "diffsentences=" ]; then F_diff__diffsentences_=1; F_diff_=0; fi
    if [ "$arg" = "diffchars=" ]; then F_diff__diffchars_=1; F_diff_=0; fi
    # flatmap= single option
    if [ "$arg" = "flatmap=" ]; then F_flatmap_=0; fi
    # getlist= single option
    if [ "$arg" = "getlist=" ]; then F_getlist_=0; fi
    # jsonschema= single option
    if [ "$arg" = "jsonschema=" ]; then F_jsonschema_=0; fi
    # jsonschemacmd= single option
    if [ "$arg" = "jsonschemacmd=" ]; then F_jsonschemacmd_=0; fi
    # jsonschemagen= single option
    if [ "$arg" = "jsonschemagen=" ]; then F_jsonschemagen_=0; fi
    # kmeans= single option
    if [ "$arg" = "kmeans=" ]; then F_kmeans_=0; fi
    # llmprompt= options
    if [ "$arg" = "llmcontext=" ]; then F_llmprompt__llmcontext_=1; F_llmprompt_=0; fi
    if [ "$arg" = "llmenv=" ]; then F_llmprompt__llmenv_=1; F_llmprompt_=0; fi
    if [ "$arg" = "llmoptions=" ]; then F_llmprompt__llmoptions_=1; F_llmprompt_=0; fi
    if [ "$arg" = "llmconversation=" ]; then F_llmprompt__llmconversation_=1; F_llmprompt_=0; fi
    if [ "$arg" = "llmimage=" ]; then F_llmprompt__llmimage_=1; F_llmprompt_=0; fi
    # maptoarray= single option
    if [ "$arg" = "maptoarray=" ]; then F_maptoarray_=0; fi
    # maptoarraykey= single option
    if [ "$arg" = "maptoarraykey=" ]; then F_maptoarraykey_=0; fi
    # merge= single option
    if [ "$arg" = "merge=" ]; then F_merge_=0; fi
    # normalize= single option
    if [ "$arg" = "normalize=" ]; then F_normalize_=0; fi
    # regression= options
    if [ "$arg" = "regressionpath=" ]; then F_regression__regressionpath_=1; F_regression_=0; fi
    if [ "$arg" = "regressionx=" ]; then F_regression__regressionx_=1; F_regression_=0; fi
    if [ "$arg" = "regressionoptions=" ]; then F_regression__regressionoptions_=1; F_regression_=0; fi
    if [ "$arg" = "regressionforecast=" ]; then F_regression__regressionforecast_=1; F_regression_=0; fi
    # removedups= single option
    if [ "$arg" = "removedups=" ]; then F_removedups_=0; fi
    # removenulls= single option
    if [ "$arg" = "removenulls=" ]; then F_removenulls_=0; fi
    # searchkeys= single option
    if [ "$arg" = "searchkeys=" ]; then F_searchkeys_=0; fi
    # searchvalues= single option
    if [ "$arg" = "searchvalues=" ]; then F_searchvalues_=0; fi
    # sortmapkeys= single option
    if [ "$arg" = "sortmapkeys=" ]; then F_sortmapkeys_=0; fi
    # trim= single option
    if [ "$arg" = "trim=" ]; then F_trim_=0; fi
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
if [ $F_in__in_ch -eq 1 ]; then
  if [ $F_in__in_ch_inch -eq 1 ]; then
    echo "inch	A JSON/SLON configuration string with type and options/url"
  fi
  if [ $F_in__in_ch_inchall -eq 1 ]; then
    echo "inchall	A boolean flag to determine if the input map will be used for a getAll query"
  fi
fi
if [ $F_in__in_csv -eq 1 ]; then
  if [ $F_in__in_csv_csv_ -eq 1 ]; then
    echo "csv=	If type=csv, the CSV options to use"
  fi
fi
if [ $F_in__in_db -eq 1 ]; then
  if [ $F_in__in_db_indbjdbc_ -eq 1 ]; then
    echo "indbjdbc=	The JDBC URL to access the input database"
  fi
  if [ $F_in__in_db_indbuser_ -eq 1 ]; then
    echo "indbuser=	The JDBC access user"
  fi
  if [ $F_in__in_db_indbpass_ -eq 1 ]; then
    echo "indbpass=	The JDBC access password"
  fi
  if [ $F_in__in_db_indbtimeout_ -eq 1 ]; then
    echo "indbtimeout=	The JDBC access timeout"
  fi
  if [ $F_in__in_db_indblib_ -eq 1 ]; then
    echo "indblib=	Use a JDBC driver oPack generated by ojob.io/db/getDriver"
  fi
  if [ $F_in__in_db_indbexec_ -eq 1 ]; then
    echo "indbexec=	If true the input SQL is not a query but a DML statement"
  fi
fi
if [ $F_in__in_json -eq 1 ]; then
  if [ $F_in__in_json_jsondesc_ -eq 1 ]; then
    echo "jsondesc=	If true the output will be a list of JSON paths of the original json."
  fi
  if [ $F_in__in_json_jsonprefix_ -eq 1 ]; then
    echo "jsonprefix=	Given the 'jsondesc=true' output list you can use each to filter big json files by prefix."
  fi
fi
if [ $F_in__in_jwt -eq 1 ]; then
  if [ $F_in__in_jwt_injwtverify_ -eq 1 ]; then
    echo "injwtverify=	If true the boolean entry '__verified' will be added to the result."
  fi
  if [ $F_in__in_jwt_injwtsecret_ -eq 1 ]; then
    echo "injwtsecret=	A string secret for using HS256, HS384 or HS512 depending on secret size used to verify."
  fi
  if [ $F_in__in_jwt_injwtpubkey_ -eq 1 ]; then
    echo "injwtpubkey=	A public key file used to verify -might require specifying the injwtalg-."
  fi
  if [ $F_in__in_jwt_injwtalg_ -eq 1 ]; then
    echo "injwtalg=	Specifies the algorithm used to verify the JWT -HS* or RSA by default-. Depends on available algorithms on the current JVM."
  fi
  if [ $F_in__in_jwt_injwtraw_ -eq 1 ]; then
    echo "injwtraw=	If true it won't try to convert Unix epoch timestamps to dates."
  fi
fi
if [ $F_in__in_lines -eq 1 ]; then
  if [ $F_in__in_lines_linesjoin_ -eq 1 ]; then
    echo "linesjoin=	If true it will return an array with each processed line"
  fi
  if [ $F_in__in_lines_linesvisual_ -eq 1 ]; then
    echo "linesvisual=	If true it will try to determine header and column position from spaces and tabs"
  fi
  if [ $F_in__in_lines_linesvisualsepre_ -eq 1 ]; then
    echo "linesvisualsepre=	Regular expression representing the separator between columns when linesvisual=true -defaults to ' \\s+'-"
  fi
fi
if [ $F_in__in_ls -eq 1 ]; then
  if [ $F_in__in_ls_lsext_ -eq 1 ]; then
    echo "lsext=	Forces the file format parsing of the provided path or file -between zip, tar, tgz-"
  fi
  if [ $F_in__in_ls_lsrecursive_ -eq 1 ]; then
    echo "lsrecursive=	Will list all files and folders recursively -for folders-"
  fi
  if [ $F_in__in_ls_lsposix_ -eq 1 ]; then
    echo "lsposix=	Tries to add extra posix data if available -for ZIP files-"
  fi
fi
if [ $F_in__in_md -eq 1 ]; then
  if [ $F_in__in_md_inmdtablejoin_ -eq 1 ]; then
    echo "inmdtablejoin=	Scans an entire markdown input for tables and returns an array with the data of each markdown table"
  fi
fi
if [ $F_in__in_ndjson -eq 1 ]; then
  if [ $F_in__in_ndjson_ndjsonjoin_ -eq 1 ]; then
    echo "ndjsonjoin=	If true will join the ndjson records to build an output array"
  fi
  if [ $F_in__in_ndjson_ndjsonfilter_ -eq 1 ]; then
    echo "ndjsonfilter=	If true each line is interpreted as an array before filters execute -this allows to filter json records on a ndjson-"
  fi
fi
if [ $F_in__in_rawhex -eq 1 ]; then
  if [ $F_in__in_rawhex_inrawhexline_ -eq 1 ]; then
    echo "inrawhexline=	Number of hexadecimal characters per returned array line"
  fi
fi
if [ $F_in__in_sh -eq 1 ]; then
  if [ $F_in__in_sh_inshformat_ -eq 1 ]; then
    echo "inshformat=	The format to parse stdout and stderr between raw, yaml or json -default-"
  fi
fi
if [ $F_in__in_sql -eq 1 ]; then
  if [ $F_in__in_sql_sqlparse_ -eq 1 ]; then
    echo "sqlparse=	If true instead of returning a SQL AST representation it will beautify the SQL statements"
  fi
  if [ $F_in__in_sql_sqloptions_ -eq 1 ]; then
    echo "sqloptions=	A JSON/SLON map with options for sqlparse=true"
  fi
fi
if [ $F_in__in_xls -eq 1 ]; then
  if [ $F_in__in_xls_xlssheet_ -eq 1 ]; then
    echo "xlssheet=	The name of sheet to consider -default to the first sheet-"
  fi
  if [ $F_in__in_xls_xlsevalformulas_ -eq 1 ]; then
    echo "xlsevalformulas=	If false the existing formulas won't be evaluated -defaults to true-"
  fi
  if [ $F_in__in_xls_xlscol_ -eq 1 ]; then
    echo "xlscol=	The column on the sheet where a table should be detected -e.g. "A"-"
  fi
  if [ $F_in__in_xls_xlsrow_ -eq 1 ]; then
    echo "xlsrow=	The row on the sheet where a table should be detected -e.g. 1-"
  fi
fi
if [ $F_in__in_xml -eq 1 ]; then
  if [ $F_in__in_xml_xmlignored_ -eq 1 ]; then
    echo "xmlignored=	A comma-separated list of XML tags to ignore"
  fi
  if [ $F_in__in_xml_xmlprefix_ -eq 1 ]; then
    echo "xmlprefix=	A prefix to add to all XML tags"
  fi
  if [ $F_in__in_xml_xmlfiltertag_ -eq 1 ]; then
    echo "xmlfiltertag=	If true will filter the XML tags"
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
if [ $F_out__out_base64 -eq 1 ]; then
  if [ $F_out__out_base64_base64gzip_ -eq 1 ]; then
    echo "base64gzip=	If true the contents will thet gzip/gunzip respectively to reduce the size of the base64 output"
  fi
fi
if [ $F_out__out_ch -eq 1 ]; then
  if [ $F_out__out_ch_ch_ -eq 1 ]; then
    echo "ch=	A JSON/SLON configuration string with type and options/url"
  fi
  if [ $F_out__out_ch_chkey_ -eq 1 ]; then
    echo "chkey=	A comma delimited list of map keys to build a key from each array value"
  fi
  if [ $F_out__out_ch_chunset_ -eq 1 ]; then
    echo "chunset=	If true the input data will be used to unset data on the output channel instead of set"
  fi
fi
if [ $F_out__out_chart -eq 1 ]; then
  if [ $F_out__out_chart_chart_ -eq 1 ]; then
    echo "chart=	Chart definition in the format --unit path:color:legend... -min:0 -max:100--"
  fi
  if [ $F_out__out_chart_chartcls_ -eq 1 ]; then
    echo "chartcls=	If true the screen will be cleared for each execution"
  fi
fi
if [ $F_out__out_cmd -eq 1 ]; then
  if [ $F_out__out_cmd_outcmd_ -eq 1 ]; then
    echo "outcmd=	The command to execute receiving, in pipeline, each input entry in json"
  fi
  if [ $F_out__out_cmd_outcmdjoin_ -eq 1 ]; then
    echo "outcmdjoin=	If true and if input is an array the entire array will be the input entry"
  fi
  if [ $F_out__out_cmd_outcmdseq_ -eq 1 ]; then
    echo "outcmdseq=	If true and if input is an array the commands will be executed in sequence"
  fi
  if [ $F_out__out_cmd_outcmdnl_ -eq 1 ]; then
    echo "outcmdnl=	If true each command execution output will be appended with a new-line"
  fi
  if [ $F_out__out_cmd_outcmdparam_ -eq 1 ]; then
    echo "outcmdparam=	If true the input entry will be replaced on the 'outcmd' where '{}' is found"
  fi
fi
if [ $F_out__out_csv -eq 1 ]; then
  if [ $F_out__out_csv_format_ -eq 1 ]; then
    echo "format=	You can choose between DEFAULT, EXCEL, INFORMIX_UNLOAD, INFORMIX_UNLOAD_CSV, MYSQL, RFC4180, ORACLE, POSTGRESQL_CSV, POSTGRESQL_TEXT and TDF"
  fi
  if [ $F_out__out_csv_withHeader_ -eq 1 ]; then
    echo "withHeader=	If true tries to automatically use the available header"
  fi
  if [ $F_out__out_csv_withHeaders_ -eq 1 ]; then
    echo "withHeaders=	A list of headers to use with the corresponding order"
  fi
  if [ $F_out__out_csv_quoteMode_ -eq 1 ]; then
    echo "quoteMode=	You can choose between ALL, ALL_NON_NULL, MINIMAL, NON_NUMERIC and NONE."
  fi
  if [ $F_out__out_csv_withDelimiter_ -eq 1 ]; then
    echo "withDelimiter=	A single character as a custom delimiter"
  fi
  if [ $F_out__out_csv_withEscape_ -eq 1 ]; then
    echo "withEscape=	A single character as a custom escape"
  fi
  if [ $F_out__out_csv_withNullString_ -eq 1 ]; then
    echo "withNullString=	String to use as representation of null values"
  fi
fi
if [ $F_out__out_db -eq 1 ]; then
  if [ $F_out__out_db_dbjdbc_ -eq 1 ]; then
    echo "dbjdbc=	The JDBC URL to access the input database"
  fi
  if [ $F_out__out_db_dbuser_ -eq 1 ]; then
    echo "dbuser=	The JDBC access user"
  fi
  if [ $F_out__out_db_dbpass_ -eq 1 ]; then
    echo "dbpass=	The JDBC access password"
  fi
  if [ $F_out__out_db_dbtimeout_ -eq 1 ]; then
    echo "dbtimeout=	The JDBC access timeout"
  fi
  if [ $F_out__out_db_dblib_ -eq 1 ]; then
    echo "dblib=	Use a JDBC driver oPack generated by ojob.io/db/getDriver"
  fi
  if [ $F_out__out_db_dbtable_ -eq 1 ]; then
    echo "dbtable=	The db table in which should be inserted -'data' by default-"
  fi
  if [ $F_out__out_db_dbnocreate_ -eq 1 ]; then
    echo "dbnocreate=	If true no table creation command will be executed -if the table already exists set this to true-"
  fi
  if [ $F_out__out_db_dbicase_ -eq 1 ]; then
    echo "dbicase=	If true table and field names will try to ignore case"
  fi
  if [ $F_out__out_db_dbbatchsize_ -eq 1 ]; then
    echo "dbbatchsize=	If defined it will changed the default batch data insert process"
  fi
fi
if [ $F_out__out_envs -eq 1 ]; then
  if [ $F_out__out_envs_envscmd_ -eq 1 ]; then
    echo "envscmd=	If defined will output the provided command to set each environment variable -defaults to 'export' or 'set' in Windows-"
  fi
  if [ $F_out__out_envs_envsprefix_ -eq 1 ]; then
    echo "envsprefix=	If defined uses the provided prefix for each environment variable key -defaults to 'OAFP'-"
  fi
fi
if [ $F_out__out_grid -eq 1 ]; then
  if [ $F_out__out_grid_grid_ -eq 1 ]; then
    echo "grid=	A JSON/SLON configuration composed of an array with another array per grid line. Each line array should have a map per column -see below for the map options-"
  fi
fi
if [ $F_out__out_html -eq 1 ]; then
  if [ $F_out__out_html_htmlcompact_ -eq 1 ]; then
    echo "htmlcompact=	Boolean flag that if true and the input data is a string or markdown the generated html will have a visual compact width format"
  fi
  if [ $F_out__out_html_htmlpart_ -eq 1 ]; then
    echo "htmlpart=	Boolean flag that if true and the input data is a string or markdown the generated html will be partial and not the complete file"
  fi
  if [ $F_out__out_html_htmlopen_ -eq 1 ]; then
    echo "htmlopen=	Boolean that if false won't try to open the output contents in a browser -defaults to true-"
  fi
  if [ $F_out__out_html_htmlwait_ -eq 1 ]; then
    echo "htmlwait=	Amount of ms, when htmlopen=true, to wait for the system browser to open an render the html output"
  fi
fi
if [ $F_out__out_jwt -eq 1 ]; then
  if [ $F_out__out_jwt_jwtsecret_ -eq 1 ]; then
    echo "jwtsecret=	A string secret for using HS256, HS384 or HS512 depending on secret size used to sign the JWT."
  fi
  if [ $F_out__out_jwt_jwtprivkey_ -eq 1 ]; then
    echo "jwtprivkey=	A private key file used to sign -might require specifying the jwtalg-."
  fi
  if [ $F_out__out_jwt_jwtalg_ -eq 1 ]; then
    echo "jwtalg=	Specifies the algorithm used to sign the JWT -HS* or RSA by default-. Depends on available algorithms on the current JVM."
  fi
fi
if [ $F_out__out_log -eq 1 ]; then
  if [ $F_out__out_log_logprintall_ -eq 1 ]; then
    echo "logprintall=	If true all original non data -string- lines will be output"
  fi
fi
if [ $F_out__out_md -eq 1 ]; then
  if [ $F_out__out_md_mdtemplate_ -eq 1 ]; then
    echo "mdtemplate=	If true will apply a template output without any input data"
  fi
fi
if [ $F_out__out_openmetrics -eq 1 ]; then
  if [ $F_out__out_openmetrics_metricsprefix_ -eq 1 ]; then
    echo "metricsprefix=	The prefix to use for each metric -defaults to 'metrics'-"
  fi
  if [ $F_out__out_openmetrics_metricstimestamp_ -eq 1 ]; then
    echo "metricstimestamp=	Unix Epoch in seconds for each metric"
  fi
fi
if [ $F_out__out_schart -eq 1 ]; then
  if [ $F_out__out_schart_schart_ -eq 1 ]; then
    echo "schart=	Chart definition in the format --unit path:color:legend... -min:0 -max:100--"
  fi
fi
if [ $F_out__out_sql -eq 1 ]; then
  if [ $F_out__out_sql_sqltable_ -eq 1 ]; then
    echo "sqltable=	The table name to use for the SQL statements -defaults to 'data'-"
  fi
  if [ $F_out__out_sql_sqlicase_ -eq 1 ]; then
    echo "sqlicase=	If true the table and fields names won't be double-quoted"
  fi
  if [ $F_out__out_sql_sqlnocreate_ -eq 1 ]; then
    echo "sqlnocreate=	If true the create table statement won't be generated"
  fi
fi
if [ $F_out__out_template -eq 1 ]; then
  if [ $F_out__out_template_template_ -eq 1 ]; then
    echo "template=	A file path to a HandleBars' template"
  fi
  if [ $F_out__out_template_templatepath_ -eq 1 ]; then
    echo "templatepath=	If 'template' is not provided a path to the template definition -pre-transformation-"
  fi
  if [ $F_out__out_template_templatedata_ -eq 1 ]; then
    echo "templatedata=	If defined the template data will be retrieved from the provided path"
  fi
fi
if [ $F_out__out_xls -eq 1 ]; then
  if [ $F_out__out_xls_xlsfile_ -eq 1 ]; then
    echo "xlsfile=	The output filename -if not defined a temporary file will be used to open with the OS's Excel-compatible application-"
  fi
  if [ $F_out__out_xls_xlssheet_ -eq 1 ]; then
    echo "xlssheet=	The name of sheet to use -default to 'data'-"
  fi
  if [ $F_out__out_xls_xlsformat_ -eq 1 ]; then
    echo "xlsformat=	A SLON or JSON string with the formatting of the output file -e.g. -bold: true, borderBottom: "medium", borderBottomColor: "red"--"
  fi
  if [ $F_out__out_xls_xlsopen_ -eq 1 ]; then
    echo "xlsopen=	If false it won't try to open the OS's Excel-compatible application -defaults to true-"
  fi
  if [ $F_out__out_xls_xlsopenwait_ -eq 1 ]; then
    echo "xlsopenwait=	The amount of time, in ms, to keep the temporary file for the OS's Excel-compatible application to start and open the file"
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
# Print completion for arraytomap=
if [ $F_arraytomap_ -eq 1 ]; then
  echo "arraytomap=	If true will try to convert the input array to a map -see arraytomapkey, arraytomapkeepkey-"
  
fi
# Print completion for arraytomapkeepkey=
if [ $F_arraytomapkeepkey_ -eq 1 ]; then
  echo "arraytomapkeepkey=	If true and arraytomap=true the defined arraytomapkey won't be removed from each map"
  
fi
# Print completion for arraytomapkey=
if [ $F_arraytomapkey_ -eq 1 ]; then
  echo "arraytomapkey=	For arraytomap=true defines the name of the map property that will be each element key -see arraytomapkeepkey-"
  
fi
# Print completion for cmlt=
if [ $F_cmlt_ -eq 1 ]; then
  echo "cmlt=	If true will accumulate the input values into an output array -useful with loop-"
  
  echo "cmltch=	A JSON/SLON OpenAF channel configuration string with type and options/url -defaults to simple-"
  echo "cmltsize=	The number of input data values to keep -default 100-. If -1 it will keep without a limit"
fi
# Print completion for correcttypes=
if [ $F_correcttypes_ -eq 1 ]; then
  echo "correcttypes=	If true will try to convert alpha-numeric field values with just numbers to number fields, string date fields to dates and boolean fields"
  
fi
# Print completion for denormalize=
if [ $F_denormalize_ -eq 1 ]; then
  echo "denormalize=	Reverses 'normalize' given a JSON/SLON map with a normalize schema -see OpenAF's ow.ai.normalize.withSchema-"
  
fi
# Print completion for diff=
if [ $F_diff_ -eq 1 ]; then
  echo "diff=	A JSON/SLON map with a 'a' path and a 'b' path to compare and provide diff data"
  
  echo "difftheme=	A JSON/SLON map with the colors to use if color = true"
  echo "diffnlines=	If true will append each line with a line number of the final result of the differences between 'a' and 'b' -just for rough reference-"
  echo "diffwords=	If true and the input is text based will perform the diff at the word level"
  echo "diffwordswithspace=	If true and the input is text based will perform the diff at the word + spaces level"
  echo "difflines=	If true and the input is text based will perform the diff at the lines level"
  echo "diffsentences=	If true and the input is text based will perfom the diff at the sentence level"
  echo "diffchars=	If true and the input is text based will perform the diff at the char level"
fi
# Print completion for flatmap=
if [ $F_flatmap_ -eq 1 ]; then
  echo "flatmap=	If true a map structure will be flat to just one level -optionally flatmapsep=[char] to use a different separator that '.'-"
  
fi
# Print completion for getlist=
if [ $F_getlist_ -eq 1 ]; then
  echo "getlist=	If true will try to find the first array on the input value -if number will stop only after the number of checks-"
  
fi
# Print completion for jsonschema=
if [ $F_jsonschema_ -eq 1 ]; then
  echo "jsonschema=	The JSON schema file to use for validation returning a map with a boolean valid and errors if exist"
  
fi
# Print completion for jsonschemacmd=
if [ $F_jsonschemacmd_ -eq 1 ]; then
  echo "jsonschemacmd=	Alternative option to 'jsonschema' to retrieve the JSON schema data to use for validation returning a map with a boolean valid and errors if exist"
  
fi
# Print completion for jsonschemagen=
if [ $F_jsonschemagen_ -eq 1 ]; then
  echo "jsonschemagen=	If true will taken the provided input map as an example to generate an output json schema"
  
fi
# Print completion for kmeans=
if [ $F_kmeans_ -eq 1 ]; then
  echo "kmeans=	Given an array of 'normalized' data will cluster data into the number of centroids provided"
  
fi
# Print completion for llmprompt=
if [ $F_llmprompt_ -eq 1 ]; then
  echo "llmprompt=	A large language model prompt to transform the input data to json -uses the same input options 'llmenv' and 'llmoptions'-"
  
  echo "llmcontext=	If 'llmprompt' is defined provides extra context to the model regarding the input data"
  echo "llmenv=	The environment variable containing the value of 'llmoptions' -defaults to OAFP_MODEL-"
  echo "llmoptions=	A JSON or SLON string with OpenAF's LLM 'type' -e.g. openai/ollama-, 'model' name, 'timeout' in ms for answers, 'url' for the ollama type or 'key' for openai type"
  echo "llmconversation=	File to keep the LLM conversation"
  echo "llmimage=	For visual models you can provide a base64 image or an image file path or an URL of an image"
fi
# Print completion for maptoarray=
if [ $F_maptoarray_ -eq 1 ]; then
  echo "maptoarray=	If true will try to convert the input map to an array -see maptoarraykey-"
  
fi
# Print completion for maptoarraykey=
if [ $F_maptoarraykey_ -eq 1 ]; then
  echo "maptoarraykey=	If maptoarray=true defines the name of the map property that will hold the key for each map in the new array"
  
fi
# Print completion for merge=
if [ $F_merge_ -eq 1 ]; then
  echo "merge=	If input is a list/array of maps will merge each element into one map"
  
fi
# Print completion for normalize=
if [ $F_normalize_ -eq 1 ]; then
  echo "normalize=	A JSON/SLON map with a normalize schema -see OpenAF's ow.ai.normalize.withSchema-"
  
fi
# Print completion for regression=
if [ $F_regression_ -eq 1 ]; then
  echo "regression=	Performs a regression -linear, log, exp, poly or power- over a provided list/array of numeric values"
  
  echo "regressionpath=	The path to the array of y values for the regression formulas"
  echo "regressionx=	Optional path to the array of x values for the regression formulas -defaults to 1, 2, 3, ...-"
  echo "regressionoptions=	A JSON/SLON configuration with order -defaults to 2- and/or precision -defaults to 5-"
  echo "regressionforecast=	Optional path to an array of x values for which to forecast the corresponding y"
fi
# Print completion for removedups=
if [ $F_removedups_ -eq 1 ]; then
  echo "removedups=	If true will try to remove duplicates from an array"
  
fi
# Print completion for removenulls=
if [ $F_removenulls_ -eq 1 ]; then
  echo "removenulls=	If true will try to remove nulls and undefined values from a map or array"
  
fi
# Print completion for searchkeys=
if [ $F_searchkeys_ -eq 1 ]; then
  echo "searchkeys=	Will return a map with only keys that match the provided string"
  
fi
# Print completion for searchvalues=
if [ $F_searchvalues_ -eq 1 ]; then
  echo "searchvalues=	Will return am map with only values that match the provided string"
  
fi
# Print completion for sortmapkeys=
if [ $F_sortmapkeys_ -eq 1 ]; then
  echo "sortmapkeys=	If true the resulting map keys will be sorted"
  
fi
# Print completion for trim=
if [ $F_trim_ -eq 1 ]; then
  echo "trim=	If true all the strings of the result map/list will be trimmed"
  
fi

# end
echo :4
