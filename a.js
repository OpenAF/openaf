var s = 'a(abc).b("x.yz").c(123)'

function fn(s) {
  var ig = __
  var res = []
  var buf = ""

  for(var i = 0; i < s.length; i++) {
    if (isUnDef(ig) && (s[i] == '"' || s[i] == "'")) {
      ig = s[i]
    } else {
      if (s[i] == ig) ig = __
    }
    if (isUnDef(ig) && s[i] == ".") {
      res.push(buf) 
      buf = ""
    } else {
      buf += s[i]
    }
  }
  if (buf.length > 0) res.push(buf)

  return res
}
