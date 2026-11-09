# ow.ai.network

[Home](../../../index.md) / [All APIs](../../../all-apis.md) / [ow](../../index.md) / [ow.ai](../index.md) / [ow.ai.network](index.md)

<a id="api-ow-ai-network-feedfoward-be62b609"></a>

## ow.ai.network.feedfoward

### ow.ai.network.feedfoward(args) : ow.ai.network

- [Examples](https://github.com/BrainJS/brain.js?tab=readme-ov-file#examples)
- [Data format](https://github.com/BrainJS/brain.js?tab=readme-ov-file#neural-network-types)
- [Train](https://github.com/BrainJS/brain.js?tab=readme-ov-file#training-options)

Sources:

- js/owrap.ai.js:5933

<a id="api-ow-ai-network-forecast-957a0dba"></a>

## ow.ai.network.forecast

### ow.ai.network.forecast(aInput, aCount) : Array



Sources:

- js/owrap.ai.js:6058

<a id="api-ow-ai-network-fromjson-933ef45b"></a>

## ow.ai.network.fromJson

### ow.ai.network.fromJson(aMap)

Tries to rebuild the network from aMap returned previously by a toJson function.

Sources:

- js/owrap.ai.js:6130

<a id="api-ow-ai-network-get-ec109274"></a>

## ow.ai.network.get

### ow.ai.network.get(inputArray) : Array

Given an inputArray of decimal values, normalize between 0 and 1, will activate the current network and  return an output array of decimal values between 0 and 1.

Sources:

- js/owrap.ai.js:6071

<a id="api-ow-ai-network-getbrainjsobject-fbf59706"></a>

## ow.ai.network.getBrainJSObject

### ow.ai.network.getBrainJSObject() : Object

Returns the current BrainJS object.

Sources:

- js/owrap.ai.js:5964

<a id="api-ow-ai-network-getsynapticobject-7c5b9998"></a>

## ow.ai.network.getSynapticObject

### ow.ai.network.getSynapticObject() : Object

Returns the current Synaptic object.

Sources:

- js/owrap.ai.js:5954

<a id="api-ow-ai-network-gru-2da524f5"></a>

## ow.ai.network.gru

### ow.ai.network.gru(args) : ow.ai.network

- [Examples](https://github.com/BrainJS/brain.js?tab=readme-ov-file#examples)
- [Data format](https://github.com/BrainJS/brain.js?tab=readme-ov-file#for-training-with-rnn-lstm-and-gru)
- [Train](https://github.com/BrainJS/brain.js?tab=readme-ov-file#training-options)

Sources:

- js/owrap.ai.js:5923

<a id="api-ow-ai-network-grutimestep-6e90d006"></a>

## ow.ai.network.grutimestep

### ow.ai.network.grutimestep(args) : ow.ai.network

- [Examples](https://github.com/BrainJS/brain.js?tab=readme-ov-file#examples)
- [Data format](https://github.com/BrainJS/brain.js?tab=readme-ov-file#for-training-with-rnntimestep-lstmtimestep-and-grutimestep)
- [Train](https://github.com/BrainJS/brain.js?tab=readme-ov-file#training-options)

Sources:

- js/owrap.ai.js:5893

<a id="api-ow-ai-network-hopfield-c49c6257"></a>

## ow.ai.network.hopfield

### ow.ai.network.hopfield(args) : ow.ai.network

Hopfield serves as a content-addressable memory remembering patterns and when feed with new patterns the network returns the most similar one from the patterns it was trained to remember. You need to provide then number of input patterns args = &#91; 10 &#93;.

Sources:

- js/owrap.ai.js:6019

<a id="api-ow-ai-network-liquid-ee3d55a7"></a>

## ow.ai.network.liquid

### ow.ai.network.liquid(args) : ow.ai.network

Liquid state machines are neural networks where neurons are randomly connected to each other. The recurrent nature of the connections turns the time varying input into a spatio-temporal pattern of activations in the network nodes. You need to provide args = &#91;number of inputs, size of pool of neurons, number of outputs, number of random connections, number of random gates&#93; (e.g. 2, 20, 1, 30, 10).

Sources:

- js/owrap.ai.js:6005

<a id="api-ow-ai-network-lstm-4a1e99cf"></a>

## ow.ai.network.lstm

### ow.ai.network.lstm(args) : ow.ai.network

- [Examples](https://github.com/BrainJS/brain.js?tab=readme-ov-file#examples)
- [Data format](https://github.com/BrainJS/brain.js?tab=readme-ov-file#for-training-with-rnn-lstm-and-gru)
- [Train](https://github.com/BrainJS/brain.js?tab=readme-ov-file#training-options)

Sources:

- js/owrap.ai.js:5913

### ow.ai.network.lstm(args) : ow.ai.network

LSTM (Long short-term memory) are well-suited to learn from experience to classify, process and predict time series when
there are very long time lags of unknown size between important events. There is a minimum of 3 layers (input, memory block (input, memory cell, forget gate, output gate), output).
`args = [2, 6, 1]` means 2 input, 6 memory blocks, 1 output; `args = [2, 4, 4, 4, 1]` means 2 input neurons, 3 memory blocks and 1 output.

Sources:

- js/owrap.ai.js:5989

<a id="api-ow-ai-network-lstmtimestep-76b39f17"></a>

## ow.ai.network.lstmtimestep

### ow.ai.network.lstmtimestep(args) : ow.ai.network

- [Examples](https://github.com/BrainJS/brain.js?tab=readme-ov-file#examples)
- [Data format](https://github.com/BrainJS/brain.js?tab=readme-ov-file#for-training-with-rnntimestep-lstmtimestep-and-grutimestep)
- [Train](https://github.com/BrainJS/brain.js?tab=readme-ov-file#training-options)

Sources:

- js/owrap.ai.js:5883

<a id="api-ow-ai-network-neuralnetwork-ebf8d081"></a>

## ow.ai.network.neuralnetwork

### ow.ai.network.neuralnetwork(args) : ow.ai.network

- [Examples](https://github.com/BrainJS/brain.js?tab=readme-ov-file#examples)
- [Data format](https://github.com/BrainJS/brain.js?tab=readme-ov-file#for-training-with-neuralnetwork)
- [Train](https://github.com/BrainJS/brain.js?tab=readme-ov-file#training-options)

Sources:

- js/owrap.ai.js:5863

<a id="api-ow-ai-network-perceptron-d3e26071"></a>

## ow.ai.network.perceptron

### ow.ai.network.perceptron(args) : ow.ai.network

Perceptron or feed-forward neural networks. There is a minimum of 3 layers (input, hidden and output) and a any nmumber of hidden layers. args = &#91;2, 3, 1&#93; means 2 input neurons, 3 hidden neurons and 1 output neuron; args = &#91;2, 10, 10, 10, 10, 1&#93; means 2 input neurons, 4 layers of 10 neurons and 1 output neuron.

Sources:

- js/owrap.ai.js:5975

<a id="api-ow-ai-network-put-cd5d64e0"></a>

## ow.ai.network.put

### ow.ai.network.put(inputArray, outputArray, learningRate)

Given an inputArray of decimal values, normalize between 0 and 1, will activate the current network and then the outputArray of decimal values, normalize between 0 and 1, with an optionial learningRate (defaults to 0.3).

Sources:

- js/owrap.ai.js:6089

<a id="api-ow-ai-network-readfile-b61f5de5"></a>

## ow.ai.network.readFile

### ow.ai.network.readFile(aFile)

Rebuilds a network from a map stored in aFile previously with ow.ai.network.writeFile.

Sources:

- js/owrap.ai.js:6156

<a id="api-ow-ai-network-recurrent-7ae29583"></a>

## ow.ai.network.recurrent

### ow.ai.network.recurrent(args) : ow.ai.network

- [Examples](https://github.com/BrainJS/brain.js?tab=readme-ov-file#examples)
- [Data format](https://github.com/BrainJS/brain.js?tab=readme-ov-file#neural-network-types)
- [Train](https://github.com/BrainJS/brain.js?tab=readme-ov-file#training-options)

Sources:

- js/owrap.ai.js:5943

<a id="api-ow-ai-network-rnn-d3620917"></a>

## ow.ai.network.rnn

### ow.ai.network.rnn(args) : ow.ai.network

- [Examples](https://github.com/BrainJS/brain.js?tab=readme-ov-file#examples)
- [Data format](https://github.com/BrainJS/brain.js?tab=readme-ov-file#for-training-with-rnn-lstm-and-gru)
- [Train](https://github.com/BrainJS/brain.js?tab=readme-ov-file#training-options)

Sources:

- js/owrap.ai.js:5903

<a id="api-ow-ai-network-rnntimestep-6faeb0d8"></a>

## ow.ai.network.rnntimestep

### ow.ai.network.rnntimestep(args) : ow.ai.network

- [Examples](https://github.com/BrainJS/brain.js?tab=readme-ov-file#examples)
- [Data format](https://github.com/BrainJS/brain.js?tab=readme-ov-file#for-training-with-rnntimestep-lstmtimestep-and-grutimestep)
- [Train](https://github.com/BrainJS/brain.js?tab=readme-ov-file#training-options)

Sources:

- js/owrap.ai.js:5873

<a id="api-ow-ai-network-tojson-35a69c57"></a>

## ow.ai.network.toJson

### ow.ai.network.toJson() : Map

Returns a map representation of the current network to be later rebuilt with the fromJson function.

Sources:

- js/owrap.ai.js:6117

<a id="api-ow-ai-network-train-6ded6ca0"></a>

## ow.ai.network.train

### ow.ai.network.train(trainingData, trainArgs)

Trains the current network with the `trainingData` provided. `trainingData` should be an array of maps. Each
map entry should have a input and output keys. Each input and output entries should be an array for the
entry values and output values normalized to a decimal number between 0 and 1. Example:

```javascript
[{input: [0,0], output: [0]}, {input: [0,1], output: [1]}, {input: [1,0], output: [1]}, {input: [1,1], output :[0]}]
```

Sources:

- js/owrap.ai.js:6032

<a id="api-ow-ai-network-writefile-9e75b768"></a>

## ow.ai.network.writeFile

### ow.ai.network.writeFile(aFile)

Writes a compressed file with the map representation of the current network.

Sources:

- js/owrap.ai.js:6146

