// OpenWrap
// Author: nmaguiar@gmail.com

OpenWrap.ai = function() {
    if (isUnDef(this.synaptic)) {
        this.synaptic = require(getOpenAFJar() + "::js/synaptic.js");        
    }
    return ow.ai;
}

/**
 * <odoc>
 * <key>ow.ai.network(aMap) : ow.ai.network</key>
 * Creates a neural network given the parameters in aMap. aMap should contain a "type" parameter to indicate
 * the type of network (perceptron, lstm, liquid or hopfield). Then aMap should contain a "args" parameter to
 * provide each network inialization parameters. Please see "help ow.ai.network.[type of network]" for more details
 * about each one. 
 * </odoc>
 */
OpenWrap.ai.prototype.network = function(args) {
    if (isDef(args) && isObject(args)) {
        switch (args.type.toLowerCase()) {
        case 'perceptron': this.perceptron.apply(this, args.args); break;
        case 'lstm'      : this.lstm.apply(this, args.args); break;
        case 'liquid'    : this.liquid.apply(this, args.args); break;
        case 'hopfield'  : this.hopfield.apply(this, args.args); break;
        }
    }
}

/**
 * <odoc>
 * <key>ow.ai.network.perceptron(args) : ow.ai.network</key>
 * Perceptron or feed-forward neural networks. There is a minimum of 3 layers (input, hidden and output) and a any
 * nmumber of hidden layers. args = [2, 3, 1] means 2 input neurons, 3 hidden neurons and 1 output neuron; args = [2, 10, 10, 10, 10, 1]
 * means 2 input neurons, 4 layers of 10 neurons and 1 output neuron.
 * </odoc>
 */
OpenWrap.ai.prototype.network.prototype.perceptron = function(args) {
    var ar = Array.prototype.slice.call(arguments);
    ar.unshift(ow.ai.synaptic.Architect.Perceptron);
    this.__net = new (ow.ai.synaptic.Architect.Perceptron.bind.apply(ow.ai.synaptic.Architect.Perceptron, ar))();
};

/**
 * <odoc>
 * <key>ow.ai.network.lstm(args) : ow.ai.network</key>
 * LSTM (Long short-term memory) are well-suited to learn from experience to classify, process and predict time series when
 * there are very long time lags of unknown size between important events. There is a minimum of 3 layers (input, memory block (input, memory cell, forget gate, output gate), output).
 * args = [2, 6, 1] means 2 input, 6 memory blocks, 1 output; args = [2, 4, 4, 4, 1] means 2 input neurons, 3 memory blocks and 1 output.
 * </odoc>
 */
OpenWrap.ai.prototype.network.prototype.lstm = function(args) {
    var ar = Array.prototype.slice.call(arguments);
    ar.unshift(ow.ai.synaptic.Architect.LSTM);
    this.__net = new (ow.ai.synaptic.Architect.LSTM.bind.apply(ow.ai.synaptic.Architect.LSTM, ar))();    
};

/**
 * <odoc>
 * <key>ow.ai.network.liquid(args) : ow.ai.network</key>
 * Liquid state machines are neural networks where neurons are randomly connected to each other. The recurrent nature of the connections turns the time
 * varying input into a spatio-temporal pattern of activations in the network nodes. You need to provide args = [number of inputs, size of pool of neurons, number of
 * outputs, number of random connections, number of random gates] (e.g. 2, 20, 1, 30, 10).
 * </odoc>
 */
OpenWrap.ai.prototype.network.prototype.liquid = function(args) {
    var ar = Array.prototype.slice.call(arguments);
    ar.unshift(ow.ai.synaptic.Architect.Liquid);
    this.__net = new (ow.ai.synaptic.Architect.Liquid.bind.apply(ow.ai.synaptic.Architect.Liquid, ar))();       
};

/**
 * <odoc>
 * <key>ow.ai.network.hopfield(args) : ow.ai.network</key>
 * Hopfield serves as a content-addressable memory remembering patterns and when feed with new patterns the network returns the most similar one from the
 * patterns it was trained to remember. You need to provide then number of input patterns args = [ 10 ]. 
 * </odoc>
 */
