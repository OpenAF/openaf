/*
 * Copyright 2014 James Saryerwinnie
 * SPDX-License-Identifier: Apache-2.0
 * Modified for OpenAF: Java port of the bundled jmespath.js engine, with
 * direct Rhino integration and bounded syntax caching. See LICENSES.txt.
 */
package openaf.core.jmespath;

import java.util.List;

/** Immutable syntax only: never stores Rhino values, scopes, or callbacks. */
final class Query {
    final String type;
    final String name;
    final Object value;
    final List<Query> children;
    Query(String type, String name, Object value, List<Query> children) {
        this.type = type;
        this.name = name;
        this.value = value;
        this.children = java.util.Collections.unmodifiableList(new java.util.ArrayList<>(children));
    }
    static Query node(String type, Query... children) {
        return new Query(type, null, null, java.util.Arrays.asList(children));
    }
    static Query named(String type, String name, List<Query> children) {
        return new Query(type, name, null, children);
    }
    static Query value(String type, Object value) {
        return new Query(type, null, value, List.of());
    }
    int nodes() {
        int total = 1;
        for (Query child : children) if (child != null) total += child.nodes();
        return total;
    }
}
