"""
Score an AccessGuru ACT run on both paper denominators (FULL 581, REACHES-LLM 458),
decomposing the hybrid detector into its components:

  axe-only        the syntax/layout detector alone (axe-core 4.4.1)
  LLM-semantic    the semantic LLM detector alone
  AccessGuru      axe ∪ LLM-semantic (the full system's verdict)

AccessGuru runs page-level on the WHOLE corpus, so no covered-slice/abstain accounting
is needed — every case gets a verdict (SCs neither detector maps to are Negative).

Usage: python analyze.py [<run-name> ...]
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def score(rows):
    tp = fp = tn = fn = 0
    for expected, flagged in rows:
        if expected == 'failed':
            tp += 1 if flagged else 0
            fn += 1 if not flagged else 0
        else:
            fp += 1 if flagged else 0
            tn += 1 if not flagged else 0
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
    print(f'    {tag:<14} n={s["n"]:<4}(f {s["gtFail"]}/pNA {s["gtPassNA"]})  '
          f'R={pct(s["recall"]):>5}  FP%={pct(s["fpRate"]):>5}  P={pct(s["precision"]):>5}  '
          f'F1={f1}  [TP{s["tp"]} FP{s["fp"]} TN{s["tn"]} FN{s["fn"]}]')


def main():
    runs = sys.argv[1:] or ['accessguru-act-gemini', 'accessguru-act-gpt5mini']
    for run in runs:
        rp = ROOT / 'results' / run / 'results.json'
        if not rp.exists():
            print(f'[{run}] no results.json — skipping')
            continue
        results = json.loads(rp.read_text())
        try:
            summ = json.loads((ROOT / 'results' / run / 'summary.json').read_text())
        except Exception:
            summ = {}
        llm = summ.get('llm', {})
        errs = sum(1 for r in results if r['outcome'] == 'error')

        print(f'\n===== {run}  (model={summ.get("model","?")}) =====')
        print(f'  tokens in={llm.get("inputTokens",0)} out={llm.get("outputTokens",0)} '
              f'~${llm.get("costUsd",0):.2f}   n={len(results)} cases, errors={errs}')

        ok = [r for r in results if r['outcome'] != 'error']
        for denom, subset in [('FULL 581 (→ Table 1a)', ok),
                              ('REACHES-LLM 458 (→ Table 1b/1e)', [r for r in ok if r.get('reaches')])]:
            print(f'  {denom}:')

            def flagged_of(r, which):
                d = r.get('detection') or {}
                if which == 'axe':
                    return bool(d.get('axe_flag'))
                if which == 'sem':
                    return bool(d.get('sem_flag'))
                return bool(d.get('flagged'))

            line('axe-only', score([(r['expected'], flagged_of(r, 'axe')) for r in subset]))
            line('LLM-semantic', score([(r['expected'], flagged_of(r, 'sem')) for r in subset]))
            line('AccessGuru', score([(r['expected'], flagged_of(r, 'all')) for r in subset]))


if __name__ == '__main__':
    main()
