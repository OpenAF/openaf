plugin("HTTP");

var ls = io.readFile("versionsAndDeps.json");
var h = new HTTP();
var lines = "";

for(let i in ls.external) {
    if (ls.external[i].license.match(/^https?:/i)) {
        ls.external[i].license = h.exec(ls.external[i].license).response;
    }
    ls.external[i].ppath = ls.external[i].path.join(", ");
    
    lines += templify("\
Third-party name      : {{description}}\n\
Version               : {{version}}\n\
Changed from original : {{#if changes}}Yes{{else}}No{{/if}}\n\
Location in openaf.jar: {{ppath}}\n\
License               : \n\n{{license}}\n\
-----------------------\n", ls.external[i]);
}

io.writeFileString("LICENSES.txt", lines);
