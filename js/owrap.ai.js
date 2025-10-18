// OpenWrap AI
// Copyright 2023 Nuno Aguiar

OpenWrap.ai = function() {
    if (isUnDef(this.synaptic)) {
        //this.synaptic = require(getOpenAFJar() + "::js/synaptic.js");        
        this.synaptic = loadCompiledRequire("synaptic_js"); 
    }
    return ow.ai;
}

/**
 * <odoc>
 * <key>ow.ai.regression() : Regression</key>
 * Returns a Regression with the following functions:\
 * \
 *    linear(data, options) : Map\
 *    power(data, options) : Map\
 *    exponential(data, options) : Map\
 *    logarithmic(data, options) : Map\
 *    polynomial(data, options) : Map\
 * \
 *    data - an array of arrays of x, y values ([[0,1],[1,3],[2,5]])\
 *    options - map to determine the order and precision ({ order: 2, precision: 5})\
 * \
 * </odoc>
 */
OpenWrap.ai.prototype.regression = function() {
    return loadCompiledRequire("regression_js");
}

/**
 * <odoc>
 * <key>ow.ai.valuesArray(entriesspan) : Map</key>
 * Creates a valuesArray object with the following functions:\
 * \
 *   getValues()     : Array\
 *   push(value)     : void\
 *   deviation()     : Number\
 *   variance()      : Number\
 *   movingAverage() : Number\
 * \
 * entriesspan - number of entries to keep
 * </odoc>
 */
OpenWrap.ai.prototype.valuesArray = function(entriesspan) {
    entriesspan = _$(entriesspan, "entriesspan").isNumber().default(3);
    ow.loadObj();

    var _values = new ow.obj.syncArray();

    return {
        getValues: () => _values,
        push     : value => {
            _$(value, "value").isNumber().$_();

            _values.add(value);
            while (_values.length() > entriesspan) _values.remove(0);
        },
        deviation: () => {
            if (_values.length() == 0) return 0;

            var m = _values.toArray().reduce((a, v) => a + v, 0) / _values.length();
            var r = _values.toArray().map(v => Math.pow(v - m, 2));
            var sum = r.reduce((a, v) => a + v, 0);
            return Math.sqrt(sum /_values.length());
        },
        variance: () => {
            if (_values.length() == 0) return 0;

            var m = _values.toArray().reduce((a, v) => a + v, 0) / _values.length();
            var r = _values.toArray().map(v => Math.pow(v - m, 2));
            var sum = r.reduce((a, v) => a + v, 0);
            return sum /_values.length();
        },
        movingAverage: () => {
            if (_values.length() == 0) return 0;

            return _values.toArray().reduce((a, v) => a + v, 0) / _values.length();
        }
    }
}
 
// | type      | chat | tooling | image | list | genimg |
// |-----------|------|---------|-------|------|--------|
// | openai    | ✔    | ✔       | ✔     | ✔    | ✔      |
// | gemini    | ✔    | ✔       | ✔     | ✔    | ✖      |
// | ollama    | ✔    | ✔       | ✔     | ✔    | ✖      |
// | anthropic | ✔    | ✔       | ✖     | ✔    | ✖      |

