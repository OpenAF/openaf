#!/usr/bin/env python3
"""Fail-closed release staging; never uploads unless --upload is supplied."""
import argparse
import datetime
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import urllib.error
import urllib.request
import zipfile
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]


def run(*args, **kwargs):
    return subprocess.check_output(args, text=True, **kwargs).strip()


def identity(tag, group):
    if not re.fullmatch(r'io\.github\.[a-z0-9]+(?:-[a-z0-9]+)*', group) or 'replace' in group:
        raise ValueError('Set central group to the exact verified io.github account namespace')
    if not re.fullmatch(r'v\d{8}(?:-\d{8})?', tag):
        raise ValueError('Expected an exact release tag vYYYYMMDD[-YYYYMMDD]')
    for date in tag[1:].split('-'):
        datetime.datetime.strptime(date, '%Y%m%d')
    if '-' in tag and tag[1:9] > tag[10:]:
        raise ValueError('Release suffix predates base version')
    return tag[1:]


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def archive(path, files):
    with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED) as z:
        for name, content in sorted(files):
            entry = zipfile.ZipInfo(name, (1980, 1, 1, 0, 0, 0))
            entry.compress_type = zipfile.ZIP_DEFLATED
            entry.external_attr = 0o100644 << 16
            z.writestr(entry, content)


def absent(group, version):
    url = f'https://repo.maven.apache.org/maven2/{group.replace(".", "/")}/openaf/{version}/openaf-{version}.pom'
    try:
        with urllib.request.urlopen(url, timeout=30):
            raise ValueError('Coordinates already exist on Central; releases are immutable')
    except urllib.error.HTTPError as e:
        e.close()
        if e.code != 404:
            raise


