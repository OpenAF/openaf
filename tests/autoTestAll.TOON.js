// Copyright 2023 Nuno Aguiar

(function() {
    var fixture = {
        kind  : "toon-test",
        nested: { a: 1, b: "x", c: true },
        items : [
            { id: 1, name: "Alice", active: true },
            { id: 2, name: "Bob", active: false }
        ],
        emptyArray : [],
        emptyObject: {},
        unicode    : "café 中文 😀",
        number     : 3.14159
    }

    exports.testToTOONDefaultEngine = function() {
        var toon = af.toTOON(fixture);
        ow.test.assert(isString(toon), true, "toTOON (default/js engine) should return a string");

        var back = af.fromTOON(toon);
        ow.test.assert(back.items, fixture.items, "toTOON/fromTOON (default/js engine) round-trip mismatch on items");
    };

    exports.testToTOONJavaEngine = function() {
        var toon = af.toTOON(fixture, true);
        ow.test.assert(isString(toon), true, "toTOON (java engine) should return a string");

        var back = af.fromTOON(toon, true);
        ow.test.assert(back.items, fixture.items, "toTOON/fromTOON (java engine) round-trip mismatch on items");
        ow.test.assert(back.nested, fixture.nested, "toTOON/fromTOON (java engine) round-trip mismatch on nested");
        ow.test.assert(back.emptyArray, fixture.emptyArray, "toTOON/fromTOON (java engine) round-trip mismatch on emptyArray");
        ow.test.assert(back.emptyObject, fixture.emptyObject, "toTOON/fromTOON (java engine) round-trip mismatch on emptyObject");
        ow.test.assert(back.unicode, fixture.unicode, "toTOON/fromTOON (java engine) round-trip mismatch on unicode");
    };

    // Both engines must produce identical TOON for data without the known edge cases (empty
    // arrays / sub-1e-6 numbers -- see testTOONKnownEmptyArrayCrossEngineLimitation below).
    exports.testTOONEnginesAgreeOnTabularData = function() {
        var obj = { items: fixture.items, nested: fixture.nested };
        ow.test.assert(af.toTOON(obj, true), af.toTOON(obj, false), "JS and Java TOON engines produced different output for the same tabular/nested data");
    };

    exports.testTOONFlagDefaults = function() {
        ow.test.assert(__flags.ALTERNATIVES.toTOON, false, "toTOON alternative flag should default to false (js engine) until proven in production");
        ow.test.assert(__flags.ALTERNATIVES.fromTOON, false, "fromTOON alternative flag should default to false (js engine) until proven in production");
    };

    // Known, documented incompatibility: TOON spec 3.0 (bundled js engine) doesn't understand the
    // canonical empty-array form ("key: []") introduced in spec 3.1+ and emitted by the java engine
    // (json-io, spec 3.3). Decoding java-engine output with the js engine turns an empty array into
    // the literal string "[]" instead of an empty array. This only matters if data written by the
    // java engine is later read by the js engine -- matching engines always round-trip correctly
    // (see testToTOONJavaEngine/testToTOONDefaultEngine above).
    exports.testTOONKnownEmptyArrayCrossEngineLimitation = function() {
        var toonFromJava = af.toTOON({ a: [] }, true);
        var decodedByJS  = af.fromTOON(toonFromJava, false);
        ow.test.assert(decodedByJS.a, "[]", "Expected the known cross-engine empty-array limitation to still reproduce (if this now fails because it decoded to an actual empty array, the bundled js engine has gained TOON spec 3.1+ support and this test/plan note can be removed)");
    };

    exports.testTOONLargePayload = function() {
        var big = { items: [] };
        for (var i = 0; i < 5000; i++) {
            big.items.push({ id: i, name: "item-" + i, active: (i % 2 === 0), ratio: i / 7 });
        }

        var toon = af.toTOON(big, true);
        ow.test.assert(isString(toon), true, "toTOON (java engine, large payload) should return a string");

        var back = af.fromTOON(toon, true);
        ow.test.assert(back.items.length, 5000, "toTOON/fromTOON (java engine, large payload) lost rows on round-trip");
        ow.test.assert(back.items[4999], big.items[4999], "toTOON/fromTOON (java engine, large payload) mismatch on last row");
    };
})();
