#!/bin/sh

# Flags
F_in_=1
F_in__in_ask=0
F_in__in_base64=0
F_in__in_ch=0
F_in__in_ch_inch=1
F_in__in_ch_inchall=1
F_in__in_csv=0
F_in__in_csv_incsv_=1
F_in__in_dsv=0
F_in__in_dsv_indsvsep_=1
F_in__in_dsv_indsvsepre_=1
F_in__in_dsv_indsvquote_=1
F_in__in_dsv_indsvescape_=1
F_in__in_dsv_indsvcomment_=1
F_in__in_dsv_indsvheader_=1
F_in__in_dsv_indsvtrim_=1
F_in__in_dsv_indsvjoin_=1
F_in__in_dsv_indsvfields_=1
F_in__in_db=0
F_in__in_db_indbjdbc_=1
F_in__in_db_indbuser_=1
F_in__in_db_indbpass_=1
F_in__in_db_indbtimeout_=1
F_in__in_db_indblib_=1
F_in__in_db_indbstream_=1
F_in__in_db_indbexec_=1
F_in__in_db_indbautocommit_=1
F_in__in_db_indbdesc_=1
F_in__in_gb64json=0
F_in__in_hsperf=0
F_in__in_ini=0
F_in__in_javas=0
F_in__in_javas_javasinception_=1
F_in__in_javagc=0
F_in__in_javagc_javagcjoin_=1
F_in__in_javathread=0
F_in__in_javathread_javathreadpid_=1
F_in__in_jfr=0
F_in__in_jfr_jfrjoin_=1
F_in__in_jfr_jfrdesc_=1
F_in__in_jmx=0
F_in__in_jmx_jmxpid_=1
F_in__in_jmx_jmxurl_=1
F_in__in_jmx_jmxuser_=1
F_in__in_jmx_jmxpass_=1
F_in__in_jmx_jmxprovider_=1
F_in__in_jmx_jmxop_=1
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
F_in__in_lines_linesvisualheadsep=1
F_in__in_llm=0
F_in__in_llmmodels=0
F_in__in_ls=0
F_in__in_ls_lsext_=1
F_in__in_ls_lsrecursive_=1
F_in__in_ls_lsposix_=1
F_in__in_md=0
F_in__in_mdtable=0
F_in__in_mdtable_inmdtablejoin_=1
F_in__in_mdcode=0
F_in__in_ndjson=0
F_in__in_ndjson_ndjsonjoin_=1
F_in__in_ndjson_ndjsonfilter_=1
F_in__in_ndslon=0
F_in__in_ndslon_ndslonjoin_=1
F_in__in_ndslon_ndslonfilter_=1
F_in__in_oaf=0
F_in__in_oafp=0
F_in__in_oafp_inoafpseq_=1
F_in__in_ojob=0
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
F_in__in_snmp=0
F_in__in_snmp_insnmp_=1
F_in__in_snmp_insnmpcommunity_=1
F_in__in_snmp_insnmpversion_=1
F_in__in_snmp_insnmptimeout_=1
F_in__in_snmp_insnmpretries_=1
F_in__in_snmp_insnmpsec_=1
F_in__in_toml=0
F_in__in_xls=0
F_in__in_xls_inxlssheet_=1
F_in__in_xls_inxlsevalformulas_=1
F_in__in_xls_inxlsdesc_=1
F_in__in_xls_inxlscol_=1
F_in__in_xls_inxlsrow_=1
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
F_out__out_cmd_outcmdtmpl_=1
F_out__out_cslon=0
F_out__out_csv=0
F_out__out_csv_csv_=1
F_out__out_dsv=0
F_out__out_dsv_dsvsep_=1
F_out__out_dsv_dsvquote_=1
F_out__out_dsv_dsvfields_=1
F_out__out_dsv_dsvuseslon_=1
F_out__out_dsv_dsvheader_=1
F_out__out_ctable=0
F_out__out_ctree=0
F_out__out_mtree=0
F_out__out_btree=0
F_out__out_cyaml=0
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
F_out__out_envs_envsnoprefix_=1
F_out__out_gb64json=0
F_out__out_grid=0
F_out__out_grid_grid_=1
F_out__out_html=0
F_out__out_html_htmlcompact_=1
F_out__out_html_htmlpart_=1
F_out__out_html_htmlopen_=1
F_out__out_html_htmlwait_=1
F_out__out_html_htmldark_=1
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
F_out__out_ndslon=0
F_out__out_ndcslon=0
F_out__out_oaf=0
F_out__out_oaf_outoaf_=1
F_out__out_openmetrics=0
F_out__out_openmetrics_metricsprefix_=1
F_out__out_openmetrics_metricstimestamp_=1
F_out__out_pjson=0
F_out__out_prettyjson=0
F_out__out_pxml=0
F_out__out_pxml_pxmlprefix=1
F_out__out_raw=0
F_out__out_rawascii=0
F_out__out_rawascii_rawasciistart_=1
F_out__out_rawascii_rawasciiend_=1
F_out__out_rawascii_rawasciitab_=1
F_out__out_rawascii_rawasciinovisual_=1
F_out__out_rawascii_rawasciinolinenum_=1
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
F_out__out_template_templatetmpl_=1
F_out__out_text=0
F_out__out_toml=0
F_out__out_tree=0
F_out__out_xls=0
F_out__out_xls_xlsfile_=1
F_out__out_xls_xlssheet_=1
F_out__out_xls_xlsformat_=1
F_out__out_xls_xlsopen_=1
F_out__out_xls_xlsopenwait_=1
F_out__out_xml=0
F_out__out_xml_outxmlprefix=1
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
F_pipe_=1
F_parallel_=1
F__v=1
F__f=1
F_allstrings_=1
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
F_field2byte_=1
F_field2date_=1
F_field2si_=1
F_field2str_=1
F_field4map_=1
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
F_numformat_=1
F_oaf_=1
F_regression_=1
F_regression__regressionpath_=0
F_regression__regressionx_=0
F_regression__regressionoptions_=0
F_regression__regressionforecast_=0
F_set_=1
F_set__setop_=0
F_set__setop__setop_union=1
F_set__setop__setop_diffa=1
F_set__setop__setop_diffb=1
F_set__setop__setop_diffab=1
F_set__setop__setop_intersect=1
F_removedups_=1
F_removeempty_=1
F_removenulls_=1
F_spacekeys_=1
F_searchkeys_=1
F_searchvalues_=1
F_sortmapkeys_=1
F_trim_=1
F_forcearray_=1
F_secKey_=1
F_secKey__secEnv_=0
F_secKey__secFile_=0
F_secKey__secMainPass_=0
F_secKey__secPass_=0
F_secKey__secBucket_=0
F_secKey__secRepo_=0
F_xjs_=1
F_xpy_=1
F_xfn_=1
F_xrjs_=1
F_xrpy_=1
F_xrfn_=1
F_val2icon_=1

