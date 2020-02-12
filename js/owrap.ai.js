// OpenWrap
// Author: nmaguiar@gmail.com

OpenWrap.ai = function() {
    if (isUnDef(this.synaptic)) {
        //this.synaptic = require(getOpenAFJar() + "::js/synaptic.js");        
        this.synaptic = loadCompiledRequire("synaptic_js"); 
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
};

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
    if (isUnDef(this.__net)) throw "Network not initialized.";

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
    if (isUnDef(this.__net)) throw "Network not initialized.";

    return this.__net.activate(inputData);
};

/**
 * <odoc>
 * <key>ow.ai.network.put(inputArray, outputArray, learningRate)</key>
 * Given an inputArray of decimal values, normalize between 0 and 1, will activate the current network and then
 * the outputArray of decimal values, normalize between 0 and 1, with an optionial learningRate (defaults to 0.3).
 * </odoc>
 */
OpenWrap.ai.prototype.network.prototype.put = function(inputData, outputData, learningRate) {
    _$(this.__net).$_("Network not initialized.");
    learningRate = _$(learningRate).isNumber().default(0.3);

    this.__net.activate(inputData);
    this.__net.propagate(learningRate, outputData);
};

/**
 * <odoc>
 * <key>ow.ai.network.toJson() : Map</key>
 * Returns a map representation of the current network to be later rebuilt with the fromJson function.
 * </odoc>
 */
OpenWrap.ai.prototype.network.prototype.toJson = function() {
    if (isUnDef(this.__net)) throw "Network not initialized.";

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
    intArray: function(ar) {
        var res = [];

        for(var v in ar) {
            res.push(Math.round(ar[v]));
        }

        return res;
    },

    /**
     * <odoc>
     * <key>ow.ai.normalize.withSchema(aSimpleMapOfData, aMapSchema) : Array</key>
     * Tries to normalize and return aSimpleMapOfData normalized according with aMapSchema provided. Each element of aMapSchema
     * should be a map describing how to normalize aSimpleMapOfData. Example:\
     * \
     * var ar = [\
     *    {name:'workout', duration:'120', enjoy: true, time:1455063275, tags:['gym', 'weights'], crucial: false },\
     *    {name:'lunch', duration:'45', enjoy: false, time:1455063275, tags:['salad', 'wine'], crucial: true },\
     *    {name:'sleep', duration:'420', enjoy: true, time:1455063275, tags:['bed', 'romance'], crucial: true}\
     * ];\
     * \
     * var sar = {\
     *    name    : { col: 0, oneOf: [ 'workout', 'lunch', 'sleep' ] },\
     *    duration: { col: 1, min: 0, max: 1000 },\
     *    enjoy   : { col: 2 },\
     *    tags    : { col: 3, anyOf: [ 'gym', 'weights', 'salad', 'wine', 'bed', 'romance' ] },\
     *    crucial : { col: 4, scaleOf: [\
     *      { val: true,  weight: 0.85 },\
     *      { val: false, weight: 0.15 }\
     *    ]},\
     * };\
     * \
     * $from(ar).sort("time").select((r) => { return normalize(r, sar); });\
     * \
     * </odoc>
     */
    withSchema: function(aAR, sAR) {
        var res = [];
        loadLodash();
    
        for(var s in sAR) {
            // Ensure it has a col
            if (isDef(sAR[s].col)) {
                // If it has a max
                if (isDef(sAR[s].max)) {
                    res[sAR[s].col] = ow.ai.normalize.scaleArray([aAR[s]], sAR[s].max, sAR[s].min);
                    continue;
                }
                if (isDef(sAR[s].oneOf) && !isArray(aAR[s])) {
                    var subres = [];
                    for(var ss = 0; ss < sAR[s].oneOf.length; ss++) {
                        subres[ss] = 0;
                    }
                    subres[sAR[s].oneOf.indexOf(aAR[s])] = 1;
                    res[sAR[s].col] = subres;
                    continue;
                }
                if (isDef(sAR[s].anyOf) && isArray(aAR[s])) {
                    var subres = [];
                    for(var ss = 0; ss < sAR[s].anyOf.length; ss++) {
                        subres[ss] = 0;
                    }        
                    for(var ss in aAR[s]) {
                        subres[sAR[s].anyOf.indexOf(aAR[s][ss])] = 1;
                    }
                    res[sAR[s].col] = subres;
                    continue;
                }
                if (isDef(sAR[s].scaleOf)) {
                    if (isArray(aAR[s])) {
                        var subres = [];
                        for(var ss in aAR[s]) {
                            subres[ss] = $stream(sAR[s].scaleOf).filter({ val: aAR[s][ss] }).toArray()[0].weight;
                        }
                        res[sAR[s].col] = subres;
                    } else {
                        res[sAR[s].col] = $stream(sAR[s].scaleOf).filter({ val: aAR[s] }).toArray()[0].weight;
                    }
                    continue;
                }
                // Else assume it's boolean
                res[sAR[s].col] =  (aAR[s]) ? true : false;
            }
        }
    
        return _.flatten(res);
    },

    /**
     * <odoc>
     * <key>ow.ai.normalize.toFeaturesArray(anArrayOfObjects, ignoredAttrs) : Map</key>
     * Tries to convert anArrayOfObjects into an array of array of values where each value is positioned
     * in the resulting array by the corresponding key sorted. The result will be a map with the resulting array
     * in 'data' (with the features values ignoring any key on ignoredAttrs), the 'ignoredAttrs' and keys with all the 'keys'
     * identified.
     * </odoc>
     */
    toFeaturesArray: function(anArrayOfObj, ignoredAttrs) {
        ignoredAttrs = _$(ignoredAttrs).isArray().default([]);

        var res = [], allkeys = [];
        // Get keys
        for(let obji in anArrayOfObj) {
            var obj = anArrayOfObj[obji];
            var keys = Object.keys(obj);
            for(let ki in keys) {
                if (allkeys.indexOf(keys[ki]) < 0 && ignoredAttrs.indexOf(keys[ki]) < 0) {
                    allkeys.push(keys[ki]);
                }
            }
        }
        allkeys = allkeys.sort();

        // Get data
        for(let obji in anArrayOfObj) {
            var obj = anArrayOfObj[obji];
            var line = [];
            for(let k in allkeys) {
                line.push(obj[allkeys[k]]);
            }
            res.push(line);
        }

        return {
            data: res,
            ignoredAttrs: ignoredAttrs,
            keys: allkeys
        };
    }
};

