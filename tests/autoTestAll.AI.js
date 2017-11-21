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
        var nn = new ow.ai.network({ type: "liquid", args: [2, 20, 1, 30, 10]});
        nn.train([{input: [0,0], output: [0]}, {input: [0,1], output: [1]}, {input: [1,0], output: [1]}, {input: [1,1], output :[0]}]);
        ow.test.assert(Math.round(nn.get([1,0])), 1, "Problem with ow.ai liquid 1 XOR 0");
        ow.test.assert(Math.round(nn.get([1,1])), 0, "Problem with ow.ai liquid 1 XOR 1");
        ow.test.assert(Math.round(nn.get([0,1])), 1, "Problem with ow.ai liquid 0 XOR 1");
        ow.test.assert(Math.round(nn.get([0,0])), 0, "Problem with ow.ai liquid 1 XOR 0");   
    };

    exports.testAILSTMXOR = function() {
        ow.loadAI();
        var nn = new ow.ai.network({ type: "lstm", args: [2, 6, 2, 1, 1]});
        nn.train([{input: [0,0], output: [0]}, {input: [0,1], output: [1]}, {input: [1,0], output: [1]}, {input: [1,1], output :[0]}], { iterations: 100000, error: 0.001 });
        ow.test.assert(Math.round(nn.get([1,0])), 1, "Problem with ow.ai lstm 1 XOR 0");
        ow.test.assert(Math.round(nn.get([1,1])), 0, "Problem with ow.ai lstm 1 XOR 1");
        ow.test.assert(Math.round(nn.get([0,1])), 1, "Problem with ow.ai lstm 0 XOR 1");
        ow.test.assert(Math.round(nn.get([0,0])), 0, "Problem with ow.ai lstm 1 XOR 0");   
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

        af.rm("autoTestAll.xorNet.gz"); 
    };    

    exports.testAILSTMXORSave = function() {
        ow.loadAI();
        var nn = new ow.ai.network({ type: "lstm", args: [2, 6, 2, 1, 1]});
        nn.train([{input: [0,0], output: [0]}, {input: [0,1], output: [1]}, {input: [1,0], output: [1]}, {input: [1,1], output :[0]}], { iterations: 100000, error: 0.001 });
        nn.writeFile("autoTestAll.ai.xorNet.lstm.gz");

        var na = new ow.ai.network();
        na.readFile("autoTestAll.ai.xorNet.lstm.gz");

        ow.test.assert(Math.round(nn.get([1,0])), 1, "Problem with saved ow.ai lstm 1 XOR 0");
        ow.test.assert(Math.round(nn.get([1,1])), 0, "Problem with saved ow.ai lstm 1 XOR 1");
        ow.test.assert(Math.round(nn.get([0,1])), 1, "Problem with saved ow.ai lstm 0 XOR 1");
        ow.test.assert(Math.round(nn.get([0,0])), 0, "Problem with saves ow.ai lstm 1 XOR 0");   

        af.rm("autoTestAll.ai.xorNet.lstm.gz");
    };

    exports.testAILiquidXORSave = function() {
        ow.loadAI();
        var nn = new ow.ai.network({ type: "liquid", args: [2, 20, 1, 30, 10]});
        nn.train([{input: [0,0], output: [0]}, {input: [0,1], output: [1]}, {input: [1,0], output: [1]}, {input: [1,1], output :[0]}]);
        nn.writeFile("autoTestAll.ai.xorNet.liquid.gz");

        var na = new ow.ai.network();
        na.readFile("autoTestAll.ai.xorNet.liquid.gz");

        ow.test.assert(Math.round(nn.get([1,0])), 1, "Problem with saved ow.ai liquid 1 XOR 0");
        ow.test.assert(Math.round(nn.get([1,1])), 0, "Problem with saved ow.ai liquid 1 XOR 1");
        ow.test.assert(Math.round(nn.get([0,1])), 1, "Problem with saved ow.ai liquid 0 XOR 1");
        ow.test.assert(Math.round(nn.get([0,0])), 0, "Problem with saves ow.ai liquid 1 XOR 0");   

        af.rm("autoTestAll.ai.xorNet.liquid.gz");
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
})();
