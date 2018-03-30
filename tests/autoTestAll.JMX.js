(function() {
    exports.testJMX = function() {
        plugin("JMXServer");
        
        log("Creating JMX server on port 12346");
        var jmxServer = new JMXServer("com.openaf:type=Values");
        var BINGO = "OK";
        jmxServer.start(12346);
        jmxServer.addBean({"a": "writable double", "b": "long", "c": "writable string" },
            function(aKey) {
                switch(aKey) {
                case "a": return 12.3;
                case "b": return 123;
                case "c": return BINGO;
                }
            },
            function(aKey, aValue) {
                if (aKey == "c") BINGO = aValue;
            }
        );
    
        log("Using JMX client to connect to JMX server");
        plugin("JMX");
        var jmx = new JMX("service:jmx:rmi:///jndi/rmi://127.0.0.1:12346/jmxrmi");
        var jmxObj = jmx.getObject("com.openaf:type=Values");
        if (jmxObj.get("a") != 12.3 ||
            jmxObj.get("b") != 123 ||
            jmxObj.get("c") != "OK") throw "Couldn't retrieve the correct values from the JMX server";
    
        jmxObj.set("a", 12.2);
        jmxObj.set("c", "BINGO")
        if (jmxObj.get("c") != "BINGO") throw "Couldn't set values on the JMX server";
    
        jmxServer.stop();
    };
})();