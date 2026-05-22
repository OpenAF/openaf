// Copyright 2023 Nuno Aguiar

(function() {
    var __cloneForTest = function(v) {
        return jsonParse(stringify(v, __, ""), __, __, true);
    };

    var __makeOpenAISse = function(events) {
        return af.fromString2InputStream(events.map(r => "data: " + stringify(r, __, "") + "\n\n").join("") + "data: [DONE]\n\n");
    };

    var __makeOllamaStream = function(events) {
        return af.fromString2InputStream(events.map(r => stringify(r, __, "")).join("\n") + "\n");
    };

    exports.testAIPerceptronXOR = function() {
        ow.loadAI();
        var nn = new ow.ai.network({ type: "perceptron", args: [2, 3, 1]});
        nn.train([{input: [0,0], output: [0]}, {input: [0,1], output: [1]}, {input: [1,0], output: [1]}, {input: [1,1], output :[0]}]);
        ow.test.assert(Math.round(nn.get([1,0])), 1, "Problem with ow.ai perceptron 1 XOR 0");
        ow.test.assert(Math.round(nn.get([1,1])), 0, "Problem with ow.ai perceptron 1 XOR 1");
        ow.test.assert(Math.round(nn.get([0,1])), 1, "Problem with ow.ai perceptron 0 XOR 1");
        ow.test.assert(Math.round(nn.get([0,0])), 0, "Problem with ow.ai perceptron 1 XOR 0");
    };

    exports.testAIPerceptronXORPut = function() {
        ow.loadAI();
        var nn = new ow.ai.network({ type: "perceptron", args: [2, 3, 1]});
        
        for(var ii = 0; ii < 20000; ii++) {
            nn.put([0, 0], [0]);
            nn.put([0, 1], [1]);
            nn.put([1, 0], [1]);
            nn.put([1, 1], [0]);
        }

        ow.test.assert(Math.round(nn.get([1,0])), 1, "Problem with ow.ai perceptron put 1 XOR 0");
        ow.test.assert(Math.round(nn.get([1,1])), 0, "Problem with ow.ai perceptron put 1 XOR 1");
        ow.test.assert(Math.round(nn.get([0,1])), 1, "Problem with ow.ai perceptron put 0 XOR 1");
        ow.test.assert(Math.round(nn.get([0,0])), 0, "Problem with ow.ai perceptron put 1 XOR 0");
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
        
        var dt = new ow.ai.decisionTree.ID3();
        dt.DecisionTree({
            trainingSet      : data,
            categoryAttr     : 'sex',
            ignoredAttributes: [ 'person' ]
        });

        ow.test.assert(dt.DecisionTree_predict(comic), 'male', "The ID3 Decision Tree didn't predict as expected.");
        
        var jsonData = clone(ow.ai.decisionTree.__toJsonID3(dt));
        var _dt = ow.ai.decisionTree.__fromJsonID3DT(jsonData);
        ow.test.assert(_dt.DecisionTree_predict(comic), 'male', "The ID3 Decision Tree copy from JSON didn't predict as expected.");
    
        dt = new ow.ai.decisionTree.ID3();
        dt.RandomForest({
            trainingSet      : data,
            categoryAttr     : 'sex',
            ignoredAttributes: [ 'person' ]
        }, 3);
        ow.test.assert(dt.RandomForest_predict(comic), { male: 3 }, "The ID3 Random Forest didn't predict as expected.");
        jsonData = clone(ow.ai.decisionTree.__toJsonID3(dt));
        var _rf = ow.ai.decisionTree.__fromJsonID3RF(jsonData);
        ow.test.assert(_rf.RandomForest_predict(comic), { male: 3 }, "The ID3 Random Forest from JSON didn't predict as expected.");

        dt = ow.ai.decisionTree({
            type             : "id3",
            trainingSet      : data,
            categoryAttr     : 'sex',
            ignoredAttributes: [ 'person' ]
        });
        ow.test.assert(dt.predict(comic), 'male', "The wrapper to access id3 decision tree didn't predict as expected.");
        dt.writeFile("dt.json.gz");
        dt = void 0;
        dt = ow.ai.decisionTree({ type: 'id3' });
        dt.readFile("dt.json.gz");
        ow.test.assert(dt.predict(comic), 'male', "The wrapper, after persisting, to access id3 decision tree didn't predict as expected.");
        io.rm("dt.json.gz");
        
        var rt = ow.ai.decisionTree({
            type             : 'randomforest',
            trainingSet      : data,
            categoryAttr     : 'sex',
            ignoredAttributes: [ 'person' ],
            treesNumber      : 3
        });
        ow.test.assert(rt.predict(comic), { male: 3 }, "The wrapper to access id3 random forest didn't predict as expected.");

        rt.writeFile("rt.json.gz");
        rt = void 0;
        rt = ow.ai.decisionTree({ type: 'randomforest' });
        rt.readFile("rt.json.gz");
        ow.test.assert(rt.predict(comic), { male: 3 }, "The wrapper, after persisting, to access id3 random forest didn't predict as expected.");
        io.rm("rt.json.gz");
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

        var testData = [
            ["B", 71, 'False'],
            ["C", 70, 'True']
        ];

        C45 = ow.ai.decisionTree({ type: 'c45', data: data, target: target, features: features, featureTypes: featureTypes });
        ow.test.assert(C45.predict(testData[0]), 'CLASS1', "Problem 1, using wrapper, with Decision Tree C45.");
        ow.test.assert(C45.predict(testData[1]), 'CLASS2', "Problem 2, using wrapper,  with Decision Tree C45.");

        C45.writeFile("C45.json.gz");
        C45 = void 0;
        C45 = ow.ai.decisionTree({ type: 'c45' });
        C45.readFile("C45.json.gz");
        ow.test.assert(C45.predict(testData[0]), 'CLASS1', "Problem 1, using wrapper after persisting, with Decision Tree C45.");
        ow.test.assert(C45.predict(testData[1]), 'CLASS2', "Problem 2, using wrapper after persisting, with Decision Tree C45.");
        io.rm("C45.json.gz");
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
            {'company': 'eBay' , 'size': 15000, 'revenue': 8700}
        ];
         
        var labels = [], vectors = [];
        for(var ii = 0; ii < data.length; ii++) {
            labels[ii] = data[ii]['company'];
            vectors[ii] = [ data[ii]['size'], data[ii]['revenue'] ];
        }
 
        var clusters = ow.ai.cluster.kmeans().__kmeans(4, vectors);
        loadLodash();
        ow.test.assert(_.uniq(clusters.assignments).length, 4, "Problem with KMeans.");

        // ---
        data = [
            { night: "good", weekend: true, slept: 8 },
            { night: "good", weekend: true, slept: 7 },
            { night: "average", weekend: false, slept: 5 },
            { night: "bad", weekend: false, slept: 4 },
            { night: "average", weekend: false, slept: 6 },
            { night: "good", weekend: true, slept: 9 },
            { night: "good", weekend: false, slept: 7 }
        ];

        vectors = $from(data).select((d) => { 
            return ow.ai.normalize.withSchema(d, {
                night  : {col: 0, oneOf: [ 'good', 'average', 'bad' ] },
                weekend: {col: 1 },
                slept  : {col: 2, min: 0, max: 24 }
            });
        });

        var res = ow.ai.cluster({ numberOfClusters: 3, type: 'kmeans' }).classify(vectors);
        ow.test.assert(_.uniq(res.assignments).length, 3, "KMeans didn't classify correctly after data was normalized.");
    };

    exports.testAIGPTPromptArgumentRouting = function() {
        ow.loadAI();

        var g = new ow.ai.gpt("openai", { key: "test-key" });
        var promptCalls = [];
        var rawCalls = [];
        var streamCalls = [];
        var rawStreamCalls = [];

        g.model.prompt = function() {
            promptCalls.push(Array.prototype.slice.call(arguments));
            return "ok";
        };
        g.model.rawPrompt = function() {
            rawCalls.push(Array.prototype.slice.call(arguments));
            return { ok: true };
        };
        g.model.promptStream = function() {
            streamCalls.push(Array.prototype.slice.call(arguments));
            return "stream-ok";
        };
        g.model.rawPromptStream = function() {
            rawStreamCalls.push(Array.prototype.slice.call(arguments));
            return { content: "stream-raw-ok", events: [] };
        };

        var tools = [ { type: "function", function: { name: "echo" } } ];
        var onPromptDelta = function() {};
        var onRawDelta = function() {};

        ow.test.assert(g.prompt("hello", "user", "gpt-test", 0.15, tools), "ok", "Problem calling GPT prompt wrapper.");
        ow.test.assert(promptCalls[0], [ "hello", "gpt-test", 0.15, false, tools ], "Problem routing GPT prompt wrapper arguments.");

        g.rawPrompt("hello", "gpt-test", 0.2, true, tools);
        ow.test.assert(rawCalls[0], [ "hello", "gpt-test", 0.2, true, tools ], "Problem routing GPT rawPrompt wrapper arguments.");

        ow.test.assert(g.promptStream("hello", "user", "gpt-test", 0.3, false, tools, onPromptDelta), "stream-ok", "Problem calling GPT promptStream wrapper.");
        ow.test.assert(streamCalls[0], [ "hello", "gpt-test", 0.3, false, tools, onPromptDelta ], "Problem routing GPT promptStream wrapper arguments.");

        g.rawPromptStream("hello", "gpt-test", 0.4, false, tools, onRawDelta);
        ow.test.assert(rawStreamCalls[0], [ "hello", "gpt-test", 0.4, false, tools, onRawDelta ], "Problem routing GPT rawPromptStream wrapper arguments.");
    };

    exports.testAIOpenAITransportModes = function() {
        ow.loadAI();

        var openai = new ow.ai.gpt("openai", { key: "test-key", url: "https://api.openai.com" });
        var openaiTransport = openai.model.__debugTransport("chat/completions", "gpt-test");
        ow.test.assert(openaiTransport.url, "https://api.openai.com/v1/chat/completions", "Problem building default OpenAI chat URL.");
        ow.test.assert(isDef(openaiTransport.headers.Authorization), true, "Problem setting default OpenAI bearer authorization.");
        ow.test.assert(isUnDef(openaiTransport.headers["api-key"]), true, "Problem avoiding api-key on default OpenAI transport.");

        var openaiBaseUrl = new ow.ai.gpt("openai", { key: "test-key", url: "https://api.openai.com/v1" });
        ow.test.assert(openaiBaseUrl.model.__debugTransport("chat/completions", "gpt-test").url, "https://api.openai.com/v1/chat/completions", "Problem preserving an OpenAI v1 base URL.");

        var azureV1 = new ow.ai.gpt("openai", {
            key : "test-key",
            url : "https://example.openai.azure.com",
            mode: "azure-openai-v1"
        });
        var azureV1Transport = azureV1.model.__debugTransport("chat/completions", "deployment-a");
        ow.test.assert(azureV1Transport.url, "https://example.openai.azure.com/openai/v1/chat/completions", "Problem building Azure OpenAI v1 chat URL.");
        ow.test.assert("" + azureV1Transport.headers["api-key"], "test-key", "Problem setting Azure OpenAI v1 api-key header.");
        ow.test.assert(isUnDef(azureV1Transport.headers.Authorization), true, "Problem suppressing Azure OpenAI v1 bearer authorization.");

        var azureV1BaseUrl = new ow.ai.gpt("openai", {
            key : "test-key",
            url : "https://example.openai.azure.com/openai/v1",
            mode: "azure-openai-v1"
        });
        ow.test.assert(azureV1BaseUrl.model.__debugTransport("chat/completions", "deployment-a").url, "https://example.openai.azure.com/openai/v1/chat/completions", "Problem preserving an Azure OpenAI v1 base URL.");

        var azureLegacy = new ow.ai.gpt("openai", {
            key       : "test-key",
            url       : "https://example.openai.azure.com",
            mode      : "azure-openai-legacy",
            deployment: "deployment-a",
            apiVersion: "2024-10-21"
        });
        var azureLegacyTransport = azureLegacy.model.__debugTransport("chat/completions", "ignored");
        ow.test.assert(azureLegacyTransport.url, "https://example.openai.azure.com/openai/deployments/deployment-a/chat/completions?api-version=2024-10-21", "Problem building Azure OpenAI legacy deployment chat URL.");
        ow.test.assert("" + azureLegacyTransport.headers["api-key"], "test-key", "Problem setting Azure OpenAI legacy api-key header.");

        var foundryV1 = new ow.ai.gpt("openai", {
            key       : "test-key",
            url       : "https://example.services.ai.azure.com",
            mode      : "foundry"
        });
        var foundryV1Transport = foundryV1.model.__debugTransport("chat/completions", "deployment-a");
        ow.test.assert(foundryV1Transport.url, "https://example.services.ai.azure.com/openai/v1/chat/completions", "Problem building Foundry v1 chat URL.");
        ow.test.assert("" + foundryV1Transport.headers["api-key"], "test-key", "Problem setting Foundry v1 api-key header.");

        var foundryPreview = new ow.ai.gpt("openai", {
            key       : "test-key",
            url       : "https://example.services.ai.azure.com/models",
            mode      : "foundry",
            apiVersion: "2024-05-01-preview"
        });
        var foundryPreviewTransport = foundryPreview.model.__debugTransport("chat/completions", "deployment-a");
        ow.test.assert(foundryPreviewTransport.url, "https://example.services.ai.azure.com/models/chat/completions?api-version=2024-05-01-preview", "Problem building Foundry model inference preview chat URL.");
        ow.test.assert("" + foundryPreviewTransport.headers["api-key"], "test-key", "Problem setting Foundry preview api-key header.");
    };

    exports.testAIOpenAIStatsCaptureIncludesCachedAndReasoning = function() {
        ow.loadAI();

        var g = new ow.ai.gpt("openai", { key: "test-key", model: "gpt-4o" });
        g.model._request = function(url, body) {
            return {
                model: body.model,
                choices: [
                    {
                        finish_reason: "stop",
                        message: { role: "assistant", content: "ok" }
                    }
                ],
                usage: {
                    prompt_tokens: 120,
                    completion_tokens: 30,
                    total_tokens: 150,
                    prompt_tokens_details: {
                        cached_tokens: 90,
                        audio_tokens: 5
                    },
                    completion_tokens_details: {
                        reasoning_tokens: 11
                    }
                }
            };
        };

        g.rawPrompt("hello", "gpt-4o", 0.1, false, []);
        var stats = g.getLastStats();
        ow.test.assert(stats.tokens.cached, 90, "Problem capturing OpenAI cached prompt tokens.");
        ow.test.assert(stats.tokens.audio, 5, "Problem capturing OpenAI audio prompt tokens.");
        ow.test.assert(stats.tokens.reasoning, 11, "Problem capturing OpenAI reasoning completion tokens.");
    };

    exports.testAIAnthropicPromptCachingHeaders = function() {
        ow.loadAI();

        var _origRest = $rest;
        var captured = [];
        $rest = function(cfg) {
            captured.push(__cloneForTest(cfg));
            return {
                get2Stream: function() { return {}; },
                post2Stream: function() { return {}; }
            };
        };

        try {
            var gCache = new ow.ai.gpt("anthropic", { key: "test-key", promptCaching: true });
            gCache.model._request("v1/messages", {});
            ow.test.assert(captured[0].requestHeaders["anthropic-beta"], "prompt-caching-2024-07-31", "Problem enabling Anthropic prompt caching beta header on request.");

            captured = [];
            gCache.model._requestStream("v1/messages", {});
            ow.test.assert(captured[0].requestHeaders["anthropic-beta"], "prompt-caching-2024-07-31", "Problem enabling Anthropic prompt caching beta header on stream request.");

            captured = [];
            var gNoCache = new ow.ai.gpt("anthropic", { key: "test-key", promptCaching: false });
            gNoCache.model._request("v1/messages", {});
            ow.test.assert(isUnDef(captured[0].requestHeaders["anthropic-beta"]), true, "Problem keeping Anthropic prompt caching beta header disabled by default.");
        } finally {
            $rest = _origRest;
        }
    };

    exports.testAIAnthropicPromptCachingBodyAndStats = function() {
        ow.loadAI();

        var g = new ow.ai.gpt("anthropic", { key: "test-key", model: "claude-test", promptCaching: true });
        var requests = [];
        g.model._request = function(url, body) {
            requests.push(__cloneForTest(body));
            return {
                id: "msg-1",
                model: "claude-test",
                type: "message",
                stop_reason: "end_turn",
                content: [{ type: "text", text: "ok" }],
                usage: {
                    input_tokens: 20,
                    output_tokens: 10,
                    cache_creation_input_tokens: 300,
                    cache_read_input_tokens: 220
                }
            };
        };

        g.addSystemPrompt("You are concise.");
        g.rawPrompt("Hello world", "claude-test", 0.2, false, []);

        var body = requests[0];
        ow.test.assert(isArray(body.system), true, "Problem converting Anthropic system prompt into content blocks when prompt caching is enabled.");
        ow.test.assert(body.system[0].cache_control.type, "ephemeral", "Problem setting Anthropic system prompt cache_control marker.");

        var lastMessage = body.messages[body.messages.length - 1];
        var lastContentBlock = lastMessage.content[lastMessage.content.length - 1];
        ow.test.assert(lastMessage.role, "user", "Problem preserving Anthropic last user message role when applying cache_control.");
        ow.test.assert(lastContentBlock.cache_control.type, "ephemeral", "Problem setting Anthropic cache_control marker on last user message.");

        var stats = g.getLastStats();
        ow.test.assert(stats.tokens.cacheCreation, 300, "Problem capturing Anthropic cache creation tokens.");
        ow.test.assert(stats.tokens.cacheRead, 220, "Problem capturing Anthropic cache read tokens.");
    };

    exports.testAIOpenAIToolRecursionNoDuplication = function() {
        ow.loadAI();

        var g = new ow.ai.gpt("openai", { key: "test-key", model: "gpt-test" });
        var requests = [];
        g.setTool("echo", "Echo", { type: "object", properties: { value: { type: "number" } } }, function(args) {
            return { echoed: args.value };
        });

        g.model._request = function(url, body) {
            requests.push(__cloneForTest(body));
            if (requests.length == 1) {
                return {
                    choices: [
                        {
                            message: {
                                tool_calls: [
                                    {
                                        id: "call-1",
                                        type: "function",
                                        function: {
                                            name: "echo",
                                            arguments: "{\"value\":7}"
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                };
            }

            return {
                choices: [
                    {
                        finish_reason: "stop",
                        message: { content: "done" }
                    }
                ]
            };
        };

        var res = g.rawPrompt("use tool", "gpt-test", 0.1, false, [ "echo" ]);
        ow.test.assert(res.choices[0].message.content, "done", "Problem finishing OpenAI tool recursion.");
        ow.test.assert(requests.length, 2, "Problem with number of OpenAI tool recursion requests.");
        ow.test.assert(requests[1].messages.length, 3, "Problem duplicating OpenAI tool recursion messages.");
        ow.test.assert(requests[1].messages[1].tool_calls[0].id, "call-1", "Problem preserving OpenAI tool call id.");
        ow.test.assert(requests[1].messages[2].tool_call_id, "call-1", "Problem preserving OpenAI tool result id.");
    };

    exports.testAIOpenAIStreamingToolRecursionNoDuplication = function() {
        ow.loadAI();

        var g = new ow.ai.gpt("openai", { key: "test-key", model: "gpt-test" });
        var requests = [];
        g.setTool("echo", "Echo", { type: "object", properties: { value: { type: "number" } } }, function(args) {
            return { echoed: args.value };
        });

        g.model._requestStream = function(url, body) {
            requests.push(__cloneForTest(body));
            if (requests.length == 1) {
                return __makeOpenAISse([
                    {
                        choices: [
                            {
                                delta: {
                                    tool_calls: [
                                        {
                                            index: 0,
                                            id: "call-2",
                                            type: "function",
                                            function: {
                                                name: "echo",
                                                arguments: "{\"value\":8}"
                                            }
                                        }
                                    ]
                                }
                            }
                        ]
                    },
                    {
                        choices: [
                            {
                                finish_reason: "tool_calls",
                                delta: {}
                            }
                        ]
                    }
                ]);
            }

            return __makeOpenAISse([
                {
                    choices: [
                        {
                            delta: { content: "done" }
                        }
                    ]
                },
                {
                    choices: [
                        {
                            finish_reason: "stop",
                            delta: {}
                        }
                    ]
                }
            ]);
        };

        var res = g.rawPromptStream("use tool", "gpt-test", 0.1, false, [ "echo" ]);
        ow.test.assert(res.content, "done", "Problem finishing OpenAI streaming tool recursion.");
        ow.test.assert(requests.length, 2, "Problem with number of OpenAI streaming tool recursion requests.");
        ow.test.assert(requests[1].messages.length, 3, "Problem duplicating OpenAI streaming tool recursion messages.");
        ow.test.assert(requests[1].messages[1].tool_calls[0].id, "call-2", "Problem preserving OpenAI streaming tool call id.");
        ow.test.assert(requests[1].messages[2].tool_call_id, "call-2", "Problem preserving OpenAI streaming tool result id.");
    };

    exports.testAIOpenAIExportConversationFallsBackToToolName = function() {
        ow.loadAI();

        var g = new ow.ai.gpt("openai", { key: "test-key", model: "gpt-test" });
        g.setConversation([
            {
                role: "tool",
                content: "{\"echoed\":1}",
                tool_call_id: "call-5",
                tool_name: "echo"
            }
        ]);

        var exported = g.exportConversation();
        ow.test.assert(exported[0].toolResults[0].id, "call-5", "Problem exporting OpenAI tool result ids without a matching tool call.");
        ow.test.assert(exported[0].toolResults[0].name, "echo", "Problem falling back to the original OpenAI tool name during export.");
    };

    exports.testAIOllamaStreamingToolExecutionAndConversationIds = function() {
        ow.loadAI();

        var g = new ow.ai.gpt("ollama", { url: "http://127.0.0.1:11434", model: "llama-test" });
        var requests = [];
        g.setTool("echo", "Echo", { type: "object", properties: { value: { type: "number" } } }, function(args) {
            return { echoed: args.value };
        });

        g.model._requestStream = function(url, body) {
            requests.push(__cloneForTest(body));
            if (requests.length == 1) {
                return __makeOllamaStream([
                    {
                        message: {
                            content: "",
                            tool_calls: [
                                {
                                    id: "call-3",
                                    function: {
                                        name: "echo",
                                        arguments: "{\"value\":9}"
                                    }
                                }
                            ]
                        },
                        done: true
                    }
                ]);
            }

            return __makeOllamaStream([
                {
                    message: {
                        content: "done"
                    },
                    done: true
                }
            ]);
        };

        var res = g.rawPromptStream("use tool", "llama-test", 0.1, false, g.model.tools);
        ow.test.assert(res.content, "done", "Problem finishing Ollama streaming tool recursion.");
        ow.test.assert(requests.length, 2, "Problem with number of Ollama streaming tool recursion requests.");
        ow.test.assert(requests[1].messages.length, 3, "Problem duplicating Ollama streaming tool recursion messages.");
        ow.test.assert(requests[1].messages[1].tool_calls[0].id, "call-3", "Problem preserving Ollama streaming tool call id.");
        ow.test.assert(requests[1].messages[2].tool_call_id, "call-3", "Problem preserving Ollama streaming tool result id.");

        var g2 = new ow.ai.gpt("ollama", { url: "http://127.0.0.1:11434", model: "llama-test" });
        g2.setConversation([
            {
                role: "assistant",
                content: "",
                tool_calls: [
                    {
                        id: "call-4",
                        function: {
                            name: "echo",
                            arguments: "{\"value\":1}"
                        }
                    }
                ]
            },
            {
                role: "tool",
                content: "{\"echoed\":1}",
                tool_call_id: "call-4"
            }
        ]);

        var exported = g2.exportConversation();
        ow.test.assert(exported[0].toolCalls[0].id, "call-4", "Problem exporting Ollama tool call ids.");
        ow.test.assert(exported[1].toolResults[0].id, "call-4", "Problem exporting Ollama tool result ids.");

        var g3 = new ow.ai.gpt("ollama", { url: "http://127.0.0.1:11434", model: "llama-test" });
        g3.importConversation(exported);
        var imported = g3.getConversation();
        ow.test.assert(imported[0].tool_calls[0].id, "call-4", "Problem importing Ollama tool call ids.");
        ow.test.assert(imported[1].tool_call_id, "call-4", "Problem importing Ollama tool result ids.");
    };

    exports.testAIOllamaStreamingWarmsModelOnFreshConversation = function() {
        ow.loadAI();

        var g = new ow.ai.gpt("ollama", { url: "http://127.0.0.1:11434", model: "llama-test" });
        var warmRequests = [];
        var streamRequests = [];
        var deltas = [];

        g.model._request = function(url, body) {
            warmRequests.push({ url: url, body: __cloneForTest(body) });
            return { done: true };
        };

        g.model._requestStream = function(url, body) {
            streamRequests.push({ url: url, body: __cloneForTest(body) });
            return __makeOllamaStream([
                { message: { content: "part-1" }, done: false },
                { message: { content: "part-2" }, done: true }
            ]);
        };

        var res = g.rawPromptStream("stream me", "llama-test", 0.1, false, [], function(delta) {
            deltas.push(delta);
        });

        ow.test.assert(warmRequests.length, 1, "Problem warming Ollama before the first streaming request.");
        ow.test.assert(warmRequests[0].url, "/api/chat", "Problem using the Ollama chat endpoint for warmup.");
        ow.test.assert(warmRequests[0].body.messages, [], "Problem keeping the Ollama warmup request side-effect free.");
        ow.test.assert(streamRequests.length, 1, "Problem executing the streamed Ollama request after warmup.");
        ow.test.assert(streamRequests[0].body.messages, [ { role: "user", content: "stream me" } ], "Problem preserving the first streamed Ollama prompt after warmup.");
        ow.test.assert(deltas, [ "part-1", "part-2" ], "Problem preserving Ollama streaming deltas after warmup.");
        ow.test.assert(res.content, "part-1part-2", "Problem aggregating Ollama streaming content after warmup.");
    };
})();
