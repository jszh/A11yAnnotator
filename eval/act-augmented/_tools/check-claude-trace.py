#!/usr/bin/env python3
"""Validity check for a Claude-lane baseline/harness run: count LLM calls that
returned no text.

An exhausted OAuth budget makes the Agent SDK return `error result: success` with
no text; every runner records that as a per-case no-verdict and still exits 0 with
a well-formed summary.json reporting recall 0.0. So the trace, not the summary, is
the only place the failure is visible.

Three shapes:
  * gena11y   — llm-trace.jsonl, dead call ⇒ verdict.summary says "transport returned no text"
  * accessguru— llm-trace.jsonl, dead call ⇒ usage.error set
  * harness   — llm-trace.json, an ARRAY of {testcaseId, traces:[{trace:[events], verdict}]};
                each inner trace is one call, live iff some assistant event carries
                non-empty text. (run-fn-llm.js / run-annotated-suite.js)
"""
import json, sys, collections, os


def _has_assistant_text(events):
    """True iff the SDK returned actual assistant text for this call."""
    if not isinstance(events, list):
        return False
    for ev in events:
        if not isinstance(ev, dict) or ev.get('type') != 'assistant':
            continue
        for b in ev.get('blocks') or []:
            if isinstance(b, dict) and b.get('kind') == 'text' and (b.get('text') or '').strip():
                return True
    return False


def check(name):
    base = f'results/{name}'
    jsonl, arr = f'{base}/llm-trace.jsonl', f'{base}/llm-trace.json'
    c = collections.Counter()
    first_err = None
    n = 0

    if os.path.exists(jsonl):                      # baseline shapes
        with open(jsonl) as fh:
            for line in fh:
                if not line.strip():
                    continue
                n += 1
                d = json.loads(line)
                u = d.get('usage') or {}
                s = ((d.get('verdict') or {}) or {}).get('summary') or ''
                bad = bool(u.get('error')) or 'transport returned no text' in s
                c['ERR' if bad else 'OK'] += 1
                if bad and first_err is None:
                    first_err = n
    elif os.path.exists(arr):                      # harness shape
        with open(arr) as fh:
            entries = json.load(fh)
        for e in entries if isinstance(entries, list) else []:
            for tr in (e.get('traces') or []):
                n += 1
                bad = not _has_assistant_text(tr.get('trace'))
                c['ERR' if bad else 'OK'] += 1
                if bad and first_err is None:
                    first_err = n
    else:
        return None
    return dict(traces=n, ok=c['OK'], err=c['ERR'], first_err_at=first_err)


if __name__ == '__main__':
    for name in sys.argv[1:]:
        r = check(name)
        if r is None:
            print(f'{name:44s} (no trace)')
            continue
        if r['traces'] == 0:
            # No calls at all is NOT proof of health — an assembled/aborted run can look
            # empty. Never report VALID here; the caller must treat it as unusable.
            print(f'{name:44s} EMPTY    traces=   0 ok=   0 err=   0 firstErrAt=None')
            continue
        verdict = 'VALID' if r['err'] == 0 else ('INVALID' if r['ok'] == 0 else 'PARTIAL')
        print(f"{name:44s} {verdict:8s} traces={r['traces']:4d} ok={r['ok']:4d} "
              f"err={r['err']:4d} firstErrAt={r['first_err_at']}")
