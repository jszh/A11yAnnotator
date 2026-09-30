"""Merge a --redo-failed-of run back into its run: each redone case (file, SC) replaces the prior row.

    python eval/gena11y/merge_redo.py <run> <redo run>

The prior results.json is kept as results.before-redo.json; status.json's tally is recomputed. The redo run's rows
carry "redoneIn": <redo run> so the provenance stays in the data."""
import json
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
run, redo = sys.argv[1], sys.argv[2]
d = ROOT / 'results' / run
rows = json.loads((d / 'results.json').read_text())
new = {(r['file'], r['sc']): {**r, 'redoneIn': redo} for r in json.loads((ROOT / 'results' / redo / 'results.json').read_text())}
if not (d / 'results.before-redo.json').exists():
    (d / 'results.before-redo.json').write_text(json.dumps(rows, indent=1))
merged = [new.get((r['file'], r['sc']), r) for r in rows]
(d / 'results.json').write_text(json.dumps(merged, indent=1))
st = json.loads((d / 'status.json').read_text()) if (d / 'status.json').exists() else {}
st['tally'] = dict(Counter(r['outcome'] for r in merged))
st['redoneIn'] = redo
(d / 'status.json').write_text(json.dumps(st, indent=1))
print(f'{run}: replaced {sum(1 for r in rows if (r["file"], r["sc"]) in new)} rows; outcomes now {dict(Counter(r["outcome"] for r in merged))}')