OpenWrap.ai.prototype.__gpttypes = {
    openai: {
        create: (aOptions) => {
            ow.loadObj()
            aOptions = _$(aOptions, "aOptions").isMap().$_()
            aOptions.params = _$(aOptions.params, "aOptions.params").isMap().default({})
            aOptions.key = _$(aOptions.key, "aOptions.key").isString().$_()
            aOptions.timeout = _$(aOptions.timeout, "aOptions.timeout").isNumber().default(15 * 60000)
            aOptions.model = _$(aOptions.model, "aOptions.model").isString().default("gpt-3.5-turbo")
            aOptions.temperature = _$(aOptions.temperature, "aOptions.temperature").isNumber().default(0.7)
            aOptions.url = _$(aOptions.url, "aOptions.url").isString().default("https://api.openai.com")
            aOptions.headers = _$(aOptions.headers, "aOptions.headers").isMap().default({})
            // If noSystem=true it will not output the system messages
            aOptions.noSystem = _$(aOptions.noSystem, "aOptions.noSystem").isBoolean().default(true)
            aOptions.noResponseFormat = _$(aOptions.noResponseFormat, "aOptions.noResponseFormat").isBoolean().default(false)
            aOptions.apiVersion = _$(aOptions.apiVersion, "aOptions.apiVersion").isString().default("v1")

            var _key = aOptions.key
            var _timeout = aOptions.timeout
            var _model = aOptions.model
            var _temperature = aOptions.temperature
            var _noSystem = aOptions.noSystem
            var _lastStats = __
            var _resetStats = () => { _lastStats = __ }
            var _captureStats = (aResponse, aRequestBody) => {
                if (!isMap(aResponse)) {
                    _lastStats = __
                    return _lastStats
                }

                var stats = { vendor: "openai" }
                var modelName = isMap(aRequestBody) ? aRequestBody.model : __
                if (isString(aResponse.model)) modelName = aResponse.model
                if (isString(modelName)) stats.model = modelName
                if (isString(aResponse.id)) stats.id = aResponse.id
                if (isString(aResponse.system_fingerprint)) stats.systemFingerprint = aResponse.system_fingerprint

                if (isMap(aResponse.usage)) {
                    var tokens = {}
                    if (isDef(aResponse.usage.prompt_tokens)) tokens.prompt = aResponse.usage.prompt_tokens
                    if (isDef(aResponse.usage.completion_tokens)) tokens.completion = aResponse.usage.completion_tokens
                    if (isDef(aResponse.usage.total_tokens)) tokens.total = aResponse.usage.total_tokens
                    if (Object.keys(tokens).length > 0) stats.tokens = tokens
                    stats.usage = aResponse.usage
                }

                if (isArray(aResponse.choices)) {
                    var finishReasons = aResponse.choices
                        .filter(c => isDef(c) && isDef(c.finish_reason))
                        .map(c => c.finish_reason)
                    if (finishReasons.length > 0) stats.finishReasons = finishReasons
                }

                if (Object.keys(stats).filter(k => k != "vendor").length == 0) stats = __
                _lastStats = stats
                return _lastStats
            }
            var _r = {
                conversation: [],
                tools: {},
                getModelName: () => _model,
                getConversation: () => {
                    return _r.conversation
                },
                setConversation: (aConversation) => {
                    aConversation = _$(aConversation, "aConversation").isArray().default([])

                    if (isArray(aConversation)) {
                        _r.conversation = aConversation.map(r => {
                            if (isDef(r)) {
                                if (isString(r)) {
                                    return { role: "user", content: r }
                                } else if (isMap(r)) {
                                    if (isDef(r.role) && r.role == "model") {
                                        r.role = "assistant"
                                    }
                                    if (isUnDef(r.role)) r.role = "user"
                                    return r
                                }
                            }
                        })
                    }
                    return _r
                },
                setTool: (aName, aDesc, aParams, aFn) => {
                    _r.tools[aName] = {
                        type: "function",
                        function: {
                            name: aName,
                            description: aDesc,
                            parameters: aParams
                        },
                        fn: aFn
                    }
                    return _r
                },
                getLastStats: () => _lastStats,
                prompt: (aPrompt, aModel, aTemperature, aJsonFlag, tools) => {
                    var __r = _r.rawPrompt(aPrompt, aModel, aTemperature, aJsonFlag, tools)
                    if (isArray(__r.choices) && __r.choices.length > 0) {
                        if (__r.choices[0].finish_reason == "stop") {
                           return __r.choices[0].message.content
                        }
                     }
                     return __r
                },
                promptImage: (aPrompt, aImage, aDetailLevel, aRole, aModel, aTemperature, aJsonFlag) => {
                    aRole        = _$(aRole, "aRole").isString().default("user")
                    aDetailLevel = _$(aDetailLevel, "aDetailLevel").isString().default("low")

                    var base64 = ""
                    if (io.fileExists(aImage)) {
                        base64 = af.fromBytes2String(af.toBase64Bytes(io.readFileBytes(aImage)))
                    } else {
                        if (isString(aImage)) {
                            base64 = aImage
                        }
                    }

                    var __r = _r.prompt([
                        {
                            role: aRole,
                            content: [
                                { type: "text", text: aPrompt },
                                { type: "image_url", image_url: { url: "data:image/jpeg;base64," + base64, detail: aDetailLevel } } 
                            ]
                        }
                    ], aModel, aTemperature, aJsonFlag)

                    if (isArray(__r.choices) && __r.choices.length > 0) {
                        return __r.choices[0].message.content
                    }
                    return __r
                },
                rawPrompt: (aPrompt, aModel, aTemperature, aJsonFlag, aTools) => {
                    aPrompt      = _$(aPrompt, "aPrompt").default(__)
                    aTemperature = _$(aTemperature, "aTemperature").isNumber().default(_temperature)
                    aModel       = _$(aModel, "aModel").isString().default(_model)
                    aJsonFlag    = _$(aJsonFlag, "aJsonFlag").isBoolean().default(false)
                    if (isUnDef(aTools)) {
                        aTools = Object.keys(_r.tools)
                    } else if (isMap(aTools)) {
                        aTools = Object.keys(aTools)
                    }
                    aTools = _$(aTools, "aTools").isArray().default([])

                    _resetStats()
                    var msgs = []
                    if (isString(aPrompt)) aPrompt = [ aPrompt ]
                    aPrompt = _r.conversation.concat(aPrompt)
                    msgs = aPrompt.filter(c => isDef(c)).map(c => isMap(c) ? c : { role: "user", content: c })

                    if (aJsonFlag) {
                        msgs.unshift({ role: (_noSystem ? "developer" : "system"), content: "output json" })
                    }
                    _r.conversation = msgs
                    if (_noSystem) msgs = msgs.map(m => { if (m.role == "system") m.role = "developer"; return m })
                    var body = {
                        model: aModel,
                        temperature: aTemperature,
                        messages: msgs
                    }
                    // IMPORTANT: OpenAI JSON mode (response_format) cannot be combined with tool/function calling.
                    // Only enable strict JSON mode when there are no tools requested.
                    if (!aOptions.noResponseFormat && aJsonFlag && (!isArray(aTools) || aTools.length === 0)) {
                        body.response_format = {
                            type: "json_schema",
                            json_schema: {
                                name: "response",
                                schema: { type: "object" }
                            }
                        }
                    }
                    body = merge(body, aOptions.params)
                    // Only include tools if there are any configured
                    if (isArray(aTools) && aTools.length > 0) {
                        body.tools = aTools
                            .map(t => {
                                if (isString(t)) {
                                    var _tool = _r.tools[t]
                                    if (isMap(_tool) && isMap(_tool.function)) {
                                        return {
                                            type: "function",
                                            function: {
                                                name: _tool.function.name,
                                                description: _tool.function.description,
                                                parameters: _tool.function.parameters
                                            }
                                        }
                                    }
                                } else if (isMap(t)) {
                                    return t
                                }
                            })
                            .filter(isDef)
                        if (!isArray(body.tools) || body.tools.length == 0) delete body.tools
                    } else {
                        if (isDef(body.tools)) delete body.tools
                    }
                    var _res = _r._request((aOptions.apiVersion.length > 0 ? aOptions.apiVersion + "/" : "") + "chat/completions", body)
                    if (isDef(_res) && isArray(_res.choices)) {
                        // call tools
                        var _p = [], stopWith = false
                        _res.choices.forEach(tc => {
                            if (isDef(tc.message) && isArray(tc.message.tool_calls)) {
                                tc.message.tool_calls.forEach(tci => {
                                    var _t = _r.tools[tci.function.name]
                                    var _tr = stringify(_t.fn(jsonParse(tci.function.arguments)), __, "")
                                    _p.push({ role: "assistant", tool_calls: [ tci ]})
                                    _p.push({ role: "tool", content: _tr, tool_call_id: tci.id })
                                })
                            }
                            if (isDef(tc.finish_reason) && tc.finish_reason == "stop") {
                                _p.push({ role: "assistant", content: tc.message.content })
                                stopWith = true
                            }
                        })
                        if (stopWith) {
                            _r.conversation = _r.conversation.concat(isString(_res) ? { role: "assistant", content: _res } : _res.choices[0].message)
                            _captureStats(_res, body)
                            return _res
                        } else {
                            _r.conversation = _r.conversation.concat(_p)
                            return _r.rawPrompt(_p, aModel, aTemperature, aJsonFlag, aTools)
                        }
                    } else {
                        _captureStats(_res, body)
                        return _res
                    }
                },
                rawImgGen: (aPrompt, aModel) => {
                    aPrompt      = _$(aPrompt, "aPrompt").default(__)
                    aModel       = _$(aModel, "aModel").isString().default(_model)

                    var msgs = []
                    if (isString(aPrompt)) aPrompt = [ aPrompt ]
                    aPrompt = _r.conversation.concat(aPrompt)
                    msgs = aPrompt.map(c => isMap(c) ? c.content : c )
                 
                    _r.conversation = aPrompt
                    return _r._request((aOptions.apiVersion.length > 0 ? aOptions.apiVersion + "/" : "") + "images/generations", merge({
                       model: aModel,
                       prompt: msgs.join("\n"),
                       response_format: "b64_json"
                    }, aOptions.params))   
                    // data[0].b64_json
                },
                promptImgGen: (aPrompt, aModel) => {
                    var res = _r.rawImgGen(aPrompt, aModel)
                    if (isArray(res.data) && res.data.length > 0) {
                        return res.data.map(r => af.fromBase64(r.b64_json))
                    } else {
                        return res
                    }
                },
                addPrompt: (aRole, aPrompt) => {
                    if (isUnDef(aPrompt)) {
                        aPrompt = aRole
                        aRole = "user"
                     }
                     if (isString(aPrompt)) _r.conversation.push({ role: aRole.toLowerCase(), content: aPrompt })
                     if (isArray(aPrompt))  _r.conversation = _r.conversation.concat(aPrompt)
                     return _r
                },
                addUserPrompt: (aPrompt) => {
                    _r.conversation.push({ role: "user", content: aPrompt })
                    return _r
                },
                addSystemPrompt: (aPrompt) => {
                    _r.conversation.push({ role: "system", content: aPrompt })
                    return _r
                },
                addDeveloperPrompt: (aPrompt) => {
                    _r.conversation.push({ role: "developer", content: aPrompt })
                    return _r
                },
                cleanPrompt: () => {
                    _r.conversation = []
                    return _r
                },
                getModels: () => {
                    var res = _r._request((aOptions.apiVersion.length > 0 ? aOptions.apiVersion + "/" : "") + "models", {}, "GET")
                    if (isArray(res.data)) {
                        return res.data
                    } else {
                        return res
                    }
                },
                getEmbeddings: (aInput, aDimensions, aEmbeddingModel) => {
                    aInput = _$(aInput, "aInput").$_()
                    aEmbeddingModel = _$(aEmbeddingModel, "aEmbeddingModel").isString().default("text-embedding-3-small")
                    aDimensions = _$(aDimensions, "aDimensions").isNumber().default(__)

                    _resetStats()
                    var body = {
                        model: aEmbeddingModel,
                        input: aInput
                    }
                    if (isDef(aDimensions)) {
                        body.dimensions = aDimensions
                    }
                    body = merge(body, aOptions.params)
                    
                    var _res = _r._request((aOptions.apiVersion.length > 0 ? aOptions.apiVersion + "/" : "") + "embeddings", body)
                    _captureStats(_res, body)
                    return _res
                },
                _request: (aURI, aData, aVerb) => {
                    _$(aURI, "aURI").isString().$_()
                    aData = _$(aData, "aData").isMap().default({})
                    aVerb = _$(aVerb, "aVerb").isString().default("POST")
                 
                    var _h = new ow.obj.http(__, __, __, __, __, __, __, { timeout: _timeout })
                    var __m = { 
                       conTimeout    : 60000,
                       httpClient    : _h,
                       requestHeaders: merge(aOptions.headers, { 
                          Authorization: "Bearer " + Packages.openaf.AFCmdBase.afc.dIP(_key),
                          Accept       : "*/*"
                       })
                    } 
                    _h.close()
                 
                    var _fnh = r => {
                        var _r 
                        if ("function" !== typeof r.getClass) {
                            _r = (isDef(r.error) ? jsonParse(r.error, __, __, true) : r)
                        } else {
                            _r = jsonParse(af.fromBytes2String(r.readAllBytes()))
                        }
                        if (typeof _r.response !== "undefined") {
                            return jsonParse(_r.response)
                        } else {
                            return _r
                        }
                    }

                    switch(aVerb.toUpperCase()) {
                    case "GET" : return _fnh($rest(__m).get2Stream(aOptions.url + (aOptions.url.endsWith("/") ? "" : "/") + aURI))
                    case "POST": return _fnh($rest(__m).post2Stream(aOptions.url + (aOptions.url.endsWith("/") ? "" : "/") + aURI, aData))
                    }
                }
            }
            return _r
        }
    },
    gemini: {
        create: (aOptions) => {
            ow.loadObj()
            aOptions = _$(aOptions, "aOptions").isMap().$_()
            aOptions.params = _$(aOptions.params, "aOptions.params").isMap().default({})
            aOptions.key = _$(aOptions.key, "aOptions.key").isString().$_()
            aOptions.timeout = _$(aOptions.timeout, "aOptions.timeout").isNumber().default(15 * 60000)
            aOptions.model = _$(aOptions.model, "aOptions.model").isString().default("gemini-1.5-flash")
            aOptions.temperature = _$(aOptions.temperature, "aOptions.temperature").isNumber().default(0.7)
            aOptions.url = _$(aOptions.url, "aOptions.url").isString().default("https://generativelanguage.googleapis.com/v1beta")
            aOptions.headers = _$(aOptions.headers, "aOptions.headers").isMap().default({})

            var _key = aOptions.key
            var _timeout = aOptions.timeout
            var _model = aOptions.model
            var _temperature = aOptions.temperature
            var _lastStats = __
            var _resetStats = () => { _lastStats = __ }
            var _captureStats = (aResponse, aModelName) => {
                if (!isMap(aResponse)) {
                    _lastStats = __
                    return _lastStats
                }

                var stats = { vendor: "gemini" }
                var modelName = isString(aModelName) ? aModelName : _model
                if (isString(aResponse.model)) modelName = aResponse.model
                if (isString(modelName)) stats.model = modelName

                if (isMap(aResponse.usageMetadata)) {
                    var tokens = {}
                    if (isDef(aResponse.usageMetadata.promptTokenCount)) tokens.prompt = aResponse.usageMetadata.promptTokenCount
                    if (isDef(aResponse.usageMetadata.candidatesTokenCount)) tokens.completion = aResponse.usageMetadata.candidatesTokenCount
                    if (isDef(aResponse.usageMetadata.totalTokenCount)) tokens.total = aResponse.usageMetadata.totalTokenCount
                    if (Object.keys(tokens).length > 0) stats.tokens = tokens
                    stats.usage = aResponse.usageMetadata
                }

                if (isArray(aResponse.candidates)) {
                    var finishReasons = aResponse.candidates
                        .filter(c => isDef(c) && isDef(c.finishReason))
                        .map(c => c.finishReason)
                    if (finishReasons.length > 0) stats.finishReasons = finishReasons
                }

                if (Object.keys(stats).filter(k => k != "vendor").length == 0) stats = __
                _lastStats = stats
                return _lastStats
            }

            var _r = {
                conversation: [],
                tools: [],
                getModelName: () => _model,
                getConversation: () => {
                    var _res = _r.conversation.map(r => {
                        if (isMap(r)) {
                            if (isUnDef(r.role))
                                r.role = "user"
                            else if (r.role == "assistant") {
                                r.role = "model"
                            }
                            
                            if (isArray(r.parts) && r.parts.length > 0) {
                                r.content = r.parts.reduce((aC, aV) => aC + "\n" + aV.text, "")
                                delete r.parts
                            }
                        }
                        return r
                    })
                    return _res
                },
                setConversation: (aConversation) => {
                    aConversation = _$(aConversation, "aConversation").isArray().default([])

                    if (isArray(aConversation)) {
                        _r.conversation = aConversation.map(r => {
                            if (isDef(r)) {
                                if (isString(r)) {
                                    return { role: "user", parts: [ { text: r } ] }
                                } else if (isMap(r)) {
                                    if (isUnDef(r.role)) r.role = "user"
                                    if (r.role != "model" && r.role != "user" && r.role != "system") r.role = "model"
                                    if (isDef(r.content)) {
                                        r.parts = [ { text: r.content } ]
                                        delete r.content
                                    }
                                    return r
                                }
                            }
                        })
                    }
                    return _r
                },
                getLastStats: () => _lastStats,
                setTool: (aName, aDesc, aParams, aFn) => {
                    _r.tools.push( {
                        name: aName,
                        description: aDesc,
                        parameters: aParams,
                        fn: aFn
                    } )
                    return _r
                },
                prompt: (aPrompt, aModel, aTemperature, aJsonFlag, tools) => {
                    var __r = _r.rawPrompt(aPrompt, aModel, aTemperature, aJsonFlag, tools)
                    if (isArray(__r.candidates) && isArray(__r.candidates[0].content.parts) && __r.candidates[0].content.parts.length > 0) {
                        if (__r.candidates[0].finishReason == "STOP") {
                           return __r.candidates[0].content.parts.reduce((aC, aV) => aC + "\n" + aV.text, "")
                        }
                    }
                    return stringify(__r, __, "")
                },
                promptImage: (aPrompt, aImage, aDetailLevel, aRole, aModel, aTemperature, aJsonFlag) => {
                    aRole        = _$(aRole, "aRole").isString().default("user")
                    aDetailLevel = _$(aDetailLevel, "aDetailLevel").isString().default("low")

                    if (!isArray(aImage)) aImage = [ aImage ]

                    var body = [ {
                        text: aPrompt
                    } ]

                    aImage.forEach(r => {
                        var base64 = ""
                        if (io.fileExists(r)) {
                            base64 = af.fromBytes2String(af.toBase64Bytes(io.readFileBytes(r)))
                        } else {
                            if (isString(r)) {
                                base64 = r
                            }
                        }

                        aMime = "image/jpeg"
                        switch(r.substring(r.lastIndexOf(".") + 1).toLowerCase()) {
                        case "png": aMime = "image/png"; break
                        case "webp": aMime = "image/webp"; break
                        case "heic": aMime = "image/heic"; break
                        case "webp": aMime = "image/webp"; break
                        default: aMime = "image/jpeg"
                        }

                        body.push({
                            inline_data: {
                                mime_type: aMime,
                                data: base64
                            }
                        })
                    })
                    
                    var __r = _r.rawPrompt({ parts: body }, aModel, aTemperature, aJsonFlag)

                    if (isArray(__r.candidates) && isArray(__r.candidates[0].content.parts) && __r.candidates[0].content.parts.length > 0) {
                        if (__r.candidates[0].finishReason == "STOP") {
                           return __r.candidates[0].content.parts.reduce((aC, aV) => aC + "\n" + aV.text, "")
                        }
                     }
                     return __r
                },
                rawPrompt: (aPrompt, aModel, aTemperature, aJsonFlag, aTools) => {
                    aPrompt      = _$(aPrompt, "aPrompt").default(__)
                    aTemperature = _$(aTemperature, "aTemperature").isNumber().default(_temperature)
                    aModel       = _$(aModel, "aModel").isString().default(_model)
                    aJsonFlag    = _$(aJsonFlag, "aJsonFlag").isBoolean().default(false)
                    aTools       = _$(aTools, "aTools").isArray().default(_r.tools)

                    _resetStats()
                    // Ensure all messages use 'parts' and never 'content'
                    function toPartsMsg(msg) {
                        if (isMap(msg)) {
                            let role = isDef(msg.role) ? msg.role : "user";
                            if (isArray(msg.parts)) {
                                return { role, parts: msg.parts };
                            } else if (isDef(msg.content)) {
                                return { role, parts: [ { text: msg.content } ] };
                            } else if (isString(msg.text)) {
                                return { role, parts: [ { text: msg.text } ] };
                            }
                        }
                        return { role: "user", parts: [ { text: String(msg) } ] };
                    }
                    var msgs = [];
                    if (isString(aPrompt)) aPrompt = [ { role: "user", parts: [ { text: aPrompt } ] } ];
                    aPrompt = _r.conversation.reduce((acc, r) => {
                        if (isUnDef(r.role) || r.role != "system") {
                            acc.push(toPartsMsg(r));
                        }
                        return acc;
                    }, []).concat(aPrompt.map(toPartsMsg));
                    msgs = aPrompt;
                 
                    var body = {
                        system_instruction: { parts: _r.conversation.reduce((acc, r) => {
                            if (isDef(r.role) && r.role == "system") {
                                acc = acc.concat(r.parts)
                            }
                            return acc;
                        }, []) },
                        contents: msgs,
                        generationConfig: {
                            temperature: aTemperature
                        }
                    }
                    if (aJsonFlag) {
                        // For Gemini, setting responseMimeType to application/json is enough to encourage JSON output.
                        // Do NOT set a default responseSchema. Gemini requires OBJECT schemas to have non-empty properties,
                        // and an empty schema `{ type: "OBJECT" }` will trigger INVALID_ARGUMENT. If callers want a
                        // structured schema, they can pass it via aOptions.params.generationConfig.responseSchema.
                        body.generationConfig.responseMimeType = "application/json"
                    }
                    if (isDef(body.system_instruction) && Object.keys(body.system_instruction.parts).length == 0) delete body.system_instruction.parts
                    if (isDef(body.system_instruction) && Object.keys(body.system_instruction).length == 0) delete body.system_instruction
                    if (isArray(aTools) && aTools.length > 0) {
                        var sTools = clone(aTools)
                        // remove functions and $id/$schema from parameters
                        traverse(sTools, (aK, aV, aP, aO) => {
                            if (aK == 'fn') delete aO[aK]
                            if (aK == 'parameters' && isMap(aO[aK])) {
                                delete aO[aK]['$id']
                                delete aO[aK]['$schema']
                            }
                        })
                        body = merge(body, { tools: [ { functionDeclarations: sTools } ] })
                    } else {
                        if (isDef(body.tools)) delete body.tools
                    }
                    body = merge(body, aOptions.params)

                    var _res = _r._request("models/" + aModel + ":generateContent", body)   
                    if (isDef(_res) && isArray(_res.candidates)) {
                        // call tools
                        var _p = msgs, stopWith = false
                        _res.candidates.forEach(tc => {
                            if (isArray(tc.content.parts) && tc.finishReason == "STOP") {
                                stopWith = true
                                tc.content.parts.forEach(p => {
                                    if (isDef(p.functionCall)) {
                                        _p.push({ role: "model", parts: [{
                                            functionCall: {
                                                name: p.functionCall.name,
                                                args: p.functionCall.args
                                            }
                                        }]})
                                        var _t = $from(_r.tools).equals("name", p.functionCall.name).at(0)
                                        var _tr = stringify(_t.fn(p.functionCall.args), __, "")
                                        _p.push({ role: "user", parts: [{
                                            functionResponse: {
                                                name: p.functionCall.name,
                                                response: {
                                                    name: p.functionCall.name,
                                                    content: _tr
                                                }
                                            }
                                        }]})
                                        stopWith = false
                                    } else {
                                        _p.push(p)
                                    }
                                })
                            }
                        })
                        if (stopWith) {
                            _r.conversation = _r.conversation.concat(_res.candidates[0].content)
                            _captureStats(_res, aModel)
                            return _res
                        } else {
                            _r.conversation = _r.conversation.concat(_p)
                            return _r.rawPrompt(_p, aModel, aTemperature, aJsonFlag, aTools)
                        }
                    } else {
                        _captureStats(_res, aModel)
                        return _res
                    }
                },
                rawImgGen: (aPrompt, aModel) => {
                    aPrompt      = _$(aPrompt, "aPrompt").default(__)
                    aModel       = _$(aModel, "aModel").isString().default(_model)

                    var msgs = []
                    if (isString(aPrompt)) aPrompt = [ aPrompt ]
                    aPrompt = _r.conversation.concat(aPrompt)
                    msgs = aPrompt.map(c => isMap(c) ? c.content : c )
                 
                    _r.conversation = aPrompt
                    return _r._request((aOptions.apiVersion.length > 0 ? aOptions.apiVersion + "/" : "") + "images/generations", merge({
                       model: aModel,
                       prompt: msgs.join("\n"),
                       response_format: "b64_json"
                    }, aOptions.params))   
                    // data[0].b64_json
                },
                promptImgGen: (aPrompt, aModel) => {
                    var res = _r.rawImgGen(aPrompt, aModel)
                    if (isArray(res.data) && res.data.length > 0) {
                        return res.data.map(r => af.fromBase64(r.b64_json))
                    } else {
                        return res
                    }
                },
                addPrompt: (aRole, aPrompt) => {
                    if (isUnDef(aPrompt)) {
                        aPrompt = aRole
                        aRole = "user"
                     }
                     if (isString(aPrompt)) _r.conversation.push({ role: aRole.toLowerCase(), content: aPrompt })
                     if (isArray(aPrompt))  _r.conversation = _r.conversation.concat(aPrompt)
                     return _r
                },
                addUserPrompt: (aPrompt) => {
                    _r.conversation.push({ role: "user", content: aPrompt })
                    return _r
                },
                addSystemPrompt: (aPrompt) => {
                    _r.conversation.push({ role: "system", parts: [ { text: aPrompt } ] })
                    return _r
                },
                cleanPrompt: () => {
                    _r.conversation = []
                    return _r
                },
                getModels: () => {
                    var res = _r._request("models", {}, "GET")
                    if (isDef(res.models)) res = res.models
                    return res
                },
                getEmbeddings: (aInput, aDimensions, aEmbeddingModel) => {
                    aInput = _$(aInput, "aInput").$_()
                    aEmbeddingModel = _$(aEmbeddingModel, "aEmbeddingModel").isString().default("text-embedding-004")
                    aDimensions = _$(aDimensions, "aDimensions").isNumber().default(__)

                    _resetStats()
                    var body = {
                        model: aEmbeddingModel,
                        content: {
                            parts: [{
                                text: isArray(aInput) ? aInput.join("\n") : String(aInput)
                            }]
                        }
                    }
                    if (isDef(aDimensions)) {
                        body.output_dimensionality = aDimensions
                    }
                    body = merge(body, aOptions.params)
                    
                    var _res = _r._request("models/" + aEmbeddingModel + ":embedContent", body)
                    _captureStats(_res, aEmbeddingModel)
                    return _res
                },
                _request: (aURI, aData, aVerb) => {
                    _$(aURI, "aURI").isString().$_()
                    aData = _$(aData, "aData").isMap().default({})
                    aVerb = _$(aVerb, "aVerb").isString().default("POST")
                 
                    var _h = new ow.obj.http(__, __, __, __, __, __, __, { timeout: _timeout })
                    var __m = { 
                       conTimeout    : 60000,
                       httpClient    : _h,
                       requestHeaders: merge(aOptions.headers, { 
                          //Authorization: "Bearer " + Packages.openaf.AFCmdBase.afc.dIP(_key),
                          Accept       : "*/*"
                       })
                    } 
                    _h.close()
                 
                    var _fnh = r => {
                        var _r 
                        if ("function" !== typeof r.getClass) {
                            _r = (isDef(r.error) ? jsonParse(r.error, __, __, true) : r)
                        } else {
                            _r = jsonParse(af.fromBytes2String(r.readAllBytes()))
                        }
                        if (typeof _r.response !== "undefined") {
                            return jsonParse(_r.response)
                        } else {
                            return _r
                        }
                    }

                    switch(aVerb.toUpperCase()) {
                    case "GET" : return _fnh($rest(__m).get2Stream(aOptions.url + (aOptions.url.endsWith("/") ? "" : "/") + aURI + "?key=" + Packages.openaf.AFCmdBase.afc.dIP(_key)))
                    case "POST": return _fnh($rest(__m).post2Stream(aOptions.url + (aOptions.url.endsWith("/") ? "" : "/") + aURI + "?key=" + Packages.openaf.AFCmdBase.afc.dIP(_key), aData))
                    }
                }
            }
            return _r
        }
    },
    ollama: {
        create: (aOptions) => {
            ow.loadObj()
            aOptions = _$(aOptions, "aOptions").isMap().$_()
            aOptions.params = _$(aOptions.params, "aOptions.params").isMap().default({})
            aOptions.timeout = _$(aOptions.timeout, "aOptions.timeout").isNumber().default(15 * 60000)
            aOptions.model = _$(aOptions.model, "aOptions.model").isString().default("llama3.2:latest")
            aOptions.temperature = _$(aOptions.temperature, "aOptions.temperature").isNumber().default(0.7)
            aOptions.url = _$(aOptions.url, "aOptions.url").isString().$_()

            ow.loadObj()
            var _timeout = aOptions.timeout
            var _model = aOptions.model
            var _temperature = aOptions.temperature
            var _url = aOptions.url
            var _params = aOptions.params
            var _lastStats = __
            var _resetStats = () => { _lastStats = __ }
            var _captureStats = (aResponse, aModelName) => {
                if (!isMap(aResponse)) {
                    _lastStats = __
                    return _lastStats
                }

                var stats = { vendor: "ollama" }
                var modelName = isString(aModelName) ? aModelName : _model
                if (isString(aResponse.model)) modelName = aResponse.model
                if (isString(modelName)) stats.model = modelName
                if (isString(aResponse.created_at)) stats.createdAt = aResponse.created_at

                var tokens = {}
                if (isDef(aResponse.prompt_eval_count)) tokens.prompt = aResponse.prompt_eval_count
                if (isDef(aResponse.eval_count)) tokens.completion = aResponse.eval_count
                if (isDef(tokens.prompt) && isDef(tokens.completion)) tokens.total = tokens.prompt + tokens.completion
                if (Object.keys(tokens).length > 0) stats.tokens = tokens

                var durations = {}
                if (isDef(aResponse.total_duration)) durations.total = aResponse.total_duration
                if (isDef(aResponse.load_duration)) durations.load = aResponse.load_duration
                if (isDef(aResponse.prompt_eval_duration)) durations.prompt = aResponse.prompt_eval_duration
                if (isDef(aResponse.eval_duration)) durations.completion = aResponse.eval_duration
                if (Object.keys(durations).length > 0) stats.durations = durations

                if (Object.keys(stats).filter(k => k != "vendor").length == 0) stats = __
                _lastStats = stats
                return _lastStats
            }

            var _r = {
                conversation: [],
                tools: [],
                getModelName: () => _model,
                getConversation: () => {
                    return _r.conversation
                },
                setConversation: (aConversation) => {
                    if (isArray(aConversation)) _r.conversation = aConversation
                    return _r
                },
                getLastStats: () => _lastStats,
                setTool: (aName, aDesc, aParams, aFn) => {
                    _r.tools.push({
                        type: "function",
                        function: {
                            name: aName,
                            description: aDesc,
                            parameters: aParams
                        },
                        fn: aFn
                    })
                    return _r
                },
                prompt: (aPrompt, aModel, aTemperature, aJsonFlag, tools) => {
                    var __r = _r.rawPrompt(aPrompt, aModel, aTemperature, aJsonFlag, tools)
                    if (isMap(__r.message)) {
                        return __r.message.content
                     }
                     return __r
                },
                promptImage: (aPrompt, aImage, aDetailLevel, aRole, aModel, aTemperature, aJsonFlag) => {
                    aRole   = _$(aRole, "aRole").isString().default("user")

                    var base64 = ""
                    if (io.fileExists(aImage)) {
                        base64 = af.fromBytes2String(af.toBase64Bytes(io.readFileBytes(aImage)))
                    } else {
                        if (isString(aImage)) {
                            base64 = aImage
                        }
                    }

                    var __r = _r.rawPrompt([
                        {
                            role: aRole,
                            content: aPrompt,
                            images: [ base64 ]
                        }
                    ], aModel, aTemperature, aJsonFlag)
                    if (isString(__r.response)) return __r.response
                    if (isMap(__r.message) && isString(__r.message.content)) return __r.message.content.trim()
                    return __r
                },
                rawPrompt: (aPrompt, aModel, aTemperature, aJsonFlag, aTools) => {
                    aPrompt      = _$(aPrompt, "aPrompt").default(__)
                    aTemperature = _$(aTemperature, "aTemperature").isNumber().default(_temperature)
                    aModel       = _$(aModel, "aModel").isString().default(_model)
                    aJsonFlag    = _$(aJsonFlag, "aJsonFlag").isBoolean().default(false)
                    aTools       = _$(aTools, "aTools").isArray().default(_r.tools)

                    _resetStats()
                    var msgs = []
                    if (isString(aPrompt)) aPrompt = [ aPrompt ]
                    aPrompt = _r.conversation.concat(aPrompt)
                    msgs = aPrompt.map(c => {
                        if (isMap(c)) {
                            // Ensure content is always a string
                            if (!isString(c.content)) c.content = stringify(c.content, __, "")
                            return c
                        }
                        return { role: "user", content: String(c) }
                    })
                    var uri = "/api/chat"

                    var body = {
                        model: aModel,
                        messages: msgs,
                        options: merge({
                            temperature: aTemperature,
                        }, _params ),
                        stream: false
                    }
                    if (aJsonFlag) {
                        body.format = "json"
                    }
                    if (isArray(aTools) && aTools.length > 0) {
                        body.tools = aTools.map(t => {
                            var _t = t.function
                            return {
                                type: "function",
                                function: {
                                    name: _t.name,
                                    description: _t.description,
                                    parameters: _t.parameters
                                }
                            }
                        })
                    } else {
                        if (isDef(body.tools)) delete body.tools
                    }
                    _r.conversation = msgs
                    var _res = _r._request(uri, body)

                    if (isDef(_res) && isDef(_res.message) && isArray(_res.message["tool_calls"])) {
                        // call tools
                        var _p = []
                        _res.message["tool_calls"].forEach(tc => {
                            if (isDef(tc.function)) {
                                var _t = aTools.find(tool => tool.function && tool.function.name == tc.function.name)
                                if (isUnDef(_t)) throw "Tool '" + tc.function.name + "' not found"
                                var _args = jsonParse(tc.function.arguments)
                                var _tr = _t.fn(_args)
                                // Ensure tool response is a string
                                _p.push({ role: "assistant", tool_calls: [ tc ] })
                                _p.push({ role: "tool", content: isString(_tr) ? _tr : stringify(_tr, __, ""), tool_call_id: tc.function.id })
                            }
                        })
                        // Also ensure all pushed messages have string content
                        _p = _p.map(m => {
                            if (isMap(m) && isDef(m.content) && !isString(m.content)) m.content = stringify(m.content, __, "")
                            return m
                        })
                        _r.conversation = _r.conversation.concat(_p)
                        return _r.rawPrompt(_p, aModel, aTemperature, aJsonFlag, aTools)
                    } else {
                        if (isDef(_res) && isDef(_res.message) && isString(_res.message.content)) {
                            _r.conversation.push({ role: "assistant", content: _res.message.content })
                        } else {
                            _r.conversation.push({ role: "assistant", content: _res })
                        }
                        _captureStats(_res, aModel)
                        return _res
                    }
                },
                rawImgGen: (aPrompt, aModel) => {
                    throw "Not implemented for Ollama"
                },
                promptImgGen: (aPrompt, aModel) => {
                    throw "Not implemented for Ollama"
                },
                addPrompt: (aRole, aPrompt) => {
                    if (isUnDef(aPrompt)) {
                        aPrompt = aRole
                        aRole = "user"
                     }
                     if (isString(aPrompt)) _r.conversation.push({ role: aRole.toLowerCase(), content: aPrompt })
                     if (isArray(aPrompt))  _r.conversation = _r.conversation.concat(aPrompt)
                     return _r
                },
                addUserPrompt: (aPrompt) => {
                    _r.conversation.push({ role: "user", content: aPrompt })
                    return _r
                },
                addSystemPrompt: (aPrompt) => {
                    _r.conversation.push({ role: "system", content: aPrompt })
                    return _r
                },
                cleanPrompt: () => {
                    _r.conversation = []
                    return _r
                },
                getModels: () => {
                    var res = _r._request("/api/tags", {}, "GET")
                    if (isArray(res.models)) {
                        return res.models
                    } else {
                        return res
                    }
                },
                getEmbeddings: (aInput, aDimensions, aEmbeddingModel) => {
                    aInput = _$(aInput, "aInput").$_()
                    aEmbeddingModel = _$(aEmbeddingModel, "aEmbeddingModel").isString().default(_model)
                    aDimensions = _$(aDimensions, "aDimensions").isNumber().default(__)

                    _resetStats()
                    var body = {
                        model: aEmbeddingModel,
                        input: isArray(aInput) ? aInput.join("\n") : String(aInput)
                    }
                    if (isDef(aDimensions)) {
                        body.dimensions = aDimensions
                    }
                    body = merge(body, _params)
                     
                    var _res = _r._request("/api/embed", body)
                    _captureStats(_res, aEmbeddingModel)
                    return _res
                },
                _request: (aURI, aData, aVerb) => {
                    _$(aURI, "aURI").isString().$_()
                    aData = _$(aData, "aData").isMap().default({})
                    aVerb = _$(aVerb, "aVerb").isString().default("POST")
                 
                    if (!aURI.startsWith("/")) aURI = "/" + aURI

                    var _h
                    if (isUnDef(this._h)) {
                        var _h = new ow.obj.http(__, __, __, __, __, __, __, { timeout: _timeout })
                        _h.close()
                    } else {
                        _h = this._h
                    }
                    
                    var __r = { 
                       conTimeout    : 60000,
                       httpClient    : _h,
                       requestHeaders: {
                         Accept: "*/*"
                       }
                    }
                 
                    var _fnh = r => {
                        var _r 
                        if ("function" !== typeof r.getClass) {
                            _r = (isDef(r.error) ? jsonParse(r.error, __, __, true) : r)
                        } else {
                            _r = jsonParse(af.fromBytes2String(r.readAllBytes()))
                        }
                        if (typeof _r.response !== "undefined") {
                            return jsonParse(_r.response)
                        } else {
                            return _r
                        }
                    }

                    var _r
                    switch(aVerb.toUpperCase()) {
                    case "GET" :
                        var _rr = $rest(__r).get2Stream(_url + aURI)
                        _r = _fnh(_rr)
                        break
                    case "POST": 
                        var _rr = $rest(__r).post2Stream(_url + aURI, aData)
                        _r = _fnh(_rr)
                        break
                    }
                    return _r
                }
            }
            return _r
        }
    },
    anthropic: {
        create: (aOptions) => {
            ow.loadObj()
            aOptions = _$(aOptions, "aOptions").isMap().$_()
            aOptions.params = _$(aOptions.params, "aOptions.params").isMap().default({})
            aOptions.key = _$(aOptions.key, "aOptions.key").isString().$_()
            aOptions.timeout = _$(aOptions.timeout, "aOptions.timeout").isNumber().default(15 * 60000)
            aOptions.model = _$(aOptions.model, "aOptions.model").isString().default("claude-3-5-sonnet-20241022")
            aOptions.temperature = _$(aOptions.temperature, "aOptions.temperature").isNumber().default(0.7)
            aOptions.url = _$(aOptions.url, "aOptions.url").isString().default("https://api.anthropic.com/")
            aOptions.headers = _$(aOptions.headers, "aOptions.headers").isMap().default({})
            // If noSystem=true it will not output the system messages
            aOptions.noSystem = _$(aOptions.noSystem, "aOptions.noSystem").isBoolean().default(true)

            var _key = aOptions.key
            var _timeout = aOptions.timeout
            var _model = aOptions.model
            var _temperature = aOptions.temperature
            var _noSystem = aOptions.noSystem
            var _lastStats = __
            var _resetStats = () => { _lastStats = __ }
            var _captureStats = (aResponse, aModelName) => {
                if (!isMap(aResponse)) {
                    _lastStats = __
                    return _lastStats
                }

                var stats = { vendor: "anthropic" }
                var modelName = isString(aModelName) ? aModelName : _model
                if (isString(aResponse.model)) modelName = aResponse.model
                if (isString(modelName)) stats.model = modelName
                if (isString(aResponse.id)) stats.id = aResponse.id
                if (isString(aResponse.type)) stats.type = aResponse.type
                if (isString(aResponse.stop_reason)) stats.stopReason = aResponse.stop_reason

                if (isMap(aResponse.usage)) {
                    var tokens = {}
                    if (isDef(aResponse.usage.input_tokens)) tokens.prompt = aResponse.usage.input_tokens
                    if (isDef(aResponse.usage.output_tokens)) tokens.completion = aResponse.usage.output_tokens
                    if (isDef(aResponse.usage.total_tokens)) tokens.total = aResponse.usage.total_tokens
                    if (Object.keys(tokens).length > 0) stats.tokens = tokens
                    stats.usage = aResponse.usage
                }

                if (isArray(aResponse.content)) {
                    var contentTypes = aResponse.content
                        .filter(c => isMap(c) && isString(c.type))
                        .map(c => c.type)
                    if (contentTypes.length > 0) stats.contentTypes = contentTypes
                }

                if (Object.keys(stats).filter(k => k != "vendor").length == 0) stats = __
                _lastStats = stats
                return _lastStats
            }
            var _r = {
                conversation: [],
                tools: {},
                getModelName: () => _model,
                getConversation: () => {
                    return _r.conversation
                },
                setConversation: (aConversation) => {
                    if (isArray(aConversation)) _r.conversation = aConversation
                    return _r
                },
                getLastStats: () => _lastStats,
                setTool: (aName, aDesc, aParams, aFn) => {
                    _r.tools[aName] = {
                        type: "function",
                        function: {
                            name: aName,
                            description: aDesc,
                            parameters: aParams
                        },
                        fn: aFn
                    }
                    return _r
                },
                prompt: (aPrompt, aModel, aTemperature, aJsonFlag, tools) => {
                    var __r = _r.rawPrompt(aPrompt, aModel, aTemperature, aJsonFlag, tools)
                    if (isArray(__r.content) && __r.content.length > 0) {
                        if (__r.stop_reason === "end_turn") {
                           return __r.content[0].text
                        }
                    }
                    return __r
                },
                promptImage: (aPrompt, aImage, aDetailLevel, aRole, aModel, aTemperature, aJsonFlag) => {
                    throw "Not supported yet"
                },
                rawPrompt: (aPrompt, aModel, aTemperature, aJsonFlag, aTools) => {
                    aPrompt      = _$(aPrompt, "aPrompt").default(__)
                    aTemperature = _$(aTemperature, "aTemperature").isNumber().default(_temperature)
                    aModel       = _$(aModel, "aModel").isString().default(_model)
                    aJsonFlag    = _$(aJsonFlag, "aJsonFlag").isBoolean().default(false)
                    if (isUnDef(aTools)) {
                        aTools = Object.keys(_r.tools)
                    } else if (isMap(aTools)) {
                        aTools = Object.keys(aTools)
                    } else if (isArray(aTools)) {
                        aTools = aTools.map(t => {
                            if (isString(t)) return t
                            if (isMap(t) && isString(t.name)) return t.name
                            if (isMap(t) && isMap(t.function) && isString(t.function.name)) return t.function.name
                        }).filter(isDef)
                    }
                    aTools       = _$(aTools, "aTools").isArray().default([])

                    _resetStats()
                    // Always build messages as a valid array of objects with role and string content
                    var buildMsgObj = function(c) {
                        if (isMap(c)) {
                            let role = isDef(c.role) ? c.role : "user";
                            let content = c.content;
                            if (isArray(content)) content = content.map(x => isString(x) ? x : stringify(x, __, "")).join("\n");
                            if (!isString(content)) content = stringify(content, __, "");
                            return { role, content };
                        } else {
                            return { role: "user", content: String(c) };
                        }
                    };
                    if (isString(aPrompt)) aPrompt = [ aPrompt ];
                    var _incoming = isArray(aPrompt) ? aPrompt : [ aPrompt ];
                    var _fullConversation = _r.conversation.concat(_incoming);
                    var msgs = _fullConversation.map(buildMsgObj);

                    var systemMsgs = msgs.filter(m => m.role == "system");
                    var bodyMessages = (_noSystem ? msgs.filter(m => m.role != "system") : msgs.slice());

                    if (aJsonFlag) {
                        var _jsonInstruction = { role: "user", content: "output json" };
                        bodyMessages.push(_jsonInstruction);
                        msgs.push(_jsonInstruction);
                    }

                    _r.conversation = msgs;

                    var body = {
                        model: aModel,
                        temperature: aTemperature,
                        messages: bodyMessages
                    }
                    // Note: Anthropic does not support response_format like OpenAI.
                    // JSON output is controlled via system prompts and model behavior.
                    // The aJsonFlag instruction is already added to messages above.
                    
                    if (_noSystem && systemMsgs.length > 0) {
                        var _systemText = systemMsgs
                            .map(m => {
                                if (isArray(m.content)) {
                                    return m.content
                                        .map(sc => {
                                            if (isMap(sc) && isString(sc.text)) return sc.text
                                            if (isString(sc)) return sc
                                            return stringify(sc, __, "")
                                        })
                                        .join("\n")
                                }
                                return isString(m.content) ? m.content : stringify(m.content, __, "")
                            })
                            .filter(s => isString(s) && s.length > 0)
                            .join("\n")
                        if (_systemText.length > 0) body.system = _systemText
                    }

                    body = merge(body, aOptions.params)

                    if (isArray(aTools) && aTools.length > 0) {
                        var _bodyTools = aTools
                            .map(t => {
                                if (!isString(t)) return __
                                var _tool = _r.tools[t]
                                if (!isMap(_tool) || !isMap(_tool.function)) return __
                                var _params = clone(_tool.function.parameters)
                                if (isMap(_params)) {
                                    delete _params["$schema"]
                                    delete _params["$id"]
                                }
                                if (!isMap(_params)) _params = { type: "object" }
                                return {
                                    name: _tool.function.name,
                                    description: _tool.function.description,
                                    input_schema: _params
                                }
                            })
                            .filter(isDef)
                        if (_bodyTools.length > 0) body.tools = _bodyTools
                    } else {
                        if (isDef(body.tools)) delete body.tools
                    }

                    var _res = _r._request("v1/messages", body)
                    _captureStats(_res, aModel)

                    if (isMap(_res) && isArray(_res.content)) {
                        var assistantMsg = { role: "assistant", content: _res.content }
                        _r.conversation.push(assistantMsg)

                        var toolCalls = _res.content.filter(c => isMap(c) && c.type == "tool_use")
                        if (toolCalls.length > 0) {
                            var followUps = []
                            toolCalls.forEach(tc => {
                                if (!isString(tc.name)) throw "Invalid tool call without name"
                                var _tool = _r.tools[tc.name]
                                if (isUnDef(_tool)) throw "Tool '" + tc.name + "' not found"
                                if (!isFunction(_tool.fn)) throw "Tool '" + tc.name + "' missing function implementation"
                                var _args = tc.input
                                var _result = _tool.fn(_args)
                                var _content
                                if (isString(_result)) {
                                    _content = _result
                                } else if (isArray(_result) || isMap(_result)) {
                                    _content = stringify(_result, __, "")
                                } else if (isUnDef(_result) || _result === null) {
                                    _content = ""
                                } else {
                                    _content = stringify(_result, __, "")
                                }
                                followUps.push({
                                    role: "user",
                                    content: [
                                        {
                                            type: "tool_result",
                                            tool_use_id: tc.id,
                                            content: _content
                                        }
                                    ]
                                })
                            })
                            if (followUps.length > 0) {
                                _r.conversation = _r.conversation.concat(followUps)
                                return _r.rawPrompt([], aModel, aTemperature, aJsonFlag, aTools)
                            }
                        }

                        return _res
                    } else {
                        _r.conversation.push({
                            role: "assistant",
                            content: _res
                        })
                        return _res
                    }
                },
                rawImgGen: (aPrompt, aModel) => {
                    throw "Not supported yet"
                },
                promptImgGen: (aPrompt, aModel) => {
                    throw "Not supported yet"
                },
                addPrompt: (aRole, aPrompt) => {
                    if (isUnDef(aPrompt)) {
                        aPrompt = aRole
                        aRole = "user"
                     }
                     if (isString(aPrompt)) _r.conversation.push({ role: aRole.toLowerCase(), content: aPrompt })
                     if (isArray(aPrompt))  _r.conversation = _r.conversation.concat(aPrompt)
                     return _r
                },
                addUserPrompt: (aPrompt) => {
                    _r.conversation.push({ role: "user", content: aPrompt })
                    return _r
                },
                addSystemPrompt: (aPrompt) => {
                    _r.conversation.push({ role: "system", content: aPrompt })
                    return _r
                },
                addDeveloperPrompt: (aPrompt) => {
                    _r.conversation.push({ role: "developer", content: aPrompt })
                    return _r
                },
                cleanPrompt: () => {
                    _r.conversation = []
                    return _r
                },
                getModels: () => {
                    var res = _r._request("v1/models", {}, "GET")
                    if (isArray(res.data)) {
                        return res.data
                    } else {
                        return res
                    }
                },
                getEmbeddings: (aInput, aDimensions, aEmbeddingModel) => {
                    throw "Text embeddings not supported by Anthropic"
                },
                _request: (aURI, aData, aVerb) => {
                    _$(aURI, "aURI").isString().$_()
                    aData = _$(aData, "aData").isMap().default({})
                    aVerb = _$(aVerb, "aVerb").isString().default("POST")
                 
                    var _h = new ow.obj.http(__, __, __, __, __, __, __, { timeout: _timeout })
                    var __m = { 
                       conTimeout    : 60000,
                       httpClient    : _h,
                       requestHeaders: merge(aOptions.headers, { 
                          "x-api-key"        : Packages.openaf.AFCmdBase.afc.dIP(_key),
                          "anthropic-version": "2023-06-01",
                          Accept             : "*/*"
                       })
                    } 
                    _h.close()
                 
                    var _fnh = r => {
                        var _r 
                        if ("function" !== typeof r.getClass) {
                            _r = (isDef(r.error) ? jsonParse(r.error, __, __, true) : r)
                        } else {
                            _r = jsonParse(af.fromBytes2String(r.readAllBytes()))
                        }
                        if (typeof _r.response !== "undefined") {
                            return jsonParse(_r.response)
                        } else {
                            return _r
                        }
                    }

                    switch(aVerb.toUpperCase()) {
                    case "GET" : return _fnh($rest(__m).get2Stream(aOptions.url + (aOptions.url.endsWith("/") ? "" : "/") + aURI))
                    case "POST": return _fnh($rest(__m).post2Stream(aOptions.url + (aOptions.url.endsWith("/") ? "" : "/") + aURI, aData))
                    }
                }
            }
            return _r
        }
    }
}

