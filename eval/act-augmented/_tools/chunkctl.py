#!/usr/bin/env python3
"""Chunked execution support for long Claude runs (quota-resilient).

Why this exists: none of the runners can resume. If the OAuth quota dies mid-run
the whole job is lost, and — worse — if a job needs more calls than one quota
window allows, a discard-and-retry driver never finishes it at all. Chunking makes
progress monotone: each chunk is an independent run, chunks that completed are
never redone, and the final artifact is assembled by concatenating per-case rows.

This leans on the same premise as the ACT 581 gate policy: cases are independent
and deterministic, so a corpus may be assembled from partial runs on an IDENTICAL
tree. Metrics are NOT recomputed here — the scorers derive them from rows.

  plan     --kind=act458|supp585 --size=N --dir=<chunkdir>
  assemble --kind=... --dir=<chunkdir> --prefix=<runname> --out=<runname>
"""
import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))            # eval/act-augmented/_tools
REPO = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
SUPP_CASES = os.path.join(HERE, 'full-supplementary-585-cases.json')
# The reaches-LLM 458 id set. Verified identical across skip-sonnet-46 (Claude) and
# fn-llm-gemini-v2 (Gemini, months earlier), so it is a stable source for chunking.
ACT_REF_RUNS = ['results/skip-sonnet-46', 'results/fn-llm-gemini-v2']

KINDS = {
    'act458': {'n': 458, 'key': lambda r: (r['ruleId'], r['testcaseId'])},
    'supp585': {'n': 585, 'key': lambda r: (r['key'],)},
}


def load_json(p):
    with open(p) as f:
        return json.load(f)


def rows_of(run_dir):
    r = load_json(os.path.join(run_dir, 'results.json'))
    return r if isinstance(r, list) else (r.get('results') or r.get('rows'))


def act_ids():
    sets = []
    for rel in ACT_REF_RUNS:
        p = os.path.join(REPO, rel)
        if os.path.isdir(p):
            sets.append({r['testcaseId'] for r in rows_of(p)})
    if not sets:
        sys.exit('FATAL: no reaches-LLM reference run found to derive the 458 id set')
    if len(sets) > 1 and sets[0] != sets[1]:
        sys.exit('FATAL: reaches-LLM reference runs disagree on the id set — refusing to chunk')
    return sorted(sets[0])


def cmd_plan(a):
    os.makedirs(a.dir, exist_ok=True)
    if a.kind == 'act458':
        ids = act_ids()
        chunks = [ids[i:i + a.size] for i in range(0, len(ids), a.size)]
        for i, c in enumerate(chunks, 1):
            # run-fn-llm.js --cases=<file> wants whitespace-separated testcaseIds
            with open(os.path.join(a.dir, f'c{i:02d}.txt'), 'w') as f:
                f.write('\n'.join(c) + '\n')
    else:
        cases = load_json(SUPP_CASES)
        if len(cases) != 585:
            sys.exit(f'FATAL: supplementary corpus is {len(cases)} cases, expected 585')
        chunks = [cases[i:i + a.size] for i in range(0, len(cases), a.size)]
        for i, c in enumerate(chunks, 1):
            with open(os.path.join(a.dir, f'c{i:02d}.json'), 'w') as f:
                json.dump(c, f, indent=1)
    man = {'kind': a.kind, 'size': a.size, 'chunks': len(chunks),
           'units': sum(len(c) for c in chunks)}
    with open(os.path.join(a.dir, 'manifest.json'), 'w') as f:
        json.dump(man, f, indent=1)
    print(f"planned {man['chunks']} chunks / {man['units']} units for {a.kind} in {a.dir}")


