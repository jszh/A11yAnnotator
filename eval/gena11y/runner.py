"""
GenA11y-adapted runner for the WCAG ACT corpora.

Two corpora
-----------
  --corpus act            (default) the OFFICIAL W3C ACT subset the paper's tables
                          use: eval/checker-comparison/act-subset/pages/<ruleId>/<tc>.html,
                          labels from upstream-evidence/v3-act-subset-proposed/raw.json.
                          "Full set, no deterministic-TN subtraction" = every case with a
                          fixture whose primary SC GenA11y covers (531 cases / 10 SCs).
  --corpus act-augmented  this project's human-judgment pages (eval/act-augmented/);
                          labels are UNVALIDATED (directional only).

Models (a11y_detector.configure)
--------------------------------
  --model gemini-3.5-flash   Google generateContent REST (GEMINI_API_KEY)
  --model gpt-5.4-mini       OpenAI Responses API (OPENAI_API_KEY)
  --model claude-sonnet-4-6  Python Agent SDK (CLAUDE_CODE_OAUTH_TOKEN)

Concurrency
-----------
  --pages 25 --tabs 25 --llm-conc 60   (page workers / concurrent Chrome drivers / LLM calls)

Usage
-----
    python runner.py --corpus act --model gemini-3.5-flash --out gena11y-act-gemini \
        --pages 25 --tabs 25 --llm-conc 60

Live progress: writes results/<out>/status.json (+ the fixed monitor path). Watch with:
    node eval/checker-comparison/fn-llm-monitor.js <out>

Artifacts (results/<out>/): status.json, results.json, summary.json, run.log,
    llm-trace.jsonl  (one line per LLM call: prompt, raw output, reasoning/thinking, usage, verdict)
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

sys.path.insert(0, os.path.dirname(__file__))

import a11y_detector
from consts import CLAUDE_MODEL, COVERED_SCS, UNCOVERED_SCS, EVAL_DIR
from extract_elements import extract_for_sc, make_driver, take_full_page_screenshot
from a11y_detector import detect_for_sc

PROJECT_ROOT = Path(__file__).resolve().parents[2]
FIXED_STATUS_PATH = (
    os.environ.get('LLM_EVAL_STATUS_PATH')
    or os.environ.get('FN_LLM_STATUS_PATH')
    or '/tmp/llm-eval-status.json'
)
ACT_SUBSET_DIR = PROJECT_ROOT / 'eval/checker-comparison/act-subset'
ACT_RAW = PROJECT_ROOT / 'eval/checker-comparison/upstream-evidence/v3-act-subset-proposed/raw.json'

_OUTCOME = {'REPRODUCED': 'caught', 'PARTIAL': 'caught', 'NOT REPRODUCED': 'missedAgree'}

# throttles concurrent Chrome drivers (the "tab limit"); (re)sized in main()
_DRIVER_SEM = threading.Semaphore(25)


# ---------------------------------------------------------------------------
# Corpus loaders
# ---------------------------------------------------------------------------

def _primary_covered_sc(sc_field) -> str | None:
    scs = sc_field if isinstance(sc_field, list) else [sc_field]
    for s in scs:
        if s in COVERED_SCS:
            return s
    return None


def load_act_cases(scs_filter: list[str] | None = None) -> list[dict]:
    """
    Official ACT subset, FULL set (no axe/v3 deterministic-TN subtraction): every
    raw.json entry with a local fixture whose primary SC GenA11y covers.
    """
    raw = json.loads(ACT_RAW.read_text())
    out = []
    for r in raw:
        if r.get('error'):
            continue
        sc = _primary_covered_sc(r.get('sc'))
        if not sc or (scs_filter and sc not in scs_filter):
            continue
        fixture = ACT_SUBSET_DIR / 'pages' / r['ruleId'] / f"{r['testcaseId']}.html"
        if not fixture.exists():
            continue
        out.append({
            'file': str(fixture.relative_to(PROJECT_ROOT)),
            'abs_path': str(fixture.resolve()),
            'sc': sc,
            'expected': r.get('expected', 'unknown'),
            'ruleId': r.get('ruleId'),
            'testcaseId': r.get('testcaseId'),
        })
    return out


def discover_pages(sc: str) -> list[dict]:
    """act-augmented corpus: valid HTML pages for one SC (labels from summary.json)."""
    sc_dir = Path(EVAL_DIR) / sc / 'pages'
    if not sc_dir.is_dir():
        return []
    summary_path = Path(EVAL_DIR) / sc / 'summary.json'
    expected_map = {}
    if summary_path.exists():
        try:
            summary = json.loads(summary_path.read_text())
            for aspect in summary.get('aspectsFinalized', []):
                for page in aspect.get('pages', []):
                    if page.get('status') == 'valid':
                        key = Path(page['file']).name.replace('.html', '')
                        expected_map[(aspect['slug'], key)] = page.get('expected', 'unknown')
        except Exception:
            pass
    pages = []
    for aspect_dir in sorted(sc_dir.iterdir()):
        if not aspect_dir.is_dir():
            continue
        for html_file in sorted(aspect_dir.glob('case-*.html')):
            pages.append({
                'file': str(html_file.relative_to(PROJECT_ROOT)),
                'abs_path': str(html_file.resolve()),
                'sc': sc,
                'expected': expected_map.get((aspect_dir.name, html_file.stem), 'unknown'),
            })
    return pages


def collect_augmented(scs: list[str], limit: int | None) -> list[dict]:
    per_sc = {sc: discover_pages(sc) for sc in scs}
    per_sc = {sc: p for sc, p in per_sc.items() if p}
    if limit is None:
        return [p for sc in scs for p in per_sc.get(sc, [])]
    out, idx = [], 0
    order = [sc for sc in scs if sc in per_sc]
    while len(out) < limit and order:
        for sc in list(order):
            if idx < len(per_sc[sc]):
                out.append(per_sc[sc][idx])
                if len(out) >= limit:
                    break
            else:
                order.remove(sc)
        idx += 1
    return out


# ---------------------------------------------------------------------------
# Single-page evaluation
# ---------------------------------------------------------------------------

def run_page(page: dict) -> dict:
    """Extraction + detection for one page. A driver-slot semaphore caps live Chromes."""
    sc = page['sc']
    url = f"file://{page['abs_path']}"
    a11y_detector.set_context(sc, page['file'])
    driver = None
    try:
        with _DRIVER_SEM:
            driver = make_driver(url)
            if sc == '2.4.10':
                from extract_elements import extract_section_headings
                section_data = extract_section_headings(driver)
                screenshot_b64 = take_full_page_screenshot(driver, 'section_headings')
                extracted = (section_data, screenshot_b64)
            else:
                extracted = extract_for_sc(driver, sc)
            try:
                driver.quit()
            finally:
                driver = None
        if extracted is None:
            return _make_result(page, None, f'SC {sc} extraction returned None')
        verdict = detect_for_sc(sc, extracted)          # LLM call — outside the driver slot
        return _make_result(page, verdict)
    except Exception:
        return _make_result(page, None, traceback.format_exc())
    finally:
        if driver:
            try:
                driver.quit()
            except Exception:
                pass


def _make_result(page: dict, verdict: dict | None, error: str | None = None) -> dict:
    expected = page['expected']
    correct = None
    outcome = 'error' if error else 'noVerdict'
    if verdict and not error:
        outcome = _OUTCOME.get(verdict['verdict'], 'noVerdict')
        correct = ((verdict['verdict'] in ('REPRODUCED', 'PARTIAL')) == (expected == 'failed'))
    return {
        'file': page['file'], 'sc': page['sc'], 'expected': expected,
        'ruleId': page.get('ruleId'), 'testcaseId': page.get('testcaseId'),
        'polarity': 'recall' if expected == 'failed' else 'specificity',
        'outcome': outcome, 'gena11y': verdict, 'correct': correct, 'error': error,
    }


# ---------------------------------------------------------------------------
# Live telemetry (monitor-compatible status.json) — thread-safe
# ---------------------------------------------------------------------------

class Telemetry:
    def __init__(self, run_name, out_dir, total, model, cfg, log_fh):
        self.out_dir = out_dir
        self.log_fh = log_fh
        self.lock = threading.Lock()
        self.started_at_ms = int(time.time() * 1000)
        self.tel = {
            'startedAt': self.started_at_ms, 'runName': run_name,
            'config': {'fnTotal': total, 'pageConc': cfg['pages'], 'globalLlm': cfg['llm_conc'],
                       'perPageLlm': 1, 'maxTabs': cfg['tabs'], 'vision': True, 'tools': False,
                       'evidence': 'gena11y-extract', 'noVisionRubric': False,
                       'baselineVision': False, 'model': model},
            'phase': 'init', 'done': 0, 'total': total,
            'workers': {}, 'inflight': {}, 'tabs': {}, 'mem': {},
            'llm': dict(a11y_detector.LLM_STATS),
            'tally': {'caught': 0, 'missedAgree': 0, 'uncertain': 0,
                      'noVerdict': 0, 'noObligation': 0, 'error': 0},
            'recent': [], 'errors': [],
        }
        self.results = []

    def log(self, line):
        with self.lock:
            print(line, flush=True)
            if self.log_fh:
                self.log_fh.write(line + '\n')
                self.log_fh.flush()

    def set_phase(self, phase):
        with self.lock:
            self.tel['phase'] = phase
            self._write_locked()

    def start_case(self, idx, page):
        with self.lock:
            self.tel['workers'][str(idx)] = {
                'idx': idx, 'ruleId': page.get('ruleId') or Path(page['file']).stem,
                'sc': page['sc'], 'expected': page['expected'], 'phase': 'orchestrate',
                'startedAt': int(time.time() * 1000),
            }
            self._write_locked()

    def finish_case(self, idx, result, ms):
        with self.lock:
            self.results.append(result)
            self.tel['done'] += 1
            self.tel['tally'][result['outcome']] = self.tel['tally'].get(result['outcome'], 0) + 1
            self.tel['recent'].insert(0, {
                'ruleId': result.get('ruleId') or Path(result['file']).stem,
                'sc': result['sc'], 'outcome': result['outcome'], 'ms': ms})
            self.tel['recent'] = self.tel['recent'][:10]
            self.tel['workers'].pop(str(idx), None)
            self.tel['llm'] = dict(a11y_detector.LLM_STATS)
            self._write_locked()
            self._write_results_locked()

    def _write_locked(self):
        try:
            self.tel['elapsedMs'] = int(time.time() * 1000) - self.started_at_ms
            self.tel['llm']['inFlightNow'] = len(self.tel['inflight'])
            payload = json.dumps(self.tel)
            (self.out_dir / 'status.json').write_text(payload)
            try:
                Path(FIXED_STATUS_PATH).write_text(payload)
            except Exception:
                pass
        except Exception:
            pass

    def _write_results_locked(self):
        try:
            (self.out_dir / 'results.json').write_text(json.dumps(self.results, indent=2))
        except Exception:
            pass

    def finalize(self, model):
        with self.lock:
            self.tel['phase'] = 'done'
            self._write_locked()
            self._write_results_locked()
            summary = self._summarize(model)
            (self.out_dir / 'summary.json').write_text(json.dumps(summary, indent=2))
            return summary

    def _summarize(self, model):
        tp = fp = tn = fn = err = nov = 0
        by_sc = {}
        for r in self.results:
            sc = r['sc']
            d = by_sc.setdefault(sc, {'tp': 0, 'fp': 0, 'tn': 0, 'fn': 0, 'err': 0, 'nov': 0})
            if r['outcome'] == 'error':
                err += 1; d['err'] += 1; continue
            if r['outcome'] == 'noVerdict':
                nov += 1; d['nov'] += 1
            recall = r['expected'] == 'failed'
            flagged = r['outcome'] == 'caught'
            if recall:
                if flagged: tp += 1; d['tp'] += 1
                else: fn += 1; d['fn'] += 1
            else:
                if flagged: fp += 1; d['fp'] += 1
                else: tn += 1; d['tn'] += 1
        recall_v = tp / (tp + fn) if (tp + fn) else None
        fp_rate = fp / (fp + tn) if (fp + tn) else None
        prec = tp / (tp + fp) if (tp + fp) else None
        f1 = (2 * prec * recall_v / (prec + recall_v)) if (prec and recall_v) else None
        return {
            'runName': self.tel['runName'], 'model': model, 'n': len(self.results),
            'elapsedMs': self.tel.get('elapsedMs'),
            'tally': self.tel['tally'],
            'confusion': {'tp': tp, 'fp': fp, 'tn': tn, 'fn': fn, 'error': err, 'noVerdict': nov},
            'recall': recall_v, 'fpRate': fp_rate, 'precision': prec, 'f1': f1,
            'bySc': by_sc, 'llm': dict(a11y_detector.LLM_STATS),
        }


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    p = argparse.ArgumentParser(description='Run GenA11y over an ACT corpus with a chosen model.')
    p.add_argument('--corpus', choices=['act', 'act-augmented'], default='act')
    p.add_argument('--model', default=CLAUDE_MODEL)
    p.add_argument('--sc', help='Restrict to a single SC.')
    p.add_argument('--limit', type=int, help='Cap total cases.')
    p.add_argument('--pages', type=int, default=25, help='Parallel page workers.')
    p.add_argument('--tabs', type=int, default=25, help='Concurrent Chrome driver cap.')
    p.add_argument('--llm-conc', type=int, default=60, help='Global concurrent LLM-call cap.')
    p.add_argument('--out', default='gena11y', help='Run name → results/<name>/.')
    p.add_argument('--dry-run', action='store_true')
    args = p.parse_args()

    global _DRIVER_SEM
    _DRIVER_SEM = threading.Semaphore(args.tabs)

    out_dir = PROJECT_ROOT / 'results' / args.out
    out_dir.mkdir(parents=True, exist_ok=True)

    scs_filter = None
    if args.sc:
        if args.sc not in COVERED_SCS:
            print(f'SC {args.sc} not covered by GenA11y.', file=sys.stderr)
            sys.exit(1)
        scs_filter = [args.sc]

    if args.corpus == 'act':
        pages = load_act_cases(scs_filter)
    else:
        scs = scs_filter or sorted(COVERED_SCS)
        pages = collect_augmented(scs, None)
    if args.limit:
        pages = pages[:args.limit]
    if not pages:
        print('No pages found for the requested corpus/SC.', file=sys.stderr)
        sys.exit(1)

    if args.dry_run:
        from collections import Counter
        print(f'{args.corpus} corpus | model={args.model} | {len(pages)} cases')
        print('expected:', dict(Counter(p['expected'] for p in pages)))
        print('by SC   :', dict(Counter(p['sc'] for p in pages)))
        return

    # trace sink: append every LLM call (prompt/raw/reasoning/usage/verdict) as JSONL
    trace_fh = open(out_dir / 'llm-trace.jsonl', 'w')

    def trace_sink(rec):
        trace_fh.write(json.dumps(rec) + '\n')
        trace_fh.flush()

    a11y_detector.configure(model=args.model, llm_concurrency=args.llm_conc, trace_sink=trace_sink)

    cfg = {'pages': args.pages, 'tabs': args.tabs, 'llm_conc': args.llm_conc}
    with open(out_dir / 'run.log', 'w') as log_fh:
        tel = Telemetry(args.out, out_dir, len(pages), args.model, cfg, log_fh)
        tel.log(f'GenA11y {args.corpus} run: {len(pages)} cases | model={args.model} | '
                f'pages={args.pages} tabs={args.tabs} llmConc={args.llm_conc}')
        tel.log(f'status → {out_dir / "status.json"}  '
                f'(monitor: node eval/checker-comparison/fn-llm-monitor.js {args.out})')
        tel.log('')
        tel.set_phase('running')

        n = len(pages)
        with ThreadPoolExecutor(max_workers=args.pages) as ex:
            def work(i, page):
                tel.start_case(i, page)
                t0 = time.time()
                res = run_page(page)
                return i, page, res, int((time.time() - t0) * 1000)

            futures = [ex.submit(work, i, page) for i, page in enumerate(pages)]
            completed = 0
            for fut in as_completed(futures):
                i, page, result, ms = fut.result()
                tel.finish_case(i, result, ms)
                completed += 1
                if result['error']:
                    mark, verdict = 'ERR', 'error'
                else:
                    verdict = result['gena11y']['verdict'] if result['gena11y'] else 'N/A'
                    mark = '✓' if result['correct'] else ('✗' if result['correct'] is False else '·')
                tel.log(f'[{completed}/{n}] {mark} {page["sc"]:<7} '
                        f'verdict={verdict:<15} expected={result["expected"]:<12} '
                        f'{ms}ms  {page.get("testcaseId") or page["file"]}')

        summary = tel.finalize(args.model)
        trace_fh.close()
        c = summary['confusion']
        pct = lambda x: f'{100*x:.1f}%' if x is not None else '—'
        tel.log('')
        tel.log(f'DONE  n={summary["n"]}  TP={c["tp"]} FP={c["fp"]} TN={c["tn"]} FN={c["fn"]} '
                f'noVerd={c["noVerdict"]} err={c["error"]}')
        tel.log(f'      recall={pct(summary["recall"])}  FPrate={pct(summary["fpRate"])}  '
                f'precision={pct(summary["precision"])}  F1={summary["f1"]:.3f}' if summary['f1']
                else f'      recall={pct(summary["recall"])}  FPrate={pct(summary["fpRate"])}')
        tel.log(f'      tokens in={summary["llm"]["inputTokens"]} out={summary["llm"]["outputTokens"]} '
                f'~${summary["llm"]["costUsd"]:.2f}')
        tel.log(f'wrote {out_dir}/ (results.json, summary.json, run.log, llm-trace.jsonl)')


if __name__ == '__main__':
    main()
