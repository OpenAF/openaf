// Opt-in real renderer smoke test. Run under an external process timeout.
// OPENAF_DESKTOP_PROVIDER_ROOT=/path/plugin-DesktopJavaFX OPENAF_DESKTOP_JAVA=/path/java21 openaf -f tests/desktop-view-javafx.js
var root = String(java.lang.System.getenv("OPENAF_DESKTOP_PROVIDER_ROOT") || getOPackPath("plugin-DesktopJavaFX") || "");
var helperJava = String(java.lang.System.getenv("OPENAF_DESKTOP_JAVA") || java.lang.System.getProperty("java.home") + "/bin/java");
if (!root) throw new Error("Install plugin-DesktopJavaFX or set OPENAF_DESKTOP_PROVIDER_ROOT");
ow.loadDesktop({provider:"javafx",providerOptions:{javafx:{java:helperJava}}});
// Explicit registration permits testing an unpackaged checkout. Installed packages use discovery.
if (java.lang.System.getenv("OPENAF_DESKTOP_PROVIDER_ROOT") != null) ow.desktop.registerProvider(require(root + "/desktop-javafx.js").create(root));
loadCompiledLib("owrap_desktop_ui_js");
var original=OpenWrap.desktop.__viewHTML;
OpenWrap.desktop.__viewHTML=function(v){
  var html=original(v);
  return html.replace("</body>","<script>openafDesktop.ready.then(function(){var phase=0,n=0;var timer=setInterval(function(){if(++n>150){clearInterval(timer);return;}var name=document.getElementById('name'),status=document.getElementById('status'),go=document.getElementById('go');if(phase===0&&name&&go){name.value='Ada';document.getElementById('mode').value='two';phase=1;go.click();}else if(phase===1&&status&&status.textContent==='Updated'){phase=2;clearInterval(timer);go.click();}},50);});</script></body>");
};
var count=new java.util.concurrent.atomic.AtomicInteger(), failure;
var v={items:[{id:"status",type:"text",text:"Initial <b>plain</b>"},{id:"name",type:"input",label:"Name",value:""},{id:"mode",type:"select",label:"Mode",options:["one","two"]},{id:"go",type:"button",label:"Continue"}]};
var w=ow.desktop.window({view:v,title:"Shared view integration test"});
w.on("message",function(e){try{if(e.message.type!=="action"||e.message.payload.values.name!=="Ada"||e.message.payload.values.mode!=="two")throw new Error("Unexpected view values: "+JSON.stringify(e));if(count.incrementAndGet()===1){v.items[0].text="Updated";v.items[1].value="Ada";v.items[2].value="two";w.setView(v);}else w.close();}catch(err){failure=String(err);w.close();}});
w.show();ow.desktop.wait(15000);
if(failure||count.get()!=2)throw new Error(failure||"View roundtrip incomplete "+count.get());
print("PASS JavaFX shared view controls, safe rendering, replacement and closure");
