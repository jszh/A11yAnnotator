"""
AccessGuru runner over the official W3C ACT corpus.

AccessGuru Detect = axe-core 4.4.1 (syntax/layout) ∪ LLM semantic detector.
Page-level: one axe run + one semantic LLM call per page; a case's target SC is
flagged if EITHER detector maps a violation to it. Runs on the FULL 581 corpus
(all SCs) — SCs neither detector maps to are structural abstains (Negative).

Usage:
    python runner.py --model gemini-3.5-flash --out accessguru-act-gemini \
        --pages 25 --tabs 25 --llm-conc 60
"""
import argparse
import json
import os
import sys
import threading
import time
import traceback
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

BASE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE)
sys.path.insert(0, os.path.join(os.path.dirname(BASE), 'gena11y'))

import a11y_detector                     # noqa: E402
import detector as AG                    # noqa: E402
from extract_elements import make_driver  # noqa: E402  (reuse tested headless-Chrome setup)

PROJECT_ROOT = Path(BASE).resolve().parents[1]
FIXED_STATUS_PATH = (os.environ.get('LLM_EVAL_STATUS_PATH')
                     or os.environ.get('FN_LLM_STATUS_PATH') or '/tmp/llm-eval-status.json')
ACT_SUBSET_DIR = PROJECT_ROOT / 'eval/checker-comparison/act-subset'
ACT_RAW = PROJECT_ROOT / 'eval/checker-comparison/upstream-evidence/v3-act-subset-proposed/raw.json'

_DRIVER_SEM = threading.Semaphore(25)


# ---------------------------------------------------------------------------
# Corpus (full 581 — all SCs; AccessGuru runs page-level)
# ---------------------------------------------------------------------------

def load_act_cases():
    raw = json.loads(ACT_RAW.read_text())
    out = []
    for r in raw:
        if r.get('error'):
            continue
        fixture = ACT_SUBSET_DIR / 'pages' / r['ruleId'] / f"{r['testcaseId']}.html"
        if not fixture.exists():
            continue
        scs = r['sc'] if isinstance(r.get('sc'), list) else [r.get('sc')]
        out.append({
            'file': str(fixture.relative_to(PROJECT_ROOT)),
            'abs_path': str(fixture.resolve()),
            'sc': scs[0],                       # primary target SC
            'all_scs': [s for s in scs if s],
            'expected': r.get('expected', 'unknown'),
            'reaches': not (r.get('axeFlag') or r.get('v3Flag')),
            'ruleId': r.get('ruleId'), 'testcaseId': r.get('testcaseId'),
        })
    return out


# ---------------------------------------------------------------------------
# Per-page detection
# ---------------------------------------------------------------------------

def _full_page_screenshot_b64(driver):
    try:
        w = driver.execute_script('return document.documentElement.scrollWidth') or 1280
        h = driver.execute_script('return document.documentElement.scrollHeight') or 1024
        driver.set_window_size(min(max(w, 1280), 2000), min(max(h, 1024), 6000))
        time.sleep(0.2)
    except Exception:
        pass
    try:
        return driver.get_screenshot_as_base64()
    except Exception:
        return None


def run_page(page):
    sc = page['sc']
    url = f"file://{page['abs_path']}"
    a11y_detector.set_context(sc, page['file'])
    driver = None
    try:
        with _DRIVER_SEM:
            driver = make_driver(url)
            # fail fast: bound any hung chromedriver command (seen on pathological pages)
            try:
                driver.command_executor.set_timeout(45)
            except Exception:
                pass
            try:
                driver.set_page_load_timeout(30)
                driver.set_script_timeout(30)
            except Exception:
                pass
            html = driver.page_source
            shot = _full_page_screenshot_b64(driver)
            axe_ids = AG.run_axe(driver)
            try:
                driver.quit()
            finally:
                driver = None
        axe_sc = AG.axe_scs(axe_ids)
        sem = AG.detect_semantic('accessibility test page', url, html, shot)
        sem_sc = set(sem['scs'])
        axe_flag = sc in axe_sc
        sem_flag = sc in sem_sc
        flagged = axe_flag or sem_flag
        return _result(page, {
            'axe_ids': axe_ids, 'axe_scs': sorted(axe_sc),
            'sem_names': sem['violation_names'], 'sem_scs': sorted(sem_sc),
            'axe_flag': axe_flag, 'sem_flag': sem_flag, 'flagged': flagged,
            'raw': sem['raw'], 'reasoning': sem['reasoning'],
            'usage': sem['usage'], 'provider': sem['provider'],
        })
    except Exception:
        return _result(page, None, traceback.format_exc())
    finally:
        if driver:
            try:
                driver.quit()
            except Exception:
                pass


