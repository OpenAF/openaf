io.writeFileString(".classpath", templify(io.readFileString(".classpath_template"), { lib: io.listFilenames("lib", true) }));