/**
 * <odoc>
 * <key>ow.ai.gpt(aType, aOptions) : ow.ai.gpt</key>
 * Creates a GPT AI model of aType (e.g. "openai" or "ollama") with aOptions.\
 * </odoc>
 */
OpenWrap.ai.prototype.gpt = function(aType, aOptions) {
    if (!isString(aType) || aType.trim().length == 0) {
        throw new Error("GPT type must be a non-empty string.")
    }

    var _type = aType.trim()
    var _types = isMap(ow.ai.__gpttypes) ? Object.keys(ow.ai.__gpttypes) : []
    var _impl = isMap(ow.ai.__gpttypes) ? ow.ai.__gpttypes[_type] : __

    if (isUnDef(_impl)) {
        var _msg = "Unrecognized GPT type '" + _type + "'."
        if (_types.length > 0) {
            _msg += " Available types: " + _types.join(", ")
        }
        throw new Error(_msg)
    }

    this.__type = _type
    this.model = _impl.create(aOptions)
    var _modelName = (isDef(this.model) && isFunction(this.model.getModelName)) ? this.model.getModelName() : __
    if (isUnDef(_modelName) && isMap(aOptions) && isString(aOptions.model)) {
        _modelName = aOptions.model
    }
    this.__modelName = _modelName
}