/**
 * <odoc>
 * <key>ow.ai.decisionTree(aMap) : Object</key>
 * Provides a wrapper to access the existing decision tree algorithms included:\
 * \
 * ID3:\
 *   type              'id3'
 *   trainingSet       (array of maps)   The training data\
 *   categoryAttr      (key name)        The map key to build the decision tree on\
 *   ignoredAttributes (array of keys)   The list of keys to be ignored in each map\
 * \
 * RandomForest:\
 *   type              'randomforest'
 *   trainingSet       (array of maps)   The training data\
 *   categoryAttr      (key name)        The map key to build the decision tree on\
 *   ignoredAttributes (array of keys)   The list of keys to be ignored in each map\
 *   treesNumber       (number)          The number of decision trees to use\
 * \
 * C45:\
 *   type              'c45' 
 *   data              (array of arrays) The training data\
 *   features          (arrays of keys)  The keys name by order of each array data value\
 *   featureTypes      (arrays of types) Categorization of each attribute between 'category' and 'number'\
 *   target            (key)             The target key name (the last of each array data value)\
 * \
 * </odoc>
 */
OpenWrap.ai.prototype.decisionTree = function(args) {
    args = _$(args).isObject().default({ type: "c45" });

    var robj = {
        predict  : ()=>{},
        fromJson : ()=>{},
        toJson   : ()=>{},
        readFile : function(aFile) {
            this.fromJson(uncompress(io.readFileBytes(aFile)));
        },
        writeFile: function(aFile) {
            io.writeFileBytes(aFile, compress(this.toJson()));
        }
    };

    var dt, c45;
    switch (args.type.toLowerCase()) {
    case 'id3': 
        if (Object.keys(args).length > 1) {
            dt = new ow.ai.decisionTree.ID3();
            dt.DecisionTree(args);
            robj.dt = dt;
        }

        robj.predict  = (data) => { return robj.dt.DecisionTree_predict(data); };
        robj.fromJson = (j) => { robj.dt = ow.ai.decisionTree.__fromJsonID3DT(j); };
        robj.toJson   = ( ) => { return ow.ai.decisionTree.__toJsonID3(robj.dt); };
        return robj;
    case 'randomforest':
        if (Object.keys(args).length > 1) {
            args.treesNumber = _$(args.treesNumber).default(3);
            dt = new ow.ai.decisionTree.ID3();
            dt.RandomForest(args, args.treesNumber);
            robj.dt = dt;
        }

        robj.predict  = (data) => { return robj.dt.RandomForest_predict(data); };
        robj.fromJson = (j) => { robj.dt = ow.ai.decisionTree.__fromJsonID3RF(j); };
        robj.toJson   = ( ) => { return ow.ai.decisionTree.__toJsonID3(robj.dt); };
        return robj;
    case 'c45':
        if (Object.keys(args).length > 1) {
            c45 = new ow.ai.decisionTree.C45();
            c45.train(args, (e) => { if (e) { if(isDef(args.error) && isFunction(args.error)) { args.error(e); } else { logErr(e); } } });
            robj.dt = c45;
        }

        robj.predict  = (data) => { return robj.dt.classify(data); };
        robj.fromJson = (j) => { robj.dt = ow.ai.decisionTree.__fromJsonC45(j); };
        robj.toJson   = ( ) => { return ow.ai.decisionTree.__toJsonC45(robj.dt); };
        return robj;
    }
};

