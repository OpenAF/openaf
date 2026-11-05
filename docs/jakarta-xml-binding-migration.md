# Jakarta XML Binding migration

OpenAF now bundles Jakarta XML Binding API 4.0.5 instead of JAXB API 2.3.1. Scripts and oPacks that directly reference `javax.xml.bind` must migrate those references to `jakarta.xml.bind`. The `ow.format.string.toHex` interface remains unchanged.