def _result(page, det, error=None):
    if error or det is None:
        outcome = 'error'
        flagged = False
    else:
        flagged = det['flagged']
        outcome = 'caught' if flagged else 'missedAgree'
    correct = None
    if not error:
        correct = (flagged == (page['expected'] == 'failed'))
    return {
        'file': page['file'], 'sc': page['sc'], 'all_scs': page['all_scs'],
        'expected': page['expected'], 'reaches': page['reaches'],
        'ruleId': page['ruleId'], 'testcaseId': page['testcaseId'],
        'polarity': 'recall' if page['expected'] == 'failed' else 'specificity',
        'outcome': outcome, 'detection': det, 'correct': correct, 'error': error,
    }


# ---------------------------------------------------------------------------
# Telemetry (monitor-compatible status.json) — thread-safe
# ---------------------------------------------------------------------------

class Telemetry:
    def __init__(self, run_name, out_dir, total, model, cfg, log_fh):
        self.out_dir, self.log_fh = out_dir, log_fh
        self.lock = threading.Lock()
        self.started = int(time.time() * 1000)
        self.tel = {
            'startedAt': self.started, 'runName': run_name,
            'config': {'fnTotal': total, 'pageConc': cfg['pages'], 'globalLlm': cfg['llm_conc'],
                       'perPageLlm': 1, 'maxTabs': cfg['tabs'], 'vision': True, 'tools': False,
                       'evidence': 'accessguru-axe+semantic', 'noVisionRubric': False,
                       'baselineVision': False, 'model': model},
            'phase': 'init', 'done': 0, 'total': total, 'workers': {}, 'inflight': {},
            'tabs': {}, 'mem': {}, 'llm': dict(a11y_detector.LLM_STATS),
            'tally': {'caught': 0, 'missedAgree': 0, 'uncertain': 0, 'noVerdict': 0,
                      'noObligation': 0, 'error': 0},
            'recent': [], 'errors': [],
        }
        self.results = []

    def log(self, line):
        with self.lock:
            print(line, flush=True)
            if self.log_fh:
                self.log_fh.write(line + '\n'); self.log_fh.flush()

    def set_phase(self, ph):
        with self.lock:
            self.tel['phase'] = ph; self._write()

    def start_case(self, idx, page):
        with self.lock:
            self.tel['workers'][str(idx)] = {'idx': idx, 'ruleId': page['ruleId'], 'sc': page['sc'],
                                             'expected': page['expected'], 'phase': 'orchestrate',
                                             'startedAt': int(time.time() * 1000)}
            self._write()

    def finish_case(self, idx, result, ms):
        with self.lock:
            self.results.append(result)
            self.tel['done'] += 1
            self.tel['tally'][result['outcome']] = self.tel['tally'].get(result['outcome'], 0) + 1
            self.tel['recent'].insert(0, {'ruleId': result['ruleId'], 'sc': result['sc'],
                                         'outcome': result['outcome'], 'ms': ms})
            self.tel['recent'] = self.tel['recent'][:10]
            self.tel['workers'].pop(str(idx), None)
            self.tel['llm'] = dict(a11y_detector.LLM_STATS)
            self._write(); self._write_results()

    def _write(self):
        try:
            self.tel['elapsedMs'] = int(time.time() * 1000) - self.started
            self.tel['llm']['inFlightNow'] = len(self.tel['inflight'])
            payload = json.dumps(self.tel)
            (self.out_dir / 'status.json').write_text(payload)
            try:
                Path(FIXED_STATUS_PATH).write_text(payload)
            except Exception:
                pass
        except Exception:
            pass

    def _write_results(self):
        try:
            (self.out_dir / 'results.json').write_text(json.dumps(self.results, indent=2))
        except Exception:
            pass

    def finalize(self, model):
        with self.lock:
            self.tel['phase'] = 'done'; self._write(); self._write_results()
            s = self._summarize(model)
            (self.out_dir / 'summary.json').write_text(json.dumps(s, indent=2))
            return s

    def _summarize(self, model):
        tp = fp = tn = fn = err = 0
        for r in self.results:
            if r['outcome'] == 'error':
                err += 1; continue
            recall = r['expected'] == 'failed'
            flagged = r['outcome'] == 'caught'
            if recall:
                tp += 1 if flagged else 0; fn += 1 if not flagged else 0
            else:
                fp += 1 if flagged else 0; tn += 1 if not flagged else 0
        rec = tp / (tp + fn) if (tp + fn) else None
        fpr = fp / (fp + tn) if (fp + tn) else None
        prec = tp / (tp + fp) if (tp + fp) else None
        f1 = (2 * prec * rec / (prec + rec)) if (prec and rec) else None
        return {'runName': self.tel['runName'], 'model': model, 'n': len(self.results),
                'confusion': {'tp': tp, 'fp': fp, 'tn': tn, 'fn': fn, 'error': err},
                'recall': rec, 'fpRate': fpr, 'precision': prec, 'f1': f1,
                'llm': dict(a11y_detector.LLM_STATS)}


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    p = argparse.ArgumentParser(description='Run AccessGuru (axe + LLM semantic) over the ACT corpus.')
    p.add_argument('--model', default='gemini-3.5-flash')
    p.add_argument('--limit', type=int)
    p.add_argument('--pages', type=int, default=25)
    p.add_argument('--tabs', type=int, default=25)
    p.add_argument('--llm-conc', type=int, default=60)
    p.add_argument('--out', default='accessguru')
    p.add_argument('--dry-run', action='store_true')
    args = p.parse_args()

    global _DRIVER_SEM
    _DRIVER_SEM = threading.Semaphore(args.tabs)

    out_dir = PROJECT_ROOT / 'results' / args.out
    out_dir.mkdir(parents=True, exist_ok=True)

    pages = load_act_cases()
    if args.limit:
        pages = pages[:args.limit]

    if args.dry_run:
        from collections import Counter
        print(f'AccessGuru | model={args.model} | {len(pages)} cases (full ACT corpus)')
        print('expected:', dict(Counter(p['expected'] for p in pages)))
        return

    trace_fh = open(out_dir / 'llm-trace.jsonl', 'w')

    def trace_sink(rec):
        trace_fh.write(json.dumps(rec) + '\n'); trace_fh.flush()

    a11y_detector.configure(model=args.model, llm_concurrency=args.llm_conc, trace_sink=None)

    cfg = {'pages': args.pages, 'tabs': args.tabs, 'llm_conc': args.llm_conc}
    with open(out_dir / 'run.log', 'w') as log_fh:
        tel = Telemetry(args.out, out_dir, len(pages), args.model, cfg, log_fh)
        tel.log(f'AccessGuru run: {len(pages)} cases | model={args.model} | '
                f'pages={args.pages} tabs={args.tabs} llmConc={args.llm_conc}')
        tel.log(f'status → {out_dir/"status.json"}  (monitor: node eval/checker-comparison/fn-llm-monitor.js {args.out})')
        tel.log('')
        tel.set_phase('running')
        n = len(pages)

        def work(i, page):
            tel.start_case(i, page)
            t0 = time.time()
            res = run_page(page)
            # write the semantic trace for this page
            det = res.get('detection')
            if det is not None:
                trace_sink({'sc': page['sc'], 'file': page['file'], 'model': args.model,
                            'provider': det.get('provider'), 'testcaseId': page['testcaseId'],
                            'axe_ids': det.get('axe_ids'), 'axe_scs': det.get('axe_scs'),
                            'sem_names': det.get('sem_names'), 'sem_scs': det.get('sem_scs'),
                            'raw': det.get('raw'), 'reasoning': det.get('reasoning'),
                            'usage': det.get('usage')})
            return i, page, res, int((time.time() - t0) * 1000)

        with ThreadPoolExecutor(max_workers=args.pages) as ex:
            futures = [ex.submit(work, i, page) for i, page in enumerate(pages)]
            done = 0
            for fut in as_completed(futures):
                i, page, result, ms = fut.result()
                tel.finish_case(i, result, ms)
                done += 1
                if result['error']:
                    mark = 'ERR'
                else:
                    mark = '✓' if result['correct'] else '✗'
                det = result.get('detection') or {}
                tag = f"axe={'Y' if det.get('axe_flag') else '-'} sem={'Y' if det.get('sem_flag') else '-'}"
                tel.log(f'[{done}/{n}] {mark} {page["sc"]:<7} {tag} exp={result["expected"]:<12} '
                        f'{ms}ms  {page["testcaseId"]}')

        s = tel.finalize(args.model)
        trace_fh.close()
        c = s['confusion']
        pct = lambda x: f'{100*x:.1f}%' if x is not None else '—'
        tel.log('')
        tel.log(f'DONE  n={s["n"]}  TP={c["tp"]} FP={c["fp"]} TN={c["tn"]} FN={c["fn"]} err={c["error"]}')
        tel.log(f'      recall={pct(s["recall"])} FPrate={pct(s["fpRate"])} precision={pct(s["precision"])} '
                f'F1={s["f1"]:.3f}' if s['f1'] else f'      recall={pct(s["recall"])}')
        tel.log(f'      tokens in={s["llm"]["inputTokens"]} out={s["llm"]["outputTokens"]} ~${s["llm"]["costUsd"]:.2f}')


if __name__ == '__main__':
    main()
