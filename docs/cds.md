# Shared archive coverage

The generated OpenAF launchers already use `.shared.oaf` through
`-XX:SharedArchiveFile`. Run `./oaf --repack` after updating the JAR or JDK to
regenerate it with the launcher's JVM settings, including compact object headers
and module options. Archive generation does not change the JAR's class path.

Repacking now executes a local OpenAF/oJob warmup with
`-XX:DumpLoadedClassList`, then creates and validates an archive. It selects the
first usable coverage level:

1. **Application**: classes recorded by the warmup, including OpenAF classes.
2. **Platform**: recorded JDK-module classes plus the JDK's standard class list.
3. **Default**: ordinary JVM archive generation if training or expanded coverage
   is unavailable.

The current repacked JAR has `Class-Path: .`. HotSpot rejects application archives
when that entry points to a nonempty directory. The platform fallback improves
coverage while preserving installation-directory Java classes and resources.
Removing the manifest entry merely to enable application sharing would change
existing behavior and is not part of this change.

The warmup loads libraries and runs a small in-memory job. Training subprocesses
set `openaf.cds.training=true` to skip both user and embedded startup profiles,
and use default OpenAF flags. Ordinary executions continue loading profiles.
The helper obtains effective VM options from the generated launcher; when no
launcher exists yet, it uses the current JVM's settings. Repack again after
generating launchers if those settings differ.

Archive creation alone does not establish that it can be used. Each candidate is
checked with `-Xshare:on -XX:+PrintSharedArchiveAndExit` against the actual JAR and
VM settings. Only a validated candidate replaces `.shared.oaf`, by an atomic
move. If every candidate fails, the previous archive is preserved and repacking
reports the failure. Under the generated launcher's ordinary default sharing
mode, a missing or incompatible archive permits normal JVM startup; explicitly
requesting `-Xshare:on` instead makes an unusable archive fatal.

To inspect the archive through a generated Unix launcher:

```sh
OAF_JARGS='-XX:+PrintSharedArchiveAndExit' ./oaf -c '1'
```

To inspect actual sharing during an oJob execution:

```sh
OAF_JARGS='-Xlog:class+load=info:file=cds-classes.log' ./ojob job.yaml
```

On macOS/JDK 26.0.2.1, the initial generated-launcher comparison increased the
archive from 1,543 to 2,003 classes. Six retained samples per variant measured
median first-instruction times of 458.5 → 446.5 ms for OpenAF and 951 → 942 ms for
a minimal oJob. These are small local gains, not the roughly 35% application-CDS
result obtained with an experimental manifest modification. Other JDK/OS
combinations need separate measurement.
