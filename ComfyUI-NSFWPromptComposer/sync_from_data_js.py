#!/usr/bin/env python3
"""Export web-app/data.js → prompt_data.json (plugin + shared/)."""
from __future__ import annotations
import json, re, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_JS = ROOT / "web-app" / "data.js"
OUT_PLUGIN = Path(__file__).resolve().parent / "prompt_data.json"
OUT_SHARED = ROOT / "shared" / "prompt_data.json"

def main() -> int:
    if not DATA_JS.exists():
        print(f"missing {DATA_JS}", file=sys.stderr)
        return 1
    text = DATA_JS.read_text(encoding="utf-8")
    # Evaluate PROMPT_DATA via node for fidelity
    script = r"""
const fs=require('fs');
const vm=require('vm');
const code=fs.readFileSync(process.argv[1],'utf8');
const ctx={window:{}};
vm.runInNewContext(code, ctx);
process.stdout.write(JSON.stringify(ctx.window.PROMPT_DATA, null, 2));
"""
    try:
        out = subprocess.check_output(["node", "-e", script, str(DATA_JS)], text=True)
        data = json.loads(out)
    except Exception as e:
        print("node export failed, trying regex fallback:", e, file=sys.stderr)
        # crude fallback: not used if node works
        return 1
    for dest in (OUT_PLUGIN, OUT_SHARED):
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print("wrote", dest)
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
