#!/usr/bin/env python3
"""Decide, from a run's own artifacts, exactly which cases must be re-run after a
mid-run quota death — and refuse to guess when it cannot tell.

Why this exists: recovering supplementary585-sonnet46 c01 by hand took log parsing,
retry attribution, an SC cross-check and a control study over reference runs, and the
first read of the data was WRONG (7 rows looked silently corrupted; they were normal).
That is not a procedure anyone should repeat under time pressure. This encodes it.

Two classes of damage, and they need different treatment:

  CERTAIN   outcome == 'noVerdict' with in-scope obligations and no verdicts. The case
            never reached a judge. Re-run it. Unambiguous from results.json alone.

  RESIDUAL  a row that DID emit an outcome while some obligation went unjudged. This is
            the dangerous class: it looks normal and scores as real. It cannot be
            settled from results.json alone, because short rows are NORMAL — reference
            runs sit at 12-22% (obligations resolved without a rubric call). So we use
            the run log to attribute dead calls to targets, and report a row as at-risk
            only when a dead target plausibly belongs to it.

Attribution is (sc, xpath) based: dead-call log lines carry sc/xpath/skill but no case
key, so a dead target is matched against the xpaths that DID produce verdicts. A target
that never produced a verdict anywhere is unrecovered; rows are then screened by SC.
When a row's SC overlaps the unrecovered set AND that row is short, it is AT-RISK and
this tool says so rather than clearing it.

Exit status: 0 clean, 2 damage found (redo list written), 3 cannot determine.
"""
import json, os, re, sys, collections, argparse

FAMILY_SHORT_MAX = 0.25   # observed 12-22% across clean reference runs
QUOTA_HINTS = ('session limit', 'usage limit', 'quota', 'rate limit', 'resets')


def rows_of(d):
    p = os.path.join('results', d, 'results.json')
    if not os.path.exists(p):
        return None
    r = json.load(open(p))
    return r if isinstance(r, list) else (r.get('results') or r.get('rows'))


