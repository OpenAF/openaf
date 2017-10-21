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
        var nn = new ow.ai.network({ type: "lstm", args: [2, 4, 4, 4, 1]});
        nn.train([{input: [0,0], output: [0]}, {input: [0,1], output: [1]}, {input: [1,0], output: [1]}, {input: [1,1], output :[0]}], { iterations: 250000, error: 0.001 });
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
        var nn = new ow.ai.network({ type: "lstm", args: [2, 4, 4, 4, 1]});
        nn.train([{input: [0,0], output: [0]}, {input: [0,1], output: [1]}, {input: [1,0], output: [1]}, {input: [1,1], output :[0]}], { iterations: 250000, error: 0.001 });
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
})();