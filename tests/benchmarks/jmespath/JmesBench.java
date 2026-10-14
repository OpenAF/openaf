package bench;
import com.fasterxml.jackson.databind.*;
import io.burt.jmespath.*;
import io.burt.jmespath.jackson.JacksonRuntime;
public class JmesBench {
  private final ObjectMapper mapper = new ObjectMapper();
  private final JacksonRuntime runtime = new JacksonRuntime();
  private final JsonNode input;
  private final Expression<JsonNode> expression;
  public static volatile Object sink;
  public JmesBench(String json, String query) throws Exception {
    input = mapper.readTree(json);
    expression = runtime.compile(query);
  }
  public static Object direct(Object input, String query) {
    return new io.burt.jmespath.jcf.JcfRuntime().compile(query).search(input);
  }
  public static String directJson(Object input, String query) throws Exception {
    return new ObjectMapper().writeValueAsString(direct(input, query));
  }
  public String result() { return expression.search(input).toString(); }
  public Object search() { return expression.search(input); }
  public String convert(String json) throws Exception {
    return expression.search(mapper.readTree(json)).toString();
  }
  public double run(int count, String query, boolean recompile) {
    long start = System.nanoTime();
    for (int i = 0; i < count; i++) sink = (recompile ? runtime.compile(query) : expression).search(input);
    return (System.nanoTime() - start) / 1e6 / count;
  }
}