OpenWrap.ai.prototype.decisionTree.__toJsonC45 = function(aC45) {
    _$(aC45).isObject().$_("Please provide a C45");

    return aC45;
};

OpenWrap.ai.prototype.decisionTree.__fromJsonC45 = function(aJson) {
    _$(aJson).isObject().$_("Please provide aJson structure.");

    ow.loadObj();
    return ow.obj.fromJson(aJson).withObject(ow.ai.decisionTree.C45.prototype).build();
};

OpenWrap.ai.prototype.decisionTree.__toJsonID3 = function(aID3) {
    _$(aID3).isObject().$_("Please provide an ID3");

    return aID3;
};

OpenWrap.ai.prototype.decisionTree.__fromJsonID3DT = function(aJson) {
    _$(aJson).isObject().$_("Please provide aJson structure.");

    ow.loadObj();
    return ow.obj.fromJson(aJson).withObject(ow.ai.decisionTree.ID3.prototype).build();
};

OpenWrap.ai.prototype.decisionTree.__fromJsonID3RF = function(aJson) {
    _$(aJson).isObject().$_("Please provide aJson structure.");

    ow.loadObj();
    return ow.obj.fromJson(aJson).withObject(ow.ai.decisionTree.ID3.prototype).build();
};

// FROM: https://github.com/lagodiuk/decision-tree-js/
// LICENSE: MIT
OpenWrap.ai.prototype.decisionTree.ID3 = function() { 
};

    OpenWrap.ai.prototype.decisionTree.ID3.prototype.predicates = {
        '==': function (a, b) { return a == b },
        '>=': function (a, b) { return a >= b }
    };

    /**
     * Creates an instance of DecisionTree
     *
     * @constructor
     * @param builder - contains training set and
     *                  some configuration parameters
     */
    OpenWrap.ai.prototype.decisionTree.ID3.prototype.DecisionTree = function(builder) {        
        this.root = this.buildDecisionTree({
            trainingSet: builder.trainingSet,
            ignoredAttributes: this.arrayToHashSet(builder.ignoredAttributes),
            categoryAttr: builder.categoryAttr || 'category',
            minItemsCount: builder.minItemsCount || 1,
            entropyThrehold: builder.entropyThrehold || 0.01,
            maxTreeDepth: builder.maxTreeDepth || 70
        });
    };
          
    OpenWrap.ai.prototype.decisionTree.ID3.prototype.DecisionTree_predict = function(item) {
        return this.predict(this.root, item);
    };

    /**
     * Creates an instance of RandomForest
     * with specific number of trees
     *
     * @constructor
     * @param builder - contains training set and some
     *                  configuration parameters for
     *                  building decision trees
     */
    OpenWrap.ai.prototype.decisionTree.ID3.prototype.RandomForest = function(builder, treesNumber) {
        this.trees = this.buildRandomForest(builder, treesNumber);
    };
          
    OpenWrap.ai.prototype.decisionTree.ID3.prototype.RandomForest_predict = function (item) {
        return this.predictRandomForest(this.trees, item);
    };
    
    /**
     * Transforming array to object with such attributes 
     * as elements of array (afterwards it can be used as HashSet)
     */
    OpenWrap.ai.prototype.decisionTree.ID3.prototype.arrayToHashSet = function(array) {
        var hashSet = {};
        if (array) {
            for(var i in array) {
                var attr = array[i];
                hashSet[attr] = true;
            }
        }
        return hashSet;
    };
    
    /**
     * Calculating how many objects have the same 
     * values of specific attribute.
     *
     * @param items - array of objects
     *
     * @param attr  - variable with name of attribute, 
     *                which embedded in each object
     */
    OpenWrap.ai.prototype.decisionTree.ID3.prototype.countUniqueValues = function(items, attr) {
        var counter = {};

        // detecting different values of attribute
        for (var i = items.length - 1; i >= 0; i--) {
            // items[i][attr] - value of attribute
            counter[items[i][attr]] = 0;
        }
          
        // counting number of occurrences of each of values
        // of attribute
        for (var i = items.length - 1; i >= 0; i--) {
            counter[items[i][attr]] += 1;
        }

        return counter;
    }
    
    /**
     * Calculating entropy of array of objects 
     * by specific attribute.
     *
     * @param items - array of objects
     *
     * @param attr  - variable with name of attribute, 
     *                which embedded in each object
     */
    OpenWrap.ai.prototype.decisionTree.ID3.prototype.entropy = function(items, attr) {
        // counting number of occurrences of each of values
        // of attribute
        var counter = this.countUniqueValues(items, attr);

        var entropy = 0;
        var p;
        for (var i in counter) {
            p = counter[i] / items.length;
            entropy += -p * Math.log(p);
        }

        return entropy;
    };
          
    /**
     * Splitting array of objects by value of specific attribute, 
     * using specific predicate and pivot.
     *
     * Items which matched by predicate will be copied to 
     * the new array called 'match', and the rest of the items 
     * will be copied to array with name 'notMatch'
     *
     * @param items - array of objects
     *
     * @param attr  - variable with name of attribute,
     *                which embedded in each object
     *
     * @param predicate - function(x, y) 
     *                    which returns 'true' or 'false'
     *
     * @param pivot - used as the second argument when 
     *                calling predicate function:
     *                e.g. predicate(item[attr], pivot)
     */
    OpenWrap.ai.prototype.decisionTree.ID3.prototype.split = function(items, attr, predicate, pivot) {
        var match = [];
        var notMatch = [];

        var item,
            attrValue;
          
        for (var i = items.length - 1; i >= 0; i--) {
            item = items[i];
            attrValue = item[attr];

            var fn = eval(predicate);
            if (fn(attrValue, pivot)) {
                match.push(item);
            } else {
                notMatch.push(item);
            }
        };

        return {
            match: match,
            notMatch: notMatch
        };
    };

    /**
     * Finding value of specific attribute which is most frequent
     * in given array of objects.
     *
     * @param items - array of objects
     *
     * @param attr  - variable with name of attribute, 
     *                which embedded in each object
     */
    OpenWrap.ai.prototype.decisionTree.ID3.prototype.mostFrequentValue = function(items, attr) {
        // counting number of occurrences of each of values
        // of attribute
        var counter = this.countUniqueValues(items, attr);

        var mostFrequentCount = 0;
        var mostFrequentValue;

        for (var value in counter) {
            if (counter[value] > mostFrequentCount) {
                mostFrequentCount = counter[value];
                mostFrequentValue = value;
            }
        };

        return mostFrequentValue;
    };


    /**
     * Function for building decision tree
     */
    OpenWrap.ai.prototype.decisionTree.ID3.prototype.buildDecisionTree = function(builder) {
        var trainingSet = builder.trainingSet;
        var minItemsCount = builder.minItemsCount;
        var categoryAttr = builder.categoryAttr;
        var entropyThrehold = builder.entropyThrehold;
        var maxTreeDepth = builder.maxTreeDepth;
        var ignoredAttributes = builder.ignoredAttributes;

        if ((maxTreeDepth == 0) || (trainingSet.length <= minItemsCount)) {
            // restriction by maximal depth of tree
            // or size of training set is to small
            // so we have to terminate process of building tree
            return {
                category: this.mostFrequentValue(trainingSet, categoryAttr)
            };
        }

        var initialEntropy = this.entropy(trainingSet, categoryAttr);

        if (initialEntropy <= entropyThrehold) {
            // entropy of training set too small
            // (it means that training set is almost homogeneous),
            // so we have to terminate process of building tree
            return {
                category: this.mostFrequentValue(trainingSet, categoryAttr)
            };
        }

        // used as hash-set for avoiding the checking of split by rules
        // with the same 'attribute-predicate-pivot' more than once
        var alreadyChecked = {};
          
        // this variable expected to contain rule, which splits training set
        // into subsets with smaller values of entropy (produces informational gain)
        var bestSplit = {gain: 0};

        for (var i = trainingSet.length - 1; i >= 0; i--) {
            var item = trainingSet[i];

            // iterating over all attributes of item
            for (var attr in item) {
                if ((attr == categoryAttr) || ignoredAttributes[attr]) {
                    continue;
                }

                // let the value of current attribute be the pivot
                var pivot = item[attr];

                // pick the predicate
                // depending on the type of the attribute value
                var predicateName;
                if (typeof pivot == 'number') {
                    predicateName = '>=';
                } else {
                    // there is no sense to compare non-numeric attributes
                    // so we will check only equality of such attributes
                    predicateName = '==';
                }

                var attrPredPivot = attr + predicateName + pivot;
                if (alreadyChecked[attrPredPivot]) {
                    // skip such pairs of 'attribute-predicate-pivot',
                    // which been already checked
                    continue;
                }
                alreadyChecked[attrPredPivot] = true;

                var predicate = this.predicates[predicateName].toString();
          
                // splitting training set by given 'attribute-predicate-value'
                var currSplit = this.split(trainingSet, attr, predicate, pivot);

                // calculating entropy of subsets
                var matchEntropy = this.entropy(currSplit.match, categoryAttr);
                var notMatchEntropy = this.entropy(currSplit.notMatch, categoryAttr);

                // calculating informational gain
                var newEntropy = 0;
                newEntropy += matchEntropy * currSplit.match.length;
                newEntropy += notMatchEntropy * currSplit.notMatch.length;
                newEntropy /= trainingSet.length;
                var currGain = initialEntropy - newEntropy;

                if (currGain > bestSplit.gain) {
                    // remember pairs 'attribute-predicate-value'
                    // which provides informational gain
                    bestSplit = currSplit;
                    bestSplit.predicateName = predicateName;
                    bestSplit.predicate = predicate;
                    bestSplit.attribute = attr;
                    bestSplit.pivot = pivot;
                    bestSplit.gain = currGain;
                }
            }
        }

        if (!bestSplit.gain) {
            // can't find optimal split
            return { category: this.mostFrequentValue(trainingSet, categoryAttr) };
        }

        // building subtrees
          
        builder.maxTreeDepth = maxTreeDepth - 1;

        builder.trainingSet = bestSplit.match;
        var matchSubTree = this.buildDecisionTree(builder);

        builder.trainingSet = bestSplit.notMatch;
        var notMatchSubTree = this.buildDecisionTree(builder);

        return {
            attribute: bestSplit.attribute,
            predicate: bestSplit.predicate,
            predicateName: bestSplit.predicateName,
            pivot: bestSplit.pivot,
            match: matchSubTree,
            notMatch: notMatchSubTree,
            matchedCount: bestSplit.match.length,
            notMatchedCount: bestSplit.notMatch.length
        };
    };

    /**
     * Classifying item, using decision tree
     */
    OpenWrap.ai.prototype.decisionTree.ID3.prototype.predict = function(tree, item) {
        var attr,
            value,
            predicate,
            pivot;
        
        // Traversing tree from the root to leaf
        while(true) {
          
            if (tree.category) {
                // only leafs contains predicted category
                return tree.category;
            }

            attr = tree.attribute;
            value = item[attr];
            
            predicate = eval(tree.predicate);
            //predicate = this.predicates[tree.predicateName];
            pivot = tree.pivot;

            // move to one of subtrees
            if (predicate(value, pivot)) {
                tree = tree.match;
            } else {
                tree = tree.notMatch;
            }
        }
    };

    /**
     * Building array of decision trees
     */
    OpenWrap.ai.prototype.decisionTree.ID3.prototype.buildRandomForest = function(builder, treesNumber) {
        var items = builder.trainingSet;
          
        // creating training sets for each tree
        var trainingSets = [];
        for (var t = 0; t < treesNumber; t++) {
            trainingSets[t] = [];
        }
        for (var i = items.length - 1; i >= 0 ; i--) {
          // assigning items to training sets of each tree
          // using 'round-robin' strategy
          var correspondingTree = i % treesNumber;
          trainingSets[correspondingTree].push(items[i]);
        }

        // building decision trees
        var forest = [];
        for (var t = 0; t < treesNumber; t++) {
            builder.trainingSet = trainingSets[t];

            var dt = new ow.ai.decisionTree.ID3();
            var tree = dt.DecisionTree(builder);
            forest.push(dt);
        }
        return forest;
    };

    /**
     * Each of decision tree classifying item
     * ('voting' that item corresponds to some class).
     *
     * This function returns hash, which contains 
     * all classifying results, and number of votes 
     * which were given for each of classifying results
     */
    OpenWrap.ai.prototype.decisionTree.ID3.prototype.predictRandomForest = function(forest, item) {
        var result = {};
        for (var i in forest) {
            var tree = forest[i];
            //var fn = eval(tree.predicate);
            if (isUnDef(tree.predict)) tree.predict = this.predict;
            var prediction = tree.predict(tree.root, item);
            //var prediction = fn(item);
            result[prediction] = result[prediction] ? result[prediction] + 1 : 1;
        }
        return result;
    };

    /*var exports = {};
    exports.DecisionTree = DecisionTree;
    exports.RandomForest = RandomForest;
    return exports;*/

