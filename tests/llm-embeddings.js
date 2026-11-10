// Run from the repository root: java -jar _oaf/openaf.jar -f tests/llm-embeddings.js
ow.loadAI()
load("js/owrap.ai.js")
var original = ow.ai.gpt, originalEnv = getEnv, created = []
try {
  global.getEnv = name => name == "OAF_EMBED_MODEL" ? '(type: ollama, model: env-embed)' : __
  ow.ai.gpt = function(type, cfg) {
    created.push(cfg.model)
    this.getEmbeddings = (input, dimensions, model) => ({ model: model, input: input })
    this.getLastStats = () => ({ model: cfg.model })
    this.prompt = () => "chat"
  }
  var check = (value, message) => { if (!value) throw message }
  var c = $gpt({ type: "ollama", model: "chat" }, { type: "ollama", model: "env-embed" })
  check(created.length == 0, "Clients must initialize lazily")
  check(c.getEmbeddings("hello").model == "env-embed", "Environment model")
  check(c.getLastStats().model == "env-embed", "Embedding statistics")
  check(c.getEmbeddings("hello", __, "override").model == "override", "Per-call override")
  c.prompt("hello")
  check(c.lastStats().model == "chat", "Chat statistics")
  var e = $gpt(__, { type: "ollama", model: "explicit" })
  check(e.getEmbeddingsWithStats("hello").response.model == "explicit", "Explicit precedence")
  check(created.length == 3, "Separate cached clients")
  print("Embeddings configuration checks passed")
} finally {
  ow.ai.gpt = original
  global.getEnv = originalEnv
}