/**
 * <odoc>
 * <key>ow.ai.gpt.prototype.getType() : String</key>
 * Returns the GPT provider type used to create this instance.
 * </odoc>
 */
OpenWrap.ai.prototype.gpt.prototype.getType = function() {
    return this.__type
}

/**
 * <odoc>
 * <key>ow.ai.gpt.prototype.getModelName() : String</key>
 * Returns the default model name configured for this GPT instance.
 * </odoc>
 */
OpenWrap.ai.prototype.gpt.prototype.getModelName = function() {
    if (isDef(this.model) && isFunction(this.model.getModelName)) {
        var _name = this.model.getModelName()
        if (isDef(_name)) this.__modelName = _name
    }
    return this.__modelName
}

/**
 * <odoc>
 * <key>ow.ai.gpt.prototype.getModels() : Array</key>
 * Returns the available models from the GPT AI service.
 * </odoc>
 */
OpenWrap.ai.prototype.gpt.prototype.getModels = function() {
    return this.model.getModels()
}

/**
 * <odoc>
 * <key>ow.ai.gpt.prototype.getEmbeddings(aInput, aDimensions, aEmbeddingModel) : Object</key>
 * Gets text embeddings for aInput (string or array of strings) using aEmbeddingModel (defaults to provider-specific default).
 * If aDimensions is specified, requests embeddings with that many dimensions (provider support varies).
 * Returns the raw embedding response from the provider.
 * </odoc>
 */
