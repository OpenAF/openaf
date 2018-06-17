(function() {
    exports.testAIPerceptronXOR = function() {
        ow.loadAI();
        var nn = new ow.ai.network({ type: "perceptron", args: [2, 3, 1]});
        nn.train([{input: [0,0], output: [0]}, {input: [0,1], output: [1]}, {input: [1,0], output: [1]}, {input: [1,1], output :[0]}]);
        ow.test.assert(Math.round(nn.get([1,0])), 1, "Problem with ow.ai perceptron 1 XOR 0");
        ow.test.assert(Math.round(nn.get([1,1])), 0, "Problem with ow.ai perceptron 1 XOR 1");
        ow.test.assert(Math.round(nn.get([0,1])), 1, "Problem with ow.ai perceptron 0 XOR 1");
        ow.test.assert(Math.round(nn.get([0,0])), 0, "Problem with ow.ai perceptron 1 XOR 0");
    };

    exports.testAILiquidXOR = function() {
        ow.loadAI();
        var nn = new ow.ai.network({ type: "liquid", args: [2, 40, 1, 2, 1]});
        nn.train([{input: [0,0], output: [0]}, {input: [0,1], output: [1]}, {input: [1,0], output: [1]}, {input: [1,1], output :[0]}]);
        ow.test.assert(Math.round(nn.get([1,0])), 1, "Problem with ow.ai liquid 1 XOR 0");
        ow.test.assert(Math.round(nn.get([1,1])), 0, "Problem with ow.ai liquid 1 XOR 1");
        ow.test.assert(Math.round(nn.get([0,1])), 1, "Problem with ow.ai liquid 0 XOR 1");
        ow.test.assert(Math.round(nn.get([0,0])), 0, "Problem with ow.ai liquid 1 XOR 0");   
    };

    exports.testAILSTMAND = function() {
        ow.loadAI();
        var nn = new ow.ai.network({ type: "lstm", args: [2, 4, 1]});
        nn.train([{input: [0,0], output: [0]}, {input: [0,1], output: [0]}, {input: [1,0], output: [0]}, {input: [1,1], output :[1]}]);
        ow.test.assert(Math.round(nn.get([1,0])), 0, "Problem with ow.ai lstm 1 AND 0");
        ow.test.assert(Math.round(nn.get([1,1])), 1, "Problem with ow.ai lstm 1 AND 1");
        ow.test.assert(Math.round(nn.get([0,1])), 0, "Problem with ow.ai lstm 0 AND 1");
        ow.test.assert(Math.round(nn.get([0,0])), 0, "Problem with ow.ai lstm 1 AND 0");   
    };

    exports.testAINetworkSave = function() {
        ow.loadAI();
        var nn = new ow.ai.network({ type: "perceptron", args: [2, 3, 1]});
        nn.train([{input: [0,0], output: [0]}, {input: [1,0], output: [0]}, {input: [0,1], output: [0]}, {input: [1,1], output :[1]}]);
        nn.writeFile("autoTestAll.xorNet.gz");

        var na = new ow.ai.network();
        na.readFile("autoTestAll.xorNet.gz");

        ow.test.assert(Math.round(na.get([1,0])), Math.round(nn.get([1,0])), "Problem with saved ow.ai perceptron 1 AND 0");
        ow.test.assert(Math.round(na.get([1,1])), Math.round(nn.get([1,1])), "Problem with saved ow.ai perceptron 1 AND 1");
        ow.test.assert(Math.round(na.get([0,1])), Math.round(nn.get([0,1])), "Problem with saved ow.ai perceptron 0 AND 1");
        ow.test.assert(Math.round(na.get([0,0])), Math.round(nn.get([0,0])), "Problem with saved ow.ai perceptron 1 AND 0");

        io.rm("autoTestAll.xorNet.gz"); 
    };    

    exports.testAILSTMANDSave = function() {
        ow.loadAI();
        var nn = new ow.ai.network({ type: "lstm", args: [2, 4, 1]});
        nn.train([{input: [0,0], output: [0]}, {input: [0,1], output: [0]}, {input: [1,0], output: [0]}, {input: [1,1], output :[1]}]);
        nn.writeFile("autoTestAll.ai.andNet.lstm.gz");

        var na = new ow.ai.network();
        na.readFile("autoTestAll.ai.andNet.lstm.gz");

        ow.test.assert(Math.round(nn.get([1,0])), 0, "Problem with saved ow.ai lstm 1 AND 0");
        ow.test.assert(Math.round(nn.get([1,1])), 1, "Problem with saved ow.ai lstm 1 AND 1");
        ow.test.assert(Math.round(nn.get([0,1])), 0, "Problem with saved ow.ai lstm 0 AND 1");
        ow.test.assert(Math.round(nn.get([0,0])), 0, "Problem with saves ow.ai lstm 1 AND 0");   

        io.rm("autoTestAll.ai.andNet.lstm.gz");
    };

    exports.testAILiquidXORSave = function() {
        ow.loadAI();
        var nn = new ow.ai.network({ type: "liquid", args: [2, 40, 1, 2, 1]});
        nn.train([{input: [0,0], output: [0]}, {input: [0,1], output: [1]}, {input: [1,0], output: [1]}, {input: [1,1], output :[0]}]);
        nn.writeFile("autoTestAll.ai.xorNet.liquid.gz");

        var na = new ow.ai.network();
        na.readFile("autoTestAll.ai.xorNet.liquid.gz");

        ow.test.assert(Math.round(nn.get([1,0])), 1, "Problem with saved ow.ai liquid 1 XOR 0");
        ow.test.assert(Math.round(nn.get([1,1])), 0, "Problem with saved ow.ai liquid 1 XOR 1");
        ow.test.assert(Math.round(nn.get([0,1])), 1, "Problem with saved ow.ai liquid 0 XOR 1");
        ow.test.assert(Math.round(nn.get([0,0])), 0, "Problem with saves ow.ai liquid 1 XOR 0");   

        io.rm("autoTestAll.ai.xorNet.liquid.gz");
    };   
    
    exports.testNormalizeWithSchema = function() {
        ow.loadAI();

        var ar = [
            {name:'workout', duration:'120', enjoy: true, time:1455063275, tags:['gym', 'weights'], crucial: true },
            {name:'lunch', duration:'45', enjoy: false, time:1455063275, tags:['salad', 'wine'], crucial: false },
            {name:'sleep', duration:'420', enjoy: true, time:1455063275, tags:['bed', 'romance'], crucial: true}
        ];

        var sar = {
            name: {
                col: 0,
                oneOf: [ 'workout', 'lunch', 'sleep' ]
            },
            duration: {
                col: 1,
                min: 0,
                max: 1000
            },
            enjoy: {
                col: 2
            },
            tags: {
                col: 3,
                anyOf: [ 'gym', 'weights', 'salad', 'wine', 'bed', 'romance' ]
            },
            crucial: {
                col: 4,
                scaleOf: [
                    { val: true,  weight: 0.85 },
                    { val: false, weight: 0.15 }
                ]
            },    
        };

        var res = $from(ar).sort("time").select((r) => { return ow.ai.normalize.withSchema(r, sar); });

        ow.test.assert(res[0], [1, 0, 0, 0.12, true, 1, 1, 0, 0, 0, 0, 0.85], "Problem with ow.ai.normalize.withSchema (1)");
        ow.test.assert(res[1], [0, 1, 0, 0.045, false, 0, 0, 1, 1, 0, 0, 0.15], "Problem with ow.ai.normalize.withSchema (2)");
        ow.test.assert(res[2], [0, 0, 1, 0.42, true, 0, 0, 0, 0, 1, 1, 0.85], "Problem with ow.ai.normalize.withSchema (3)");
    };

    exports.testID3 = function() {
        ow.loadAI();

        var data = [
            {person: 'Homer', hairLength: 0, weight: 250, age: 36, sex: 'male'},
            {person: 'Marge', hairLength: 10, weight: 150, age: 34, sex: 'female'},
            {person: 'Bart', hairLength: 2, weight: 90, age: 10, sex: 'male'},
            {person: 'Lisa', hairLength: 6, weight: 78, age: 8, sex: 'female'},
            {person: 'Maggie', hairLength: 4, weight: 20, age: 1, sex: 'female'},
            {person: 'Abe', hairLength: 1, weight: 170, age: 70, sex: 'male'},
            {person: 'Selma', hairLength: 8, weight: 160, age: 41, sex: 'female'},
            {person: 'Otto', hairLength: 10, weight: 180, age: 38, sex: 'male'},
            {person: 'Krusty', hairLength: 6, weight: 200, age: 45, sex: 'male'}
        ];

        var comic = {person: 'Comic guy', hairLength: 8, weight: 290, age: 38};

        var dt = new ow.ai.decisionTree.ID3.DecisionTree({
            trainingSet      : data,
            categoryAttr     : 'sex',
            ignoredAttributes: [ 'person' ]
        });
 
        ow.test.assert(dt.predict(comic), 'male', "The ID3 Decision Tree didn't predict has expected.");

        var jsonData = clone(ow.ai.decisionTree.__toJsonID3(dt));
        var _dt = ow.ai.decisionTree.__fromJsonID3DT(jsonData);
        ow.test.assert(_dt.predict(comic), 'male', "The ID3 Decision Tree copy from JSON didn't predict has expected.");

        var rt = new ow.ai.decisionTree.ID3.RandomForest({
            trainingSet      : data,
            categoryAttr     : 'sex',
            ignoredAttributes: [ 'person' ]
        }, 3);

        ow.test.assert(rt.predict(comic), { male: 3 }, "The ID3 Random Forest didn't predict has expected.");

        jsonData = clone(ow.ai.decisionTree.__toJsonID3(rt));
        var _rf = ow.ai.decisionTree.__fromJsonID3RF(jsonData);
        ow.test.assert(_rf.predict(comic), { male: 3 }, "The ID3 Random Forest from JSON didn't predict has expected.");
    };

    exports.testC45 = function() {
        ow.loadAI();

        var data = [
            [ "A", 70, 'True', 'CLASS1' ],
            [ "A", 90, 'True', 'CLASS2' ],
            [ "A", 85, 'False', 'CLASS2' ],
            [ "A", 95, 'False', 'CLASS2' ],
            [ "A", 70, 'False', 'CLASS1' ],
            [ "B", 90, 'True', 'CLASS1' ],
            [ "B", 78, 'False', 'CLASS1' ],
            [ "B", 65, 'True', 'CLASS1' ],
            [ "B", 75, 'False', 'CLASS1' ],
            [ "C", 80, 'True', 'CLASS2' ],
            [ "C", 70, 'True', 'CLASS2' ],
            [ "C", 80, 'False', 'CLASS1' ],
            [ "C", 80, 'False', 'CLASS1' ],
            [ "C", 96, 'False', 'CLASS1' ]
        ];

        var features = [ "attr1", "attr2", "attr3" ];
        var featureTypes = [ "category", "number", "category" ];
        var target = "class";

        var C45 = new ow.ai.decisionTree.C45();
        C45.train({
            data: data,
            target: target,
            features: features,
            featureTypes: featureTypes
        }, (error, model) => {
            if (error) {
                logErr(error);
                return false;
            }

            var testData = [
                ["B", 71, 'False'],
                ["C", 70, 'True']
            ];

            ow.test.assert(model.classify(testData[0]), 'CLASS1', "Problem 1 with Decision Tree C45.");
            ow.test.assert(model.classify(testData[1]), 'CLASS2', "Problem 2 with Decision Tree C45.");
        });

    };

    exports.testFeaturesArray = function() {
        ow.loadAI();

        var data = [
            {person: 'Homer', hairLength: 0, weight: 250, age: 36, sex: 'male'},
            {person: 'Marge', hairLength: 10, weight: 150, age: 34, sex: 'female'},
            {person: 'Bart', hairLength: 2, weight: 90, age: 10, sex: 'male'},
            {person: 'Lisa', hairLength: 6, weight: 78, age: 8, sex: 'female'},
            {person: 'Maggie', hairLength: 4, weight: 20, age: 1, sex: 'female'},
            {person: 'Abe', hairLength: 1, weight: 170, age: 70, sex: 'male'},
            {person: 'Selma', hairLength: 8, weight: 160, age: 41, sex: 'female'},
            {person: 'Otto', hairLength: 10, weight: 180, age: 38, sex: 'male'},
            {person: 'Krusty', hairLength: 6, weight: 200, age: 45, sex: 'male'}
        ];

        var res = ow.ai.normalize.toFeaturesArray(data, [ "person" ]);
        ow.test.assert(res.data.length, data.length, "Resulting array lost lines from original.");
        ow.test.assert(res.keys.length, 4, "Feature keys not properly identified.");
        ow.test.assert(res.ignoredAttrs.length, 1, "Incorrect ignored attributes.");
        ow.test.assert(res.data[1], [ 34, 10, "female", 150 ], "Incorrect converted features array.");
    };

    exports.testKMeans = function() {
        ow.loadAI();

        var data = [ 
            {'company': 'Microsoft' , 'size': 91259, 'revenue': 60420},
            {'company': 'IBM' , 'size': 400000, 'revenue': 98787},
            {'company': 'Skype' , 'size': 700, 'revenue': 716},
            {'company': 'SAP' , 'size': 48000, 'revenue': 11567},
            {'company': 'Yahoo!' , 'size': 14000 , 'revenue': 6426 },
            {'company': 'eBay' , 'size': 15000, 'revenue': 8700},
        ];
         
        var labels = [], vectors = [];
        for(let i = 0; i < data.length; i++) {
            labels[i] = data[i]['company'];
            vectors[i] = [ data[i]['size'], data[i]['revenue'] ];
        }

        var clusters = ow.ai.cluster.kmeans().__kmeans(4, vectors);
        loadLodash();
        ow.test.assert(_.uniq(clusters.assignments).length, 4, "Problem with KMeans.");
    };
})();
