# Updating Libs

Steps to update libs:

1. Update the corresponding library in `lib/`, deleting the previous version
2. Update `versionsAndDeps.json`
3. Update `pom.xml`
4. Run `buildLicenses.js`
5. Commit

## Bundled Ajv

Ajv is a self-contained JavaScript bundle rather than a Java dependency. Follow [the pinned bundle regeneration workflow](../../tools/ajv/README.md), update version/license metadata, rebuild OpenAF, and run the schema regression suite against the new JAR. See [JSON Schema validation](../json-schema.md) for the public compatibility contract.