OpenWrap.ai.prototype.gpt.prototype.getEmbeddings = function(aInput, aDimensions, aEmbeddingModel) {
    if (isFunction(this.model.getEmbeddings)) {
        return this.model.getEmbeddings(aInput, aDimensions, aEmbeddingModel)
    } else {
        throw "Embeddings not supported by this provider"
    }
}

/**
 * <odoc>
 * <key>ow.ai.gpt.getLastStats() : Map</key>
 * Returns the latest usage statistics reported by the underlying GPT model for the most recent prompt request.
 * </odoc>
 */
OpenWrap.ai.prototype.gpt.prototype.getLastStats = function() {
    if (isDef(this.model) && isFunction(this.model.getLastStats)) {
        var stats = this.model.getLastStats()
        if (isMap(stats)) return clone(stats)
        return stats
    }
    return __
}

/**
 * <odoc>
 * <key>ow.ai.gpt.prompt(aPrompt, aRole, aModel, aTemperature, aJsonFlag, tools) : String</key>
 * Tries to prompt aPrompt (a string or an array of strings) with aRole (defaults to "user") and aModel (defaults to the one provided on the constructor).
 * </odoc>
 */
OpenWrap.ai.prototype.gpt.prototype.prompt = function(aPrompt, aRole, aModel, aTemperature, aJsonFlag, tools) {
    return this.model.prompt(aPrompt, aRole, aModel, aTemperature, aJsonFlag, tools)
}

/**
 * <odoc>
 * <key>ow.ai.gpt.promptWithStats(aPrompt, aRole, aModel, aTemperature, aJsonFlag, tools) : Map</key>
 * Executes prompt and returns a map with the model response and any reported statistics ({ response, stats }).
 * </odoc>
 */
OpenWrap.ai.prototype.gpt.prototype.promptWithStats = function(aPrompt, aRole, aModel, aTemperature, aJsonFlag, tools) {
    var response = this.model.prompt(aPrompt, aRole, aModel, aTemperature, aJsonFlag, tools)
    return { response: response, stats: this.getLastStats() }
}

/**
 * <odoc>
 * <key>ow.ai.gpt.promptImage(aPrompt, aImage, aDetailLevel, aRole, aModel, aTemperature, jsonFlag) : String</key>
 * Tries to prompt aPrompt (a string or an array of strings) with aImage (a file path or a base64 string representation), aRole (defaults to "user") and aModel (defaults to the one provided on the constructor).
 * </odoc>
 */
OpenWrap.ai.prototype.gpt.prototype.promptImage = function(aPrompt, aImage, aDetailLevel, aRole, aModel, aTemperature, jsonFlag) {
    return this.model.promptImage(aPrompt, aImage, aDetailLevel, aRole, aModel, aTemperature, jsonFlag)
}

/**
 * <odoc>
 * <key>ow.ai.gpt.getConversation() : Array</key>
 * Returns the current conversation.
 * </odoc>
 */
OpenWrap.ai.prototype.gpt.prototype.getConversation = function() {
    return this.model.getConversation()
}

/**
 * <odoc>
 * <key>ow.ai.gpt.setConversation(aConversation) : ow.ai.gpt</key>
 * Sets the current conversation to aConversation.
 * </odoc>
 */
OpenWrap.ai.prototype.gpt.prototype.setConversation = function(aConversation) {
    this.model.setConversation(aConversation)
    return this
}

/**
 * <odoc>
 * <key>ow.ai.gpt.rawPrompt(aPrompt, aRole, aModel, aTemperature, aJsonFlag, tools) : String</key>
 * Tries to prompt aPrompt (a string or an array of strings) with aRole (defaults to "user") and aModel (defaults to the one provided on the constructor).
 * </odoc>
 */
OpenWrap.ai.prototype.gpt.prototype.rawPrompt = function(aPrompt, aRole, aModel, aTemperature, aJsonFlag, tools) {
    return this.model.rawPrompt(aPrompt, aModel, aTemperature, aJsonFlag, tools)
}

/**
 * <odoc>
 * <key>ow.ai.gpt.rawPromptWithStats(aPrompt, aRole, aModel, aTemperature, aJsonFlag, tools) : Map</key>
 * Executes rawPrompt and returns the raw response together with any reported statistics ({ response, stats }).
 * </odoc>
 */
OpenWrap.ai.prototype.gpt.prototype.rawPromptWithStats = function(aPrompt, aRole, aModel, aTemperature, aJsonFlag, tools) {
    var response = this.model.rawPrompt(aPrompt, aModel, aTemperature, aJsonFlag, tools)
    return { response: response, stats: this.getLastStats() }
}

/**
 * <odoc>
 * <key>ow.ai.gpt.promptImgGen(aPrompt, aModel, anOutputPathPrefix) : Array</key>
 * Tries to prompt aPrompt (a string or an array of strings), aModel (defaults to the one provided on the constructor)
 * to generate one or more images and anOutputPathPrefix to which the number of the image and ".png" will be appended.
 * Returns an array of the files generated.
 * </odoc>
 */
OpenWrap.ai.prototype.gpt.prototype.promptImgGen = function(aPrompt, aModel, anOutputPath) {
    anOutputPath = _$(anOutputPath, "anOutputPath").isString().default(String(java.lang.System.getProperty("java.io.tmpdir")) + "/image")
    var _res = this.model.promptImgGen(aPrompt, aModel)
    var files = []
    if (isArray(_res)) {
        _res.forEach((r, idx) => {
            var f = anOutputPath + idx + ".png"
            var os = io.writeFileStream(f)
            ioStreamCopy(os, af.fromBytes2InputStream(r))
            os.close()
            files.push(f)
        })
        return files
    } else {
        throw af.toSLON(_res)
    }

}

/**
 * <odoc>
 * <key>ow.ai.gpt.rawImgGen(aPrompt, aModel) : Map</key>
 * Tries to generate an image based on aPrompt (a string or an array of strings) with aModel (defaults to the one provided on the constructor).
 * Returns the raw result.
 * </odoc>
 */
OpenWrap.ai.prototype.gpt.prototype.rawImgGen = function(aPrompt, aModel) {
    return this.model.rawImgGen(aPrompt, aModel)
}

/**
 * <odoc>
 * <key>ow.ai.gpt.addPrompt(aPrompt, aRole) : ow.ai.gpt</key>
 * Adds aPrompt (a string or an array of strings) with aRole (defaults to "user") to the current conversation.
 * </odoc>
 */
OpenWrap.ai.prototype.gpt.prototype.addPrompt = function(aPrompt, aRole) {
    this.model = this.model.addPrompt(aPrompt, aRole)
    return this
}

/**
 * <odoc>
 * <key>ow.ai.gpt.addUserPrompt(aPrompt) : ow.ai.gpt</key>
 * Adds aPrompt (a string or an array of strings) with aRole (defaults to "user") to the current conversation.
 * </odoc>
 */
OpenWrap.ai.prototype.gpt.prototype.addUserPrompt = function(aPrompt) {
    this.model = this.model.addUserPrompt(aPrompt)
    return this
}

/**
 * <odoc>
 * <key>ow.ai.gpt.addSystemPrompt(aPrompt) : ow.ai.gpt</key>
 * Adds aPrompt (a string or an array of strings) with aRole (defaults to "user") to the current conversation.
 * </odoc>
 */
OpenWrap.ai.prototype.gpt.prototype.addSystemPrompt = function(aPrompt) {
    this.model = this.model.addSystemPrompt(aPrompt)
    return this
}

/**
 * <odoc>
 * <key>ow.ai.gpt.addDeveloperPrompt(aPrompt) : ow.ai.gpt</key>
 * Adds aPrompt (a string or an array of strings) with aRole (defaults to "developer") to the current conversation.
 * </odoc>
 */
OpenWrap.ai.prototype.gpt.prototype.addDeveloperPrompt = function(aPrompt) {
    this.model = this.model.addDeveloperPrompt(aPrompt)
    return this
}

/**
 * <odoc>
 * <key>ow.ai.gpt.cleanPrompt() : ow.ai.gpt</key>
 * Cleans the current conversation.
 * </odoc>
 */
OpenWrap.ai.prototype.gpt.prototype.cleanPrompt = function() {
    this.model = this.model.cleanPrompt()
    return this
}

/**
 * <odoc>
 * <key>ow.ai.gpt.jsonPrompt(aPrompt, aModel, aTemperature, tools) : Object</key>
 * Tries to prompt aPrompt (a string or an array of strings) with aRole (defaults to "user") and aModel (defaults to the one provided on the constructor).
 * </odoc>
 */
OpenWrap.ai.prototype.gpt.prototype.jsonPrompt = function(aPrompt, aModel, aTemperature, tools) {
    this.setInstructions("json")

    var out = this.model.prompt(aPrompt, aModel, aTemperature, true, tools)
    return isString(out) ? jsonParse(out, __, __, true) : out
}

/**
 * <odoc>
 * <key>ow.ai.gpt.jsonPromptWithStats(aPrompt, aModel, aTemperature, tools) : Map</key>
 * Executes jsonPrompt and returns the parsed response together with any reported statistics ({ response, stats }).
 * </odoc>
 */
OpenWrap.ai.prototype.gpt.prototype.jsonPromptWithStats = function(aPrompt, aModel, aTemperature, tools) {
    this.setInstructions("json")

    var out = this.model.prompt(aPrompt, aModel, aTemperature, true, tools)
    var parsed = isString(out) ? jsonParse(out, __, __, true) : out
    return { response: parsed, stats: this.getLastStats() }
}

/**
 * <odoc>
 * <key>ow.ai.gpt.booleanPrompt(aPrompt, aModel, aTemperature, tools) : boolean</key>
 * Tries to prompt aPrompt (a string or an array of strings) with aRole (defaults to "user") and aModel (defaults to the one provided on the constructor).
 * </odoc>
 */
