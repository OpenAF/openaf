/*
_comments - Bool; [optional];
                Set this flag to true to prevent removing comments from @text ( minxml and mincss functions only. )

   Examples:
        vkbeautify.xml(text); // pretty print XML
        vkbeautify.json(text, 4 ); // pretty print JSON
        vkbeautify.css(text, '. . . .'); // pretty print CSS
        vkbeautify.sql(text, '----'); // pretty print SQL

        vkbeautify.xmlmin(text, true);// minify XML, preserve comments
        vkbeautify.jsonmin(text);// minify JSON
        vkbeautify.cssmin(text);// minify CSS, remove comments ( default )
        vkbeautify.sqlmin(text);// minify SQL

*/
function createShiftArr(b){var a="    ";if(isNaN(parseInt(b)))a=b;else switch(b){case 1:a=" ";break;case 2:a="  ";break;case 3:a="   ";break;case 4:a="    ";break;case 5:a="     ";break;case 6:a="      ";break;case 7:a="       ";break;case 8:a="        ";break;case 9:a="         ";break;case 10:a="          ";break;case 11:a="           ";break;case 12:a="            "}b=["\n"];for(ix=0;100>ix;ix++)b.push(b[ix]+a);return b}
function vkbeautify(){this.step="    ";this.shift=createShiftArr(this.step)}
vkbeautify.prototype.xml=function(b,a){b=b.replace(/>\s{0,}</g,"><").replace(/</g,"~::~<").replace(/\s*xmlns\:/g,"~::~xmlns:").replace(/\s*xmlns\=/g,"~::~xmlns=").split("~::~");var g=b.length,c=!1,e=0,d="",f=a?createShiftArr(a):this.shift;for(a=0;a<g;a++)if(-1<b[a].search(/<!/)){if(d+=f[e]+b[a],c=!0,-1<b[a].search(/--\x3e/)||-1<b[a].search(/\]>/)||-1<b[a].search(/!DOCTYPE/))c=!1}else-1<b[a].search(/--\x3e/)||-1<b[a].search(/\]>/)?(d+=b[a],c=!1):/^<\w/.exec(b[a-1])&&/^<\/\w/.exec(b[a])&&/^<[\w:\-\.\,]+/.exec(b[a-
1])==/^<\/[\w:\-\.\,]+/.exec(b[a])[0].replace("/","")?(d+=b[a],c||e--):d=-1<b[a].search(/<\w/)&&-1==b[a].search(/<\//)&&-1==b[a].search(/\/>/)?c?d+=b[a]:d+=f[e++]+b[a]:-1<b[a].search(/<\w/)&&-1<b[a].search(/<\//)?c?d+=b[a]:d+=f[e]+b[a]:-1<b[a].search(/<\//)?c?d+=b[a]:d+=f[--e]+b[a]:-1<b[a].search(/\/>/)?c?d+=b[a]:d+=f[e]+b[a]:-1<b[a].search(/<\?/)?d+(f[e]+b[a]):-1<b[a].search(/xmlns\:/)||-1<b[a].search(/xmlns\=/)?d+(f[e]+b[a]):d+b[a];return"\n"==d[0]?d.slice(1):d};
vkbeautify.prototype.json=function(b,a){a=a?a:this.step;return"undefined"===typeof JSON?b:"string"===typeof b?JSON.stringify(JSON.parse(b),null,a):"object"===typeof b?JSON.stringify(b,null,a):b};
vkbeautify.prototype.css=function(b,a){b=b.replace(/\s{1,}/g," ").replace(/\{/g,"{~::~").replace(/\}/g,"~::~}~::~").replace(/\;/g,";~::~").replace(/\/\*/g,"~::~/*").replace(/\*\//g,"*/~::~").replace(/~::~\s{0,}~::~/g,"~::~").split("~::~");var g=b.length,c=0,e="",d=a?createShiftArr(a):this.shift;for(a=0;a<g;a++)/\{/.exec(b[a])?e+=d[c++]+b[a]:/\}/.exec(b[a])?e+=d[--c]+b[a]:(/\*\\/.exec(b[a]),e+=d[c]+b[a]);return e.replace(/^\n{1,}/,"")};
function isSubquery(b,a){return a-(b.replace(/\(/g,"").length-b.replace(/\)/g,"").length)}
function split_sql(b,a){return b.replace(/\s{1,}/g," ").replace(/ AND /ig,"~::~"+a+a+"AND ").replace(/ BETWEEN /ig,"~::~"+a+"BETWEEN ").replace(/ CASE /ig,"~::~"+a+"CASE ").replace(/ ELSE /ig,"~::~"+a+"ELSE ").replace(/ END /ig,"~::~"+a+"END ").replace(/ FROM /ig,"~::~FROM ").replace(/ GROUP\s{1,}BY/ig,"~::~GROUP BY ").replace(/ HAVING /ig,"~::~HAVING ").replace(/ IN /ig," IN ").replace(/ JOIN /ig,"~::~JOIN ").replace(/ CROSS~::~{1,}JOIN /ig,"~::~CROSS JOIN ").replace(/ INNER~::~{1,}JOIN /ig,"~::~INNER JOIN ").replace(/ LEFT~::~{1,}JOIN /ig,
"~::~LEFT JOIN ").replace(/ RIGHT~::~{1,}JOIN /ig,"~::~RIGHT JOIN ").replace(/ ON /ig,"~::~"+a+"ON ").replace(/ OR /ig,"~::~"+a+a+"OR ").replace(/ ORDER\s{1,}BY/ig,"~::~ORDER BY ").replace(/ OVER /ig,"~::~"+a+"OVER ").replace(/\(\s{0,}SELECT /ig,"~::~(SELECT ").replace(/\)\s{0,}SELECT /ig,")~::~SELECT ").replace(/ THEN /ig," THEN~::~"+a+"").replace(/ UNION /ig,"~::~UNION~::~").replace(/ USING /ig,"~::~USING ").replace(/ WHEN /ig,"~::~"+a+"WHEN ").replace(/ WHERE /ig,"~::~WHERE ").replace(/ WITH /ig,
"~::~WITH ").replace(/ ALL /ig," ALL ").replace(/ AS /ig," AS ").replace(/ ASC /ig," ASC ").replace(/ DESC /ig," DESC ").replace(/ DISTINCT /ig," DISTINCT ").replace(/ EXISTS /ig," EXISTS ").replace(/ NOT /ig," NOT ").replace(/ NULL /ig," NULL ").replace(/ LIKE /ig," LIKE ").replace(/\s{0,}SELECT /ig,"SELECT ").replace(/\s{0,}UPDATE /ig,"UPDATE ").replace(/ SET /ig," SET ").replace(/~::~{1,}/g,"~::~").split("~::~")}
vkbeautify.prototype.sql=function(b,a){b=b.replace(/\s{1,}/g," ").replace(/\'/ig,"~::~'").split("~::~");var g=b.length,c=[],e=0,d=this.step,f=0,h="",k=a?createShiftArr(a):this.shift;for(a=0;a<g;a++)c=a%2?c.concat(b[a]):c.concat(split_sql(b[a],d));g=c.length;for(a=0;a<g;a++)f=isSubquery(c[a],f),/\s{0,}\s{0,}SELECT\s{0,}/.exec(c[a])&&(c[a]=c[a].replace(/\,/g,",\n"+d+d+"")),/\s{0,}\s{0,}SET\s{0,}/.exec(c[a])&&(c[a]=c[a].replace(/\,/g,",\n"+d+d+"")),/\s{0,}\(\s{0,}SELECT\s{0,}/.exec(c[a])?(e++,h+=k[e]+
c[a]):/\'/.exec(c[a])?(1>f&&e&&e--,h+=c[a]):(h+=k[e]+c[a],1>f&&e&&e--);return h=h.replace(/^\n{1,}/,"").replace(/\n{1,}/g,"\n")};vkbeautify.prototype.xmlmin=function(b,a){return(a?b:b.replace(/\<![ \r\n\t]*(--([^\-]|[\r\n]|-[^\-])*--[ \r\n\t]*)\>/g,"").replace(/[ \r\n\t]{1,}xmlns/g," xmlns")).replace(/>\s{0,}</g,"><")};vkbeautify.prototype.jsonmin=function(b){return"undefined"===typeof JSON?b:JSON.stringify(JSON.parse(b),null,0)};
vkbeautify.prototype.cssmin=function(b,a){return(a?b:b.replace(/\/\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*+\//g,"")).replace(/\s{1,}/g," ").replace(/\{\s{1,}/g,"{").replace(/\}\s{1,}/g,"}").replace(/\;\s{1,}/g,";").replace(/\/\*\s{1,}/g,"/*").replace(/\*\/\s{1,}/g,"*/")};vkbeautify.prototype.sqlmin=function(b){return b.replace(/\s{1,}/g," ").replace(/\s{1,}\(/,"(").replace(/\s{1,}\)/,")")};beautify=new vkbeautify;