# Iterate over the arguments
if [ $# -gt 0 ]; then
  FFOUND=0
  for arg in "$@"; do
    if [ "$arg" = "${!#}" ]; then FFOUND=1; break; fi
    # in= options
    if [ "$arg" = "in=ask" ]; then FFOUND=1; F_in__in_ask=1; F_in_=0; fi
    if [ "$arg" = "in=base64" ]; then FFOUND=1; F_in__in_base64=1; F_in_=0; fi
    if [ "$arg" = "in=ch" ]; then FFOUND=1; F_in__in_ch=1; F_in_=0; fi
    if [ "${arg#inch}" != "$arg" ]; then FFOUND=1; F_in__in_ch_inch=0; fi
    if [ "${arg#inchall}" != "$arg" ]; then FFOUND=1; F_in__in_ch_inchall=0; fi
    if [ "$arg" = "in=csv" ]; then FFOUND=1; F_in__in_csv=1; F_in_=0; fi
    if [ "${arg#incsv=}" != "$arg" ]; then FFOUND=1; F_in__in_csv_incsv_=0; fi
    if [ "$arg" = "in=dsv" ]; then FFOUND=1; F_in__in_dsv=1; F_in_=0; fi
    if [ "${arg#indsvsep=}" != "$arg" ]; then FFOUND=1; F_in__in_dsv_indsvsep_=0; fi
    if [ "${arg#indsvsepre=}" != "$arg" ]; then FFOUND=1; F_in__in_dsv_indsvsepre_=0; fi
    if [ "${arg#indsvquote=}" != "$arg" ]; then FFOUND=1; F_in__in_dsv_indsvquote_=0; fi
    if [ "${arg#indsvescape=}" != "$arg" ]; then FFOUND=1; F_in__in_dsv_indsvescape_=0; fi
    if [ "${arg#indsvcomment=}" != "$arg" ]; then FFOUND=1; F_in__in_dsv_indsvcomment_=0; fi
    if [ "${arg#indsvheader=}" != "$arg" ]; then FFOUND=1; F_in__in_dsv_indsvheader_=0; fi
    if [ "${arg#indsvtrim=}" != "$arg" ]; then FFOUND=1; F_in__in_dsv_indsvtrim_=0; fi
    if [ "${arg#indsvjoin=}" != "$arg" ]; then FFOUND=1; F_in__in_dsv_indsvjoin_=0; fi
    if [ "${arg#indsvfields=}" != "$arg" ]; then FFOUND=1; F_in__in_dsv_indsvfields_=0; fi
    if [ "$arg" = "in=db" ]; then FFOUND=1; F_in__in_db=1; F_in_=0; fi
    if [ "${arg#indbjdbc=}" != "$arg" ]; then FFOUND=1; F_in__in_db_indbjdbc_=0; fi
    if [ "${arg#indbuser=}" != "$arg" ]; then FFOUND=1; F_in__in_db_indbuser_=0; fi
    if [ "${arg#indbpass=}" != "$arg" ]; then FFOUND=1; F_in__in_db_indbpass_=0; fi
    if [ "${arg#indbtimeout=}" != "$arg" ]; then FFOUND=1; F_in__in_db_indbtimeout_=0; fi
    if [ "${arg#indblib=}" != "$arg" ]; then FFOUND=1; F_in__in_db_indblib_=0; fi
    if [ "${arg#indbstream=}" != "$arg" ]; then FFOUND=1; F_in__in_db_indbstream_=0; fi
    if [ "${arg#indbexec=}" != "$arg" ]; then FFOUND=1; F_in__in_db_indbexec_=0; fi
    if [ "${arg#indbautocommit=}" != "$arg" ]; then FFOUND=1; F_in__in_db_indbautocommit_=0; fi
    if [ "${arg#indbdesc=}" != "$arg" ]; then FFOUND=1; F_in__in_db_indbdesc_=0; fi
    if [ "$arg" = "in=gb64json" ]; then FFOUND=1; F_in__in_gb64json=1; F_in_=0; fi
    if [ "$arg" = "in=hsperf" ]; then FFOUND=1; F_in__in_hsperf=1; F_in_=0; fi
    if [ "$arg" = "in=ini" ]; then FFOUND=1; F_in__in_ini=1; F_in_=0; fi
    if [ "$arg" = "in=javas" ]; then FFOUND=1; F_in__in_javas=1; F_in_=0; fi
    if [ "${arg#javasinception=}" != "$arg" ]; then FFOUND=1; F_in__in_javas_javasinception_=0; fi
    if [ "$arg" = "in=javagc" ]; then FFOUND=1; F_in__in_javagc=1; F_in_=0; fi
    if [ "${arg#javagcjoin=}" != "$arg" ]; then FFOUND=1; F_in__in_javagc_javagcjoin_=0; fi
    if [ "$arg" = "in=javathread" ]; then FFOUND=1; F_in__in_javathread=1; F_in_=0; fi
    if [ "${arg#javathreadpid=}" != "$arg" ]; then FFOUND=1; F_in__in_javathread_javathreadpid_=0; fi
    if [ "$arg" = "in=jfr" ]; then FFOUND=1; F_in__in_jfr=1; F_in_=0; fi
    if [ "${arg#jfrjoin=}" != "$arg" ]; then FFOUND=1; F_in__in_jfr_jfrjoin_=0; fi
    if [ "${arg#jfrdesc=}" != "$arg" ]; then FFOUND=1; F_in__in_jfr_jfrdesc_=0; fi
    if [ "$arg" = "in=jmx" ]; then FFOUND=1; F_in__in_jmx=1; F_in_=0; fi
    if [ "${arg#jmxpid=}" != "$arg" ]; then FFOUND=1; F_in__in_jmx_jmxpid_=0; fi
    if [ "${arg#jmxurl=}" != "$arg" ]; then FFOUND=1; F_in__in_jmx_jmxurl_=0; fi
    if [ "${arg#jmxuser=}" != "$arg" ]; then FFOUND=1; F_in__in_jmx_jmxuser_=0; fi
    if [ "${arg#jmxpass=}" != "$arg" ]; then FFOUND=1; F_in__in_jmx_jmxpass_=0; fi
    if [ "${arg#jmxprovider=}" != "$arg" ]; then FFOUND=1; F_in__in_jmx_jmxprovider_=0; fi
    if [ "${arg#jmxop=}" != "$arg" ]; then FFOUND=1; F_in__in_jmx_jmxop_=0; fi
    if [ "$arg" = "in=json" ]; then FFOUND=1; F_in__in_json=1; F_in_=0; fi
    if [ "${arg#jsondesc=}" != "$arg" ]; then FFOUND=1; F_in__in_json_jsondesc_=0; fi
    if [ "${arg#jsonprefix=}" != "$arg" ]; then FFOUND=1; F_in__in_json_jsonprefix_=0; fi
    if [ "$arg" = "in=jsonschema" ]; then FFOUND=1; F_in__in_jsonschema=1; F_in_=0; fi
    if [ "$arg" = "in=jwt" ]; then FFOUND=1; F_in__in_jwt=1; F_in_=0; fi
    if [ "${arg#injwtverify=}" != "$arg" ]; then FFOUND=1; F_in__in_jwt_injwtverify_=0; fi
    if [ "${arg#injwtsecret=}" != "$arg" ]; then FFOUND=1; F_in__in_jwt_injwtsecret_=0; fi
    if [ "${arg#injwtpubkey=}" != "$arg" ]; then FFOUND=1; F_in__in_jwt_injwtpubkey_=0; fi
    if [ "${arg#injwtalg=}" != "$arg" ]; then FFOUND=1; F_in__in_jwt_injwtalg_=0; fi
    if [ "${arg#injwtraw=}" != "$arg" ]; then FFOUND=1; F_in__in_jwt_injwtraw_=0; fi
    if [ "$arg" = "in=lines" ]; then FFOUND=1; F_in__in_lines=1; F_in_=0; fi
    if [ "${arg#linesjoin=}" != "$arg" ]; then FFOUND=1; F_in__in_lines_linesjoin_=0; fi
    if [ "${arg#linesvisual=}" != "$arg" ]; then FFOUND=1; F_in__in_lines_linesvisual_=0; fi
    if [ "${arg#linesvisualsepre=}" != "$arg" ]; then FFOUND=1; F_in__in_lines_linesvisualsepre_=0; fi
    if [ "${arg#linesvisualheadsep}" != "$arg" ]; then FFOUND=1; F_in__in_lines_linesvisualheadsep=0; fi
    if [ "$arg" = "in=llm" ]; then FFOUND=1; F_in__in_llm=1; F_in_=0; fi
    if [ "$arg" = "in=llmmodels" ]; then FFOUND=1; F_in__in_llmmodels=1; F_in_=0; fi
    if [ "$arg" = "in=ls" ]; then FFOUND=1; F_in__in_ls=1; F_in_=0; fi
    if [ "${arg#lsext=}" != "$arg" ]; then FFOUND=1; F_in__in_ls_lsext_=0; fi
    if [ "${arg#lsrecursive=}" != "$arg" ]; then FFOUND=1; F_in__in_ls_lsrecursive_=0; fi
    if [ "${arg#lsposix=}" != "$arg" ]; then FFOUND=1; F_in__in_ls_lsposix_=0; fi
    if [ "$arg" = "in=md" ]; then FFOUND=1; F_in__in_md=1; F_in_=0; fi
    if [ "$arg" = "in=mdtable" ]; then FFOUND=1; F_in__in_mdtable=1; F_in_=0; fi
    if [ "${arg#inmdtablejoin=}" != "$arg" ]; then FFOUND=1; F_in__in_mdtable_inmdtablejoin_=0; fi
    if [ "$arg" = "in=mdcode" ]; then FFOUND=1; F_in__in_mdcode=1; F_in_=0; fi
    if [ "$arg" = "in=ndjson" ]; then FFOUND=1; F_in__in_ndjson=1; F_in_=0; fi
    if [ "${arg#ndjsonjoin=}" != "$arg" ]; then FFOUND=1; F_in__in_ndjson_ndjsonjoin_=0; fi
    if [ "${arg#ndjsonfilter=}" != "$arg" ]; then FFOUND=1; F_in__in_ndjson_ndjsonfilter_=0; fi
    if [ "$arg" = "in=ndslon" ]; then FFOUND=1; F_in__in_ndslon=1; F_in_=0; fi
    if [ "${arg#ndslonjoin=}" != "$arg" ]; then FFOUND=1; F_in__in_ndslon_ndslonjoin_=0; fi
    if [ "${arg#ndslonfilter=}" != "$arg" ]; then FFOUND=1; F_in__in_ndslon_ndslonfilter_=0; fi
    if [ "$arg" = "in=oaf" ]; then FFOUND=1; F_in__in_oaf=1; F_in_=0; fi
    if [ "$arg" = "in=oafp" ]; then FFOUND=1; F_in__in_oafp=1; F_in_=0; fi
    if [ "${arg#inoafpseq=}" != "$arg" ]; then FFOUND=1; F_in__in_oafp_inoafpseq_=0; fi
    if [ "$arg" = "in=ojob" ]; then FFOUND=1; F_in__in_ojob=1; F_in_=0; fi
    if [ "$arg" = "in=openmetrics" ]; then FFOUND=1; F_in__in_openmetrics=1; F_in_=0; fi
    if [ "$arg" = "in=raw" ]; then FFOUND=1; F_in__in_raw=1; F_in_=0; fi
    if [ "$arg" = "in=rawhex" ]; then FFOUND=1; F_in__in_rawhex=1; F_in_=0; fi
    if [ "${arg#inrawhexline=}" != "$arg" ]; then FFOUND=1; F_in__in_rawhex_inrawhexline_=0; fi
    if [ "$arg" = "in=sh" ]; then FFOUND=1; F_in__in_sh=1; F_in_=0; fi
    if [ "${arg#inshformat=}" != "$arg" ]; then FFOUND=1; F_in__in_sh_inshformat_=0; fi
    if [ "$arg" = "in=slon" ]; then FFOUND=1; F_in__in_slon=1; F_in_=0; fi
    if [ "$arg" = "in=sql" ]; then FFOUND=1; F_in__in_sql=1; F_in_=0; fi
    if [ "${arg#sqlparse=}" != "$arg" ]; then FFOUND=1; F_in__in_sql_sqlparse_=0; fi
    if [ "${arg#sqloptions=}" != "$arg" ]; then FFOUND=1; F_in__in_sql_sqloptions_=0; fi
    if [ "$arg" = "in=snmp" ]; then FFOUND=1; F_in__in_snmp=1; F_in_=0; fi
    if [ "${arg#insnmp=}" != "$arg" ]; then FFOUND=1; F_in__in_snmp_insnmp_=0; fi
    if [ "${arg#insnmpcommunity=}" != "$arg" ]; then FFOUND=1; F_in__in_snmp_insnmpcommunity_=0; fi
    if [ "${arg#insnmpversion=}" != "$arg" ]; then FFOUND=1; F_in__in_snmp_insnmpversion_=0; fi
    if [ "${arg#insnmptimeout=}" != "$arg" ]; then FFOUND=1; F_in__in_snmp_insnmptimeout_=0; fi
    if [ "${arg#insnmpretries=}" != "$arg" ]; then FFOUND=1; F_in__in_snmp_insnmpretries_=0; fi
    if [ "${arg#insnmpsec=}" != "$arg" ]; then FFOUND=1; F_in__in_snmp_insnmpsec_=0; fi
    if [ "$arg" = "in=toml" ]; then FFOUND=1; F_in__in_toml=1; F_in_=0; fi
    if [ "$arg" = "in=xls" ]; then FFOUND=1; F_in__in_xls=1; F_in_=0; fi
    if [ "${arg#inxlssheet=}" != "$arg" ]; then FFOUND=1; F_in__in_xls_inxlssheet_=0; fi
    if [ "${arg#inxlsevalformulas=}" != "$arg" ]; then FFOUND=1; F_in__in_xls_inxlsevalformulas_=0; fi
    if [ "${arg#inxlsdesc=}" != "$arg" ]; then FFOUND=1; F_in__in_xls_inxlsdesc_=0; fi
    if [ "${arg#inxlscol=}" != "$arg" ]; then FFOUND=1; F_in__in_xls_inxlscol_=0; fi
    if [ "${arg#inxlsrow=}" != "$arg" ]; then FFOUND=1; F_in__in_xls_inxlsrow_=0; fi
    if [ "$arg" = "in=xml" ]; then FFOUND=1; F_in__in_xml=1; F_in_=0; fi
    if [ "${arg#xmlignored=}" != "$arg" ]; then FFOUND=1; F_in__in_xml_xmlignored_=0; fi
    if [ "${arg#xmlprefix=}" != "$arg" ]; then FFOUND=1; F_in__in_xml_xmlprefix_=0; fi
    if [ "${arg#xmlfiltertag=}" != "$arg" ]; then FFOUND=1; F_in__in_xml_xmlfiltertag_=0; fi
    if [ "$arg" = "in=yaml" ]; then FFOUND=1; F_in__in_yaml=1; F_in_=0; fi
    # out= options
    if [ "$arg" = "out=base64" ]; then FFOUND=1; F_out__out_base64=1; F_out_=0; fi
    if [ "${arg#base64gzip=}" != "$arg" ]; then FFOUND=1; F_out__out_base64_base64gzip_=0; fi
    if [ "$arg" = "out=ch" ]; then FFOUND=1; F_out__out_ch=1; F_out_=0; fi
    if [ "${arg#ch=}" != "$arg" ]; then FFOUND=1; F_out__out_ch_ch_=0; fi
    if [ "${arg#chkey=}" != "$arg" ]; then FFOUND=1; F_out__out_ch_chkey_=0; fi
    if [ "${arg#chunset=}" != "$arg" ]; then FFOUND=1; F_out__out_ch_chunset_=0; fi
    if [ "$arg" = "out=chart" ]; then FFOUND=1; F_out__out_chart=1; F_out_=0; fi
    if [ "${arg#chart=}" != "$arg" ]; then FFOUND=1; F_out__out_chart_chart_=0; fi
    if [ "${arg#chartcls=}" != "$arg" ]; then FFOUND=1; F_out__out_chart_chartcls_=0; fi
    if [ "$arg" = "out=cjson" ]; then FFOUND=1; F_out__out_cjson=1; F_out_=0; fi
    if [ "$arg" = "out=cmd" ]; then FFOUND=1; F_out__out_cmd=1; F_out_=0; fi
    if [ "${arg#outcmd=}" != "$arg" ]; then FFOUND=1; F_out__out_cmd_outcmd_=0; fi
    if [ "${arg#outcmdjoin=}" != "$arg" ]; then FFOUND=1; F_out__out_cmd_outcmdjoin_=0; fi
    if [ "${arg#outcmdseq=}" != "$arg" ]; then FFOUND=1; F_out__out_cmd_outcmdseq_=0; fi
    if [ "${arg#outcmdnl=}" != "$arg" ]; then FFOUND=1; F_out__out_cmd_outcmdnl_=0; fi
    if [ "${arg#outcmdparam=}" != "$arg" ]; then FFOUND=1; F_out__out_cmd_outcmdparam_=0; fi
    if [ "${arg#outcmdtmpl=}" != "$arg" ]; then FFOUND=1; F_out__out_cmd_outcmdtmpl_=0; fi
    if [ "$arg" = "out=cslon" ]; then FFOUND=1; F_out__out_cslon=1; F_out_=0; fi
    if [ "$arg" = "out=csv" ]; then FFOUND=1; F_out__out_csv=1; F_out_=0; fi
    if [ "${arg#csv=}" != "$arg" ]; then FFOUND=1; F_out__out_csv_csv_=0; fi
    if [ "$arg" = "out=dsv" ]; then FFOUND=1; F_out__out_dsv=1; F_out_=0; fi
    if [ "${arg#dsvsep=}" != "$arg" ]; then FFOUND=1; F_out__out_dsv_dsvsep_=0; fi
    if [ "${arg#dsvquote=}" != "$arg" ]; then FFOUND=1; F_out__out_dsv_dsvquote_=0; fi
    if [ "${arg#dsvfields=}" != "$arg" ]; then FFOUND=1; F_out__out_dsv_dsvfields_=0; fi
    if [ "${arg#dsvuseslon=}" != "$arg" ]; then FFOUND=1; F_out__out_dsv_dsvuseslon_=0; fi
    if [ "${arg#dsvheader=}" != "$arg" ]; then FFOUND=1; F_out__out_dsv_dsvheader_=0; fi
    if [ "$arg" = "out=ctable" ]; then FFOUND=1; F_out__out_ctable=1; F_out_=0; fi
    if [ "$arg" = "out=ctree" ]; then FFOUND=1; F_out__out_ctree=1; F_out_=0; fi
    if [ "$arg" = "out=mtree" ]; then FFOUND=1; F_out__out_mtree=1; F_out_=0; fi
    if [ "$arg" = "out=btree" ]; then FFOUND=1; F_out__out_btree=1; F_out_=0; fi
    if [ "$arg" = "out=cyaml" ]; then FFOUND=1; F_out__out_cyaml=1; F_out_=0; fi
    if [ "$arg" = "out=db" ]; then FFOUND=1; F_out__out_db=1; F_out_=0; fi
    if [ "${arg#dbjdbc=}" != "$arg" ]; then FFOUND=1; F_out__out_db_dbjdbc_=0; fi
    if [ "${arg#dbuser=}" != "$arg" ]; then FFOUND=1; F_out__out_db_dbuser_=0; fi
    if [ "${arg#dbpass=}" != "$arg" ]; then FFOUND=1; F_out__out_db_dbpass_=0; fi
    if [ "${arg#dbtimeout=}" != "$arg" ]; then FFOUND=1; F_out__out_db_dbtimeout_=0; fi
    if [ "${arg#dblib=}" != "$arg" ]; then FFOUND=1; F_out__out_db_dblib_=0; fi
    if [ "${arg#dbtable=}" != "$arg" ]; then FFOUND=1; F_out__out_db_dbtable_=0; fi
    if [ "${arg#dbnocreate=}" != "$arg" ]; then FFOUND=1; F_out__out_db_dbnocreate_=0; fi
    if [ "${arg#dbicase=}" != "$arg" ]; then FFOUND=1; F_out__out_db_dbicase_=0; fi
    if [ "${arg#dbbatchsize=}" != "$arg" ]; then FFOUND=1; F_out__out_db_dbbatchsize_=0; fi
    if [ "$arg" = "out=envs" ]; then FFOUND=1; F_out__out_envs=1; F_out_=0; fi
    if [ "${arg#envscmd=}" != "$arg" ]; then FFOUND=1; F_out__out_envs_envscmd_=0; fi
    if [ "${arg#envsprefix=}" != "$arg" ]; then FFOUND=1; F_out__out_envs_envsprefix_=0; fi
    if [ "${arg#envsnoprefix=}" != "$arg" ]; then FFOUND=1; F_out__out_envs_envsnoprefix_=0; fi
    if [ "$arg" = "out=gb64json" ]; then FFOUND=1; F_out__out_gb64json=1; F_out_=0; fi
    if [ "$arg" = "out=grid" ]; then FFOUND=1; F_out__out_grid=1; F_out_=0; fi
    if [ "${arg#grid=}" != "$arg" ]; then FFOUND=1; F_out__out_grid_grid_=0; fi
    if [ "$arg" = "out=html" ]; then FFOUND=1; F_out__out_html=1; F_out_=0; fi
    if [ "${arg#htmlcompact=}" != "$arg" ]; then FFOUND=1; F_out__out_html_htmlcompact_=0; fi
    if [ "${arg#htmlpart=}" != "$arg" ]; then FFOUND=1; F_out__out_html_htmlpart_=0; fi
    if [ "${arg#htmlopen=}" != "$arg" ]; then FFOUND=1; F_out__out_html_htmlopen_=0; fi
    if [ "${arg#htmlwait=}" != "$arg" ]; then FFOUND=1; F_out__out_html_htmlwait_=0; fi
    if [ "${arg#htmldark=}" != "$arg" ]; then FFOUND=1; F_out__out_html_htmldark_=0; fi
    if [ "$arg" = "out=ini" ]; then FFOUND=1; F_out__out_ini=1; F_out_=0; fi
    if [ "$arg" = "out=json" ]; then FFOUND=1; F_out__out_json=1; F_out_=0; fi
    if [ "$arg" = "out=jwt" ]; then FFOUND=1; F_out__out_jwt=1; F_out_=0; fi
    if [ "${arg#jwtsecret=}" != "$arg" ]; then FFOUND=1; F_out__out_jwt_jwtsecret_=0; fi
    if [ "${arg#jwtprivkey=}" != "$arg" ]; then FFOUND=1; F_out__out_jwt_jwtprivkey_=0; fi
    if [ "${arg#jwtalg=}" != "$arg" ]; then FFOUND=1; F_out__out_jwt_jwtalg_=0; fi
    if [ "$arg" = "out=lines" ]; then FFOUND=1; F_out__out_lines=1; F_out_=0; fi
    if [ "$arg" = "out=log" ]; then FFOUND=1; F_out__out_log=1; F_out_=0; fi
    if [ "${arg#logprintall=}" != "$arg" ]; then FFOUND=1; F_out__out_log_logprintall_=0; fi
    if [ "$arg" = "out=map" ]; then FFOUND=1; F_out__out_map=1; F_out_=0; fi
    if [ "$arg" = "out=md" ]; then FFOUND=1; F_out__out_md=1; F_out_=0; fi
    if [ "${arg#mdtemplate=}" != "$arg" ]; then FFOUND=1; F_out__out_md_mdtemplate_=0; fi
    if [ "$arg" = "out=mdtable" ]; then FFOUND=1; F_out__out_mdtable=1; F_out_=0; fi
    if [ "$arg" = "out=mdyaml" ]; then FFOUND=1; F_out__out_mdyaml=1; F_out_=0; fi
    if [ "$arg" = "out=ndjson" ]; then FFOUND=1; F_out__out_ndjson=1; F_out_=0; fi
    if [ "$arg" = "out=ndslon" ]; then FFOUND=1; F_out__out_ndslon=1; F_out_=0; fi
    if [ "$arg" = "out=ndcslon" ]; then FFOUND=1; F_out__out_ndcslon=1; F_out_=0; fi
    if [ "$arg" = "out=oaf" ]; then FFOUND=1; F_out__out_oaf=1; F_out_=0; fi
    if [ "${arg#outoaf=}" != "$arg" ]; then FFOUND=1; F_out__out_oaf_outoaf_=0; fi
    if [ "$arg" = "out=openmetrics" ]; then FFOUND=1; F_out__out_openmetrics=1; F_out_=0; fi
    if [ "${arg#metricsprefix=}" != "$arg" ]; then FFOUND=1; F_out__out_openmetrics_metricsprefix_=0; fi
    if [ "${arg#metricstimestamp=}" != "$arg" ]; then FFOUND=1; F_out__out_openmetrics_metricstimestamp_=0; fi
    if [ "$arg" = "out=pjson" ]; then FFOUND=1; F_out__out_pjson=1; F_out_=0; fi
    if [ "$arg" = "out=prettyjson" ]; then FFOUND=1; F_out__out_prettyjson=1; F_out_=0; fi
    if [ "$arg" = "out=pxml" ]; then FFOUND=1; F_out__out_pxml=1; F_out_=0; fi
    if [ "${arg#pxmlprefix}" != "$arg" ]; then FFOUND=1; F_out__out_pxml_pxmlprefix=0; fi
    if [ "$arg" = "out=raw" ]; then FFOUND=1; F_out__out_raw=1; F_out_=0; fi
    if [ "$arg" = "out=rawascii" ]; then FFOUND=1; F_out__out_rawascii=1; F_out_=0; fi
    if [ "${arg#rawasciistart=}" != "$arg" ]; then FFOUND=1; F_out__out_rawascii_rawasciistart_=0; fi
    if [ "${arg#rawasciiend=}" != "$arg" ]; then FFOUND=1; F_out__out_rawascii_rawasciiend_=0; fi
    if [ "${arg#rawasciitab=}" != "$arg" ]; then FFOUND=1; F_out__out_rawascii_rawasciitab_=0; fi
    if [ "${arg#rawasciinovisual=}" != "$arg" ]; then FFOUND=1; F_out__out_rawascii_rawasciinovisual_=0; fi
    if [ "${arg#rawasciinolinenum=}" != "$arg" ]; then FFOUND=1; F_out__out_rawascii_rawasciinolinenum_=0; fi
    if [ "$arg" = "out=schart" ]; then FFOUND=1; F_out__out_schart=1; F_out_=0; fi
    if [ "${arg#schart=}" != "$arg" ]; then FFOUND=1; F_out__out_schart_schart_=0; fi
    if [ "$arg" = "out=slon" ]; then FFOUND=1; F_out__out_slon=1; F_out_=0; fi
    if [ "$arg" = "out=sql" ]; then FFOUND=1; F_out__out_sql=1; F_out_=0; fi
    if [ "${arg#sqltable=}" != "$arg" ]; then FFOUND=1; F_out__out_sql_sqltable_=0; fi
    if [ "${arg#sqlicase=}" != "$arg" ]; then FFOUND=1; F_out__out_sql_sqlicase_=0; fi
    if [ "${arg#sqlnocreate=}" != "$arg" ]; then FFOUND=1; F_out__out_sql_sqlnocreate_=0; fi
    if [ "$arg" = "out=stable" ]; then FFOUND=1; F_out__out_stable=1; F_out_=0; fi
    if [ "$arg" = "out=table" ]; then FFOUND=1; F_out__out_table=1; F_out_=0; fi
    if [ "$arg" = "out=template" ]; then FFOUND=1; F_out__out_template=1; F_out_=0; fi
    if [ "${arg#template=}" != "$arg" ]; then FFOUND=1; F_out__out_template_template_=0; fi
    if [ "${arg#templatepath=}" != "$arg" ]; then FFOUND=1; F_out__out_template_templatepath_=0; fi
    if [ "${arg#templatedata=}" != "$arg" ]; then FFOUND=1; F_out__out_template_templatedata_=0; fi
    if [ "${arg#templatetmpl=}" != "$arg" ]; then FFOUND=1; F_out__out_template_templatetmpl_=0; fi
    if [ "$arg" = "out=text" ]; then FFOUND=1; F_out__out_text=1; F_out_=0; fi
    if [ "$arg" = "out=toml" ]; then FFOUND=1; F_out__out_toml=1; F_out_=0; fi
    if [ "$arg" = "out=tree" ]; then FFOUND=1; F_out__out_tree=1; F_out_=0; fi
    if [ "$arg" = "out=xls" ]; then FFOUND=1; F_out__out_xls=1; F_out_=0; fi
    if [ "${arg#xlsfile=}" != "$arg" ]; then FFOUND=1; F_out__out_xls_xlsfile_=0; fi
    if [ "${arg#xlssheet=}" != "$arg" ]; then FFOUND=1; F_out__out_xls_xlssheet_=0; fi
    if [ "${arg#xlsformat=}" != "$arg" ]; then FFOUND=1; F_out__out_xls_xlsformat_=0; fi
    if [ "${arg#xlsopen=}" != "$arg" ]; then FFOUND=1; F_out__out_xls_xlsopen_=0; fi
    if [ "${arg#xlsopenwait=}" != "$arg" ]; then FFOUND=1; F_out__out_xls_xlsopenwait_=0; fi
    if [ "$arg" = "out=xml" ]; then FFOUND=1; F_out__out_xml=1; F_out_=0; fi
    if [ "${arg#outxmlprefix}" != "$arg" ]; then FFOUND=1; F_out__out_xml_outxmlprefix=0; fi
    if [ "$arg" = "out=yaml" ]; then FFOUND=1; F_out__out_yaml=1; F_out_=0; fi
    # -h single option
    if [ "$arg" = "-h" ]; then FFOUND=1; F__h=0; fi
    # help= options
    if [ "$arg" = "help=filters" ]; then FFOUND=1; F_help__help_filters=1; F_help_=0; fi
    if [ "$arg" = "help=template" ]; then FFOUND=1; F_help__help_template=1; F_help_=0; fi
    if [ "$arg" = "help=examples" ]; then FFOUND=1; F_help__help_examples=1; F_help_=0; fi
    # file= single option
    if [ "$arg" = "file=" ]; then FFOUND=1; F_file_=0; fi
    # cmd= single option
    if [ "$arg" = "cmd=" ]; then FFOUND=1; F_cmd_=0; fi
    # data= single option
    if [ "$arg" = "data=" ]; then FFOUND=1; F_data_=0; fi
    # from= single option
    if [ "$arg" = "from=" ]; then FFOUND=1; F_from_=0; fi
    # sql= single option
    if [ "$arg" = "sql=" ]; then FFOUND=1; F_sql_=0; fi
    # sqlfilter= single option
    if [ "$arg" = "sqlfilter=" ]; then FFOUND=1; F_sqlfilter_=0; fi
    # sqlfiltertables= single option
    if [ "$arg" = "sqlfiltertables=" ]; then FFOUND=1; F_sqlfiltertables_=0; fi
    # path= single option
    if [ "$arg" = "path=" ]; then FFOUND=1; F_path_=0; fi
    # outkey= single option
    if [ "$arg" = "outkey=" ]; then FFOUND=1; F_outkey_=0; fi
    # outfile= single option
    if [ "$arg" = "outfile=" ]; then FFOUND=1; F_outfile_=0; fi
    # outfileappend= single option
    if [ "$arg" = "outfileappend=" ]; then FFOUND=1; F_outfileappend_=0; fi
    # pause= single option
    if [ "$arg" = "pause=" ]; then FFOUND=1; F_pause_=0; fi
    # color= single option
    if [ "$arg" = "color=" ]; then FFOUND=1; F_color_=0; fi
    # url= single option
    if [ "$arg" = "url=" ]; then FFOUND=1; F_url_=0; fi
    # urlmethod= single option
    if [ "$arg" = "urlmethod=" ]; then FFOUND=1; F_urlmethod_=0; fi
    # urlparams= single option
    if [ "$arg" = "urlparams=" ]; then FFOUND=1; F_urlparams_=0; fi
    # urldata= single option
    if [ "$arg" = "urldata=" ]; then FFOUND=1; F_urldata_=0; fi
    # chs= single option
    if [ "$arg" = "chs=" ]; then FFOUND=1; F_chs_=0; fi
    # loop= single option
    if [ "$arg" = "loop=" ]; then FFOUND=1; F_loop_=0; fi
    # loopcls= single option
    if [ "$arg" = "loopcls=" ]; then FFOUND=1; F_loopcls_=0; fi
    # libs= single option
    if [ "$arg" = "libs=" ]; then FFOUND=1; F_libs_=0; fi
    # -examples single option
    if [ "$arg" = "-examples" ]; then FFOUND=1; F__examples=0; fi
    # examples= single option
    if [ "$arg" = "examples=" ]; then FFOUND=1; F_examples_=0; fi
    # version= single option
    if [ "$arg" = "version=" ]; then FFOUND=1; F_version_=0; fi
    # pipe= single option
    if [ "$arg" = "pipe=" ]; then FFOUND=1; F_pipe_=0; fi
    # parallel= single option
    if [ "$arg" = "parallel=" ]; then FFOUND=1; F_parallel_=0; fi
    # -v single option
    if [ "$arg" = "-v" ]; then FFOUND=1; F__v=0; fi
    # -f single option
    if [ "$arg" = "-f" ]; then FFOUND=1; F__f=0; fi
    # allstrings= single option
    if [ "$arg" = "allstrings=" ]; then FFOUND=1; F_allstrings_=0; fi
    # arraytomap= single option
    if [ "$arg" = "arraytomap=" ]; then FFOUND=1; F_arraytomap_=0; fi
    # arraytomapkeepkey= single option
    if [ "$arg" = "arraytomapkeepkey=" ]; then FFOUND=1; F_arraytomapkeepkey_=0; fi
    # arraytomapkey= single option
    if [ "$arg" = "arraytomapkey=" ]; then FFOUND=1; F_arraytomapkey_=0; fi
    # cmlt= options
    if [ "$arg" = "cmltch=" ]; then FFOUND=1; F_cmlt__cmltch_=1; F_cmlt_=0; fi
    if [ "$arg" = "cmltsize=" ]; then FFOUND=1; F_cmlt__cmltsize_=1; F_cmlt_=0; fi
    # correcttypes= single option
    if [ "$arg" = "correcttypes=" ]; then FFOUND=1; F_correcttypes_=0; fi
    # denormalize= single option
    if [ "$arg" = "denormalize=" ]; then FFOUND=1; F_denormalize_=0; fi
    # diff= options
    if [ "$arg" = "difftheme=" ]; then FFOUND=1; F_diff__difftheme_=1; F_diff_=0; fi
    if [ "$arg" = "diffnlines=" ]; then FFOUND=1; F_diff__diffnlines_=1; F_diff_=0; fi
    if [ "$arg" = "diffwords=" ]; then FFOUND=1; F_diff__diffwords_=1; F_diff_=0; fi
    if [ "$arg" = "diffwordswithspace=" ]; then FFOUND=1; F_diff__diffwordswithspace_=1; F_diff_=0; fi
    if [ "$arg" = "difflines=" ]; then FFOUND=1; F_diff__difflines_=1; F_diff_=0; fi
    if [ "$arg" = "diffsentences=" ]; then FFOUND=1; F_diff__diffsentences_=1; F_diff_=0; fi
    if [ "$arg" = "diffchars=" ]; then FFOUND=1; F_diff__diffchars_=1; F_diff_=0; fi
    # field2byte= single option
    if [ "$arg" = "field2byte=" ]; then FFOUND=1; F_field2byte_=0; fi
    # field2date= single option
    if [ "$arg" = "field2date=" ]; then FFOUND=1; F_field2date_=0; fi
    # field2si= single option
    if [ "$arg" = "field2si=" ]; then FFOUND=1; F_field2si_=0; fi
    # field2str= single option
    if [ "$arg" = "field2str=" ]; then FFOUND=1; F_field2str_=0; fi
    # field4map= single option
    if [ "$arg" = "field4map=" ]; then FFOUND=1; F_field4map_=0; fi
    # flatmap= single option
    if [ "$arg" = "flatmap=" ]; then FFOUND=1; F_flatmap_=0; fi
    # getlist= single option
    if [ "$arg" = "getlist=" ]; then FFOUND=1; F_getlist_=0; fi
    # jsonschema= single option
    if [ "$arg" = "jsonschema=" ]; then FFOUND=1; F_jsonschema_=0; fi
    # jsonschemacmd= single option
    if [ "$arg" = "jsonschemacmd=" ]; then FFOUND=1; F_jsonschemacmd_=0; fi
    # jsonschemagen= single option
    if [ "$arg" = "jsonschemagen=" ]; then FFOUND=1; F_jsonschemagen_=0; fi
    # kmeans= single option
    if [ "$arg" = "kmeans=" ]; then FFOUND=1; F_kmeans_=0; fi
    # llmprompt= options
    if [ "$arg" = "llmcontext=" ]; then FFOUND=1; F_llmprompt__llmcontext_=1; F_llmprompt_=0; fi
    if [ "$arg" = "llmenv=" ]; then FFOUND=1; F_llmprompt__llmenv_=1; F_llmprompt_=0; fi
    if [ "$arg" = "llmoptions=" ]; then FFOUND=1; F_llmprompt__llmoptions_=1; F_llmprompt_=0; fi
    if [ "$arg" = "llmconversation=" ]; then FFOUND=1; F_llmprompt__llmconversation_=1; F_llmprompt_=0; fi
    if [ "$arg" = "llmimage=" ]; then FFOUND=1; F_llmprompt__llmimage_=1; F_llmprompt_=0; fi
    # maptoarray= single option
    if [ "$arg" = "maptoarray=" ]; then FFOUND=1; F_maptoarray_=0; fi
    # maptoarraykey= single option
    if [ "$arg" = "maptoarraykey=" ]; then FFOUND=1; F_maptoarraykey_=0; fi
    # merge= single option
    if [ "$arg" = "merge=" ]; then FFOUND=1; F_merge_=0; fi
    # normalize= single option
    if [ "$arg" = "normalize=" ]; then FFOUND=1; F_normalize_=0; fi
    # numformat= single option
    if [ "$arg" = "numformat=" ]; then FFOUND=1; F_numformat_=0; fi
    # oaf= single option
    if [ "$arg" = "oaf=" ]; then FFOUND=1; F_oaf_=0; fi
    # regression= options
    if [ "$arg" = "regressionpath=" ]; then FFOUND=1; F_regression__regressionpath_=1; F_regression_=0; fi
    if [ "$arg" = "regressionx=" ]; then FFOUND=1; F_regression__regressionx_=1; F_regression_=0; fi
    if [ "$arg" = "regressionoptions=" ]; then FFOUND=1; F_regression__regressionoptions_=1; F_regression_=0; fi
    if [ "$arg" = "regressionforecast=" ]; then FFOUND=1; F_regression__regressionforecast_=1; F_regression_=0; fi
    # set= options
    if [ "$arg" = "setop=" ]; then FFOUND=1; F_set__setop_=1; F_set_=0; fi
    if [ "${arg#setop=union}" != "$arg" ]; then FFOUND=1; F_set__setop__setop_union=0; fi
    if [ "${arg#setop=diffa}" != "$arg" ]; then FFOUND=1; F_set__setop__setop_diffa=0; fi
    if [ "${arg#setop=diffb}" != "$arg" ]; then FFOUND=1; F_set__setop__setop_diffb=0; fi
    if [ "${arg#setop=diffab}" != "$arg" ]; then FFOUND=1; F_set__setop__setop_diffab=0; fi
    if [ "${arg#setop=intersect}" != "$arg" ]; then FFOUND=1; F_set__setop__setop_intersect=0; fi
    # removedups= single option
    if [ "$arg" = "removedups=" ]; then FFOUND=1; F_removedups_=0; fi
    # removeempty= single option
    if [ "$arg" = "removeempty=" ]; then FFOUND=1; F_removeempty_=0; fi
    # removenulls= single option
    if [ "$arg" = "removenulls=" ]; then FFOUND=1; F_removenulls_=0; fi
    # spacekeys= single option
    if [ "$arg" = "spacekeys=" ]; then FFOUND=1; F_spacekeys_=0; fi
    # searchkeys= single option
    if [ "$arg" = "searchkeys=" ]; then FFOUND=1; F_searchkeys_=0; fi
    # searchvalues= single option
    if [ "$arg" = "searchvalues=" ]; then FFOUND=1; F_searchvalues_=0; fi
    # sortmapkeys= single option
    if [ "$arg" = "sortmapkeys=" ]; then FFOUND=1; F_sortmapkeys_=0; fi
    # trim= single option
    if [ "$arg" = "trim=" ]; then FFOUND=1; F_trim_=0; fi
    # forcearray= single option
    if [ "$arg" = "forcearray=" ]; then FFOUND=1; F_forcearray_=0; fi
    # secKey= options
    if [ "$arg" = "secEnv=" ]; then FFOUND=1; F_secKey__secEnv_=1; F_secKey_=0; fi
    if [ "$arg" = "secFile=" ]; then FFOUND=1; F_secKey__secFile_=1; F_secKey_=0; fi
    if [ "$arg" = "secMainPass=" ]; then FFOUND=1; F_secKey__secMainPass_=1; F_secKey_=0; fi
    if [ "$arg" = "secPass=" ]; then FFOUND=1; F_secKey__secPass_=1; F_secKey_=0; fi
    if [ "$arg" = "secBucket=" ]; then FFOUND=1; F_secKey__secBucket_=1; F_secKey_=0; fi
    if [ "$arg" = "secRepo=" ]; then FFOUND=1; F_secKey__secRepo_=1; F_secKey_=0; fi
    # xjs= single option
    if [ "$arg" = "xjs=" ]; then FFOUND=1; F_xjs_=0; fi
    # xpy= single option
    if [ "$arg" = "xpy=" ]; then FFOUND=1; F_xpy_=0; fi
    # xfn= single option
    if [ "$arg" = "xfn=" ]; then FFOUND=1; F_xfn_=0; fi
    # xrjs= single option
    if [ "$arg" = "xrjs=" ]; then FFOUND=1; F_xrjs_=0; fi
    # xrpy= single option
    if [ "$arg" = "xrpy=" ]; then FFOUND=1; F_xrpy_=0; fi
    # xrfn= single option
    if [ "$arg" = "xrfn=" ]; then FFOUND=1; F_xrfn_=0; fi
    # val2icon= single option
    if [ "$arg" = "val2icon=" ]; then FFOUND=1; F_val2icon_=0; fi
  done
fi

# Print completion for in=
if [ $F_in_ -eq 1 ]; then
  echo "in=	The input type -if not provided it will try to be auto-detected-"
  
  echo "in=ask	Interactively asks questions to an user -using JSON/SLON for OpenAF's askStruct-"
  echo "in=base64	A base64 text input format"
  echo "in=ch	An OpenAF channel input format"
  echo "in=csv	A CSV format -auto-detected-"
  echo "in=dsv	A DSV -Delimiter Separated Values- format"
  echo "in=db	A JDBC query to a database"
  echo "in=gb64json	Equivalent to in=base64 and base64gzip=true"
  echo "in=hsperf	A Java hsperfdata* file -requires file=hsperfdata_user/123-"
  echo "in=ini	INI/Properties format"
  echo "in=javas	Tries to list java processes running locally"
  echo "in=javagc	A Java GC log text file format"
  echo "in=javathread	A Java thread dump text file format or java pid"
  echo "in=jfr	A Java Flight Recorder file format"
  echo "in=jmx	Uses Java JMX to retrieve data from another Java process"
  echo "in=json	A JSON format -auto-detected-"
  echo "in=jsonschema	Given a JSON schema format tries to generate sample data for it"
  echo "in=jwt	Decodes and/or verifies a JSON Web Token -JWT-"
  echo "in=lines	A given string/text to be processed line by line"
  echo "in=llm	A large language model input -uses 'llmenv' or 'llmoptions'-"
  echo "in=llmmodels	Lists the large language models available -using 'llmenv' or 'llmoptions'-"
  echo "in=ls	Returns a list of files and folders for a given directory path or zip or tar or tgz file"
  echo "in=md	A Markdown input format"
  echo "in=mdtable	A Markdown table format"
  echo "in=mdcode	A Markdown code blocks format"
  echo "in=ndjson	A NDJSON (new-line delimited JSON) format"
  echo "in=ndslon	A NDSLON (new-line delimited SLON) format"
  echo "in=oaf	Takes an OpenAF scripting code or OpenAF script file to execute and use the result as input"
  echo "in=oafp	Takes a JSON/SLON/YAML map input as parameters for calling a sub oafp process -arrays will call multiple oafp processes-"
  echo "in=ojob	Takes a JSON/SLON/YAML map input with a 'ojob' string and a 'args' map parameter"
  echo "in=openmetrics	An OpenMetrics/Prometheus compatible format"
  echo "in=raw	Passes the input directly to transforms and output"
  echo "in=rawhex	Tries to read the input char by char converting into lines with the hexadecimal representation"
  echo "in=sh	Executes a shell command returning stdout, stderr and exitcode as a map"
  echo "in=slon	A SLON format -auto-detected-"
  echo "in=sql	One or more SQLs statements to AST -Abstract Syntax Tree- or beautified SQL"
  echo "in=snmp	Retrieves data from a SNMP device"
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
  if [ $F_in__in_csv_incsv_ -eq 1 ]; then
    echo "incsv=	If in=csv, the CSV options to use"
  fi
fi
if [ $F_in__in_dsv -eq 1 ]; then
  if [ $F_in__in_dsv_indsvsep_ -eq 1 ]; then
    echo "indsvsep=	The separator to use for the DSV format -defaults to comma-"
  fi
  if [ $F_in__in_dsv_indsvsepre_ -eq 1 ]; then
    echo "indsvsepre=	The regular expression to use for the DSV format"
  fi
  if [ $F_in__in_dsv_indsvquote_ -eq 1 ]; then
    echo "indsvquote=	The quote character to use for the DSV format -defaults to double quote-"
  fi
  if [ $F_in__in_dsv_indsvescape_ -eq 1 ]; then
    echo "indsvescape=	The escape character to use for the DSV format -defaults to backslash -"
  fi
  if [ $F_in__in_dsv_indsvcomment_ -eq 1 ]; then
    echo "indsvcomment=	The comment character to use for the DSV format -defaults to pound-"
  fi
  if [ $F_in__in_dsv_indsvheader_ -eq 1 ]; then
    echo "indsvheader=	If true the first line will be considered as header -defaults to true-"
  fi
  if [ $F_in__in_dsv_indsvtrim_ -eq 1 ]; then
    echo "indsvtrim=	If true the values will be trimmed -defaults to true-"
  fi
  if [ $F_in__in_dsv_indsvjoin_ -eq 1 ]; then
    echo "indsvjoin=	If true will join the DSV records to build an output array"
  fi
  if [ $F_in__in_dsv_indsvfields_ -eq 1 ]; then
    echo "indsvfields=	Comma delimited list of fields to use for the DSV format -defaults to all fields-"
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
  if [ $F_in__in_db_indbstream_ -eq 1 ]; then
    echo "indbstream=	If true will stream the data instead of loading it all in memory"
  fi
  if [ $F_in__in_db_indbexec_ -eq 1 ]; then
    echo "indbexec=	If true the input SQL is not a query but a DML statement"
  fi
  if [ $F_in__in_db_indbautocommit_ -eq 1 ]; then
    echo "indbautocommit=	If true the input SQL will be executed with autocommit enabled"
  fi
  if [ $F_in__in_db_indbdesc_ -eq 1 ]; then
    echo "indbdesc=	If true, the output will be a list of column names and types. Use 'LIMIT 1' for faster results."
  fi
fi
if [ $F_in__in_javas -eq 1 ]; then
  if [ $F_in__in_javas_javasinception_ -eq 1 ]; then
    echo "javasinception=	If true will include also oafp itself"
  fi
fi
if [ $F_in__in_javagc -eq 1 ]; then
  if [ $F_in__in_javagc_javagcjoin_ -eq 1 ]; then
    echo "javagcjoin=	If true it will return an array with each processed line."
  fi
fi
if [ $F_in__in_javathread -eq 1 ]; then
  if [ $F_in__in_javathread_javathreadpid_ -eq 1 ]; then
    echo "javathreadpid=	The PID of the Java process to connect to -requires Java SDK-"
  fi
fi
if [ $F_in__in_jfr -eq 1 ]; then
  if [ $F_in__in_jfr_jfrjoin_ -eq 1 ]; then
    echo "jfrjoin=	If true it will return an array with each processed line."
  fi
  if [ $F_in__in_jfr_jfrdesc_ -eq 1 ]; then
    echo "jfrdesc=	If true it will include a __desc_ entry with the JFR event description"
  fi
fi
if [ $F_in__in_jmx -eq 1 ]; then
  if [ $F_in__in_jmx_jmxpid_ -eq 1 ]; then
    echo "jmxpid=	The PID of the Java process to connect to"
  fi
  if [ $F_in__in_jmx_jmxurl_ -eq 1 ]; then
    echo "jmxurl=	The JMX URL to connect to"
  fi
  if [ $F_in__in_jmx_jmxuser_ -eq 1 ]; then
    echo "jmxuser=	The JMX user to connect to"
  fi
  if [ $F_in__in_jmx_jmxpass_ -eq 1 ]; then
    echo "jmxpass=	The JMX password to connect to"
  fi
  if [ $F_in__in_jmx_jmxprovider_ -eq 1 ]; then
    echo "jmxprovider=	The JMX Java class provider to use"
  fi
  if [ $F_in__in_jmx_jmxop_ -eq 1 ]; then
    echo "jmxop=	The JMX operation to execute between 'all', 'domains', 'query' and 'get'"
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
  if [ $F_in__in_lines_linesvisualheadsep -eq 1 ]; then
    echo "linesvisualheadsep	If true will try to process the second line as header separator aiding on column position determination -if linesvisualsepre is not defined it will default to '\\s+'-"
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
if [ $F_in__in_mdtable -eq 1 ]; then
  if [ $F_in__in_mdtable_inmdtablejoin_ -eq 1 ]; then
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
if [ $F_in__in_ndslon -eq 1 ]; then
  if [ $F_in__in_ndslon_ndslonjoin_ -eq 1 ]; then
    echo "ndslonjoin=	If true will join the ndslon records to build an output array"
  fi
  if [ $F_in__in_ndslon_ndslonfilter_ -eq 1 ]; then
    echo "ndslonfilter=	If true each line is interpreted as an array before filters execute -this allows to filter slon records on a ndslon-"
  fi
fi
if [ $F_in__in_oafp -eq 1 ]; then
  if [ $F_in__in_oafp_inoafpseq_ -eq 1 ]; then
    echo "inoafpseq=	If true and if input is an array the oafp processes will be executed in sequence"
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
if [ $F_in__in_snmp -eq 1 ]; then
  if [ $F_in__in_snmp_insnmp_ -eq 1 ]; then
    echo "insnmp=	The SNMP address 'udp://1.2.3.4/161'"
  fi
  if [ $F_in__in_snmp_insnmpcommunity_ -eq 1 ]; then
    echo "insnmpcommunity=	The SNMP community"
  fi
  if [ $F_in__in_snmp_insnmpversion_ -eq 1 ]; then
    echo "insnmpversion=	The SNMP version -1, 2, 3-"
  fi
  if [ $F_in__in_snmp_insnmptimeout_ -eq 1 ]; then
    echo "insnmptimeout=	The SNMP timeout"
  fi
  if [ $F_in__in_snmp_insnmpretries_ -eq 1 ]; then
    echo "insnmpretries=	The SNMP retries"
  fi
  if [ $F_in__in_snmp_insnmpsec_ -eq 1 ]; then
    echo "insnmpsec=	JSON/SLON map with SNMPv3 security options"
  fi
fi
if [ $F_in__in_xls -eq 1 ]; then
  if [ $F_in__in_xls_inxlssheet_ -eq 1 ]; then
    echo "inxlssheet=	The name of sheet to consider -default to the first sheet-"
  fi
  if [ $F_in__in_xls_inxlsevalformulas_ -eq 1 ]; then
    echo "inxlsevalformulas=	If false the existing formulas won't be evaluated -defaults to true-"
  fi
  if [ $F_in__in_xls_inxlsdesc_ -eq 1 ]; then
    echo "inxlsdesc=	If true, instead of retrieving data, either a list of sheet names will be returned, or, if inxlssheet is provided, a table empty and non-empty will be returned"
  fi
  if [ $F_in__in_xls_inxlscol_ -eq 1 ]; then
    echo "inxlscol=	The column on the sheet where a table should be detected -e.g. "A"-"
  fi
  if [ $F_in__in_xls_inxlsrow_ -eq 1 ]; then
    echo "inxlsrow=	The row on the sheet where a table should be detected -e.g. 1-"
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
  echo "out=	The output format -default mtree-"
  
  echo "out=base64	A base64 text output format"
  echo "out=ch	An OpenAF channel output format"
  echo "out=chart	A line-chart like chart -usefull together with 'loop'-"
  echo "out=cjson	A JSON forcely colored format"
  echo "out=cmd	Executes a command for each input data entry"
  echo "out=cslon	A SLON format forcely colored"
  echo "out=csv	A CSV format -only for list outputs-"
  echo "out=dsv	A DSV -Delimiter Separated Values- format -only for list outputs-"
  echo "out=ctable	A table-like forcely colored format -only for list outputs-"
  echo "out=ctree	A tree-like forcely colored format"
  echo "out=mtree	A tree-like forcely monochrome format"
  echo "out=btree	A tree-like forcely with non-ansi characters format"
  echo "out=cyaml	An YAML colored format"
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
  echo "out=md	An output Markdown format"
  echo "out=mdtable	A Markdown table format -only for list outputs-"
  echo "out=mdyaml	A multi document YAML format -only for list outputs-"
  echo "out=ndjson	A NDJSON -new-line delimited JSON- format"
  echo "out=ndslon	A NDSLON -new-line delimited SLON- format"
  echo "out=ndcslon	A NDSLON -new-line delimited SLON- forcely colored"
  echo "out=oaf	Executes OpenAF scripting code or an OpenAF script file and receives -data- as input and outputs via -outoaf-"
  echo "out=openmetrics	Converts a map or list to OpenMetrics/Prometheus compatible format"
  echo "out=pjson	A JSON format with spacing -equivalent to prettyjson-"
  echo "out=prettyjson	A JSON format with spacing"
  echo "out=pxml	Tries to output the input data into pretty xml"
  echo "out=raw	Tries to output the internal representation -string or json- of the input transformed data"
  echo "out=rawascii	Outputs text data line by line with visual representation of non-visual characters"
  echo "out=schart	A static line-chart like chart -for a fixed list/array of values-"
  echo "out=slon	A SLON format"
  echo "out=sql	Outputs a series of SQL statements for an input list/array data"
  echo "out=stable	A table-like format with separation -only for list outputs-"
  echo "out=table	A table-like format without size constraints -only for list outputs-"
  echo "out=template	A Handlebars template format"
  echo "out=text	A string text format"
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
  if [ $F_out__out_cmd_outcmdtmpl_ -eq 1 ]; then
    echo "outcmdtmpl=	If true the input entry will be considered as an OpenAF template"
  fi
fi
if [ $F_out__out_csv -eq 1 ]; then
  if [ $F_out__out_csv_csv_ -eq 1 ]; then
    echo "csv=	If out=csv, the CSV options to use"
  fi
fi
if [ $F_out__out_dsv -eq 1 ]; then
  if [ $F_out__out_dsv_dsvsep_ -eq 1 ]; then
    echo "dsvsep=	The separator to use for the DSV format -defaults to comma-"
  fi
  if [ $F_out__out_dsv_dsvquote_ -eq 1 ]; then
    echo "dsvquote=	The quote character to use for the DSV format -defaults to double quote-"
  fi
  if [ $F_out__out_dsv_dsvfields_ -eq 1 ]; then
    echo "dsvfields=	Comma delimited list of fields to use for the DSV format -defaults to all fields-"
  fi
  if [ $F_out__out_dsv_dsvuseslon_ -eq 1 ]; then
    echo "dsvuseslon=	If true the output of value objects will be a SLON format -default is false-"
  fi
  if [ $F_out__out_dsv_dsvheader_ -eq 1 ]; then
    echo "dsvheader=	If true will try to output the first line as header -default is true-"
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
  if [ $F_out__out_envs_envsnoprefix_ -eq 1 ]; then
    echo "envsnoprefix=	Boolean flag to indicate that no envsprefix should be used -defaults to false-"
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
  if [ $F_out__out_html_htmldark_ -eq 1 ]; then
    echo "htmldark=	If supported and true the output html will use a dark theme."
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
if [ $F_out__out_oaf -eq 1 ]; then
  if [ $F_out__out_oaf_outoaf_ -eq 1 ]; then
    echo "outoaf=	The OpenAF script to execute scripting code or file path receiving -data- as input"
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
if [ $F_out__out_pxml -eq 1 ]; then
  if [ $F_out__out_pxml_pxmlprefix -eq 1 ]; then
    echo "pxmlprefix	A prefix added to all XML tags"
  fi
fi
if [ $F_out__out_rawascii -eq 1 ]; then
  if [ $F_out__out_rawascii_rawasciistart_ -eq 1 ]; then
    echo "rawasciistart=	Starting line number to display"
  fi
  if [ $F_out__out_rawascii_rawasciiend_ -eq 1 ]; then
    echo "rawasciiend=	Ending line number to display"
  fi
  if [ $F_out__out_rawascii_rawasciitab_ -eq 1 ]; then
    echo "rawasciitab=	Tab size for tab character visualization -defaults to 8-"
  fi
  if [ $F_out__out_rawascii_rawasciinovisual_ -eq 1 ]; then
    echo "rawasciinovisual=	If true, non-visual characters won't be replaced by their visual representation"
  fi
  if [ $F_out__out_rawascii_rawasciinolinenum_ -eq 1 ]; then
    echo "rawasciinolinenum=	If true, line numbers won't be displayed"
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
    echo "template=	A file path to a HandleBars' template or a string template definition if 'templatetmpl' is true"
  fi
  if [ $F_out__out_template_templatepath_ -eq 1 ]; then
    echo "templatepath=	If 'template' is not provided a path to the template definition -pre-transformation-"
  fi
  if [ $F_out__out_template_templatedata_ -eq 1 ]; then
    echo "templatedata=	If defined the template data will be retrieved from the provided path"
  fi
  if [ $F_out__out_template_templatetmpl_ -eq 1 ]; then
    echo "templatetmpl=	If true the 'template' will be interpreted as the template defintion instead of a file path"
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
if [ $F_out__out_xml -eq 1 ]; then
  if [ $F_out__out_xml_outxmlprefix -eq 1 ]; then
    echo "outxmlprefix	A prefix added to all XML tags"
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
# Print completion for pipe=
if [ $F_pipe_ -eq 1 ]; then
  echo "pipe=	A JSON/SLON/YAML map for recursive call of oafp similar to using unix pipes - useful with -f -"
  
fi
# Print completion for parallel=
if [ $F_parallel_ -eq 1 ]; then
  echo "parallel=	If true and input supports parallel processing it will try to process the input in parallel regardless of the input data order"
  
fi
# Print completion for -v
if [ $F__v -eq 1 ]; then
  echo "-v	Changes the input to a map with the tool's version info"
  
fi
# Print completion for -f
if [ $F__f -eq 1 ]; then
  echo "-f	A JSON/SLON/YAML file with all the oafp parameters as a map"
  
fi
# Print completion for allstrings=
if [ $F_allstrings_ -eq 1 ]; then
  echo "allstrings=	If true all fields will be converted to strings -useful for text processing-"
  
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
# Print completion for field2byte=
if [ $F_field2byte_ -eq 1 ]; then
  echo "field2byte=	A comma delimited list of fields whose value should be converted to a byte abbreviation"
  
fi
# Print completion for field2date=
if [ $F_field2date_ -eq 1 ]; then
  echo "field2date=	A comma delimited list of fields whose value should be converted to date values"
  
fi
# Print completion for field2si=
if [ $F_field2si_ -eq 1 ]; then
  echo "field2si=	A comma delimited list of fields whose value should be converted to a SI abbreviation"
  
fi
# Print completion for field2str=
if [ $F_field2str_ -eq 1 ]; then
  echo "field2str=	A comma delimited list of fields whose value should be converted to a string representation"
  
fi
# Print completion for field4map=
if [ $F_field4map_ -eq 1 ]; then
  echo "field4map=	A comma delimited list of fields whose value should be converted from JSON/SLON string representation to a map"
  
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
# Print completion for numformat=
if [ $F_numformat_ -eq 1 ]; then
  echo "numformat=	For all number values applies a java.util.Formatter format -e.g. %,d-"
  
fi
# Print completion for oaf=
if [ $F_oaf_ -eq 1 ]; then
  echo "oaf=	An OpenAF script to execute or a file path to an OpenAF script taking -data- as input and returning the transformed data"
  
fi
# Print completion for regression=
if [ $F_regression_ -eq 1 ]; then
  echo "regression=	Performs a regression -linear, log, exp, poly or power- over a provided list/array of numeric values"
  
  echo "regressionpath=	The path to the array of y values for the regression formulas"
  echo "regressionx=	Optional path to the array of x values for the regression formulas -defaults to 1, 2, 3, ...-"
  echo "regressionoptions=	A JSON/SLON configuration with order -defaults to 2- and/or precision -defaults to 5-"
  echo "regressionforecast=	Optional path to an array of x values for which to forecast the corresponding y"
fi
# Print completion for set=
if [ $F_set_ -eq 1 ]; then
  echo "set=	Performs set operations (intersection by default) over an 'a' and 'b' path to an array defined in a JSON/SLON map"
  
  echo "setop=	Allows to choose a different set operation between 'union', 'diffa', 'diffb', 'diffab' -symetric difference-, 'diff' and 'intersect' -default-"
fi
if [ $F_set__setop_ -eq 1 ]; then
  if [ $F_set__setop__setop_union -eq 1 ]; then
    echo "setop=union	Will return the union of the two sets"
  fi
  if [ $F_set__setop__setop_diffa -eq 1 ]; then
    echo "setop=diffa	Will return the difference between 'a' and 'b'"
  fi
  if [ $F_set__setop__setop_diffb -eq 1 ]; then
    echo "setop=diffb	Will return the difference between 'b' and 'a'"
  fi
  if [ $F_set__setop__setop_diffab -eq 1 ]; then
    echo "setop=diffab	Will return the symetric difference between 'a' and 'b'"
  fi
  if [ $F_set__setop__setop_intersect -eq 1 ]; then
    echo "setop=intersect	Will return the intersection of the two sets"
  fi
fi
# Print completion for removedups=
if [ $F_removedups_ -eq 1 ]; then
  echo "removedups=	If true will try to remove duplicates from an array"
  
fi
# Print completion for removeempty=
if [ $F_removeempty_ -eq 1 ]; then
  echo "removeempty=	If true will remove array/list entries that are either null or undefined"
  
fi
# Print completion for removenulls=
if [ $F_removenulls_ -eq 1 ]; then
  echo "removenulls=	If true will try to remove nulls and undefined values from a map or array"
  
fi
# Print completion for spacekeys=
if [ $F_spacekeys_ -eq 1 ]; then
  echo "spacekeys=	Replaces spaces in keys with the provided string -for example, helpful to xml output-"
  
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
# Print completion for forcearray=
if [ $F_forcearray_ -eq 1 ]; then
  echo "forcearray=	If true and if the input is map it will force it to be an array with that map as the only element"
  
fi
# Print completion for secKey=
if [ $F_secKey_ -eq 1 ]; then
  echo "secKey=	The mandatory sBucket bucket key to use"
  
  echo "secEnv=	A boolean flag to use environment variables as sBuckets"
  echo "secFile=	Optional sBucket file source"
  echo "secMainPass=	sBucket repository password"
  echo "secPass=	sBucket bucket password"
  echo "secBucket=	sBucket bucket name"
  echo "secRepo=	sBucket repository"
fi
# Print completion for xjs=
if [ $F_xjs_ -eq 1 ]; then
  echo "xjs=	A .js file with function code manipulating an input 'args'. Returns the transformed 'args' variable"
  
fi
# Print completion for xpy=
if [ $F_xpy_ -eq 1 ]; then
  echo "xpy=	A .py file with Python function code manipulating an input 'args'. Returns the transformed 'args' variable"
  
fi
# Print completion for xfn=
if [ $F_xfn_ -eq 1 ]; then
  echo "xfn=	A javascript code, receiving input as 'args' and return it's code evaluation"
  
fi
# Print completion for xrjs=
if [ $F_xrjs_ -eq 1 ]; then
  echo "xrjs=	A .js file with function code to manipulate each input array record as 'args'. Returns the transformed 'args' record"
  
fi
# Print completion for xrpy=
if [ $F_xrpy_ -eq 1 ]; then
  echo "xrpy=	A .py file with function code to manipulate each input array record as 'args'. Returns the transformed 'args' record"
  
fi
# Print completion for xrfn=
if [ $F_xrfn_ -eq 1 ]; then
  echo "xrfn=	A javascript code, receiving each input array record as 'args' and return it's code evaluation"
  
fi
# Print completion for val2icon=
if [ $F_val2icon_ -eq 1 ]; then
  echo "val2icon=	If defined will transform undefined, null and boolean values to emoticons -values can be 'default' or 'simple'-"
  
fi

# end
if [ $FFOUND -eq 0 ]; then
  echo :4
else
  echo :2
fi