OpenWrap.ai.prototype.gpt.prototype.booleanPrompt = function(aPrompt, aModel, aTemperature, tools) {
    this.setInstructions("boolean")

    var out = this.model.prompt(aPrompt, aModel, aTemperature, tools)
    return isString(out) ? (out.toLowerCase() == "true") : out 
}

/**
 * <odoc>
 * <key>ow.ai.gpt.setTool(aName, aDesc, aParams, aFn) : ow.ai.gpt</key>
 * Sets a tool with aName, aDesc (description), aParams (a json schema) and aFn (a javascript function tha receives a map according with the provided json schema and returns a map)
 * </odoc>
 */
OpenWrap.ai.prototype.gpt.prototype.setTool = function(aName, aDesc, aParams, aFn) {
    this.model.setTool(aName, aDesc, aParams, aFn)
    return this
}

/**
 * <odoc>
 * <key>ow.ai.gpt.setInstructions(aType) : ow.ai.gpt</key>
 * Sets the instructions for the current conversation. aType can be a string (e.g. json, boolean, sql, js and path) or an array of strings.
 * </odoc>
 */
OpenWrap.ai.prototype.gpt.prototype.setInstructions = function(aType) {
    if (isArray(aType)) {
        this.addSystemPrompt(aType.join("\n"))
    } else {
        if (isString(aType)) {
            switch(aType.toLowerCase()) {
            case "json"   : this.addSystemPrompt("Respond in JSON."); break;
            case "boolean": this.addSystemPrompt("Acting as an assistant you can only answer with the most correct of only three possible answers: 'true', 'false', 'undefined'."); break;
            case "sql"    : this.addSystemPrompt("Acting as a powerfull SQL assistant you can only output an answer as a single SQL query."); break;
            case "js"     : this.addSystemPrompt("Acting as a powerfull Javascript assistant you can only output an answer as a single Javascript function."); break;
            case "path"   : this.addSystemPrompt("Acting as a powerfull JMESPath assistant you can only output an answer as a single JMESPath query string."); break;
            }
        }
    }

    return this
}

/**
 * <odoc>
 * <key>ow.ai.gpt.sqlPrompt(aPrompt, aTableDefs, aDBName, aModel, aTemperature, tools) : String</key>
 * Tries to prompt aPrompt (a string or an array of strings) with aRole (defaults to "user") and aModel (defaults to the one provided on the constructor).
 * </odoc>
 */
OpenWrap.ai.prototype.gpt.prototype.sqlPrompt = function(aPrompt, aTableDefs, aDBName, aModel, aTemperature, tools) {
    aDBName = _$(aDBName, "aDBName").isString().default("H2")
    aTableDefs = _$(aTableDefs, "aTableDefs").isArray().$_()

    this.addSystemPrompt("Acting as a powerfull SQL assistant you can only output an answer as a single " + aDBName + " database SQL query, where all column names are double-quoted, considering the table '" + aTableDefs.join("' and the table '") + "'")
    var out = this.model.prompt(aPrompt, aModel, aTemperature, tools)
    return out
}

/**
 * <odoc>
 * <key>ow.ai.gpt.pathPrompt(aPrompt, aJSONSchemaDef, aModel, aTemperature, tools) : String</key>
 * Tries to prompt aPrompt (a string or an array of strings) with aRole (defaults to "user") and aModel (defaults to the one provided on the constructor).
 * </odoc>
 */
OpenWrap.ai.prototype.gpt.prototype.pathPrompt = function(aPrompt, aJSONSchemaDef, aModel, aTemperature, tools) {
    this.addSystemPrompt("you can only output an answer as a single JMESPath query string to use as argument for JMESPath")
    this.addSystemPrompt("consider the array to be queried is composed of maps with the following json schema " + stringify(aJSONSchemaDef,__,""))
    
    var out = this.model.prompt(aPrompt, aModel, aTemperature, tools)
    return out
}

/**
 * <odoc>
 * <key>ow.ai.gpt.parseCode(anAnswer) : String</key>
 * Tries to parse anAnswer and return the code between \``` and \```.
 * </odoc>
 */
OpenWrap.ai.prototype.gpt.prototype.parseCode = function(anAnswer) {
    _$(anAnswer, "anAnswer").isString().$_()

    if (anAnswer.indexOf("```") < 0) return anAnswer

	var code = "", codeLines = false
	var ar = anAnswer.split("\n")
    for(var i = 0; i < ar.length; i++) {
        var line = ar[i]

		if (line.indexOf("```") >= 0) {
			if (codeLines) {
				codeLines = false
                return code
			} else {
				codeLines = true
			}
			if (/`{3,}[^`]+`{3,}/.test(line)) {
				code += line.match(/`{3,}([^`]+)`{3,}/)[1]
				codeLines = false
                return code
			}
		} else {
			if (codeLines) {
				code += line + "\n"
			}
		}
	}
	return code
}

/**
 * <odoc>
 * <key>ow.ai.gpt.codePrompt(aPrompt, aModel, aTemperature, aCommentChars) : String</key>
 * Tries to prompt aPrompt (a string or an array of strings) with aRole (defaults to "user") and aModel (defaults to the one provided on the constructor).
 * </odoc>
 */
OpenWrap.ai.prototype.gpt.prototype.codePrompt = function(aPrompt, aModel, aTemperature, aCommentChars) {
    aCommentChars = _$(aCommentChars, "aCommentChars").isString().default("#")

    var aResponse = this.model.prompt(aPrompt, aModel, aTemperature)

    if (aResponse.indexOf("```") >= 0) {
       var code = false
       return aResponse.split("\n").map(line => {
          if (line.indexOf("```") >= 0) {
             var _t = aCommentChars + " ---" + (code ? "^^^" : "vvv") + "---"
             code = !code
             return _t
          }
          if (code) {
             return line
          } else {
             return (line.length > 0) ? aCommentChars + " " + line : ""
          }
       }).filter(isDef).join("\n")
    } else {
       return aResponse
    }
}

/**
 * <odoc>
 * <key>$gpt(aModel) : $gpt</key>
 * Creates a GPT AI model of aType (e.g. "openai" or "ollama") with aOptions.\
 * \
 * aModel can be a map with the following properties:\
 * - type: the type of the model (e.g. "openai", "ollama", "anthropic")\
 * - options: a map with the options for the model (e.g. { key: "your-api-key", model: "gpt-3.5-turbo", temperature: 0.7, url: "https://api.openai.com/" })\
 * - conversation: an array of messages to start the conversation (e.g. [{ role: "system", content: "You are a helpful assistant." }, { role: "user", content: "Hello!" }])\
 * - tools: a map with the tools to use in the conversation (e.g. { "tool1": { type: "function", function: { name: "tool1", description: "A tool that does something", parameters: { type: "object", properties: { param1: { type: "string" } } } }, fn: function(args) { return args.param1; } } })\
 * - timeout: the timeout for the requests in milliseconds (defaults to 15 minutes)\
 * - noSystem: if true, it will not output the system messages (defaults to true)\
 * - instructions: a string or an array of strings with the instructions for the model (e.g. "json", "boolean", "sql", "js", "path")\
 * - headers: a map with the headers to use in the requests (e.g. { "Content-Type": "application/json" })\
 * - params: a map with the parameters to use in the requests (e.g. { "max_tokens": 1000, "top_p": 1, "frequency_penalty": 0, "presence_penalty": 0 })\
 * \
 * If aModel is not provided, it will try to get the model from the environment variable "OAF_MODEL" with the map in JSON or SLON format.
 * \
 * The returned object also exposes helper methods to inspect vendor usage information: `getLastStats`/`lastStats` (map with the latest statistics), `promptWithStats`,
 * `promptJSONWithStats` and `rawPromptWithStats` (returning `{ response, stats }`).
 * </odoc>
 */