/**
 * FROM: https://github.com/miguelmota/C4.5
 * LICENSE: MIT
 */
OpenWrap.ai.prototype.decisionTree.C45 = function() {
    this.features = [];
    this.targets = [];
    this.data = void 0;
    this.target = void 0;
    this.features = void 0;
    this.featureTypes = void 0;
    this.targets = void 0;
    this.model = void 0;
    this.error = void 0;
};
  
OpenWrap.ai.prototype.decisionTree.C45.prototype = {
    unique: function (col) {
        var u = {},
            a = [];
        for (var i = 0, l = col.length; i < l; ++i) {
            if (u.hasOwnProperty(col[i])) {
                continue;
            }
            a.push(col[i]);
            u[col[i]] = 1;
        }
        return a;
    },
    find: function (col, pred) {
        var value;
        col.forEach(function (item) {
            var result = pred(item);
            if (result) {
                value = item;
            }
        });
        return value;
    },
    max: function (array, fn) {
        var max = -Infinity;
        var index;
        for (var i = 0; i < array.length; i++) {
            var result = fn(array[i]);
            if (result >= max) {
                max = result;
                index = i;
            }
        }
        return typeof index !== 'undefined' ? array[index] : max;
    },
    sortBy: function (col, fn) {
        col = [].slice.call(col);
        return col.sort(fn);
    },
    /**
     * train
     *
     * @param {object} options
     * @param {array} options.data - training data
     * @param {string} options.target - class label
     * @param {array} options.features - features names
     * @param {array} options.featureTypes - features type (ie 'category', 'number')
     * @param {function} callback - callback, containing error and model as parameters
     */
    train: function (options, callback) {
        this.data = options.data;
        this.target = options.target;
        this.features = options.features;
        this.featureTypes = options.featureTypes;
        this.error = options.error;
        var parent = this;

        this.featureTypes.forEach(function (f) {
            if (['number', 'category'].indexOf(f) === -1) {
                parent.error = new Error('Unrecognized feature type');
                return;
            }
        });

        this.targets = this.unique(this.data.map(function (d) {
            return d[d.length - 1];
        }));
        //this.features = features;
        //this.targets = targets;

        this.model = this._c45(this.data, this.target, this.features, this.featureTypes, 0);
        //callback(null, this.model);
    },

    classify: function classify(sample) {
        // root is feature (attribute) containing all sub values
        var root = this.model;

        if (typeof root === 'undefined') {
            this.errors = new Error('model is undefined');
        }

        while (root.type !== 'result') {
            var childNode;

            if (root.type === 'feature_number') {
                var featureName = root.name;
                var sampleVal = parseFloat(sample[featureName]);

                if (sampleVal <= root.cut) {
                    childNode = root.values[1];
                } else {
                    childNode = root.values[0];
                }
            } else {
                // feature syn attribute
                var feature = root.name;
                var sampleValue = sample[this.features.indexOf(feature)];

                // sub value , containing 2 childs
                childNode = this.find(root.values, function (x) {
                    return x.name === sampleValue;
                });
            }

            // non trained feature
            if (typeof childNode === 'undefined') {
                return 'unknown';
            }
            root = childNode.child;
        }
        return root.value;
    },

    _c45: function (data, target, features, featureTypes, depth) {
        var targets = this.unique(data.map(function (d) {
            return d[d.length - 1];
        }));

        if (!targets.length) {
            return {
                type: 'result',
                value: 'none data',
                name: 'none data'
            };
        }

        if (targets.length === 1) {
            return {
                type: 'result',
                value: targets[0],
                name: targets[0]
            };
        }

        if (!features.length) {
            var topTarget = this.mostCommon(targets);
            return {
                type: 'result',
                value: topTarget,
                name: topTarget
            };
        }

        var bestFeatureData = this.maxGain(data, target, features, featureTypes);
        var bestFeature = bestFeatureData.feature;

        var remainingFeatures = features.slice(0);
        remainingFeatures.splice(features.indexOf(bestFeature), 1);

        if (featureTypes[this.features.indexOf(bestFeature)] === 'category') {
            var possibleValues = this.unique(data.map(function (d) {
                return d[this.features.indexOf(bestFeature)];
            }.bind(this)));
            var node = {
                name: bestFeature,
                type: 'feature_category',
                values: possibleValues.map(function (v) {
                    var newData = data.filter(function (x) {
                        return x[this.features.indexOf(bestFeature)] === v;
                    }.bind(this));
                    var childNode = {
                        name: v,
                        type: 'feature_value',
                        child: this._c45(newData, target, remainingFeatures, featureTypes, depth + 1)
                    };
                    return childNode;
                }.bind(this))
            };
        } else if (featureTypes[this.features.indexOf(bestFeature)] === 'number') {
            var possibleValues = this.unique(data.map(function (d) {
                return d[this.features.indexOf(bestFeature)];
            }.bind(this)));
            var node = {
                name: bestFeature,
                type: 'feature_number',
                cut: bestFeatureData.cut,
                values: []
            };

            var newDataRight = data.filter(function (x) {
                return parseFloat(x[this.features.indexOf(bestFeature)]) > bestFeatureData.cut;
            }.bind(this));
            var childNodeRight = {
                name: bestFeatureData.cut.toString(),
                type: 'feature_value',
                child: this._c45(newDataRight, target, remainingFeatures, featureTypes, depth + 1)
            };
            node.values.push(childNodeRight);

            var newDataLeft = data.filter(function (x) {
                return parseFloat(x[this.features.indexOf(bestFeature)]) <= bestFeatureData.cut;
            }.bind(this));
            var childNodeLeft = {
                name: bestFeatureData.cut.toString(),
                type: 'feature_value',
                child: this._c45(newDataLeft, target, remainingFeatures, featureTypes, depth + 1),
            };
            node.values.push(childNodeLeft);
        }
        return node;
    },

    maxGain: function (data, target, features, featureTypes) {
        var g45 = features.map(function (feature) {
            return this.gain(data, target, features, feature, featureTypes);
        }.bind(this));
        return this.max(g45, function (e) {
            return e.gain;
        });
    },

    gain: function (data, target, features, feature, featureTypes) {
        var setEntropy = this.entropy(data.map(function (d) {
            return d[d.length - 1];
        }));
        if (featureTypes[this.features.indexOf(feature)] === 'category') {
            var attrVals = this.unique(data.map(function (d) {
                return d[this.features.indexOf(feature)];
            }.bind(this)));
            var setSize = data.length;
            var entropies = attrVals.map(function (n) {
                var subset = data.filter(function (x) {
                    return x[feature] === n;
                });
                return (subset.length / setSize) * this.entropy(
                    subset.map(function (d) {
                        return d[d.length - 1];
                    })
                );
            }.bind(this));
            var sumOfEntropies = entropies.reduce(function (a, b) {
                return a + b;
            }, 0);
            return {
                feature: feature,
                gain: setEntropy - sumOfEntropies,
                cut: 0
            };
        } else if (featureTypes[this.features.indexOf(feature)] === 'number') {
            var attrVals = this.unique(data.map(function (d) {
                return d[this.features.indexOf(feature)];
            }.bind(this)));
            var gainVals = attrVals.map(function (cut) {
                var cutf = parseFloat(cut);
                var gain = setEntropy - this.conditionalEntropy(data, feature, cutf, target);
                return {
                    feature: feature,
                    gain: gain,
                    cut: cutf
                };
            }.bind(this));
            var maxgain = this.max(gainVals, function (e) {
                return e.gain;
            });
            return maxgain;
        }
    },

    entropy: function (vals) {
        var uniqueVals = this.unique(vals);
        var probs = uniqueVals.map(function (x) {
            return this.prob(x, vals);
        }.bind(this));
        var logVals = probs.map(function (p) {
            return -p * this.log2(p);
        }.bind(this));
        return logVals.reduce(function (a, b) {
            return a + b;
        }, 0);
    },

    conditionalEntropy: function (data, feature, cut, target) {
        var subset1 = data.filter(function (x) {
            return parseFloat(x[this.features.indexOf(feature)]) <= cut;
        }.bind(this));
        var subset2 = data.filter(function (x) {
            return parseFloat(x[this.features.indexOf(feature)]) > cut;
        }.bind(this));
        var setSize = data.length;
        return subset1.length / setSize * this.entropy(
            subset1.map(function (d) {
                return d[d.length - 1];
            })
        ) + subset2.length / setSize * this.entropy(
            subset2.map(function (d) {
                return d[d.length - 1];
            })
        );
    },

    prob: function (target, targets) {
        return this.count(target, targets) / targets.length;
    },

    mostCommon: function (targets) {
        return this.sortBy(targets, function (target) {
            return this.count(target, targets);
        }.bind(this)).reverse()[0];
    },

    count: function (target, targets) {
        return targets.filter(function (t) {
            return t === target;
        }).length;
    },

    log2: function (n) {
        return Math.log(n) / Math.log(2);
    }
};