OpenWrap.ai.prototype.network.prototype.hopfield = function(args) {
    var ar = Array.prototype.slice.call(arguments);
    ar.unshift(ow.ai.synaptic.Architect.Hopfield);
    this.__net = new (ow.ai.synaptic.Architect.Liquid.bind.apply(ow.ai.synaptic.Architect.Hopfield, ar))();       
};

/**
 * <odoc>
 * <key>ow.ai.network.train(trainingData, trainArgs)</key>
 * Trains the current network with the trainingData provided. trainingData should be an array of maps. Each 
 * map entry should have a input and output keys. Each input and output entries should be an array for the 
 * entry values and output values normalized to a decimal number between 0 and 1. Example:\
 * [{input: [0,0], output: [0]}, {input: [0,1], output: [1]}, {input: [1,0], output: [1]}, {input: [1,1], output :[0]}]\.
 * \
 * </odoc>
 */
OpenWrap.ai.prototype.network.prototype.train = function(trainingData, trainArgs) {
    if (isUnDef(this.__net)) throw "Network not initialized."

    var t = new ow.ai.synaptic.Trainer(this.__net);
    t.train(trainingData, trainArgs);
    return t;
};

/**
 * <odoc>
 * <key>ow.ai.network.get(inputArray) : Array</key>
 * Given an inputArray of decimal values, normalize between 0 and 1, will activate the current network and 
 * return an output array of decimal values between 0 and 1.
 * </odoc>
 */
OpenWrap.ai.prototype.network.prototype.get = function(inputData) {
    if (isUnDef(this.__net)) throw "Network not initialized."

    return this.__net.activate(inputData);
};

/**
 * <odoc>
 * <key>ow.ai.network.toJson() : Map</key>
 * Returns a map representation of the current network to be later rebuilt with the fromJson function.
 * </odoc>
 */
OpenWrap.ai.prototype.network.prototype.toJson = function() {
    if (isUnDef(this.__net)) throw "Network not initialized."

    return this.__net.toJSON();
};

/**
 * <odoc>
 * <key>ow.ai.network.fromJson(aMap)</key>
 * Tries to rebuild the network from aMap returned previously by a toJson function.
 * </odoc>
 */
OpenWrap.ai.prototype.network.prototype.fromJson = function(aJSON) {
    this.__net = ow.ai.synaptic.Network.fromJSON(aJSON);
};

/**
 * <odoc>
 * <key>ow.ai.network.writeFile(aFile)</key>
 * Writes a compressed file with the map representation of the current network.
 * </odoc>
 */
OpenWrap.ai.prototype.network.prototype.writeFile = function(aFile) {
    io.writeFileBytes(aFile, compress(this.toJson()));
};

/**
 * <odoc>
 * <key>ow.ai.network.readFile(aFile)</key>
 * Rebuilds a network from a map stored in aFile previously with ow.ai.network.writeFile.
 * </odoc>
 */
OpenWrap.ai.prototype.network.prototype.readFile = function(aFile) {
    this.fromJson(uncompress(io.readFileBytes(aFile)));
};

OpenWrap.ai.prototype.normalize = {
    /**
     * <odoc>
     * <key>ow.ai.normalize.scaleArray(anArray, aMax, aMin) : Array</key>
     * Given anArray of numbers tries to normalize returning an array of values between 0 and 1. If
     * aMax or aMin are not provided they will be infered from the provided anArray.
     * </odoc>
     */
    scaleArray: function(anArray, aMax, aMin) {
        var max = isDef(aMax) ? aMax : anArray.reduce((a,b) => { return Math.max(a,b);});
        var min = isDef(aMin) ? aMin : anArray.reduce((a,b) => { return Math.min(a,b);});

        return anArray.map((v) => { if (v > aMax) v = aMax; if (v < aMin) v = aMin; return (v - min)/(max - min); });
    },

    /**
     * <odoc>
     * <key>ow.ai.normalize.intArray(anArray) : Array</key>
     * Returns anArray where all numbers have been rounded to an integer value.
     * </odoc>
     */
    intArray: function(anArray) {
        var res = [];

        for(var v in ar) {
            res.push(Math.round(ar[v]));
        }

        return res;
    }
};