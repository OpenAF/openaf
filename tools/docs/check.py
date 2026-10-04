#!/usr/bin/env python3
"""Check local documentation links/copies and report source-backed coverage."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[2]


def source_inventory():
    files = subprocess.check_output(["git", "ls-files", "js", "src/openaf", "ojob.yaml"], cwd=ROOT, text=True).splitlines()
    inventory = {}

    def record(name, path, text, offset, kind):
        entry = inventory.setdefault(name, {"symbol": name, "sources": [], "odoc": False, "candidate": False})
        location = {"path": path, "line": text.count("\n", 0, offset) + 1, "kind": kind}
        if location not in entry["sources"]:
            entry["sources"].append(location)
        entry["odoc" if kind == "odoc" else "candidate"] = True

    for filename in files:
        if not filename.endswith((".js", ".java", ".yaml")):
            continue
        text = (ROOT / filename).read_text(errors="replace")
        for match in re.finditer(r"<key>([^<]+)</key>", text):
            name = re.split(r"[({\[:\s]", match[1].strip())[0]
            if name:
                record(name, filename, text, match.start(), "odoc")
        if filename.endswith(".js"):
            for match in re.finditer(r"^(?:const|var|let)\s+([\w$]+)\s*=\s*function\b", text, re.M):
                if not match[1].startswith("_"):
                    record(match[1], filename, text, match.start(), "global-candidate")
            for match in re.finditer(r"^OpenWrap\.(\w+)\.prototype\.([\w.$]+)\s*=\s*function\b", text, re.M):
                if not match[2].startswith("_"):
                    record("ow." + match[1] + "." + match[2], filename, text, match.start(), "wrapper-candidate")
        if filename == "ojob.yaml":
            for match in re.finditer(r"^- name\s*:\s*(.+)$", text, re.M):
                record(match[1].strip(), filename, text, match.start(), "builtin-job")
    return inventory


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--report", type=Path)
    parser.add_argument("--execution-report", type=Path)
    args = parser.parse_args()
    manifest = json.loads((ROOT / "tools/docs/coverage.json").read_text())
    documents = [ROOT / "README.md"] + sorted((ROOT / "docs").rglob("*.md")) + sorted((ROOT / "skills").rglob("*.md"))
    errors = []
    for path in documents:
        text = re.sub(r"<!--.*?-->", "", path.read_text(), flags=re.S)
        text = re.sub(r"```.*?```", "", text, flags=re.S)
        for match in re.finditer(r"!?\[[^\]\n]*\]\(([^)\n]+)\)", text):
            target = match[1].strip().split(' "', 1)[0].strip("<>")
            parsed = urlsplit(target)
            if parsed.scheme or parsed.netloc or not parsed.path:
                continue
            dest = path.parent / unquote(parsed.path)
            if not dest.exists():
                errors.append("%s: missing link %s" % (path.relative_to(ROOT), target))
    for copy in manifest["copies"]:
        blocks = re.findall(r"```" + re.escape(copy["language"]) + r"\n(.*?)```", (ROOT / copy["document"]).read_text(), re.S)
        asset = (ROOT / copy["asset"]).read_text().strip()
        if asset not in [block.strip() for block in blocks]:
            errors.append("Embedded example drift: " + copy["document"] + " -> " + copy["asset"])

    inventory = source_inventory()
    runner = (ROOT / "tools/docs/test_examples.py").read_text()
    execution = json.loads(args.execution_report.read_text()) if args.execution_report else {}
    if execution:
        if execution.get("runner_sha256") != hashlib.sha256((ROOT / "tools/docs/test_examples.py").read_bytes()).hexdigest():
            errors.append("Execution report is stale: example runner changed")
        for path, digest in execution.get("example_sha256", {}).items():
            file = ROOT / path
            if not file.is_file() or hashlib.sha256(file.read_bytes()).hexdigest() != digest:
                errors.append("Execution report is stale: " + path)
    curated = manifest["contracts"] + manifest["features"]
    for item in curated:
        if item in manifest["contracts"] and item["symbol"] not in inventory:
            errors.append("Contract not found in source inventory: " + item["symbol"])
        if "source" in item:
            if item["source_token"] not in (ROOT / item["source"]).read_text():
                errors.append("Source token missing: " + item["symbol"])
        for path in [item["reference"]] + item["examples"]:
            if not (ROOT / path).is_file():
                errors.append("Missing coverage reference: " + path)
        if "def " + item["test"] + "(" not in runner:
            errors.append("Missing example test: " + item["test"])
        item["executed"] = bool(not errors and execution.get("successful") and item["test"] in execution.get("passed_tests", [])
                                and all(path in execution.get("examples", []) for path in item["examples"]))

    prose = {str(path.relative_to(ROOT)): path.read_text() for path in documents}
    for entry in inventory.values():
        # A literal mention is a discovery hint, never a claim of contract coverage.
        entry["mentioned_in"] = [name for name, text in prose.items() if entry["symbol"] in text]
        entry["contract_reviewed"] = any(item["symbol"] == entry["symbol"] for item in manifest["contracts"])
    report = {
        "scope": "Source ODoc keys, column-zero JS function/wrapper candidates, and top-level built-in jobs; not an exhaustive public API parser",
        "summary": {"symbols": len(inventory), "with_odoc": sum(e["odoc"] for e in inventory.values()),
                    "candidates_without_odoc": sum(e["candidate"] and not e["odoc"] for e in inventory.values()),
                    "curated_contracts": len(manifest["contracts"]), "curated_features": len(manifest["features"]),
                    "executed_curated_entries": sum(item["executed"] for item in curated)},
        "execution": execution, "curated": curated, "symbols": sorted(inventory.values(), key=lambda e: e["symbol"]),
        "errors": errors,
    }
    if args.report:
        args.report.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report["summary"], indent=2))
    for error in errors:
        print(error)
    raise SystemExit(1 if errors else 0)


if __name__ == "__main__":
    main()
