# ow.ai.gpt.prototype

[Home](../../../../index.md) / [All APIs](../../../../all-apis.md) / [ow](../../../index.md) / [ow.ai](../../index.md) / [ow.ai.gpt](../index.md) / [ow.ai.gpt.prototype](index.md)

<a id="api-ow-ai-gpt-prototype-getembeddings-e9cfe872"></a>

## ow.ai.gpt.prototype.getEmbeddings

### ow.ai.gpt.prototype.getEmbeddings(aInput, aDimensions, aEmbeddingModel) : Object

Gets text embeddings for aInput (string or array of strings) using aEmbeddingModel (defaults to provider-specific default). If aDimensions is specified, requests embeddings with that many dimensions (provider support varies). Returns the raw embedding response from the provider.

Sources:

- js/owrap.ai.js:4501

<a id="api-ow-ai-gpt-prototype-getmodelinfo-d37dbffb"></a>

## ow.ai.gpt.prototype.getModelInfo

### ow.ai.gpt.prototype.getModelInfo(aModelId) : Map

Returns the model information for aModelId (defaults to the current configured model when omitted).

Sources:

- js/owrap.ai.js:4487

<a id="api-ow-ai-gpt-prototype-getmodelname-30fda71f"></a>

## ow.ai.gpt.prototype.getModelName

### ow.ai.gpt.prototype.getModelName() : String

Returns the default model name configured for this GPT instance.

Sources:

- js/owrap.ai.js:4463

<a id="api-ow-ai-gpt-prototype-getmodels-10d9d1e8"></a>

## ow.ai.gpt.prototype.getModels

### ow.ai.gpt.prototype.getModels() : Array

Returns the available models from the GPT AI service.

Sources:

- js/owrap.ai.js:4477

<a id="api-ow-ai-gpt-prototype-gettype-a77f2868"></a>

## ow.ai.gpt.prototype.getType

### ow.ai.gpt.prototype.getType() : String

Returns the GPT provider type used to create this instance.

Sources:

- js/owrap.ai.js:4453