def verify_bundle(path, group, version, jar):
    prefix = f'{group.replace(".", "/")}/openaf/{version}/openaf-{version}'
    with zipfile.ZipFile(path) as z, tempfile.TemporaryDirectory() as tmp:
        expected = {prefix + suffix for suffix in ('.jar', '.pom', '-sources.jar', '-javadoc.jar')}
        allowed = {n + ext for n in expected for ext in ('', '.asc', '.md5', '.sha1', '.sha256', '.sha512')}
        if len(z.namelist()) != len(set(z.namelist())) or set(z.namelist()) != allowed:
            raise ValueError('Unexpected or missing bundle files')
        assert hashlib.sha256(z.read(prefix + '.jar')).hexdigest() == digest(jar)
        for name in expected:
            data = z.read(name)
            for alg in ('md5', 'sha1', 'sha256', 'sha512'):
                assert z.read(name + '.' + alg).decode().strip() == hashlib.new(alg, data).hexdigest()
            f = Path(tmp) / Path(name).name
            f.write_bytes(data)
            sig = Path(str(f) + '.asc')
            sig.write_bytes(z.read(name + '.asc'))
            run('gpg', '--batch', '--verify', str(sig), str(f))
        pom = ET.fromstring(z.read(prefix + '.pom'))
        ns = {'m': 'http://maven.apache.org/POM/4.0.0'}
        for key, value in [('groupId', group), ('artifactId', 'openaf'), ('version', version), ('packaging', 'jar')]:
            assert pom.find('m:' + key, ns).text == value
        assert pom.find('m:dependencies', ns) is None
        for field in ('name', 'description', 'url', 'licenses/license/name', 'developers/developer/name', 'scm/connection'):
            assert pom.find('/'.join('m:' + part for part in field.split('/')), ns).text
        assert b'PRIVATE KEY' not in z.read(prefix + '.pom')
        for suffix, required in [('-sources.jar', 'openaf/Launcher.java'), ('-javadoc.jar', 'index.html')]:
            import io
            with zipfile.ZipFile(io.BytesIO(z.read(prefix + suffix))) as a:
                assert required in a.namelist()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--tag', required=True)
    parser.add_argument('--group', required=True)
    parser.add_argument('--upload', action='store_true')
    parser.add_argument('--auto-publish', action='store_true')
    parser.add_argument('--output', default='target/central-release')
    args = parser.parse_args()
    os.chdir(ROOT)
    version = identity(args.tag, args.group)
    if args.auto_publish and not args.upload:
        parser.error('--auto-publish requires --upload')
    assert run('git', 'rev-parse', 'HEAD') == run('git', 'rev-parse', 'refs/tags/' + args.tag + '^{commit}'), 'HEAD does not match release tag'
    # Only the official builder's exact source substitutions are allowed.
    for name in ('src/openaf/AFCmdBase.java', 'js/openaf.js'):
        expected = run('git', 'show', 'HEAD:' + name)
        if name.endswith('AFCmdBase.java'):
            expected = re.sub(r'public static String VERSION = "[0-9]+";', f'public static String VERSION = "{version}";', expected)
            expected = re.sub(r'public static String DISTRIBUTION = "[^"\n]+";', 'public static String DISTRIBUTION = "stable";', expected)
        else:
            expected = re.sub(r'var noHomeComms = [a-z]+;', 'var noHomeComms = false;', expected)
        assert Path(name).read_text().strip() == expected.strip(), 'Source differs from release: ' + name
    # Build-generated files outside Java sources may change.
    for line in run('git', 'diff', '--name-only', 'HEAD').splitlines():
        if line not in ('src/openaf/AFCmdBase.java', 'js/openaf.js', 'dependencies.json', 'ojob.saved.json') and not line.startswith('complete/'):
            raise ValueError('Unexpected tracked changes: ' + line)
    assert '25' == run('javac', '-version').split()[1].split('.')[0], 'Use JDK 25'
    assert re.search(r'Apache Maven 3\.(9|10)\.', run('mvn', '-version')), 'Use Maven 3.9/3.10'
    absent(args.group, version)
    jar = ROOT / 'openaf.jar'
    original = digest(jar)
    with zipfile.ZipFile(jar) as z:
        manifest = z.read('META-INF/MANIFEST.MF').decode().replace('\r\n', '\n').replace('\n ', '')
        headers = dict(line.split(': ', 1) for line in manifest.splitlines() if ': ' in line)
        assert headers.get('Main-Class') == 'openaf.Launcher', 'Expected official repacked executable'
        assert int.from_bytes(z.read('openaf/Launcher.class')[6:8], 'big') == 65, 'Expected Java 21 launcher bytecode'
        assert 'org/mozilla/javascript/Context.class' in z.namelist(), 'Missing embedded dependencies'
        assert len(z.namelist()) == len(set(z.namelist())), 'Duplicate ZIP entries'
    # Read compiled static fields, not mutable source or .package.json alone.
    with tempfile.TemporaryDirectory() as probe:
        source = Path(probe) / 'ReleaseIdentity.java'
        source.write_text('public class ReleaseIdentity { public static void main(String[] a) throws Exception { Class<?> c=Class.forName("openaf.AFCmdBase",false,ClassLoader.getSystemClassLoader()); System.out.println(c.getField("VERSION").get(null)+"|"+c.getField("DISTRIBUTION").get(null)); }}')
        result = run('java', '--class-path', str(jar), str(source))
        assert result == version + '|stable', 'Binary release identity mismatch: ' + result
    run('java', '-jar', str(jar), '--version')
    print(run('java', '-jar', str(jar), '-v'))
    print('Verified primary JAR SHA-256: ' + original)
    out = Path(args.output).resolve()
    if out.exists():
        raise ValueError('Output already exists; use a new empty staging directory')
    out.mkdir(parents=True)
    shutil.copyfile(jar, out / 'openaf.jar')
    sources = sorted((ROOT / 'src').rglob('*.java'))
    archive(out / 'sources.jar', [(str(p.relative_to(ROOT / 'src')), p.read_bytes()) for p in sources])
    docs = out / 'apidocs'
    # Bundled vendored Java sources are included in sources; document OpenAF's public API.
    run('javadoc', '-quiet', '-notimestamp', '-Xdoclint:none', '-encoding', 'UTF-8',
        '--release', '21', '-classpath', str(jar), '-sourcepath', str(ROOT / 'src'),
        '-d', str(docs), '-subpackages', 'openaf')
    assert (docs / 'index.html').is_file() and (docs / 'openaf/AFBase.html').is_file()
    archive(out / 'javadoc.jar', [(str(p.relative_to(docs)), p.read_bytes()) for p in docs.rglob('*') if p.is_file()])
    pom = (ROOT / 'pom-central.xml').read_text().replace('${central.groupId}', args.group).replace('${revision}', version).replace('${central.tag}', args.tag)
    (out / 'pom.xml').write_text(pom)
    repo = out / 'repository'
    command = ['mvn', '-B', '-ntp', '-f', str(out / 'pom.xml'), f'-Dmaven.repo.local={repo}', 'deploy', f'-Dcentral.skipUpload={str(not args.upload).lower()}', f'-Dcentral.autoPublish={str(args.auto_publish).lower()}']
    # First produce and verify the signed bundle locally. Never upload unverified artifacts.
    dry = command.copy()
    dry[-2] = '-Dcentral.skipUpload=true'
    subprocess.run(dry, check=True)
    bundle = out / 'target/central-publishing/central-bundle.zip'
    verify_bundle(bundle, args.group, version, jar)
    installed = repo / args.group.replace('.', '/') / 'openaf' / version / f'openaf-{version}.jar'
    assert digest(installed) == original
    consumer = out / 'consumer'
    consumer.mkdir()
    (consumer / 'pom.xml').write_text(f'<project xmlns="http://maven.apache.org/POM/4.0.0"><modelVersion>4.0.0</modelVersion><groupId>test</groupId><artifactId>consumer</artifactId><version>1</version><dependencies><dependency><groupId>{args.group}</groupId><artifactId>openaf</artifactId><version>{version}</version></dependency></dependencies></project>')
    subprocess.run(['mvn', '-B', '-ntp', '-f', str(consumer / 'pom.xml'), f'-Dmaven.repo.local={repo}', 'org.apache.maven.plugins:maven-dependency-plugin:3.8.1:copy-dependencies', '-DoutputDirectory=' + str(consumer / 'lib')], check=True)
    resolved = consumer / 'lib' / installed.name
    assert digest(resolved) == original
    probe = consumer / 'Consumer.java'
    probe.write_text('public class Consumer { public static void main(String[] args) { System.out.println(openaf.AFCmdBase.VERSION); } }')
    assert run('java', '--class-path', str(resolved), str(probe)) == version
    assert digest(jar) == original and digest(out / 'openaf.jar') == original
    if args.upload:
        absent(args.group, version)
        subprocess.run(command, check=True)
    (out / 'verification.json').write_text(json.dumps(dict(group=args.group, version=version, tag=args.tag, commit=run('git', 'rev-parse', 'HEAD'), sha256=original, uploaded=args.upload), indent=2))
    print(f'{args.group}:openaf:{version}: ' + ('upload completed; check Portal status' if args.upload else 'verified locally; no upload'))


if __name__ == '__main__':
    main()
