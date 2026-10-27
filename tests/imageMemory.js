// Standalone offline regression: OAF_JARGS=-Xmx256m oaf -f tests/imageMemory.js
ow.loadAI();
function check(value, message) { if (!value) throw new Error(message); }
try {
  var api = $llm({type:'openai',model:'fixture',key:'fixture',url:'http://fixture.invalid'}).getGPT().model;
  check(api.supportsImageMimeTypes === true, 'OpenAI advertises MIME support');
  var sent = [];
  api._request = function(uri, body) {
    sent.push(body);
    return {choices:[{finish_reason:'stop',message:{content:'image description'}}]};
  };
  var png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB';
  var jpeg = '/9j/4AAQSkZJRgABAQAAAQABAAD/';
  ;[png,jpeg,'legacy'].forEach(function(value) {
    api.cleanPrompt();
    check(api.promptImage('Describe',value,'high','user','fixture',0,false) === 'image description', 'Legacy arguments and answer');
    var content = sent[sent.length - 1].messages[0].content;
    var expected = value === png ? 'image/png' : 'image/jpeg';
    check(content[1].image_url.url === 'data:' + expected + ';base64,' + value, 'Original bytes and MIME');
    check(content[1].image_url.detail === 'high', 'Detail preserved');
  });
  var file = String(io.createTempFile('image-mime-', '.bin'));
  try {
    var output = new java.io.FileOutputStream(file);
    try { output.write(java.util.Base64.getDecoder().decode(png)); } finally { output.close(); }
    api.cleanPrompt(); api.promptImage('Describe',file);
    check(sent[sent.length - 1].messages[0].content[1].image_url.url === 'data:image/png;base64,' + png, 'Signature detection for file without image extension');
  } finally { io.rm(file); }
  var questions = {visible:{type:'boolean',instructions:'Visible?'}};
  ;[3 * 1024 * 1024, 3 * 1024 * 1024 + 1, 3 * 1024 * 1024 + 2].forEach(function(size) {
    var bytes = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE,size);
    var value = String(java.util.Base64.getEncoder().encodeToString(bytes));
    bytes = null;
    ;['ollama','openai'].forEach(function(provider) {
      var image = provider === 'openai' ? 'data:image/png;base64,' + value : value;
      ow.ai.__decision.request('Look',questions,{images:[image]},'fixture',provider);
      var failed = false;
      try { ow.ai.__decision.request('Look',questions,{images:[image.substring(0,image.length - 4) + 'AA=A']},'fixture',provider); }
      catch(e) { failed = e.code === 'LLM_DECISION_INVALID_REQUEST'; }
      check(failed,'Malformed large decision image rejected');
    });
    value = null; java.lang.System.gc();
  });
  ;['====','AA=A','AA==AAAA','AAA_','AAA\n',''].forEach(function(value) { check(!ow.ai.__image.validBase64(value),'Invalid base64'); });
  print('OpenAF image MIME and Rhino memory regressions passed');
} catch(e) { printErr(e); exit(1); }