/**
 * <odoc>
 * <key>ow.ai.cluster(args) : Object</key>
 * Wraps access to clustering of data. The result will be an object with a classify method that will 
 * return the clustering result given the provided data. Args expects different arguments depending on type of 
 * clustering:\
 * \
 *    args.type                (String) "kmeans" (default)\
 *    args.numberOfClusters    (Number) number of clusters to use (default to 5)\
 *    classify(normalizedData) (Map)    returns a map of centroids and cluster assignments\
 * \
 * </odoc>
 */
OpenWrap.ai.prototype.cluster = function(args) {
    args = _$(args).isObject().default({ type: "kmeans" });
    args.type = _$(args.type).isString().default("kmeans");

    var robj = {
        classify: () => {}
    };

    switch (args.type.toLowerCase()) {
    case 'kmeans':
        args.numberOfClusters = _$(args.numberOfClusters).isNumber().default(5);
        robj.classify = (vectors) => {
            return ow.ai.cluster.kmeans().__kmeans(args.numberOfClusters, vectors);
        };
        return robj;
    }
};

/**
 * FROM: https://github.com/nantunes/figue
 * LICENSE: MIT
 */
OpenWrap.ai.prototype.cluster.kmeans = function () {
    function __arrayCompare(th, testArr) {
        if (th.length != testArr.length) return false;
        for (var i = 0; i < testArr.length; i++) {
            if (th[i].compare) { 
                if (!th[i].compare(testArr[i])) return false;
            }
            if (th[i] !== testArr[i]) return false;
        }
        return true;
    }

    function euclidianDistance (vec1 , vec2) {
        var N = vec1.length ;
        var d = 0 ;
        for (var i = 0 ; i < N ; i++)
            d += Math.pow (vec1[i] - vec2[i], 2)
        d = Math.sqrt (d) ;
        return d ;
    }

    function addVectors (vec1 , vec2) {
        var N = vec1.length ;
        var vec = new Array(N) ;
        for (var i = 0 ; i < N ; i++)
            vec[i] = vec1[i] + vec2[i] ;
        return vec ;
    }	

    function multiplyVectorByValue (value , vec) {
        var N = vec.length ;
        var v = new Array(N) ;
        for (var i = 0 ; i < N ; i++)
            v[i] = value * vec[i] ;
        return v ;
    }	

    function getRandomVectors(k, vectors) {
        /*  Returns a array of k distinct vectors randomly selected from a the input array of vectors
            Returns null if k > n or if there are less than k distinct objects in vectors */
        
        var n = vectors.length ;
        if ( k > n ) 
            return null ;
        
        var selected_vectors = new Array(k) ;
        var selected_indices = new Array(k) ;
        
        var tested_indices = new Object ;
        var tested = 0 ;
        var selected = 0 ;
        var i , vector, select ;
        while (selected < k) {
            if (tested == n)
                return null ;
            
            var random_index = Math.floor(Math.random()*(n)) ;
            if (random_index in tested_indices)
                continue ;
            
            tested_indices[random_index] = 1;
            tested++ ;
            vector = vectors[random_index] ;
            select = true ;
            for (i = 0 ; i < selected ; i++) {
                if ( __arrayCompare(vector, selected_vectors[i]) ) {
                    select = false ;
                    break ;
                }
            }
            if (select) {
                selected_vectors[selected] = vector ;
                selected_indices[selected] = random_index ; 
                selected++ ;
            }
        }
        return {'vectors': selected_vectors, 'indices': selected_indices} ;
    }
    
    function kmeans (k, vectors) {
        var n = vectors.length ;
        var assignments = new Array(n) ;
        var clusterSizes = new Array(k) ;
        var repeat = true ;
        var nb_iters = 0 ;
        var centroids = null ;
        
        var t = getRandomVectors(k, vectors) ;
        if (t == null)
            return null ;
        else
            centroids = t.vectors ;
            
        while (repeat) {

            // assignment step
            for (var j = 0 ; j < k ; j++)
                clusterSizes[j] = 0 ;
            
            for (var i = 0 ; i < n ; i++) {
                var vector = vectors[i] ;
                var mindist = Number.MAX_VALUE ;
                var best ;
                for (var j = 0 ; j < k ; j++) {
                    dist = euclidianDistance (centroids[j], vector)
                    if (dist < mindist) {
                        mindist = dist ;
                        best = j ;
                    }
                }
                clusterSizes[best]++ ;
                assignments[i] = best ;
            }
        
            // update centroids step
            var newCentroids = new Array(k) ;
            for (var j = 0 ; j < k ; j++)
                newCentroids[j] = null ;

            for (var i = 0 ; i < n ; i++) {
                cluster = assignments[i] ;
                if (newCentroids[cluster] == null)
                    newCentroids[cluster] = vectors[i] ;
                else
                    newCentroids[cluster] = addVectors (newCentroids[cluster] , vectors[i]) ;	
            }

            for (var j = 0 ; j < k ; j++) {
                newCentroids[j] = multiplyVectorByValue (1/clusterSizes[j] , newCentroids[j]) ;
            }	
            
            // check convergence
            repeat = false ;
            for (var j = 0 ; j < k ; j++) {
                if (! __arrayCompare(newCentroids[j], centroids[j])) {
                    repeat = true ; 
                    break ; 
                }
            }
            centroids = newCentroids ;
            nb_iters++ ;
            
            // check nb of iters
            if (nb_iters > ow.ai.cluster.__KMEANS_MAX_ITERATIONS)
                repeat = false ;
            
        }
        return { 'centroids': centroids , 'assignments': assignments} ;
    }

    return { 
        __KMEANS_MAX_ITERATIONS: 10,
        __kmeans: kmeans
    };
};