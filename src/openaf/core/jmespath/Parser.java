/*
 * Copyright 2014 James Saryerwinnie
 * SPDX-License-Identifier: Apache-2.0
 * Modified for OpenAF: Java port of the bundled jmespath.js engine, with
 * direct Rhino integration and bounded syntax caching. See LICENSES.txt.
 */
package openaf.core.jmespath;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/** Java port of the bundled jmespath.js Pratt parser. See LICENSES.txt. */
final class Parser {
    private record Token(String type, Object value, int start) {}
    private final Values values;
    private final List<Token> tokens = new ArrayList<>();
    private int index;
    private static final Map<String, Integer> POWER = Map.ofEntries(
        Map.entry("Pipe", 1), Map.entry("Or", 2), Map.entry("And", 3),
        Map.entry("EQ", 5), Map.entry("GT", 5), Map.entry("LT", 5),
        Map.entry("GTE", 5), Map.entry("LTE", 5), Map.entry("NE", 5),
        Map.entry("Flatten", 9), Map.entry("Star", 20), Map.entry("Filter", 21),
        Map.entry("Dot", 40), Map.entry("Not", 45), Map.entry("Lbrace", 50),
        Map.entry("Lbracket", 55), Map.entry("Lparen", 60));
    Parser(Values values) { this.values = values; }
    Query parse(String expression) {
        tokenize(expression);
        Query result = expression(0);
        if (!peek().equals("EOF")) {
            Token t = token();
            throw values.error("ParserError", "Unexpected token type: " + t.type + ", value: " + Values.str(t.value));
        }
        return result;
    }
    private static boolean alpha(char c) {
        return c >= 'a' && c <= 'z' || c >= 'A' && c <= 'Z' || c == '_';
    }
    private static boolean num(char c) { return c >= '0' && c <= '9' || c == '-'; }
    private static char at(String s, int p) { return p < s.length() ? s.charAt(p) : '\0'; }
    private void tokenize(String s) {
        int p = 0;
        while (p < s.length()) {
            int start = p;
            char c = s.charAt(p++);
            if (alpha(c)) {
                while (p < s.length() && (alpha(s.charAt(p)) || s.charAt(p) >= '0' && s.charAt(p) <= '9')) p++;
                tokens.add(new Token("UnquotedIdentifier", s.substring(start, p), start));
            } else if (num(c)) {
                while (p < s.length() && num(s.charAt(p))) p++;
                String number = s.substring(start, p);
                int end = number.startsWith("-") ? 1 : 0;
                while (end < number.length() && Character.isDigit(number.charAt(end))) end++;
                double n;
                try { n = Double.parseDouble(number.substring(0, end)); } catch (NumberFormatException e) { n = Double.NaN; }
                tokens.add(new Token("Number", n, start));
            } else if (c == '"' || c == '\'' || c == '`') {
                int content = p;
                while (p < s.length() && s.charAt(p) != c) {
                    if (s.charAt(p) == '\\' && (at(s, p + 1) == '\\' || at(s, p + 1) == c)) p += 2;
                    else p++;
                }
                Object literal;
                String text = s.substring(content, Math.min(p, s.length()));
                p++;
                if (c == '"') {
                    literal = values.parseJSON(s.substring(start, Math.min(p, s.length())));
                    tokens.add(new Token("QuotedIdentifier", literal, start));
                } else {
                    if (c == '\'') {
                        // JS slice excludes the final character only when there is a closing quote.
                        literal = replaceFirst(text, "\\'", "'");
                    } else {
                        text = Values.str(values.call(text, "trimLeft"));
                        text = replaceFirst(text, "\\`", "`");
                        boolean json = !text.isEmpty() && "[{\"".indexOf(text.charAt(0)) >= 0
                            || text.equals("true") || text.equals("false") || text.equals("null");
                        if (!json && !text.isEmpty() && "-0123456789".indexOf(text.charAt(0)) >= 0) {
                            try { values.parseJSON(text); json = true; } catch (org.mozilla.javascript.RhinoException ignored) { /* raw literal */ }
                        }
                        literal = values.parseJSON(json ? text : "\"" + text + "\"");
                    }
                    // Freeze JSON literals to plain immutable Java syntax data.
                    tokens.add(new Token("Literal", values.freeze(literal), start));
                }
            } else if (c == ' ' || c == '\t' || c == '\n') {
                continue;
            } else {
                String type = switch (c) {
                    case '.' -> "Dot"; case '*' -> "Star"; case ',' -> "Comma"; case ':' -> "Colon";
                    case '{' -> "Lbrace"; case '}' -> "Rbrace"; case ']' -> "Rbracket";
                    case '(' -> "Lparen"; case ')' -> "Rparen"; case '@' -> "Current";
                    case '[' -> at(s, p) == '?' ? "Filter" : at(s, p) == ']' ? "Flatten" : "Lbracket";
                    case '&' -> at(s, p) == '&' ? "And" : "Expref";
                    case '|' -> at(s, p) == '|' ? "Or" : "Pipe";
                    case '!' -> at(s, p) == '=' ? "NE" : "Not";
                    case '<' -> at(s, p) == '=' ? "LTE" : "LT";
                    case '>' -> at(s, p) == '=' ? "GTE" : "GT";
                    case '=' -> at(s, p) == '=' ? "EQ" : null;
                    default -> throw values.error("LexerError", "Unknown character:" + c);
                };
                if (type == null) {
                    // The old lexer emits undefined for a lone '='.
                    throw values.error("TypeError", "Cannot read property \"type\" from undefined");
                }
                if (List.of("Filter", "Flatten", "And", "Or", "NE", "LTE", "GTE", "EQ").contains(type)) p++;
                tokens.add(new Token(type, s.substring(start, p), start));
            }
        }
        tokens.add(new Token("EOF", "", s.length()));
    }
    private static String replaceFirst(String s, String from, String to) {
        int i = s.indexOf(from);
        return i < 0 ? s : s.substring(0, i) + to + s.substring(i + from.length());
    }
    private Token token() {
        if (index >= tokens.size()) throw values.error("TypeError", "Cannot read property \"type\" from undefined");
        return tokens.get(index);
    }
    private String peek() { return token().type; }
    private String nextType() { return index + 1 < tokens.size() ? tokens.get(index + 1).type : "EOF"; }
    private int power(String type) { return POWER.getOrDefault(type, 0); }
    private void match(String type) {
        if (!peek().equals(type)) throw values.error("ParserError", "Expected " + type + ", got: " + peek());
        index++;
    }
    private Query expression(int rbp) {
        Token t = token(); index++;
        Query left = nud(t);
        while (rbp < power(peek())) {
            String type = peek(); index++;
            left = led(type, left);
        }
        return left;
    }
    private Query nud(Token t) {
        switch (t.type) {
            case "Literal": return Query.value("Literal", t.value);
            case "UnquotedIdentifier": return Query.named("Field", Values.str(t.value), List.of());
            case "QuotedIdentifier":
                if (peek().equals("Lparen")) throw values.error("Error", "Quoted identifier not allowed for function names.");
                return Query.named("Field", Values.str(t.value), List.of());
            case "Not": return Query.node("NotExpression", expression(power("Not")));
            case "Star": return Query.node("ValueProjection", Query.node("Identity"),
                peek().equals("Rbracket") ? Query.node("Identity") : projection(power("Star")));
            case "Filter": return led(t.type, Query.node("Identity"));
            case "Lbrace": return hash();
            case "Flatten": return Query.node("Projection", Query.node("Flatten", Query.node("Identity")), projection(power("Flatten")));
            case "Lbracket":
                if (peek().equals("Number") || peek().equals("Colon")) return projectSlice(Query.node("Identity"), indexExpression());
                if (peek().equals("Star") && nextType().equals("Rbracket")) {
                    index += 2;
                    return Query.node("Projection", Query.node("Identity"), projection(power("Star")));
                }
                return list();
            case "Current": return Query.node("Current");
            case "Expref": return Query.node("ExpressionReference", expression(0));
            case "Lparen":
                List<Query> args = arguments(false);
                return args.isEmpty() ? null : args.get(0);
            default: throw invalid(t);
        }
    }
    private Query led(String type, Query left) {
        switch (type) {
            case "Dot":
                if (!peek().equals("Star")) return Query.node("Subexpression", left, dot(power("Dot")));
                index++;
                return Query.node("ValueProjection", left, projection(power("Dot")));
            case "Pipe": return Query.node("Pipe", left, expression(power(type)));
            case "Or": return Query.node("OrExpression", left, expression(power(type)));
            case "And": return Query.node("AndExpression", left, expression(power(type)));
            case "Lparen":
                if (left == null) throw values.error("TypeError", "Cannot read property \"name\" from undefined");
                return Query.named("Function", left.name, arguments(true));
            case "Filter":
                Query condition = expression(0); match("Rbracket");
                return Query.node("FilterProjection", left,
                    peek().equals("Flatten") ? Query.node("Identity") : projection(power("Filter")), condition);
            case "Flatten": return Query.node("Projection", Query.node("Flatten", left), projection(power("Flatten")));
            case "EQ": case "NE": case "GT": case "GTE": case "LT": case "LTE":
                return Query.named("Comparator", type, java.util.Arrays.asList(left, expression(power(type))));
            case "Lbracket":
                if (peek().equals("Number") || peek().equals("Colon")) return projectSlice(left, indexExpression());
                match("Star"); match("Rbracket");
                return Query.node("Projection", left, projection(power("Star")));
            default: throw invalid(token());
        }
    }
    private List<Query> arguments(boolean commas) {
        List<Query> args = new ArrayList<>();
        while (!peek().equals("Rparen")) {
            Query arg;
            if (peek().equals("Current")) { arg = Query.node("Current"); index++; }
            else arg = expression(0);
            if (commas && peek().equals("Comma")) match("Comma");
            args.add(arg);
        }
        match("Rparen"); return args;
    }
    private Query indexExpression() {
        if (peek().equals("Colon") || nextType().equals("Colon")) {
            List<Query> parts = new ArrayList<>(java.util.Arrays.asList(null, null, null));
            int part = 0;
            while (!peek().equals("Rbracket") && part < 3) {
                if (peek().equals("Colon")) { part++; index++; }
                else if (peek().equals("Number")) { parts.set(part, Query.value("Number", token().value)); index++; }
                else throw values.error("Parsererror", "Syntax error, unexpected token: undefined(undefined)");
            }
            match("Rbracket"); return new Query("Slice", null, null, parts);
        }
        Query result = Query.value("Index", token().value); index++; match("Rbracket"); return result;
    }
    private Query projectSlice(Query left, Query right) {
        Query result = Query.node("IndexExpression", left, right);
        return right.type.equals("Slice") ? Query.node("Projection", result, projection(power("Star"))) : result;
    }
    private Query dot(int rbp) {
        if (List.of("UnquotedIdentifier", "QuotedIdentifier", "Star").contains(peek())) return expression(rbp);
        if (peek().equals("Lbracket")) { index++; return list(); }
        if (peek().equals("Lbrace")) { index++; return hash(); }
        return null;
    }
    private Query projection(int rbp) {
        if (power(peek()) < 10) return Query.node("Identity");
        if (peek().equals("Lbracket") || peek().equals("Filter")) return expression(rbp);
        if (peek().equals("Dot")) { index++; return dot(rbp); }
        Token t = token();
        throw values.error("ParserError", "Sytanx error, unexpected token: " + Values.str(t.value) + "(" + t.type + ")");
    }
    private Query list() {
        List<Query> children = new ArrayList<>();
        while (!peek().equals("Rbracket")) {
            children.add(expression(0));
            if (peek().equals("Comma")) {
                index++;
                if (peek().equals("Rbracket")) throw values.error("Error", "Unexpected token Rbracket");
            }
        }
        match("Rbracket"); return new Query("MultiSelectList", null, null, children);
    }
    private Query hash() {
        List<Query> pairs = new ArrayList<>();
        for (;;) {
            Token key = token();
            if (!key.type.equals("UnquotedIdentifier") && !key.type.equals("QuotedIdentifier"))
                throw values.error("Error", "Expecting an identifier token, got: " + key.type);
            index++; match("Colon");
            pairs.add(Query.named("KeyValuePair", Values.str(key.value), java.util.Arrays.asList(expression(0))));
            if (peek().equals("Comma")) index++;
            else if (peek().equals("Rbrace")) { index++; break; }
            else {
                // The JS loop diagnoses the next token as an invalid key.
            }
        }
        return new Query("MultiSelectHash", null, null, pairs);
    }
    private RuntimeException invalid(Token t) {
        return values.error("ParserError", "Invalid token (" + t.type + "): \"" + Values.str(t.value) + "\"");
    }
}