global.$gpt = function(aModel) {
    if (isUnDef(aModel) && isDef(getEnv("OAF_MODEL"))) aModel = af.fromJSSLON(getEnv("OAF_MODEL"))
    _$(aModel, "options").isMap().$_()
    var type = _$(aModel.type, "type").isString().$_()

    var _dbtbls = [], _dbname
    var _g = new ow.ai.gpt(type, aModel)
    var _r = {
        getGPT: () => _g,
        getAPI: () => _g,
        getModels: () => {
            return _g.getModels()
        },
        /**
         * <odoc>
         * <key>$gpt.getLastStats() : Map</key>
         * Returns the latest usage statistics reported by the underlying LLM vendor for the last prompt request.
         * </odoc>
         */
        getLastStats: () => _g.getLastStats(),
        /**
         * <odoc>
         * <key>$gpt.lastStats() : Map</key>
         * Alias for $gpt.getLastStats.
         * </odoc>
         */
        lastStats: () => _g.getLastStats(),
        /**
         * <odoc>
         * <key>$gpt.prompt(aPrompt, aRole, aModel, aTemperature, tools) : String</key>
         * Tries to prompt aPrompt (a string or an array of strings) and aModel (defaults to the one provided on the constructor).
         * </odoc>
         */
        prompt: (aPrompt, aRole, aModel, aTemperature, tools) => {
            return _g.prompt(aPrompt, aRole, aModel, aTemperature, tools)
        },
        /**
         * <odoc>
         * <key>$gpt.promptWithStats(aPrompt, aRole, aModel, aTemperature, tools) : Map</key>
         * Executes prompt and returns a map with the response and the reported statistics ({ response, stats }).
         * </odoc>
         */
        promptWithStats: (aPrompt, aRole, aModel, aTemperature, tools) => {
            var response = _g.prompt(aPrompt, aRole, aModel, aTemperature, tools)
            return { response: response, stats: _g.getLastStats() }
        },
        /**
         * <odoc>
         * <key>$gpt.rawPromptWithStats(aPrompt, aModel, aTemperature, aJsonFlag, tools) : Map</key>
         * Executes the underlying rawPrompt call and returns the raw response together with the reported statistics ({ response, stats }).
         * </odoc>
         */
        rawPromptWithStats: (aPrompt, aModel, aTemperature, aJsonFlag, tools) => {
            var response = _g.rawPrompt(aPrompt, aModel, aTemperature, aJsonFlag, tools)
            return { response: response, stats: _g.getLastStats() }
        },
        /**
         * <odoc>
         * <key>$gpt.promptImage(aPrompt, aImage, aDetailLevel, aRole, aModel, aTemperature, jsonFlag) : String</key>
         * Tries to prompt aPrompt (a string or an array of strings) with aImage (a file path or a base64 string representation), aRole (defaults to "user") and aModel (defaults to the one provided on the constructor).
         * </odoc>
         */
        promptImage: (aPrompt, aImage, aDetailLevel, aRole, aModel, aTemperature, jsonFlag) => {
            return _g.promptImage(aPrompt, aImage, aDetailLevel, aRole, aModel, aTemperature, jsonFlag)
        },
        /**
         * <odoc>
         * <key>$gpt.promptImgGen(aPrompt, aModel, aPath) : Array</key>
         * Tries to prompt aPrompt and aModel (defaults to the one provided on the constructor) to generate one or more images and aPath to which the number of the image and ".png" will be saved to.
         * Returns an array of the image files generated.
         * </odoc>
         */
        promptImgGen: (aPrompt, aModel, aPath) => {
            return _g.promptImgGen(aPrompt, aModel, aPath)
        },
        /**
         * <odoc>
         * <key>$gpt.promptMD(aPrompt, aRole, aModel, aTemperature, tools) : String</key>
         * Tries to prompt aPrompt (a string or an array of strings) and aModel (defaults to the one provided on the constructor) returning a markdown string.
         * </odoc>
         */
        promptMD: (aPrompt, aRole, aModel, aTemperature, tools) => {
            return ow.loadFormat().withMD(_g.prompt(aPrompt, aRole, aModel, aTemperature, tools))
        },
        /**
         * <odoc>
         * <key>$gpt.promptBool(aPrompt, aRole, aModel, aTemperature, tools) : boolean</key>
         * Tries to prompt aPrompt (a string or an array of strings) and aModel (defaults to the one provided on the constructor) returning a boolean.
         * </odoc>
         */
        promptBool: (aPrompt, aRole, aModel, aTemperature, tools) => {
            return _g.booleanPrompt(aPrompt, aRole, aModel, aTemperature, tools)
        },
        /**
         * <odoc>
         * <key>$gpt.promptSQL(aPrompt, aTableDefs, aDBName, aModel, aTemperature, tools)</key>
         * Tries to prompt aPrompt (a string or an array of strings) and aModel (defaults to the one provided on the constructor) returning a SQL query.
         * </odoc>
         */
        promptSQL: (aPrompt, aTableDefs, aDBName, aModel, aTemperature, tools) => {
            return _g.sqlPrompt(aPrompt, _dbtbls, _dbname, aModel, aTemperature, tools)
        },
        /**
         * <odoc>
         * <key>$gpt.promptPath(aPrompt, aJSONSchemaDef, aModel, aTemperature)</key>
         * Tries to prompt aPrompt (a string or an array of strings) and aModel (defaults to the one provided on the constructor) returning a JMESPath query.
         * </odoc>
         */
        promptPath: (aPrompt, aJSONSchemaDef, aModel, aTemperature, tools) => {
            return _g.pathPrompt(aPrompt, aJSONSchemaDef, aModel, aTemperature, tools)
        },
        /**
         * <odoc>
         * <key>$gpt.promptJSON(aPrompt, aModel, aTemperature)</key>
         * Tries to prompt aPrompt (a string or an array of strings) and aModel (defaults to the one provided on the constructor) returning a Javascript function.
         * </odoc>
         */
        promptJSON: (aPrompt, aModel, aTemperature, tools) => {
            return _g.jsonPrompt(aPrompt, aModel, aTemperature, tools)
        },
        /**
         * <odoc>
         * <key>$gpt.promptJSONWithStats(aPrompt, aModel, aTemperature)</key>
         * Tries to prompt aPrompt (a string or an array of strings) and aModel (defaults to the one provided on the constructor) returning a map with the parsed JSON response and statistics ({ response, stats }).
         * </odoc>
         */
        promptJSONWithStats: (aPrompt, aModel, aTemperature, tools) => {
            return _g.jsonPromptWithStats(aPrompt, aModel, aTemperature, tools)
        },
        /**
         * <odoc>
         * <key>$gpt.iniPrompt(aPrompt, aRole, aModel, aTemperature) : String</key>
         * Tries to prompt aPrompt (a string or an array of strings) and aModel (defaults to the one provided on the constructor) after cleaning the current conversation.
         * </odoc>
         */
        iniPrompt: (aPrompt, aRole, aModel, aTemperature, tools) => {
            return _g.cleanPrompt().prompt(aPrompt, aRole, aModel, aTemperature, tools)
        },
        /**
         * <odoc>
         * <key>$gpt.sysPrompt(aPrompt, aModel, aTemperature) : String</key>
         * Adds a prompt system aPrompt (a string or an array of strings) and aModel (defaults to the one provided on the constructor).
         * </odoc>
         */
        sysPrompt: (aPrompt, aModel, aTemperature) => { 
            _g.addSystemPrompt(aPrompt)
            return _r
        },
        devPrompt: (aPrompt, aModel, aTemperature) => {
            _g.addDeveloperPrompt(aPrompt)
            return _r
        },
        withInstructions: (aPrompt, aModel, aTemperature) => {
            _g.addSystemPrompt(aPrompt)
            return _r
        },
        /**
         * <odoc>
         * <key>$gpt.withContext(anObject, aContext) : ow.ai.gpt</key>
         * Adds a context to the current conversation.
         * </odoc>
         */
        withContext: (anObject, aContext) => {
            _$(anObject, "anObject").$_()
            _$(aContext, "aContext").isString().$_()

            _g.addSystemPrompt("with " + aContext + ": " + stringify(anObject, __, ""))

            return _r
        },
        /**
         * <odoc>
         * <key>$gpt.withTool(aName, aDesc, aParams, aFn) : ow.ai.gpt</key>
         * Sets a tool with aName, aDesc (description), aParams (a json schema) and aFn (a javascript function tha receives a map according with the provided json schema and returns a map)
         * </odoc>
         */
        withTool: (aName, aDesc, aParams, aFn) => {
            _g.model.setTool(aName, aDesc, aParams, aFn)
            return _r
        },
        /**
         * <odoc>
         * <key>$gpt.withMcpTools(aMcpClient, aToolNames) : ow.ai.gpt</key>
         * Automatically adds MCP tools from an MCP client to the current GPT instance. The aMcpClient should be an initialized $mcp client.
         * If aToolNames is provided (array of strings), only those specific tools will be added. Otherwise, all available tools are added.
         * Each MCP tool will be converted to a GPT-compatible tool using the MCP tool's JSON schema.
         * \
         * Example:\
         * \
         * var mcpClient = $mcp({cmd: "npx @modelcontextprotocol/server-filesystem /tmp"});\
         * mcpClient.initialize();\
         * var gpt = $gpt({type: "openai", options: {key: "your-key"}});\
         * gpt.withMcpTools(mcpClient); // Adds all MCP tools\
         * // or gpt.withMcpTools(mcpClient, ["read_file", "write_file"]); // Adds only specific tools\
         * \
         * var response = gpt.prompt("Read the file /tmp/example.txt");\
         * </odoc>
         */
        withMcpTools: (aMcpClient, aToolNames) => {
            _$(aMcpClient, "aMcpClient").isMap().$_()
            aToolNames = _$(aToolNames, "aToolNames").isArray().default(__)

            if (!aMcpClient._initialized) {
                throw new Error("MCP client not initialized. Call initialize() first.")
            }

            var toolsList = aMcpClient.listTools()
            if (!isArray(toolsList.tools)) {
                throw new Error("Unable to retrieve tools from MCP client")
            }

            var toolsToAdd = toolsList.tools
            if (isDef(aToolNames)) {
                toolsToAdd = toolsList.tools.filter(tool => aToolNames.indexOf(tool.name) >= 0)
            }

            toolsToAdd.forEach(tool => {
                var gptParams = {
                    type: "object",
                    properties: tool.inputSchema.properties || {},
                    required: tool.inputSchema.required || []
                }

                var mcpToolFn = function(args) {
                    try {
                        var result = aMcpClient.callTool(tool.name, args)
                        if (isDef(result.content) && isArray(result.content)) {
                            // Extract text content from MCP result
                            return result.content.map(c => c.text || c.data || stringify(c)).join("\n")
                        } else if (isDef(result.content)) {
                            return result.content
                        } else {
                            return stringify(result)
                        }
                    } catch(e) {
                        return "Error calling MCP tool '" + tool.name + "': " + e.message
                    }
                }

                _g.model.setTool(tool.name, tool.description, gptParams, mcpToolFn)
            })

            return _r
        },
        /**
         * <odoc>
         * <key>$gpt.withSQLTables(aDBName, aTablesDefs) : ow.ai.gpt</key>
         * Adds aDBName with aTableDefs to be used with promptSQL.
         * </odoc>
         */
        withSQLTables: (aDBName, aTableDefs) => {
            _$(aDBName, "aDBName").isString().$_()
            _$(aTableDefs, "aTableDefs").isArray().$_()

            _dbtbls = aTableDefs
            _dbname = aDBName

            return _r
        },
        /**
         * <odoc>
         * <key>$gpt.withJSONAssert(aPath, anAssert) : ow.ai.gpt</key>
         * Adds a JSON path aPath to be asserted with anAssert (e.g. isArray or isMap).
         * </odoc>
         */
        withJSONAssert: (aPath, anAssert) => {
            _$(aPath, "aPath").isString().$_()
            _$(anAssert, "anAssert").isString().$_()

            switch(anAssert.toLowerCase()) {
            case "isArray": _g.addSystemPrompt("The JSON result should have '" + aPath + "' as an array."); break
            case "isMap"  : _g.addSystemPrompt("The JSON result should have '" + aPath + "' as a map."); break
            }

            return _r
        },
        /**
         * <odoc>
         * <key>$gpt.getEmbeddings(aInput, aDimensions, aEmbeddingModel) : Object</key>
         * Gets text embeddings for aInput (string or array of strings) using aEmbeddingModel (defaults to provider-specific default).
         * If aDimensions is specified, requests embeddings with that many dimensions (provider support varies).
         * Returns the raw embedding response from the provider.
         * </odoc>
         */
        getEmbeddings: (aInput, aDimensions, aEmbeddingModel) => {
            return _g.getEmbeddings(aInput, aDimensions, aEmbeddingModel)
        },
        /**
         * <odoc>
         * <key>$gpt.getEmbeddingsWithStats(aInput, aDimensions, aEmbeddingModel) : Map</key>
         * Gets text embeddings for aInput (string or array of strings) using aEmbeddingModel and returns both the response and usage statistics.
         * If aDimensions is specified, requests embeddings with that many dimensions (provider support varies).
         * Returns a map with { response, stats }.
         * </odoc>
         */
        getEmbeddingsWithStats: (aInput, aDimensions, aEmbeddingModel) => {
            var response = _g.getEmbeddings(aInput, aDimensions, aEmbeddingModel)
            return { response: response, stats: _g.getLastStats() }
        },
        /**
         * <odoc>
         * <key>$gpt.close()</key>
         * Closes the current GPT model.
         * </odoc>
         */
        close: () => { 
            _g = __
        }
    }

    return _r
}

/**
 * <odoc>
 * <key>ow.ai.network(aMap) : ow.ai.network</key>
 * Creates a neural network given the parameters in aMap. aMap should contain a "type" parameter to indicate
 * the type of network (synaptic: perceptron, lstm, liquid or hopfield; brainjs: neuralnetwork, rnntimestep, lstmtimestep, grutimestep, rnn, lstm or gru). 
 * Then aMap should contain a "args" parameter to
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
        // BrainJS
        case 'neuralnetwork': 
            loadLib(getOpenAFJar() + "::js/brainjs.js")
            this.__bjnet = new brain.NeuralNetwork(args.args) 
            break
        case 'rnntimestep'  : 
            loadLib(getOpenAFJar() + "::js/brainjs.js")
            this.__bjnet = new brain.recurrent.RNNTimeStep(args.args)
            break
        case 'lstmtimestep' : 
            loadLib(getOpenAFJar() + "::js/brainjs.js")
            this.__bjnet = new brain.recurrent.LSTMTimeStep(args.args)
            break
        case 'grutimestep'  : 
            loadLib(getOpenAFJar() + "::js/brainjs.js")
            this.__bjnet = new brain.recurrent.GRUTimeStep(args.args)
            break
        case 'rnn'          : 
            loadLib(getOpenAFJar() + "::js/brainjs.js")
            this.__bjnet = new brain.recurrent.RNN(args.args)
            break
        case 'lstm'         : 
            loadLib(getOpenAFJar() + "::js/brainjs.js")
            this.__bjnet = new brain.recurrent.LSTM(args.args)
            break
        case 'gru'          : 
            loadLib(getOpenAFJar() + "::js/brainjs.js")
            this.__bjnet = new brain.recurrent.GRU(args.args)
            break
        case 'feedfoward'   :
            loadLib(getOpenAFJar() + "::js/brainjs.js")
            this.__bjnet = new brain.FeedForward(args.args)
            break
        case 'recurrent'    :
            loadLib(getOpenAFJar() + "::js/brainjs.js")
            this.__bjnet = new brain.Recurrent(args.args)
            break 
        }
    }
}

/**
 * <odoc>
 * <key>ow.ai.network.neuralnetwork(args) : ow.ai.network</key>
 * Examples: https://github.com/BrainJS/brain.js?tab=readme-ov-file#examples
 * Data format: https://github.com/BrainJS/brain.js?tab=readme-ov-file#for-training-with-neuralnetwork
 * Train: https://github.com/BrainJS/brain.js?tab=readme-ov-file#training-options
 * </odoc>
 */
/**
 * <odoc>
 * <key>ow.ai.network.rnntimestep(args) : ow.ai.network</key>
 * Examples: https://github.com/BrainJS/brain.js?tab=readme-ov-file#examples
 * Data format: https://github.com/BrainJS/brain.js?tab=readme-ov-file#for-training-with-rnntimestep-lstmtimestep-and-grutimestep
 * Train: https://github.com/BrainJS/brain.js?tab=readme-ov-file#training-options
 * </odoc>
 */
/**
 * <odoc>
 * <key>ow.ai.network.lstmtimestep(args) : ow.ai.network</key>
 * Examples: https://github.com/BrainJS/brain.js?tab=readme-ov-file#examples
 * Data format: https://github.com/BrainJS/brain.js?tab=readme-ov-file#for-training-with-rnntimestep-lstmtimestep-and-grutimestep
 * Train: https://github.com/BrainJS/brain.js?tab=readme-ov-file#training-options
 * </odoc>
 */
/**
 * <odoc>
 * <key>ow.ai.network.grutimestep(args) : ow.ai.network</key>
 * Examples: https://github.com/BrainJS/brain.js?tab=readme-ov-file#examples
 * Data format: https://github.com/BrainJS/brain.js?tab=readme-ov-file#for-training-with-rnntimestep-lstmtimestep-and-grutimestep
 * Train: https://github.com/BrainJS/brain.js?tab=readme-ov-file#training-options
 * </odoc>
 */
/**
 * <odoc>
 * <key>ow.ai.network.rnn(args) : ow.ai.network</key>
 * Examples: https://github.com/BrainJS/brain.js?tab=readme-ov-file#examples
 * Data format: https://github.com/BrainJS/brain.js?tab=readme-ov-file#for-training-with-rnn-lstm-and-gru
 * Train: https://github.com/BrainJS/brain.js?tab=readme-ov-file#training-options
 * </odoc>
 */
/**
 * <odoc>
 * <key>ow.ai.network.lstm(args) : ow.ai.network</key>
 * Examples: https://github.com/BrainJS/brain.js?tab=readme-ov-file#examples
 * Data format: https://github.com/BrainJS/brain.js?tab=readme-ov-file#for-training-with-rnn-lstm-and-gru
 * Train: https://github.com/BrainJS/brain.js?tab=readme-ov-file#training-options
 * </odoc>
 */
/**
 * <odoc>
 * <key>ow.ai.network.gru(args) : ow.ai.network</key>
 * Examples: https://github.com/BrainJS/brain.js?tab=readme-ov-file#examples
 * Data format: https://github.com/BrainJS/brain.js?tab=readme-ov-file#for-training-with-rnn-lstm-and-gru
 * Train: https://github.com/BrainJS/brain.js?tab=readme-ov-file#training-options
 * </odoc>
 */
/**
 * <odoc>
 * <key>ow.ai.network.feedfoward(args) : ow.ai.network</key>
 * Examples: https://github.com/BrainJS/brain.js?tab=readme-ov-file#examples
 * Data format: https://github.com/BrainJS/brain.js?tab=readme-ov-file#neural-network-types
 * Train: https://github.com/BrainJS/brain.js?tab=readme-ov-file#training-options
 * </odoc>
 */