def cmd_assemble(a):
    man = load_json(os.path.join(a.dir, 'manifest.json'))
    spec = KINDS[a.kind]
    keyfn = spec['key']
    all_rows, traces_arr, traces_lines, chunk_names, cost = [], [], [], [], 0.0
    seen = set()
    # Aggregate the chunks' LLM failure telemetry onto the assembled run. Without this a
    # supp585 assembly is the one artifact in the campaign that our own validator cannot
    # judge (run-annotated-suite.js writes no trace file, so there is nothing to
    # concatenate) — and it is the artifact that gets scored and archived.
    llm_calls, llm_fails, llm_modes, llm_known = 0, 0, {}, True
    for i in range(1, man['chunks'] + 1):
        rd = os.path.join(REPO, 'results', f'{a.prefix}__c{i:02d}')
        if not os.path.isdir(rd):
            sys.exit(f'FATAL: chunk run missing: {rd}')
        rws = rows_of(rd)
        for r in rws:
            k = keyfn(r)
            if k in seen:
                sys.exit(f'FATAL: duplicate row {k} — chunks overlap, refusing to assemble')
            seen.add(k)
        all_rows += rws
        chunk_names.append(os.path.basename(rd))
        tj, tl = os.path.join(rd, 'llm-trace.json'), os.path.join(rd, 'llm-trace.jsonl')
        if os.path.exists(tj):
            traces_arr += load_json(tj)
        elif os.path.exists(tl):
            with open(tl) as f:
                traces_lines += [ln for ln in f if ln.strip()]
        try:
            sm = load_json(os.path.join(rd, 'summary.json'))
            cost += float((sm.get('tokens') or {}).get('costUsd') or 0)
            llm = sm.get('llm') or {}
            if llm:
                llm_calls += int(llm.get('calls') or 0)
                if 'transportFailures' in llm:
                    llm_fails += int(llm['transportFailures'] or 0)
                    for k, v in (llm.get('failuresByMode') or {}).items():
                        llm_modes[k] = llm_modes.get(k, 0) + int(v or 0)
                else:
                    # One chunk without telemetry makes the whole assembly unverifiable;
                    # summing the rest would manufacture a clean bill it hasn't earned.
                    llm_known = False
        except Exception:
            llm_known = False

    if len(all_rows) != spec['n']:
        sys.exit(f"FATAL: assembled {len(all_rows)} rows, expected {spec['n']} — "
                 'incomplete or overlapping chunks, refusing to write')

    out = os.path.join(REPO, 'results', a.out)
    os.makedirs(out, exist_ok=True)
    with open(os.path.join(out, 'results.json'), 'w') as f:
        json.dump(all_rows, f)
    if traces_arr:
        with open(os.path.join(out, 'llm-trace.json'), 'w') as f:
            json.dump(traces_arr, f)
    if traces_lines:
        with open(os.path.join(out, 'llm-trace.jsonl'), 'w') as f:
            f.writelines(traces_lines)
    agg_llm = None
    if llm_calls > 0:
        agg_llm = {'calls': llm_calls, 'failuresByMode': llm_modes, 'aggregatedFromChunks': True}
        # Omitted, not zeroed, when any chunk lacked telemetry ⇒ the validator reports
        # UNKNOWN rather than VALID.
        if llm_known:
            agg_llm['transportFailures'] = llm_fails
    with open(os.path.join(out, 'summary.json'), 'w') as f:
        json.dump({
            'assembled': True, 'kind': a.kind, 'n': len(all_rows),
            'chunks': chunk_names, 'tokens': {'costUsd': round(cost, 4)},
            **({'llm': agg_llm} if agg_llm else {}),
            'note': ('Assembled from independent per-case chunk runs on one tree because the '
                     'runners cannot resume across an OAuth quota reset. Rows are verbatim from '
                     'the chunk runs; metrics are NOT in this file — derive them with '
                     'score-supplementary-585.js / the ACT scorers, which read results.json.'),
        }, f, indent=1)
    print(f'assembled {len(all_rows)} rows from {len(chunk_names)} chunks → results/{a.out} '
          f'(traces: {len(traces_arr) or len(traces_lines)}, chunk cost ${cost:.2f})')


ap = argparse.ArgumentParser()
sub = ap.add_subparsers(dest='cmd', required=True)
p1 = sub.add_parser('plan')
p1.add_argument('--kind', required=True, choices=list(KINDS))
p1.add_argument('--size', type=int, required=True)
p1.add_argument('--dir', required=True)
p1.set_defaults(fn=cmd_plan)
p2 = sub.add_parser('assemble')
p2.add_argument('--kind', required=True, choices=list(KINDS))
p2.add_argument('--dir', required=True)
p2.add_argument('--prefix', required=True)
p2.add_argument('--out', required=True)
p2.set_defaults(fn=cmd_assemble)
a = ap.parse_args()
a.fn(a)
