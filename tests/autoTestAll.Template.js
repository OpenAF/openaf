// Copyright 2023 Nuno Aguiar

(function() {
    exports.testLoadTemplate = function() {
        ow.loadTemplate();
    };

    exports.testMD2HTML = function() {
        var md = "# test 1";

        ow.loadTemplate();
        var out = ow.template.parseMD2HTML(md);
        ow.test.assert(out, "<h1 id=\"test-1\">test 1</h1>", "Problem with ow.template.parseMD2HTML");

        // TODO: Need to improve this test
        out = ow.template.parseMD2HTML(md, true);
        ow.test.assert(out.match(/highlight\.js/).length, 1, "Problem with ow.template.parseMD2HTML full html");
    };

    exports.testSimpleTemplate = function() {
        ow.loadTemplate();
        ow.test.assert(templify("Hello {{name}}", { name: "OpenAF"}), "Hello OpenAF", "Problem with simple templify test 1.");
        ow.test.assert(templify("{{#each a}}{{this}}{{/each}}", {a:[1,2,3]}), "123", "Problem with simple templify test 2.");
    };

    exports.testFormatHelpers = function() {
        ow.loadTemplate();
        ow.template.addFormatHelpers();
        ow.test.assert(templify("{{#owFormat_toHex a}}{{/owFormat_toHex}}", {a:123}), "7b", "Problem with template ow.format helper toHex");
        ow.test.assert(templify("{{#owFormat_toBytesAbbreviation a 3}}{{/owFormat_toBytesAbbreviation}}", {a:1024}), "1 KB", "Problem with template ow.format helper toBytesAbbreviation");

        ow.template.delHelper("owFormat_toHex");
        try {
            templify("{{#owFormat_toHex a}}{{/owFormat_toHex}}", {a:123});
            throw("Problem with deleting a template helper");
        } catch(e) {
            ow.test.assert(e.message, "Missing helper: \"owFormat_toHex\"", "Problem with deleting a template helper (different message?).");
        }
    };

    exports.testOpenAFHelpers = function() {
        ow.loadTemplate()
        ow.template.addOpenAFHelpers()

        $set("testOpenAFHelpers", "123")
        $set("testOpenAFHelpers2", { x: 1, y: -1 })
    
        ow.test.assert(templify("{{$get 'testOpenAFHelpers'}}"), "123", "Problem with $get template helper")
        ow.test.assert(templify("{{$getObj 'testOpenAFHelpers2' 'y'}}"), "-1", "Problem with $getObj template helper")

        ow.test.assert(templify("{{#$switch 'a'}}{{#$case 'a'}}A{{/$case}}{{#$case 'b'}}B{{/$case}}{{#$default 'D'}}{{/$default}}{{/$switch}}"), "A", "Problem with switch case 1")
        ow.test.assert(templify("{{#$switch 'b'}}{{#$case 'a'}}A{{/$case}}{{#$case 'b'}}B{{/$case}}{{#$default 'D'}}{{/$default}}{{/$switch}}"), "B", "Problem with switch case 2")
        ow.test.assert(templify("{{#$switch 'x'}}{{#$case 'a'}}A{{/$case}}{{#$case 'b'}}B{{/$case}}{{#$default 'D'}}{{/$default}}{{/$switch}}"), "D", "Problem with switch default")

        ow.test.assert($t("-{{$t ($get 'testOpenAFHelpers') this}}-"), "-123-", "Problem with $t using another helper.")
        ow.test.assert($t("-{{$t '{{x}}{{y}}' this}}-", $get("testOpenAFHelpers2")), "-1-1-", "Problem with $t using data.")
    }

    exports.testConditionalHelpers = function() {
        ow.loadTemplate();
        ow.template.addConditionalHelpers();
        ow.test.assert(
            templify("{{#$isnt number 5}}Kiss my shiny metal ass!{{else}}Never mind :({{/$isnt}}", { number: 5}),
            "Never mind :(",
            "Problem with template conditional helper $isnt."
        );
        ow.test.assert(
            templify("{{#$gt number 8}}Kiss my shiny metal ass!{{else}}Never mind :({{/$gt}}", {number: 5}),
            "Never mind :(",
            "Problem with template conditional helper $gt."
        );        
        ow.test.assert(
            $t("{{#$compare M '==' 'M2'}}ok{{else}}nok{{/$compare}}", { M: 'M2' }),
            "ok",
            "Problem with template conditional helper $compare."
        )
        ow.test.assert(
            $t("{{#$gt M 2}}ok{{else}}nok{{/$gt}}", { M: 5 }),
            "ok",
            "Problem with template conditional helper $gt"
        )
        ow.test.assert(
            $t("{{#$gte M 2}}ok{{else}}nok{{/$gte}}", { M: 2 }),
            "ok",
            "Problem with template conditional helper $gte"
        )
        ow.test.assert(
            $t("{{#$has this 'foo'}}ok{{else}}nok{{/$has}}", { foo: "bar" }),
            "ok",
            "Problem with template conditional helper $has"
        ),
        ow.test.assert(
            $t("{{#$eq foo 'bar'}}ok{{else}}nok{{/$eq}}", { foo: "bar" }),
            "ok",
            "Problem with template conditional helper $eq"
        ),
        ow.test.assert(
            $t("{{#$ifEven 24}}ok{{else}}nok{{/$ifEven}}"),
            "ok",
            "Problem with template conditional helper $ifEven"
        ),
        ow.test.assert(
            $t("{{#$ifOdd 25}}ok{{else}}nok{{/$ifOdd}}"),
            "ok",
            "Problem with template conditional helper $ifOdd"
        )
        ow.test.assert(
            $t("{{#$startsWith 'something' 'some'}}ok{{else}}nok{{/$startsWith}}"),
            "ok",
            "Problem with ttemplate conditional helper $startsWith"
        )
        ow.test.assert(
            $t("{{#if ($startsWith 'something' 'some')}}ok{{else}}nok{{/if}}"),
            "ok",
            "Problem with ttemplate conditional helper $startsWith inline"
        )
        ow.test.assert(
            $t("{{#$endsWith 'something' 'thing'}}ok{{else}}nok{{/$endsWith}}"),
            "ok",
            "Problem with ttemplate conditional helper $endsWith"
        )
        ow.test.assert(
            $t("{{#if ($endsWith 'something' 'thing')}}ok{{else}}nok{{/if}}"),
            "ok",
            "Problem with ttemplate conditional helper $endsWith inline"
        )
        ow.test.assert(
            $t("{{#$match 'something' 's?ome'}}ok{{else}}nok{{/$match}}"),
            "ok",
            "Problem with ttemplate conditional helper $match"
        )
        ow.test.assert(
            $t("{{#if ($match 'something' 's?ome')}}ok{{else}}nok{{/if}}"),
            "ok",
            "Problem with ttemplate conditional helper $match inline"
        )
        ow.test.assert(
            $t("{{#$match 'something' 'S?OME' 'i'}}ok{{else}}nok{{/$match}}"),
            "ok",
            "Problem with ttemplate conditional helper $match"
        )
        ow.test.assert(
            $t("{{#if ($match 'something' 'S?OME' 'i')}}ok{{else}}nok{{/if}}"),
            "ok",
            "Problem with ttemplate conditional helper $match inline"
        )
    };

    exports.testPartialHelpers = function() {
        ow.loadTemplate();

        ow.template.addPartial("test", "test:{{title}}");
        ow.test.assert(
            templify("{{> test title='openaf'}}"),
            "test:openaf",
            "Problem with template partial."
        );

        ow.template.delPartial("test");
        try {
            templify("{{> test title='openaf'}}");
            throw("Problem with deleting a template partial.");
        } catch(e) {
            ow.test.assert(e.message, "The partial test could not be found", "Problem with deleting a template partial (different message?).");
        }
    };
})();