/**
 * <odoc>
 * <key>ow.ai.network.recurrent(args) : ow.ai.network</key>
 * Examples: https://github.com/BrainJS/brain.js?tab=readme-ov-file#examples
 * Data format: https://github.com/BrainJS/brain.js?tab=readme-ov-file#neural-network-types
 * Train: https://github.com/BrainJS/brain.js?tab=readme-ov-file#training-options
 * </odoc>
 */

/**
 * <odoc>
 * <key>ow.ai.network.getSynapticObject() : Object</key>
 * Returns the current Synaptic object.
 * </odoc>
 */
OpenWrap.ai.prototype.network.prototype.getSynapticObject = function() {
    return this.__net
}

/**
 * <odoc>
 * <key>ow.ai.network.getBrainJSObject() : Object</key>
 * Returns the current BrainJS object.
 * </odoc>
 
 */
OpenWrap.ai.prototype.network.prototype.getBrainJSObject = function() {
    return this.__bjnet
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
    if (isUnDef(this.__net) && isUnDef(this.__bjnet)) throw "Network not initialized."

    if (isDef(this.__net)) {
        var t = new ow.ai.synaptic.Trainer(this.__net)
        t.train(trainingData, trainArgs)
        return t
    } else if (isDef(this.__bjnet)) {
        return this.__bjnet.train(trainingData, trainArgs)
    }
}

/**
 * <odoc>
 * <key>ow.ai.network.forecast(aInput, aCount) : Array</key>
 * </odoc>
 */
OpenWrap.ai.prototype.network.prototype.forecast = function(aInput, aCount) {
    if (isUnDef(this.__bjnet)) throw "BrainJS network not initialized."

    if (isDef(this.__bjnet)) {
        return this.__bjnet.forecast(aInput, aCount)
    }
}

/**
 * <odoc>
 * <key>ow.ai.network.get(inputArray) : Array</key>
 * Given an inputArray of decimal values, normalize between 0 and 1, will activate the current network and 
 * return an output array of decimal values between 0 and 1.
 * </odoc>
 */
OpenWrap.ai.prototype.network.prototype.get = function(inputData) {
    if (isUnDef(this.__net) && isUnDef(this.__bjnet)) throw "Network not initialized.";

    if (isDef(this.__net)) return this.__net.activate(inputData)
    if (isDef(this.__bjnet)) {
        var _d = this.__bjnet.run(inputData)
        if (Object.prototype.toString.call(_d) === '[object Float32Array]') _d = Array.from(_d)
        return _d
    }
};

/**
 * <odoc>
 * <key>ow.ai.network.put(inputArray, outputArray, learningRate)</key>
 * Given an inputArray of decimal values, normalize between 0 and 1, will activate the current network and then
 * the outputArray of decimal values, normalize between 0 and 1, with an optionial learningRate (defaults to 0.3).
 * </odoc>
 */
OpenWrap.ai.prototype.network.prototype.put = function(inputData, outputData, learningRate, bjOptions) {
    if (isUnDef(this.__net) && isUnDef(this.__bjnet)) throw "Network not initialized."
    if (isUnDef(this.__bjnet)) {
        learningRate = _$(learningRate).isNumber().default(0.3)

        this.__net.activate(inputData)
        this.__net.propagate(learningRate, outputData)
    } else if (isUnDef(this.__bjnet)) {
        bjOptions = merge({
            // Defaults values --> expected validation
            iterations: 1, // the maximum times to iterate the training data --> number greater than 0
            errorThresh: 0.005, // the acceptable error percentage from training data --> number between 0 and 1
            logPeriod: 10, // iterations between logging out --> number greater than 0
            learningRate: 0.3, // scales with delta to effect training rate --> number between 0 and 1
            momentum: 0.1, // scales with next layer's change value --> number between 0 and 1
            //timeout: number, // the max number of milliseconds to train for --> number greater than 0. Default --> Infinity
          }, bjOptions)
          this.__bjnet.train([{ input: inputData, output: outputData }], bjOptions)
    }
}

/**
 * <odoc>
 * <key>ow.ai.network.toJson() : Map</key>
 * Returns a map representation of the current network to be later rebuilt with the fromJson function.
 * </odoc>
 */
OpenWrap.ai.prototype.network.prototype.toJson = function() {
    if (isUnDef(this.__net) && isUnDef(this.__bjnet)) throw "Network not initialized."

    if (isDef(this.__net)) return this.__net.toJSON()
    if (isDef(this.__bjnet)) return this.__bjnet.toJSON()
}

/**
 * <odoc>
 * <key>ow.ai.network.fromJson(aMap)</key>
 * Tries to rebuild the network from aMap returned previously by a toJson function.
 * </odoc>
 */
OpenWrap.ai.prototype.network.prototype.fromJson = function(aJSON) {
    if (isDef(aJSON) && isDef(aJSON.type) && 
        aJSON.type != "perceptron" && aJSON.type != "lstm" && aJSON.type != "liquid" && aJSON.type != "hopfield") {
        if (isUnDef(this.__bjnet)) throw "BrainJS network not initialized."
        this.__bjnet = this.__bjnet.fromJSON(aJSON)
    } else {
        this.__net = ow.ai.synaptic.Network.fromJSON(aJSON)
    }
}

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
     * <key>ow.ai.normalize.softMax(anArray, aTemperature) : Array</key>
     * Given anArray of numbers tries to apply a Softmax function returning an array of values between 0 and 1. If
     * aTemperature is provided it will be used to control the smoothness of the output.
     * </odoc>
     */
    softMax: function(anArray, aTemperature) {
        _$(anArray, "anArray").isArray().$_()
        aTemperature = _$(aTemperature, "aTemperature").isNumber().default(1)

        // Ensure all values are numbers
        anArray = anArray.map(v => Number(v) )

        // Compute exponentials
        var exps = anArray.map((v) => Math.exp(v / aTemperature) )
        var sumExps = exps.reduce((a, b) => a + b )
        return exps.map((v) => { return v / sumExps })
    },

    /**
     * <odoc>
     * <key>ow.ai.normalize.quantitize(anArray, aLevels) : Array</key>
     * Given anArray of numbers tries to quantitize returning an array of values between 0 and aLevels. If
     * aLevels is not provided it will default to 10.
     * </odoc>
     */
    quantitize: function(anArray, aLevels) {
        _$(anArray, "anArray").isArray().$_()
        aLevels = _$(aLevels, "aLevels").isNumber().default(10)

        // Ensure all values are numbers
        anArray = anArray.map(v => Number(v) )

        // Compute max and min
        var max = anArray.reduce((a,b) => Math.max(a,b) )
        var min = anArray.reduce((a,b) => Math.min(a,b) )

        // Compute step
        var step = (max - min) / aLevels

        // Quantitize
        return anArray.map(v => Math.floor((v - min) / step) )
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
     * <key>ow.ai.normalize.denormalizeWithSchema(aMapOfNormalizedData, aMapSchema, convertBools) : Map</key>
     * Tries to denormalize aMapOfNormalizedData (result from ow.ai.normalize.withSchema) according with aMapSchema provided.
     * </odoc>
     */
    denormalizeWithSchema: function(aMapOfNormalizedData, aMapSchema, convertBools) {
        _$(aMapSchema, "aMapSchema").isMap().$_()
        convertBools = _$(convertBools, "convertBools").isBoolean().default(false)
    
        var res = {}, icol = 0
        var schema = $m4a(aMapSchema, "key")
        schema.sort((a, b) => a.col - b.col).forEach(schema => {
            var key = schema.key
            var col = schema.col
            var max = schema.max
            var min = schema.min ? schema.min : 0
            var oneOf = schema.oneOf
            var anyOf = schema.anyOf
            var scaleOf = schema.scaleOf
    
            if (isDef(max)) {
                res[key] = aMapOfNormalizedData[isDef(col) ? icol : key] * (max - min) + min
                icol++
                return
            }
            if (isDef(oneOf)) {
                var _vs
                if (isDef(col)) 
                    _vs = aMapOfNormalizedData.slice(icol, icol + oneOf.length)
                else
                    _vs = aMapOfNormalizedData[key]
    
                res[key] = oneOf[_vs.indexOf(1)]
                icol += oneOf.length
                return
            }
            if (isDef(anyOf)) {
                var _vs
                if (isDef(col)) 
                    _vs = aMapOfNormalizedData.slice(icol, icol + anyOf.length)
                else
                    _vs = aMapOfNormalizedData[key]
    
                res[key] = _vs.reduce((p, c, i) => { if (c == 1) p.push(anyOf[i]); return p }, [])
                icol += anyOf.length
                return
            }
            if (isDef(scaleOf)) {
                var v = aMapOfNormalizedData[isDef(col) ? icol : key]
                if (isArray(v)) {
                    res[key] = v.map(vv => {
                        var diff = 2, rv
                        scaleOf.forEach(s => {
                            if (Math.abs(s.weight - vv) < diff) {
                                diff = Math.abs(s.weight - vv)
                                rv = s.val
                            }
                        })
                        return rv
                    })
                } else {
                    var diff = 2, rv
                    scaleOf.forEach(s => {
                        if (Math.abs(s.weight - v) < diff) {
                            diff = Math.abs(s.weight - v)
                            rv = s.val
                        }
                    })
                    res[key] = rv
                }
                icol++
                return
            }
            res[key] = aMapOfNormalizedData[isDef(col) ? icol : key] == 1 ? (convertBools ? true : 1) : (convertBools ? false : 0)
            icol++
        })
    
        return res
    },

    /**
     * <odoc>
     * <key>ow.ai.normalize.withSchema(aSimpleMapOfData, aMapSchema, convertBools) : Array</key>
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
    withSchema: function(aAR, sAR, convertBools) {
        _$(aAR, "aSimpleMapOfData").isMap().$_()
        _$(sAR, "aMapSchema").isMap().$_()
        convertBools = _$(convertBools, "convertBools").isBoolean().default(false)
    
        const _scaleArray = (anArray, aMax, aMin) => {
            var max = isDef(aMax) ? aMax : anArray.reduce((a,b) => Math.max(a,b) )
            var min = isDef(aMin) ? aMin : anArray.reduce((a,b) => Math.min(a,b) )
    
            return anArray.map(v => { if (v > aMax) v = aMax; if (v < aMin) v = aMin; return (v - min)/(max - min) })
        }
        var res = {}
    
        for(var s in sAR) {
            var schema = sAR[s]
            var col = schema.col
            var max = schema.max
            var min = schema.min ? schema.min : 0
            var oneOf = schema.oneOf
            var anyOf = schema.anyOf
            var scaleOf = schema.scaleOf
    
            // Ensure it has a col
            if (isDef(col) && !isArray(res)) res = []
            // If it has a max
            if (isDef(max)) {
                res[isDef(col) ? col : s] = _scaleArray([aAR[s]], max, min)[0]
                continue
            }
            if (isDef(oneOf) && !isArray(aAR[s])) {
                var subres = []
                for(var ss = 0; ss < oneOf.length; ss++) {
                    subres[ss] = 0
                }
                subres[oneOf.indexOf(aAR[s])] = 1
                res[isDef(col) ? col : s] = subres
                continue
            }
            if (isDef(anyOf) && isArray(aAR[s])) {
                var subres = [];
                for(var ss = 0; ss < anyOf.length; ss++) {
                    subres[ss] = 0
                }        
                for(var ss in aAR[s]) {
                    subres[anyOf.indexOf(aAR[s][ss])] = 1
                }
                res[isDef(col) ? col : s] = subres
                continue
            }
            if (isDef(scaleOf)) {
                if (isArray(aAR[s])) {
                    var subres = []
                    for(var ss in aAR[s]) {
                        subres[ss] = scaleOf.reduce((p, c) => (c.val === aAR[s] ? c.weight : (isNumber(p) ? p : p.weight)))
                    }
                    res[isDef(col) ? col : s] = subres
                } else {
                    res[isDef(col) ? col : s] = scaleOf.reduce((p, c) => (c.val === aAR[s] ? c.weight : (isNumber(p) ? p : p.weight)) )
                }
                continue
            }
            // Else assume it's boolean
            res[isDef(col) ? col : s] =  (aAR[s]) ? (convertBools ? 1 : true) : (convertBools ? 0 : false)
            //}
        }
    
        if (isArray(res)) {
            var _res = []
            res.forEach(r => {
                if (isArray(r)) {
                    _res = _res.concat(r)
                } else {
                    _res.push(r)
                }
            })
            return _res
        } else {
            return res
        }
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
 *   type              'id3'\
 *   trainingSet       (array of maps)   The training data\
 *   categoryAttr      (key name)        The map key to build the decision tree on\
 *   ignoredAttributes (array of keys)   The list of keys to be ignored in each map\
 * \
 * RandomForest:\
 *   type              'randomforest'\
 *   trainingSet       (array of maps)   The training data\
 *   categoryAttr      (key name)        The map key to build the decision tree on\
 *   ignoredAttributes (array of keys)   The list of keys to be ignored in each map\
 *   treesNumber       (number)          The number of decision trees to use\
 * \
 * C45:\
 *   type              'c45'\
 *   data              (array of arrays) The training data\
 *   features          (arrays of keys)  The keys name by order of each array data value\
 *   featureTypes      (arrays of types) Categorization of each attribute between 'category' and 'number'\
 *   target            (key)             The target key name (the last of each array data value)
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
    this.data = __;
    this.target = __;
    this.features = __;
    this.featureTypes = __;
    this.targets = __;
    this.model = __;
    this.error = __;
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
