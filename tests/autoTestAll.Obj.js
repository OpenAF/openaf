(function() {
    exports.testRESTErrors = function() {
        ow.loadObj();

        var res200 = ow.obj.rest.get("https://httpstat.us/200");
        ow.test.assert(res200.responseCode, 200, "Problem with obtaining a HTTP 200 code");

        var res400;
        try {
            res400 = ow.obj.rest.get("https://httpstat.us/400");
        } catch(e) {
            res400 = ow.obj.rest.exceptionParse(e);
        }
        ow.test.assert(res400.response, "400 Bad Request", "Problem with obtaining and parsing the HTTP 400 code");

        var res401;
        try {
            res401 = ow.obj.rest.get("https://httpstat.us/401");
        } catch(e) {
            res401 = ow.obj.rest.exceptionParse(e);
        }
        ow.test.assert(res401.response, "401 Unauthorized", "Problem with obtaining and parsing the HTTP 401 code");

        var res500;
        try {
            res500 = ow.obj.rest.get("https://httpstat.us/500");
        } catch(e) {
            res500 = ow.obj.rest.exceptionParse(e);
        }
        ow.test.assert(res500.response, "500 Internal Server Error", "Problem with obtaining and parsing the HTTP 500 code");
    };
})();