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
                non-empty text. (run-fn-llm.js)
  * annotated — run-annotated-suite.js persists NO trace file, so fall back to the
                telemetry it does persist: summary.json llm.transportFailures /
                failuresByMode. A dead call degrades the Claude transport to null via
                failTrace('empty') (llm-agent-adapter.js:761), which the suite's trace
                sink counts. That is a per-call count, so PARTIAL death is detected —
                not merely total death.

Do NOT infer liveness from results.json: a deterministic catch, a noObligation case and
a genuine live no-verdict all present as rows with empty verdicts, so a dead call is
indistinguishable from a real one at row level.

THIRD quota signature (2026-09-06, supplementary585-sonnet46 c01). The SDK can return the
quota message AS TEXT ("You've hit your session limit · resets 5:40am", textLen 67). Text
arrived, so failTrace('empty') never fires, transportFailures is legitimately 0, and the
trace check above reports VALID. The adjudicator logs it as
`[v3:noVerdict] {"reason":"unparseable-envelope"}` and the case becomes a fabricated
negative. Neither the trace nor the telemetry can see this, so we cross-check the ROW
distribution: an in-family noVerdict rate is 0.0-2.0% (measured over 15 reference
585-family runs + 10 ACT chunks); the contaminated chunk was 27.5%. A rate over
NOVERDICT_SUSPECT_RATE reports SUSPECT, never VALID.

Deliberately provider-agnostic: matching Anthropic's wording would miss the Gemini and
OpenAI equivalents, whereas a dead tail inflates the no-verdict rate whoever produced it.
"""
import json, sys, collections, os

# Above this share of rows returning noVerdict, a run is contaminated rather than merely
# unlucky. Family range is 0.0-2.0%; the one known bad run was 27.5%. MIN_N keeps a small
# chunk from tripping on one or two legitimate no-verdicts.
NOVERDICT_SUSPECT_RATE = 0.05
NOVERDICT_SUSPECT_MIN_N = 5
# The rate gate catches MAGNITUDE, but quota death is a SHAPE: the budget dies once and
# every case after it fabricates a negative, so the damage is a block running to the final
# row. If the budget dies with only a few cases left the rate stays under the gate (5/120 =
# 4.2%) and the chunk reads VALID with fabricated negatives in it. So gate the trailing run
# of consecutive noVerdicts as well. Measured on the three 120-case sonnet46 chunks:
#   c01 (quota death) 27.5%, trailing run 29   <- block running to the last row
#   c02 (clean)        0.0%, trailing run  0
#   c03 (clean)        2.5%, trailing run  0   <- scattered (positions 12, 44, 49)
# Ordinary no-verdicts scatter; only a quota death piles them at the tail.
#
# Threshold 3 over 5 because the cost is asymmetric: a false alarm costs one triage run and
# is non-destructive, while a miss corrupts a scored number. CAVEAT: rows are SC-ordered, so
# adjacent rows are correlated and a genuinely hard trailing SC could in principle produce a
# short run — treat SUSPECT as "investigate", not "proven contaminated".
NOVERDICT_TRAILING_RUN_MAX = 3


def noverdict_shape(name):
    """(noVerdict, total, trailing_run) from results.json, or None when there are no rows."""
    p = f'results/{name}/results.json'
    if not os.path.exists(p):
        return None
    try:
        r = json.load(open(p))
    except Exception:
        return None
    rows = r if isinstance(r, list) else (r.get('results') or r.get('rows'))
    if not rows:
        return None
    isnv = [isinstance(x, dict) and x.get('outcome') == 'noVerdict' for x in rows]
    trail = 0
    for flag in reversed(isnv):
        if not flag:
            break
        trail += 1
    return sum(isnv), len(rows), trail


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
    elif os.path.exists(f'{base}/summary.json'):        # annotated-suite: no trace file
        with open(f'{base}/summary.json') as fh:
            llm = (json.load(fh).get('llm') or {})
        if not llm:
            return None
        n = int(llm.get('calls') or 0)
        # `or 0` on a MISSING key would report "no failures" for a run that never
        # recorded any — absence of evidence read as evidence of health, which is the
        # exact pattern behind the original recall-0.0 runs. Runs predating the
        # telemetry (or one that died before the sink finalised) are UNKNOWN, not clean.
        if n > 0 and 'transportFailures' not in llm:
            return dict(traces=n, ok=0, err=0, first_err_at=None, unknown=True,
                        modes=None, source='summary.llm')
        # Any transportFail means the call degraded to null; 'empty' is the quota
        # signature. Count them all — a degraded run must never be scored silently.
        err = int(llm.get('transportFailures') or 0)
        modes = llm.get('failuresByMode') or {}
        return dict(traces=n, ok=max(n - err, 0), err=err, first_err_at=None,
                    modes=modes, source='summary.llm')
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
        if r.get('unknown'):
            # Never VALID: the run made calls but recorded no failure telemetry, so its
            # health is unverifiable. Callers must refuse to score it, not pass it.
            print(f"{name:44s} UNKNOWN  traces={r['traces']:4d} ok=   ? err=   ? "
                  f"firstErrAt=None via=summary.llm (no transportFailures telemetry)")
            continue
        verdict = 'VALID' if r['err'] == 0 else ('INVALID' if r['ok'] == 0 else 'PARTIAL')
        # Row-distribution cross-check: catches the quota-message-as-text mode, which is
        # invisible to both the trace and the telemetry. Only ever downgrades.
        nvr = noverdict_shape(name)
        if nvr and verdict == 'VALID':
            nv, tot, trail = nvr
            why = None
            if nv >= NOVERDICT_SUSPECT_MIN_N and nv / tot > NOVERDICT_SUSPECT_RATE:
                why = (f'noVerdict={nv}/{tot}={nv / tot * 100:.1f}% over the '
                       f'{NOVERDICT_SUSPECT_RATE * 100:.0f}% rate gate')
            elif trail >= NOVERDICT_TRAILING_RUN_MAX:
                # Shape, not magnitude: a run of no-verdicts ending at the final row is what
                # a mid-chunk budget death looks like and case difficulty cannot produce.
                why = (f'{trail} consecutive noVerdict rows ending at the LAST row '
                       f'(rate {nv / tot * 100:.1f}% is under the gate — this is shape, '
                       f'not magnitude)')
            if why:
                print(f'{name:44s} SUSPECT  traces={r["traces"]:4d} ok={r["ok"]:4d} '
                      f'err={r["err"]:4d} — {why}; trace and telemetry are clean but the '
                      f'row distribution says a tail never reached a judge; do NOT score')
                continue
        extra = ''
        if r.get('source'):
            extra = f" via={r['source']}" + (f" modes={json.dumps(r['modes'])}" if r.get('modes') else '')
        print(f"{name:44s} {verdict:8s} traces={r['traces']:4d} ok={r['ok']:4d} "
              f"err={r['err']:4d} firstErrAt={r['first_err_at']}{extra}")
