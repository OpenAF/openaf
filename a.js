var getDNS = function(aName, aType, aServer) {
    var getProps = aObj => {
        var rr = {}
        Object.keys(aObj).forEach(r => {
            if (r.startsWith("get") && (r != "getClass")) {
                rr[r.substring(3)] = aObj[r]()
            }
        })
        return rr
    }

    var res = []
    var records = new Packages.org.xbill.DNS.Lookup(aName, Packages.org.xbill.DNS.Type[aType.toUpperCase()])
    if (isDef(aServer)) records.setResolver(new Packages.org.xbill.DNS.SimpleResolver(aServer))
    records = records.run()
    for(var i in records) {
        var rec = records[i]
        res.push(getProps(rec))
    }
    if (res.length == 1) res = res[0]
    return res
}