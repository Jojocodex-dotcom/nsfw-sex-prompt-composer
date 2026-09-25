#!/usr/bin/env python3
"""Sync ../data.js → prompt_data.json (and parent ../prompt_data.json). Requires Node.js."""
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, ".."))
DATA_JS = os.path.join(ROOT, "data.js")


def main() -> int:
    if not os.path.isfile(DATA_JS):
        print("Missing", DATA_JS, file=sys.stderr)
        return 1
    script = r"""
const fs=require('fs'); const vm=require('vm');
const code=fs.readFileSync(process.argv[1],'utf8');
const ctx={window:{}}; vm.createContext(ctx); vm.runInContext(code,ctx);
process.stdout.write(JSON.stringify(ctx.window.PROMPT_DATA,null,2));
"""
    out = subprocess.check_output(["node", "-e", script, DATA_JS], cwd=ROOT)
    data = json.loads(out.decode("utf-8"))
    for dest in (os.path.join(HERE, "prompt_data.json"), os.path.join(ROOT, "prompt_data.json")):
        with open(dest, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            f.write("\n")
        print("wrote", dest)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
