"""
Score a GenA11y ACT run for paper-table comparability, on two denominators
(FULL 581, REACHES-LLM 458) and two accounting modes each:

  covered-only        score ONLY the cases whose SC GenA11y covers (its native slice).
  uncovered=Negative  score over the WHOLE denominator; cases GenA11y cannot cover are
                      counted as Negatives (it abstains → flags nothing): an uncovered
                      GT-fail is an FN, an uncovered GT-pass/NA is a TN. This makes the
                      denominator IDENTICAL to the harness (Table 1a full-581 / Table 1e
                      reaches-458), holding GenA11y accountable for its coverage gap.

Usage: python analyze.py [<run-name> ...]
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from consts import COVERED_SCS

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / 'eval/checker-comparison/upstream-evidence/v3-act-subset-proposed/raw.json'
SUB = ROOT / 'eval/checker-comparison/act-subset'


def _primary_covered_sc(sc_field):
    scs = sc_field if isinstance(sc_field, list) else [sc_field]
    return next((s for s in scs if s in COVERED_SCS), None)


def load_corpus():
    """All fixture-present, non-error ACT cases → matches the paper's 581 / 458.
    Keyed by (ruleId, testcaseId): a testcaseId can recur under multiple rules."""
    cases = []
    for r in json.loads(RAW.read_text()):
        if r.get('error'):
            continue
        if not (SUB / 'pages' / r['ruleId'] / f"{r['testcaseId']}.html").exists():
            continue
        cases.append({
            'key': (r['ruleId'], r['testcaseId']),
            'expected': r['expected'],
            'reaches': not (r.get('axeFlag') or r.get('v3Flag')),
            'sc': _primary_covered_sc(r.get('sc')),          # None ⇒ uncovered
        })
    return cases


def score(rows):
    """rows: list of (expected, flagged: bool|None). None flagged ⇒ noVerdict (negative)."""
    tp = fp = tn = fn = 0
    for expected, flagged in rows:
        f = bool(flagged)
        if expected == 'failed':
            tp += 1 if f else 0
            fn += 1 if not f else 0
        else:
            fp += 1 if f else 0
            tn += 1 if not f else 0
    rec = tp / (tp + fn) if (tp + fn) else None
    fpr = fp / (fp + tn) if (fp + tn) else None
    prec = tp / (tp + fp) if (tp + fp) else None
    f1 = (2 * prec * rec / (prec + rec)) if (prec and rec) else None
    return {'n': tp + fp + tn + fn, 'tp': tp, 'fp': fp, 'tn': tn, 'fn': fn,
            'recall': rec, 'fpRate': fpr, 'precision': prec, 'f1': f1,
            'gtFail': tp + fn, 'gtPassNA': fp + tn}


def pct(x):
    return f'{100*x:.1f}' if x is not None else '—'


def line(tag, s):
    f1 = f'{s["f1"]:.3f}' if s['f1'] is not None else '—'
    print(f'    {tag:<22} n={s["n"]:<4}(f {s["gtFail"]}/pNA {s["gtPassNA"]})  '
          f'R={pct(s["recall"]):>5}  FP%={pct(s["fpRate"]):>5}  '
          f'P={pct(s["precision"]):>5}  F1={f1}  '
          f'[TP{s["tp"]} FP{s["fp"]} TN{s["tn"]} FN{s["fn"]}]')


def main():
    runs = sys.argv[1:] or ['gena11y-act-gemini', 'gena11y-act-gpt5mini']
    corpus = load_corpus()

    for run in runs:
        rp = ROOT / 'results' / run / 'results.json'
        if not rp.exists():
            print(f'[{run}] no results.json — skipping')
            continue
        results = json.loads(rp.read_text())
        # map (ruleId, testcaseId) → flagged (True if caught; False if cleared/error/noVerdict)
        out_map = {}
        for r in results:
            k = (r.get('ruleId'), r.get('testcaseId'))
            out_map[k] = (r['outcome'] == 'caught')  # error/noVerdict → False (negative)
        errs = sum(1 for r in results if r['outcome'] == 'error')
        try:
            summ = json.loads((ROOT / 'results' / run / 'summary.json').read_text())
        except Exception:
            summ = {}
        llm = summ.get('llm', {})

        print(f'\n===== {run}  (model={summ.get("model","?")}) =====')
        print(f'  tokens in={llm.get("inputTokens",0)} out={llm.get("outputTokens",0)} '
              f'~${llm.get("costUsd",0):.2f}   ran={len(results)} cases, errors={errs}')

        for denom_name, subset in [('FULL 581 (→ Table 1a)', corpus),
                                   ('REACHES-LLM 458 (→ Table 1b/1e)',
                                    [c for c in corpus if c['reaches']])]:
            covered = [c for c in subset if c['sc']]
            print(f'  {denom_name}:')
            # covered-only: only cases GenA11y ran
            line('covered-only',
                 score([(c['expected'], out_map.get(c['key'], False)) for c in covered]))
            # uncovered=Negative: whole denominator, uncovered abstain → negative
            line('uncovered=Negative',
                 score([(c['expected'], out_map.get(c['key'], False)) for c in subset]))


if __name__ == '__main__':
    main()
