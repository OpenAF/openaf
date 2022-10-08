/*v:0.1.0;a:Nuno Aguiar*/
var nLinq_USE_CASE=!1,nLinq=function(h,l){$$(h).isMap()&&(l=_$(l,"aKey").isString().default("_key"),h=Object.keys(h).map(a=>{$$(h[a]).isMap()&&(h[a][l]=a);return h[a]}));var g=h,m="",d=nLinq_USE_CASE,f=!1,n=!1,t=0,x=0,A=!1,v=[],E=function(a,b){if(null===a||void 0===a||null===b||void 0===b)return a===b;if(a.constructor!==b.constructor)return!1;if(a instanceof Function||a instanceof RegExp)return a===b;if(a===b||a.valueOf()===b.valueOf())return!0;if(Array.isArray(a)&&a.length!==b.length||a instanceof
Date||!(a instanceof Object)||!(b instanceof Object))return!1;var e=Object.keys(a),k=Object.keys(b);if(e.length!=k.length)return!1;for(var r in a)if(e=a[r],$$(b[r]).isUnDef()||!E(e,b[r]))return!1;return!0},F=function(a,b,e){_$(a).isArray().$_();var k,r=!1;for(k=0;k<a.length&&!r;k++){var q=$$(e).isFunction()?e(a[k]):a[k];E(b,q)&&(r=!0)}return r?k-1:-1},z=function(a){if(!$$(a).isMap())return a;var b={};Object.keys(a).sort().forEach(e=>{b[e]=$$(a[e]).isMap()?z(a[e]):a[e]});return b},G=function(a,b){var e=
b.map(k=>JSON.stringify(z(k),void 0,""));return a.filter(k=>0>e.indexOf(JSON.stringify(z(k),void 0,"")))},H=function(a,b){var e=b.map(k=>JSON.stringify(z(k),void 0,""));return a.filter(k=>0<=e.indexOf(JSON.stringify(z(k),void 0,"")))},I=function(a,b){var e=a.map(k=>JSON.stringify(z(k),void 0,""));return a.concat(b.filter(k=>0>e.indexOf(JSON.stringify(z(k),void 0,""))))},J=function(a,b){return a.map(e=>b.map(k=>isMap(k)?merge(e,k):[e,k])).reduce((e,k)=>e.concat(k))},u=(a,b)=>{$$(a).isFunction()&&(a=
a());$$(a).isArray()||(a=[a]);if(!$$(a).isUnDef()){if(0==m.length){if(A)return[];0!=x&&(a=a.slice(x));return 0!=t?a.slice(0>t?t:0,0<t?t:void 0):a}m=m.replace(/;/g," ");var e=$$(b).isFunction()?b:new Function("r","whereFn","return $$(r).isDef() ? ("+m+") : void 0");g=0!=t?A?a.filter(k=>!e(k,v)).slice(0>t?t:0,0<t?t:void 0):a.filter(k=>e(k,v)).slice(0>t?t:0,0<t?t:void 0):A?a.filter(k=>!e(k,v)):a.filter(k=>e(k,v));0!=x&&(g=g.slice(x));return g}},K=a=>{if($$(a).isString()&&a.replace(/^[^a-zA-Z_$]|[^\w\[\]\.$]/g,
"")==a)return a;if($$(a).isDef())throw"'"+a+"' is not a valid key.";},D=a=>{$$(a).isNumber()||$$(a).isBoolean()||($$(a).isString()&&(a=d?a:a.toLowerCase()),a=JSON.stringify(a,void 0,""));return a},L=a=>{var b=(k,r,q)=>{var w=Object.keys(k);_$(r,"aFunc").isFunction().$_();q=_$(q).isString().default("");for(var y in w)$$(k[w[y]]).isMap()||$$(k[w[y]]).isArray()?b(k[w[y]],r,(""==q?"":q+".")+w[y]):r(w[y],k[w[y]],q,k)},e={};b(a,(k,r,q,w)=>{e[q+(""==q?"":".")+k]=r});return e},p=(a,b,e,k,r,q)=>{if($$(q).isUnDef()&&
$$(a).isMap()){var w=L(a);Object.keys(w).forEach(C=>{p(C,w[C],e,k)})}else{var y=!0;if(r){r=$$(q).isDef();var M=b;b=D(r?b:a);q=D(r?q:M)}else{r=$$(b).isDef();b=D(r?b:a);try{a=r?K(a):void 0}catch(C){if(0<String(C).indexOf("is not a valid key"))y=!1;else throw C;}}0<=e.indexOf("{ki}")&&(e=e.replace(/{ki}/g,$$(b).isString()&&!d?".toLowerCase()":""));0<=e.indexOf("{ski}")&&(e=e.replace(/{ski}/g,$$(b).isString()&&!d?"String(":""));0<=e.indexOf("{eki}")&&(e=e.replace(/{eki}/g,$$(b).isString()&&!d?").toLowerCase()":
""));e=r?e.replace(/{k}/g,y?"r."+a:"$$$$(r).get("+JSON.stringify(a)+")"):e.replace(/{k}/g,"r");$$(b).isString()&&(b=b.replace(/\$/g,"$$$"));$$(q).isDef()?($$(q).isString()&&(q=q.replace(/\$/g,"$$$")),q=D(q),e=e.replace(/{v}/g,b).replace(/{v2}/g,q)):e=e.replace(/{v}/g,b);B(e,k)}},B=(a,b)=>{b=_$(b).default(f);0<m.length&&(m=b?"("+m+") || ":m+" && ");m+="("+a+")"},c={_setState:a=>{_$(a,"map").isMap().$_();m=a.where;d=a.useCase;f=a.useOr;n=a.useNot;t=a.alimit;x=a.askip;A=a.negative;v=a.whereFn;return c},
_getState:()=>({where:m,useCase:d,useOr:f,useNot:n,alimit:t,askip:x,negative:A,whereFn:v}),useCase:a=>{d=$$(a).isUnDef()||a?!0:!1;return c},ignoreCase:a=>{d=$$(a).isUnDef()||a?!1:!0;return c},limit:a=>{$$(a).isNumber()&&(t=a);return c},head:a=>{c.limit(a);return c},tail:a=>{$$(a).isNumber()&&(t=-a);return c},or:()=>{f=!0;return c},and:()=>{f=!1;return c},not:()=>{n=!0;return c},andNot:()=>{f=!1;n=!0;return c},orNot:()=>{n=f=!0;return c},setWhere:a=>{B(a,!1);return c},where:a=>{f?n?c.orNotWhere(a):
c.orWhere(a):n?c.andNotWhere(a):c.andWhere(a);return c},orWhere:a=>{_$(a,"fn").isFunction().$_();v.push(a);B("whereFn["+(v.length-1)+"](r)",!0);return c},andWhere:a=>{_$(a,"fn").isFunction().$_();v.push(a);B("whereFn["+(v.length-1)+"](r)",!1);return c},notWhere:a=>{f?c.orNotWhere(a):c.andNotWhere(a);return c},andNotWhere:a=>{_$(a,"fn").isFunction().$_();v.push(a);B("!whereFn["+(v.length-1)+"](r)",!1);return c},orNotWhere:a=>{_$(a,"fn").isFunction().$_();v.push(a);B("!whereFn["+(v.length-1)+"](r)",
!0);return c},starts:(a,b)=>{f?n?c.orNotStarts(a,b):c.orStarts(a,b):n?c.andNotStarts(a,b):c.andStarts(a,b);return c},ends:(a,b)=>{f?n?c.orNotEnds(a,b):c.orEnds(a,b):n?c.andNotEnds(a,b):c.andEnds(a,b);return c},equals:(a,b)=>{f?n?c.orNotEquals(a,b):c.orEquals(a,b):n?c.andNotEquals(a,b):c.andEquals(a,b);return c},greater:(a,b)=>{f?n?c.orNotGreater(a,b):c.orGreater(a,b):n?c.andNotGreater(a,b):c.andGreater(a,b);return c},less:(a,b)=>{f?n?c.orNotLess(a,b):c.orLess(a,b):n?c.andNotLess(a,b):c.andLess(a,
b);return c},greaterEquals:(a,b)=>{f?n?c.orNotGreaterEquals(a,b):c.orGreaterEquals(a,b):n?c.andNotGreaterEquals(a,b):c.andGreaterEquals(a,b);return c},lessEquals:(a,b)=>{f?n?c.orNotLessEquals(a,b):c.orLessEquals(a,b):n?c.andNotLessEquals(a,b):c.andLessEquals(a,b);return c},contains:(a,b)=>{f?n?c.orNotContains(a,b):c.orContains(a,b):n?c.andNotContains(a,b):c.andContains(a,b);return c},empty:(a,b)=>{f?n?c.orNotEmpty(a,b):c.orEmpty(a,b):n?c.andNotEmpty(a,b):c.andEmpty(a,b);return c},match:(a,b)=>{f?
n?c.orNotMatch(a,b):c.orMatch(a,b):n?c.andNotMatch(a,b):c.andMatch(a,b);return c},type:(a,b)=>{f?n?c.orNotType(a,b):c.orType(a,b):n?c.andNotType(a,b):c.andType(a,b);return c},between:(a,b,e)=>{f?n?c.orNotBetween(a,b,e):c.orBetween(a,b,e):n?c.andNotBetween(a,b,e):c.andBetween(a,b,e);return c},betweenEquals:(a,b,e)=>{f?n?c.orNotBetweenEquals(a,b,e):c.orBetweenEquals(a,b,e):n?c.andNotBetweenEquals(a,b,e):c.andBetweenEquals(a,b,e);return c},is:a=>{f?n?c.orNotIs(a):c.orIs(a):n?c.andNotIs(a):c.andIs(a);
return c},andStarts:(a,b)=>{p(a,b,"String({k}){ki}.startsWith({v})",!1);return c},andEnds:(a,b)=>{p(a,b,"String({k}){ki}.endsWith({v})",!1);return c},andEquals:(a,b)=>{p(a,b,"{ski}{k}{eki} == {v}",!1);return c},andGreater:(a,b)=>{p(a,b,"{ski}{k}{eki} > {v}",!1);return c},andLess:(a,b)=>{p(a,b,"{ski}{k}{eki} < {v}",!1);return c},andGreaterEquals:(a,b)=>{p(a,b,"{ski}{k}{eki} >= {v}",!1);return c},andLessEquals:(a,b)=>{p(a,b,"{ski}{k}{eki} <= {v}",!1);return c},andContains:(a,b)=>{p(a,b,"String({k}){ki}.indexOf({v}) >= 0",
!1);return c},andEmpty:(a,b)=>{p(a,"","($$({k}).isUnDef() || String({k}){ki}.length == 0)",!1);return c},andMatch:(a,b)=>{p(a,b,"String({k}){ki}.match({v})",!1);return c},andType:(a,b)=>{p(a,b,"typeof {k} == {v}",!1);return c},andBetween:(a,b,e)=>{p(a,b,"({ski}{k}{eki} > {v} && {ski}{k}{eki} < {v2})",!1,!0,e);return c},andBetweenEquals:(a,b,e)=>{p(a,b,"({ski}{k}{eki} >= {v} && {ski}{k}{eki} <= {v2})",!1,!0,e);return c},andIs:a=>{p(a,"","{k} != null && {k}",!1);return c},notStarts:(a,b)=>{f?c.orNotStarts(a,
b):c.andNotStarts(a,b);return c},notEnds:(a,b)=>{f?c.orNotEnds(a,b):c.andNotEnds(a,b);return c},notEquals:(a,b)=>{f?c.orNotEquals(a,b):c.andNotEquals(a,b);return c},notGreater:(a,b)=>{f?c.orNotGreater(a,b):c.andNotGreater(a,b);return c},notLess:(a,b)=>{f?c.orNotLess(a,b):c.andNotLess(a,b);return c},notGreaterEquals:(a,b)=>{f?c.orNotGreaterEquals(a,b):c.andNotGreaterEquals(a,b);return c},notLessEquals:(a,b)=>{f?c.orNotLessEquals(a,b):c.andNotLessEquals(a,b);return c},notContains:(a,b)=>{f?c.orNotContains(a,
b):c.andNotContains(a,b);return c},notEmpty:(a,b)=>{f?c.orNotEmpty(a,b):c.andNotEmpty(a,b);return c},notMatch:(a,b)=>{f?c.orNotMatch(a,b):c.andNotMatch(a,b);return c},notType:(a,b)=>{f?c.orNotType(a,b):c.andNotType(a,b);return c},notBetween:(a,b,e)=>{f?c.orNotBetween(a,b,e):c.andNotBetween(a,b,e);return c},notBetweenEquals:(a,b,e)=>{f?c.orNotBetweenEquals(a,b,e):c.andNotBetweenEquals(a,b,e);return c},notIs:a=>{f?c.orNotIs(a):c.andNotIs(a);return c},andNotStarts:(a,b)=>{p(a,b,"!(String({k}){ki}.startsWith({v}))",
!1);return c},andNotEnds:(a,b)=>{p(a,b,"!(String({k}){ki}.endsWith({v}))",!1);return c},andNotEquals:(a,b)=>{p(a,b,"{ski}{k}{eki} != {v}",!1);return c},andNotGreater:(a,b)=>{p(a,b,"{ski}{k}{eki} <= {v}",!1);return c},andNotLess:(a,b)=>{p(a,b,"{ski}{k}{eki} >= {v}",!1);return c},andNotGreaterEquals:(a,b)=>{p(a,b,"{ski}{k}{eki} < {v}",!1);return c},andNotLessEquals:(a,b)=>{p(a,b,"{ski}{k}{eki} > {v}",!1);return c},andNotContains:(a,b)=>{p(a,b,"String({k}){ki}.indexOf({v}) < 0",!1);return c},andNotEmpty:(a,
b)=>{p(a,"","($$({k}).isDef() && String({k}){ki}.length != 0)",!1);return c},andNotMatch:(a,b)=>{p(a,b,"!(String({k}){ki}.match({v}))",!1);return c},andNotType:(a,b)=>{p(a,b,"typeof {k} != {v}",!1);return c},andNotBetween:(a,b,e)=>{p(a,b,"({ski}{k}{eki} < {v} || {ski}{k}{eki} > {v2})",!1,!0,e);return c},andNotBetweenEquals:(a,b,e)=>{p(a,b,"({ski}{k}{eki} <= {v} || {ski}{k}{eki} >= {v2})",!1,!0,e);return c},andNotIs:a=>{p(a,"","{k} == null || !({k})",!1);return c},orStarts:(a,b)=>{p(a,b,"String({k}){ki}.startsWith({v})",
!0);return c},orEnds:(a,b)=>{p(a,b,"String({k}){ki}.endsWith({v})",!0);return c},orEquals:(a,b)=>{p(a,b,"{ski}{k}{eki} == {v}",!0);return c},orGreater:(a,b)=>{p(a,b,"{ski}{k}{eki} > {v}",!0);return c},orLess:(a,b)=>{p(a,b,"{ski}{k}{eki} < {v}",!0);return c},orGreaterEquals:(a,b)=>{p(a,b,"{ski}{k}{eki} >= {v}",!0);return c},orLessEquals:(a,b)=>{p(a,b,"{ski}{k}{eki} <= {v}",!0);return c},orContains:(a,b)=>{p(a,b,"String({k}){ki}.indexOf({v}) >= 0",!0);return c},orEmpty:(a,b)=>{p(a,"","($$({k}).isUnDef() || String({k}){ki}.length == 0)",
!0);return c},orMatch:(a,b)=>{p(a,b,"String({k}){ki}.match({v})",!0);return c},orType:(a,b)=>{p(a,b,"typeof {k} == {v}",!0);return c},orBetween:(a,b,e)=>{p(a,b,"({ski}{k}{eki} > {v} && {ski}{k}{eki} < {v2})",!0,e);return c},orBetweenEquals:(a,b,e)=>{p(a,b,"({ski}{k}{eki} >= {v} && {ski}{k}{eki} <= {v2})",!0,e);return c},orIs:a=>{p(a,"","{k} != null && {k}",!0);return c},orNotStarts:(a,b)=>{p(a,b,"!(String({k}){ki}.startsWith({v}))",!0);return c},orNotEnds:(a,b)=>{p(a,b,"!(String({k}){ki}.endsWith({v}))",
!0);return c},orNotEquals:(a,b)=>{p(a,b,"{ski}{k}{eki} != {v}",!0);return c},orNotGreater:(a,b)=>{p(a,b,"{ski}{k}{eki} <= {v}",!0);return c},orNotLess:(a,b)=>{p(a,b,"{ski}{k}{eki} >= {v}",!0);return c},orNotGreaterEquals:(a,b)=>{p(a,b,"{ski}{k}{eki} < {v}",!0);return c},orNotLessEquals:(a,b)=>{p(a,b,"{ski}{k}{eki} > {v}",!0);return c},orNotContains:(a,b)=>{p(a,b,"String({k}){ki}.indexOf({v}) < 0",!0);return c},orNotEmpty:(a,b)=>{p(a,"","($$({k}).isDef() && String({k}){ki}.length != 0)",!0);return c},
orNotMatch:(a,b)=>{p(a,b,"!(String({k}){ki}.match({v}))",!0);return c},orNotType:(a,b)=>{p(a,b,"typeof {k} != {v}",!0);return c},orNotBetween:(a,b,e)=>{p(a,b,"({ski}{k}{eki} < {v} || {ski}{k}{eki} > {v2})",!1,!0,e);return c},orNotBetweenEquals:(a,b,e)=>{p(a,b,"({ski}{k}{eki} <= {v} || {ski}{k}{eki} >= {v2})",!1,!0,e);return c},orNotIs:a=>{p(a,"","{k} == null || !({k})",!0);return c},min:a=>{a=_$(a).isString().default(void 0);var b;c.select(e=>{var k=$$(a).isDef()?Number($$(e).get(a)):Number(e);null!=
k&&$$(k).isNumber()&&($$(b).isUnDef()?b=e:($$(a).isDef()&&$$(b).get(a)>k&&(b=e),$$(a).isUnDef()&&b>k&&(b=e)))});return b},max:a=>{a=_$(a).isString().default(void 0);var b;c.select(e=>{var k=$$(a).isDef()?Number($$(e).get(a)):Number(e);null!=k&&$$(k).isNumber()&&($$(b).isUnDef()?b=e:($$(a).isDef()&&$$(b).get(a)<k&&(b=e),$$(a).isUnDef()&&b<k&&(b=e)))});return b},average:a=>{a=_$(a).isString().default(void 0);var b=0,e=0;c.select(k=>{k=$$(a).isDef()?Number($$(k).get(a)):Number(k);null!=k&&$$(k).isNumber()&&
(e++,b+=k)});return 0<e?b/e:void 0},sum:a=>{a=_$(a).isString().default(void 0);var b=0;c.select(e=>{e=$$(a).isDef()?Number($$(e).get(a)):Number(e);null!=e&&$$(e).isNumber()&&(b+=e)});return b},distinct:a=>{a=_$(a).isString().default(void 0);var b=[];c.select(e=>{e=$$(a).isDef()?$$(e).get(a):e;0>b.indexOf(e)&&b.push(e)});return b},group:a=>{a=_$(a).isString().default(void 0);var b={};c.select(e=>{var k=$$(a).isDef()?$$(e).get(a):e;$$(k).isBoolean()&&(k=String(k));0>Object.keys(b).indexOf(k)?b[k]=[e]:
b[k].push(e)});return b},at:a=>{_$(a,"index").isNumber().$_();g=u(g);return g[Number(a)]},all:a=>{g=u(g);return $$(g).isArray()?g.length==h.length:a},count:()=>{g=u(g);return g.length},first:a=>{g=u(g);return 0<g.length?g[0]:a},last:a=>{g=u(g);return 0<g.length?g[g.length-1]:a},any:()=>{g=u(g);return 0<g.length},none:()=>{g=u(g);return 0==g.length},reverse:()=>{g=u(g);return g.reverse()},each:a=>{_$(a,"each function").isFunction().$_();c.select(a);return c},intersect:a=>{_$(a,"intersect param").isArray().$_();
g=u(g);g=H(g,a);return c},except:a=>{_$(a,"except param").isArray().$_();g=u(g);g=G(g,a);return c},union:a=>{_$(a,"union param").isArray().$_();g=u(g);g=I(g,a);return c},cartesian:a=>{_$(a,"cartesian param").isArray().$_();g=u(g);g=J(g,a);return c},attach:(a,b)=>{_$(a,"key").$_();_$(b,"value").$_();g=u(g);g=$$(b).isFunction()?g.map(e=>{$$(e).set(a,b(e));return e}):g.map(e=>{$$(e).set(a,b);return e});return c},filter:a=>{_$(a,"value").$_();g=u(g);g=g.filter(b=>{var e=!0;$$(a).isMap()&&$$(b).isMap()&&
Object.keys(a).forEach(k=>{E(a[k],b[k])||(e=!1)});$$(b).isArray()&&0>F(b,a)&&(e=!1);$$(a).isFunction()&&!a(b)&&(e=!1);($$(a).isNumber()||$$(a).isString())&&($$(b).isNumber()||$$(b).isString())&&b!=a&&(e=!1);return e});return c},sort:function(){var a="";g=u(g);for(var b=0;b<arguments.length;b++){var e=arguments[b],k=!1;e.startsWith("-")&&(k=!0,e=e.substr(1,e.length-1));a=0<a.length?a+" || ":"return ";a=k?a+(' ($$(a).get("'+e+'") > $$(b).get("'+e+'") ? -1 : ($$(a).get("'+e+'") < $$(b).get("'+e+'") ? 1 : 0)) '):
a+(' ($$(a).get("'+e+'") > $$(b).get("'+e+'") ? 1 : ($$(a).get("'+e+'") < $$(b).get("'+e+'") ? -1 : 0)) ')}g=g.sort(new Function("a","b",a));return c},assign:(a,b,e,k,r)=>{g=u(g);g.forEach(q=>{q[b]=nLinq(a).equals(k,$$(q).get(e)).first(r)});return c},join:(a,b,e,k)=>{g=u(g);g.forEach(r=>{r[b]=nLinq(a).equals(k,$$(r).get(e)).select()});return c},skip:a=>{_$(a).isNumber().$_();x=a;return c},skipWhile:a=>{_$(a,"skip function").isFunction().$_();c.notWhere(a);return c},takeWhile:a=>{_$(a,"take function").isFunction().$_();
c.where(a);return c},take:a=>{_$(a).isNumber().$_();return c.limit(a)},skipTake:(a,b)=>{_$(a).isNumber().$_();return c.skip(a).take(b)},apply:a=>{a=_$(a,"aMap").isMap().default({});a.where=_$(a.where,"where").isArray().default([]);a.select=_$(a.select,"select").default(void 0);a.transform=_$(a.transform,"transform").isArray().default([]);a.selector=_$(a.selector,"selector").isMap().default(void 0);a.where.forEach(e=>{$$(e.cond).isString()&&(c=c[e.cond].apply(c,e.args))});a.transform.forEach(e=>{$$(e.func).isString()&&
(c=c[e.func].apply(c,e.args))});var b;$$(a.select).isString()&&(b=c.tselect(new Function("elem","index","array",a.select)));$$(a.select).isMap()&&(b=c.select(a.select));$$(b).isUnDef()&&$$(a.selector).isMap()&&(b=$$(a.selector.func).isString()?$$({}).set(a.selector.func,c[a.selector.func].apply(c,a.selector.args)):b);$$(b).isUnDef()&&$$(a.select).isUnDef()&&(b=c.select());return b},select:a=>{g=u(g);if($$(a).isUnDef())return g;if($$(a).isFunction())return g.map(a);if($$(a).isArray()){var b={};a.forEach(k=>
{$$(k).isString()&&$$(b).set(k,void 0)})}if($$(a).isMap()){var e=Object.keys(a);return g.map(k=>{var r={};e.forEach(q=>{$$($$(k).get(q)).isDef()?$$(r).set(q,$$(k).get(q)):$$(r).set(q,$$(a).get(q))});return r})}},mselect:(a,b,e)=>{a=c.select(a);b=_$(b,"aKey").isString().default("_key");e=_$(e,"dontRemove").isBoolean().default(!0);var k={},r;for(r in a){var q=a[r];if($$(b).isDef()&&$$(q[b]).isDef()){var w=q[b];k[w]=q;e||delete k[w][b]}else k["row"+r]=q}return k},define:a=>{g=c.select(a);return c},removed:a=>
{A=!0;g=c.select(a);return c},stream:a=>{var b=0<t?t:1;a=c.streamFn(a);do a(),0<t&&b--;while($$(g).isDef()&&0<b)},streamFn:a=>()=>{var b=c.select(a);g=$$(h).isFunction()?h():h;return b},query:a=>{a=_$(a,"aMap").isMap().default({});a.where=_$(a.where,"where").isArray().default([]);a.select=_$(a.select,"select").default(void 0);a.transform=_$(a.transform,"transform").isArray().default([]);a.selector=_$(a.selector,"selector").isMap().default(void 0);a.where.forEach(e=>{$$(e.cond).isString()&&(c=c[e.cond].apply(c,
e.args))});a.transform.forEach(e=>{$$(e.func).isString()&&(c=c[e.func].apply(c,e.args))});var b;$$(a.select).isString()&&(b=c.tselect(newFn("elem","index","array",a.select)));$$(a.select).isMap()&&(b=c.select(a.select));$$(b).isUnDef()&&$$(a.selector).isMap()&&(b=$$(a.selector.func).isString()?c[a.selector.func].apply(c,a.selector.args):b);$$(b).isUnDef()&&$$(a.select).isUnDef()&&(b=c.select());return b}};return c},$from=nLinq;
const $$=function(h){return{get:l=>{if($$(h).isObject()){l=l.replace(/\[(\w+)\]/g,".$1");l=l.replace(/^\./,"");l=l.split(".");for(var g=0,m=l.length;g<m;++g){var d=l[g];if(d in h)h=h[d];else return}return h}},getI:l=>{if($$(h).isObject()){l=l.replace(/\[(\w+)\]/g,".$1");l=l.replace(/^\./,"");l=l.split(".");for(var g=0,m=l.length;g<m;++g){var d=l[g];if($$(h).isMap()){var f={};d=String(d).toUpperCase();Object.keys(h).forEach(n=>f[n.toUpperCase()]=n);if(d in f)h=h[f[d]];else return}else if(d in h)h=
h[d];else return}return h}},set:(l,g)=>{if($$(h).isObject()){var m=h;l=l.replace(/\[(\w+)\]/g,".$1");l=l.replace(/^\./,"");l=l.split(".");for(var d,f,n=0,t=l.length;n<t;++n){var x=l[n];d=h;f=x;x in h||(h[x]={});h=h[x]}d[f]=g;return m}},isDef:()=>"undefined"!=typeof h?!0:!1,isUnDef:()=>"undefined"==typeof h?!0:!1,isArray:()=>Array.isArray(h),isMap:()=>"[object Object]"==Object.prototype.toString.call(h),isObject:()=>{var l=typeof h;return"function"===l||"object"===l&&!!h},isFunction:()=>"function"==
typeof h||!1,isString:()=>"string"==typeof h||!1,isNumber:()=>!isNaN(parseFloat(h))&&isFinite(h),isTNumber:()=>"number"==typeof h||!1,isBoolean:()=>"boolean"==typeof h||!1,isNull:()=>null==h||!1,isDate:()=>null!=h&&!isNaN(h)&&"undefined"!==typeof h.getDate,isRegExp:()=>h instanceof RegExp,isUUID:()=>h.match(/^\b[0-9a-f]{8}\b-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-\b[0-9a-f]{12}\b$/)?!0:!1,isSchema:(l,g)=>{if("undefined"==typeof Ajv)if("undefined"!=typeof loadAjv)loadAjv();else throw"Ajv library not loaded.";
ow.loadObj();return ow.obj.schemaValidate(l,h,g)}}},_$=function(h,l){l=$$(l).isDef()?l+" ":"";var g=$$(h).isDef()?!0:!1;const m={default:d=>g?h:d,$_:d=>{$$(d).isUnDef()&&(d=l+"not defined or assigned");if(!g)throw d;return h},isNumber:d=>{$$(d).isUnDef()&&(d=l+"is not a number");if(g&&!$$(h).isNumber())throw d;return m},toNumber:d=>{$$(d).isUnDef()&&(d=l+"can't be converted to number");if(g)try{h=Number(h)}catch(f){throw d;}return m},isTNumber:d=>{$$(d).isUnDef()&&(d=l+"is not a number type");if(g&&
!$$(h).isTNumber())throw d;return m},isString:d=>{$$(d).isUnDef()&&(d=l+"is not a string");if(g&&!$$(h).isString())throw d;return m},toString:d=>{$$(d).isUnDef()&&(d=l+"can't be converted to string");if(g)try{h=String(h)}catch(f){throw d;}return m},isBoolean:d=>{$$(d).isUnDef()&&(d=l+"is not boolean");if(g&&"boolean"!==typeof h)throw d;return m},toBoolean:d=>{$$(d).isUnDef()&&(d=l+"can't be converted to a boolean");if(g)try{$$(h).isNumber()&&(h=!!h),$$(h).isString()&&(h="true"==h.trim().toLowerCase())}catch(f){throw d;
}return m},isArray:d=>{$$(d).isUnDef()&&(d=l+"is not an array");if(g&&!$$(h).isArray())throw d;return m},toArray:d=>{$$(d).isUnDef()&&(d=l+"can't be converted to an array");if(g)try{h=String(h).split(",").map(f=>f.trim())}catch(f){throw d;}return m},isMap:d=>{$$(d).isUnDef()&&(d=l+"is not a map");if(g&&!$$(h).isMap())throw d;return m},toMap:d=>{$$(d).isUnDef()&&(d=l+"can't be converted to a map");if(g)try{var f=h;h=$$(global.jsonParse).isFunction()?global.jsonParse(f,!0):JSON.parse(f)}catch(n){throw d;
}return m},isObject:d=>{$$(d).isUnDef()&&(d=l+"is not an object");if(g&&!$$(h).isObject())throw d;return m},isDate:d=>{$$(d).isUnDef()&&(d=l+"is not a date");if(g&&!$$(h).isDate())throw d;return m},toDate:d=>{$$(d).isUnDef()&&(d=l+"can't be converted to date");if(g)try{h=new Date(h)}catch(f){throw d;}return m},isRegExp:d=>{$$(d).isUnDef()&&(d=l+"is not a RegExp");if(g&&!$$(h).isRegExp())throw d;return m},isFunction:d=>{$$(d).isUnDef()&&(d=l+"is not a function");if(g&&!$$(h).isFunction())throw d;return m},
isJavaObject:d=>{$$(d).isUnDef()&&(d=l+"is not a java object");if(g&&!isJavaObject(h))throw d;return m},isInstanceOf:(d,f)=>{$$(f).isUnDef()&&(f=l+"is not an instance of "+d);if(g&&!(h instanceof d))throw f;return m},isNotNull:d=>{$$(d).isUnDef()&&(d=l+"is null");if(g&&null==h)throw d;return m},isUUID:d=>{$$(d).isUnDef()&&(d=l+"is not an UUID");if(g&&(!$$(h).isString()||h.match(/^\b[0-9a-f]{8}\b-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-\b[0-9a-f]{12}\b$/)))throw d;return m},isSchema:(d,f,n)=>{if("undefined"==
typeof Ajv)if("undefined"!=typeof loadAjv)loadAjv();else throw"Ajv library not loaded.";ow.loadObj();try{ow.obj.schemaValidate(d,h,n)}catch(t){throw $$(f).isUnDef()&&(f=l+" "+String(t)),f;}return m},check:(d,f)=>{if(!$$(d).isFunction()&&!$$(d).isString())throw"please provide a function to check";d=$$(d).isFunction()?d(h):newFn("v","return "+d)(h);$$(f).isUnDef()&&(f=l+"is not ok");if(g&&!d)throw f;return m},expr:(d,f)=>{if(!$$(d).isString())throw"please provide an expression";d=af.eval(templify(d,
{v:h}));$$(f).isUnDef()&&(f=l+"is not ok");if(g&&!d)throw f;return m},equals:(d,f)=>{$$(f).isUnDef()&&(f=l+"is equals to "+d);if(g&&h==d)throw f;return m},notEquals:(d,f)=>{$$(f).isUnDef()&&(f=l+"is not equals to "+d);if(g&&h!=d)throw f;return m},anyOf:(d,f)=>{if(!$$(d).isArray())throw"please provide an array of values";$$(f).isUnDef()&&(f=l+"has a value not in "+JSON.stringify(d));g&&$$(h).isArray()&&h.forEach(n=>{if(0>d.indexOf(n))throw f;});return m},oneOf:(d,f)=>{if(!$$(d).isArray())throw"please provide an array of values";
$$(f).isUnDef()&&(f=l+"is not one of "+JSON.stringify(d));if(g&&!$$(h).isArray()&&0>d.indexOf(h))throw f;return m},between:(d,f,n)=>{$$(n).isUnDef()&&(n=l+"is not between "+d+" and "+f);if(g&&(h>=f||h<=d))throw n;},betweenEquals:(d,f,n)=>{$$(n).isUnDef()&&(n=l+"is not between "+d+" and "+f);if(g&&(h>f||h<d))throw n;},less:(d,f)=>{$$(f).isUnDef()&&(f=l+"is less than "+d);if(g&&h>=d)throw f;return m},lessEquals:(d,f)=>{$$(f).isUnDef()&&(f=l+"is less or equals than "+d);if(g&&h>d)throw f;return m},greater:(d,
f)=>{$$(f).isUnDef()&&(f=l+"is greater than "+d);if(g&&h<=d)throw f;return m},greaterEquals:(d,f)=>{$$(f).isUnDef()&&(f=l+"is greater or equals than "+d);if(g&&h<d)throw f;return m},notEmpty:d=>{$$(d).isUnDef()&&(d=l+"is empty");if(g&&""==String(h))throw d;return m},empty:d=>{$$(d).isUnDef()&&(d=l+"is not empty");if(g&&""!=String(h))throw d;return m},contains:(d,f)=>{if(!$$(d).isString())throw"please provide a string to check if contains";$$(f).isUnDef()&&(f=l+"doesn't contain "+d);if(g&&0>String(h).indexOf(d))throw f;
return m},notContains:(d,f)=>{if(!$$(d).isString())throw"please provide a string to check if not contains";$$(f).isUnDef()&&(f=l+"contains "+d);if(g&&0<=String(h).indexOf(d))throw f;return m},starts:(d,f)=>{if(!$$(d).isString())throw"please provide a string to check if it starts with";$$(f).isUnDef()&&(f=l+"doesn't start with '"+d+"'");if(g&&!h.startsWith(aValu))throw f;return m},ends:(d,f)=>{if(!$$(d).isString())throw"please provide a string to check if it ends with";$$(f).isUnDef()&&(f=l+"doesn't end with '"+
d+"'");if(g&&!h.endsWith(d))throw f;return m},notStarts:(d,f)=>{if(!$$(d).isString())throw"please provide a string to check if it not starts with";$$(f).isUnDef()&&(f=l+"starts with '"+d+"'");if(g&&h.startsWith(aValu))throw f;return m},notEnds:(d,f)=>{if(!$$(d).isString())throw"please provide a string to check if it not ends with";$$(f).isUnDef()&&(f=l+"ends with '"+d+"'");if(g&&h.endsWith(d))throw f;return m},regexp:(d,f)=>{$$(f).isUnDef()&&(f=l+"doesn't match '"+d+"'");if(!(d instanceof RegExp))throw"is not a regular expression ("+
d+")";if(g&&!d.test(h))throw f;return m},javaRegexp:(d,f,n)=>{if($$(d).isUnDef()||!$$(d).isString())throw"please provide a regular expression string";$$(n).isUnDef()&&(n=l+"doesn't match '"+d+"'");if(g&&!javaRegExp(h).test(d,f))throw n;return m}};return m};