def dead_targets(run):
    """(sc, xpath) pairs whose call returned a non-verdict, + whether it looked quota-shaped."""
    log = os.path.join('results', f'{run}-run.log')
    out, quota = set(), 0
    if not os.path.exists(log):
        return None, 0
    for ln in open(log, errors='replace'):
        if '[v3:noVerdict]' not in ln:
            continue
        if any(h in ln.lower() for h in QUOTA_HINTS):
            quota += 1
        m = re.search(r'\[v3:noVerdict\] (\{.*?\})\s*$', ln.strip()) or re.search(r'\[v3:noVerdict\] (\{.*\})', ln)
        if not m:
            continue
        try:
            d = json.loads(m.group(1))
        except Exception:
            continue
        out.add((d.get('sc'), d.get('xpath')))
    return out, quota


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('run')
    ap.add_argument('--case-list', help='master corpus json, to emit a redo case-list')
    ap.add_argument('--out', help='write the redo case-list here')
    a = ap.parse_args()

    # An ASSEMBLED run has no run log of its own — the logs live with the chunks it was
    # concatenated from — so judging it directly always yields CANNOT DETERMINE. Delegate to
    # the chunks, which is the level at which the evidence exists. Aggregate is the worst
    # chunk verdict: an assembled artifact is only as clean as its dirtiest part.
    smp = os.path.join('results', a.run, 'summary.json')
    if os.path.exists(smp):
        try:
            sm = json.load(open(smp))
        except Exception:
            sm = {}
        if sm.get('assembled') and sm.get('chunks'):
            print(f'{a.run}: assembled from {len(sm["chunks"])} chunks — triaging each '
                  f'(the assembled dir has no run log of its own).')
            worst, argv0 = 0, sys.argv[0]
            for ch in sm['chunks']:
                sys.argv = [argv0, ch]
                rc = main()
                worst = max(worst, rc)
            sys.argv = [argv0, a.run]
            print(f'{a.run}: AGGREGATE = worst chunk verdict, rc={worst} '
                  f'({"CLEAN" if worst == 0 else "damage or undetermined — see chunks above"})')
            return worst

    rows = rows_of(a.run)
    if not rows:
        print(f'{a.run}: no results.json'); return 3

    certain = [r for r in rows
               if r.get('outcome') == 'noVerdict'
               and (r.get('inScopeObligations') or 0) > 0
               and not (r.get('rubricVerdicts') or []) and not (r.get('agentVerdicts') or [])]

    def short(r):
        obl = r.get('inScopeObligations') or 0
        got = len(r.get('rubricVerdicts') or []) + len(r.get('agentVerdicts') or [])
        return obl and got < obl

    others = [r for r in rows if r not in certain]
    shorts = [r for r in others if short(r)]
    short_rate = len(shorts) / len(others) if others else 0

    targets, quota_lines = dead_targets(a.run)
    at_risk, undetermined = [], False
    if targets is None:
        # No log ⇒ the residual class cannot be ruled out either way. Say so.
        undetermined = bool(shorts)
    else:
        ok = {(v.get('sc'), v.get('xpath'))
              for r in rows for v in (r.get('rubricVerdicts') or []) + (r.get('agentVerdicts') or [])}
        unrec = targets - ok
        dead_scs = {sc for sc, _ in unrec}
        at_risk = [r for r in shorts if set(r.get('sc') or []) & dead_scs]

    print(f'{a.run}: {len(rows)} rows')
    print(f'  CERTAIN damage (noVerdict, obligations unjudged) : {len(certain)}')
    print(f'  short rows among the rest                        : {len(shorts)} '
          f'({short_rate * 100:.1f}%; family background 12-22%)')
    if targets is not None:
        print(f'  quota-shaped log lines                           : {quota_lines}')
        print(f'  unrecovered dead targets                         : {len(targets - ok)} '
              f'covering SCs {sorted({sc for sc, _ in (targets - ok)})}')
    print(f'  AT-RISK (short AND shares an SC with a dead target): {len(at_risk)}')

    # A noVerdict row is quota damage only if a quota event actually happened. Every run
    # carries a small residue of ordinary no-verdicts (reference runs sit at 0.2-1.0%) and
    # re-running those just reproduces them. Without this gate the tool cries wolf on every
    # clean run, which is how a real warning gets ignored.
    if targets is not None and quota_lines == 0:
        print(f'  NO quota-shaped log lines: the {len(certain)} noVerdict row(s) are this '
              "run's ordinary judge residue, not quota damage.")
        print('  VERDICT: CLEAN — no quota event in this run; nothing to re-run.')
        return 0

    if undetermined:
        print('  VERDICT: CANNOT DETERMINE — no run log, and short rows exist that the '
              'log would have been needed to clear. Re-run the WHOLE unit.')
        return 3
    if short_rate > FAMILY_SHORT_MAX and not at_risk:
        print(f'  NOTE: short rate {short_rate*100:.1f}% exceeds family max — elevated but '
              'no dead target shares an SC with any short row.')

    redo = certain + at_risk
    if not redo:
        print('  VERDICT: CLEAN — nothing to re-run.')
        return 0
    print(f'  VERDICT: re-run {len(redo)} cases '
          f'({len(certain)} certain + {len(at_risk)} at-risk).')
    if a.case_list and a.out:
        master = {c['key']: c for c in json.load(open(a.case_list))}
        keys = [r['key'] for r in redo if r.get('key')]
        miss = [k for k in keys if k not in master]
        if miss:
            print(f'  FATAL: {len(miss)} keys not in the master case list'); return 3
        json.dump([master[k] for k in keys], open(a.out, 'w'), indent=1)
        print(f'  wrote redo case-list -> {a.out}')
    return 2


sys.exit(main())
