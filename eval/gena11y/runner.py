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
  --corpus saved-pages    the 56 real saved webpages the Gemini-3.7 harness run used
                          (eval/56-page-baselines/page-list-56.json). These pages have NO
                          ground-truth labels, so cases are marked unlabeled: the summary
                          reports verdict counts, never a confusion matrix. Pages are loaded
                          over the annotator server (--base) with the SAME ?offline=1[&noscript=1]
                          query the harness used, not from file://.

Models (a11y_detector.configure)
--------------------------------
  --model gemini-3.5-flash   Google generateContent REST (GEMINI_API_KEY)
  --model gpt-5.4-mini       OpenAI Responses API (OPENAI_API_KEY)
  --model chatgpt/gpt-5.6-luna  LiteLLM ChatGPT-subscription OAuth transport
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
from urllib.parse import quote

sys.path.insert(0, os.path.dirname(__file__))

import a11y_detector
import extract_elements as _extract_elements
from consts import CLAUDE_MODEL, COVERED_SCS, UNCOVERED_SCS, EVAL_DIR
from extract_elements import make_driver
from a11y_detector import detect_for_sc
from temp_isolation import ThreadLocalTempFolders

PROJECT_ROOT = Path(__file__).resolve().parents[2]
FIXED_STATUS_PATH = (
    os.environ.get('LLM_EVAL_STATUS_PATH')
    or os.environ.get('FN_LLM_STATUS_PATH')
    or '/tmp/llm-eval-status.json'
)
ACT_SUBSET_DIR = PROJECT_ROOT / 'eval/checker-comparison/act-subset'
ACT_RAW = PROJECT_ROOT / 'eval/checker-comparison/upstream-evidence/v3-act-subset-proposed/raw.json'
sys.path.insert(0, str(PROJECT_ROOT / 'eval/act-augmented/_tools'))
from reliable_annotated_cases import load_reliable_annotated_cases

_OUTCOME = {'REPRODUCED': 'caught', 'PARTIAL': 'caught', 'NOT REPRODUCED': 'missedAgree'}

# throttles concurrent Chrome drivers (the "tab limit"); (re)sized in main()
_DRIVER_SEM = threading.Semaphore(25)

# GenA11y's screenshot helpers use fixed filenames under one module-level
# directory. Keep the imported detector/extractor unchanged, but give every
# screenshot-producing page extraction its own thread-local temporary
# subdirectory so captures remain isolated without reducing page concurrency.
_SCREENSHOT_SC_S = {'1.4.1', '1.4.3', '1.4.10', '2.4.10', '3.3.1', '3.3.3'}
_SCREENSHOT_TMP_ROOT = _extract_elements.TEMP_FILE_FOLDER
_SCREENSHOT_TEMP_FOLDERS = ThreadLocalTempFolders(_SCREENSHOT_TMP_ROOT)
_extract_elements.TEMP_FILE_FOLDER = _SCREENSHOT_TEMP_FOLDERS


def _extract_for_page(driver, sc: str):
    def extract():
        if sc == '2.4.10':
            section_data = _extract_elements.extract_section_headings(driver)
            screenshot_b64 = _extract_elements.take_full_page_screenshot(
                driver, 'section_headings')
            return section_data, screenshot_b64
        return _extract_elements.extract_for_sc(driver, sc)

    if sc not in _SCREENSHOT_SC_S:
        return extract()

    safe_sc = sc.replace('.', '-')
    return _SCREENSHOT_TEMP_FOLDERS.run(f'page-{safe_sc}-', extract)


# ---------------------------------------------------------------------------
# Corpus loaders
# ---------------------------------------------------------------------------

def _primary_covered_sc(sc_field) -> str | None:
    scs = sc_field if isinstance(sc_field, list) else [sc_field]
    for s in scs:
        if s in COVERED_SCS:
            return s
    return None


# ACT and supplementary pages are loaded from their label-free copies (built by intera11y/eval/neutral-corpus.js),
# the same pages InterA11y evaluates: the originals' titles ("Failed Example 2"), paths and asset folder names name
# the rule and the expected result. 'file' stays the original path (results are keyed by it); only the page loaded
# changes.
NEUTRAL_MAP = PROJECT_ROOT / 'eval/corpus-neutral/map.json'
_neutral = None


def _load_neutral() -> dict:
    global _neutral
    if _neutral is None:
        if not NEUTRAL_MAP.exists():
            raise FileNotFoundError('eval/corpus-neutral/map.json is missing: run node intera11y/eval/neutral-corpus.js')
        _neutral = json.loads(NEUTRAL_MAP.read_text())
    return _neutral


def _in_neutral(rel: str) -> bool:
    return rel in _load_neutral()


def neutral_abs_path(rel: str) -> str:
    _load_neutral()
    if rel not in _neutral:
        raise FileNotFoundError(f'no label-free copy of {rel}: rebuild with node intera11y/eval/neutral-corpus.js')
    return str((PROJECT_ROOT / _neutral[rel]).resolve())


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
        rel = str(fixture.relative_to(PROJECT_ROOT))
        out.append({
            'file': rel,
            'abs_path': neutral_abs_path(rel),
            'sc': sc,
            'expected': r.get('expected', 'unknown'),
            'ruleId': r.get('ruleId'),
            'testcaseId': r.get('testcaseId'),
        })
    return out


# The 8-SC harness-expansion slice of act-rest (13 ACT rules / 218 cases) — see
# eval/checker-comparison/expansion-scope.json. GenA11y has element extraction for NONE
# of the 8 SCs (they are outside its COVERED_SCS design), so every case loads with
# covered=False and run_page() short-circuits to a structural 'uncovered' abstain
# (no driver, no LLM call). The run still writes full artifacts so the structural
# result is provenanced like any other run.
ACT_REST_DIR = PROJECT_ROOT / 'eval/checker-comparison/act-rest'
EXPANSION_RULES = {'73f2c2', '24afc2', '9e45ec', '78fd32', 'bc659a', 'b4f0c3', '2ee8b8',
                   '59br37', 'efbfc7', 'cf77f2', 'ye5d6e', '3e12e1', '9bd38c'}


def load_act_rest_cases() -> list[dict]:
    rows = json.loads((ACT_REST_DIR / 'subset.json').read_text())
    out = []
    for r in rows:
        if r.get('ruleId') not in EXPANSION_RULES:
            continue
        fixture = ACT_REST_DIR / r['localPath']
        if not fixture.exists():
            continue
        scs = r['sc'] if isinstance(r.get('sc'), list) else [r.get('sc')]
        primary = next((s for s in scs if s in COVERED_SCS), None)
        out.append({
            'file': str(fixture.relative_to(PROJECT_ROOT)),
            'abs_path': str(fixture.resolve()),
            'sc': primary or (scs[0] if scs and scs[0] else 'none'),
            'covered': primary is not None,
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


SAVED_PAGE_LIST = PROJECT_ROOT / 'eval/56-page-baselines/page-list-56.json'

# The 21 SCs the 774-element harness sample actually spans. GenA11y covers 10 of them; the other
# 11 load with covered=False and short-circuit to a zero-cost structural abstain, so the artifact
# records GenA11y's coverage gap on this corpus explicitly instead of leaving the SC absent.
SAVED_SAMPLE_SCS = ['1.1.1', '1.3.1', '1.4.1', '1.4.3', '1.4.4', '1.4.5', '1.4.12', '1.4.13',
                    '2.1.1', '2.1.2', '2.2.1', '2.2.2', '2.4.2', '2.4.3', '2.4.4', '2.4.6',
                    '2.4.7', '2.5.3', '3.3.1', '4.1.2', '4.1.3']


def load_saved_pages_cases(scs_filter: list[str] | None, base: str,
                           page_list: str | None = None) -> list[dict]:
    """
    The 56 real saved webpages, expanded to one case per (page, SC).

    SC scope = GenA11y's own COVERED_SCS (everything it can actually evaluate) UNION the SCs the
    harness sample spans (so its gaps are on the record). Real pages carry no labels, hence
    expected='unknown' and unlabeled=True — scoring these against a confusion matrix would be
    inventing ground truth.
    """
    list_path = Path(page_list) if page_list else SAVED_PAGE_LIST
    if not list_path.is_absolute():
        list_path = PROJECT_ROOT / list_path
    data = json.loads(list_path.read_text())
    scs = scs_filter or sorted(set(COVERED_SCS) | set(SAVED_SAMPLE_SCS))
    out = []
    for page in data['pages']:
        rel = page['relPath']
        fixture = PROJECT_ROOT / rel
        if not fixture.exists():
            raise FileNotFoundError(f"saved-pages corpus file missing: {rel}")
        # assetUrlUnder(): {base}/assets/{dir}/{encoded file} — identical to the harness's URL.
        url = f"{base}/assets/{page['assetDir']}/{quote(page['file'], safe='')}{page['query']}"
        for sc in scs:
            out.append({
                'file': rel, 'abs_path': str(fixture.resolve()), 'url': url,
                'sc': sc, 'expected': 'unknown', 'unlabeled': True,
                'covered': sc in COVERED_SCS,
                'ruleId': page['name'], 'testcaseId': f"{page['name']}::{sc}",
                'pageFile': page['file'],
            })
    return out


def load_case_list(case_list: str) -> list[dict]:
    """Load an explicit, provenance-preserving slice shared by all comparison runners."""
    list_path = Path(case_list)
    if not list_path.is_absolute():
        list_path = PROJECT_ROOT / list_path
    rows = json.loads(list_path.read_text())
    out = []
    for row in rows:
        fixture = PROJECT_ROOT / row['file']
        if not fixture.exists():
            raise FileNotFoundError(f"case-list fixture missing: {row['file']}")
        out.append({
            # a supplementary-585 page from its label-free copy; other lists (e.g. act-augmented dev pages) as they are
            'file': row['file'], 'abs_path': neutral_abs_path(row['file']) if _in_neutral(row['file']) else str(fixture.resolve()),
            'sc': row['sc'], 'expected': row['expected'],
            'ruleId': row.get('aspect'),
            'testcaseId': f"aug-{row['sc']}-{row.get('aspect', 'aspect')}-{row['id']}",
            'covered': row['sc'] in COVERED_SCS,
        })
    return out


# ---------------------------------------------------------------------------
# Single-page evaluation
# ---------------------------------------------------------------------------

def run_page(page: dict) -> dict:
    """Extraction + detection for one page. A driver-slot semaphore caps live Chromes."""
    if page.get('covered') is False:
        # Structural abstain: GenA11y has no extraction for this SC — no driver, no LLM.
        # Scored as uncovered=Negative (GT-fail -> FN, GT-pass/NA -> TN), same accounting
        # as analyze.py applies to load-time-excluded cases on the act corpus.
        return {
            'file': page['file'], 'sc': page['sc'], 'expected': page['expected'],
            'ruleId': page.get('ruleId'), 'testcaseId': page.get('testcaseId'),
            'polarity': 'recall' if page['expected'] == 'failed' else 'specificity',
            'outcome': 'uncovered', 'gena11y': None,
            'correct': None if page.get('unlabeled') else page['expected'] != 'failed',
            'unlabeled': bool(page.get('unlabeled')), 'pageFile': page.get('pageFile'),
            'error': None,
        }
    sc = page['sc']
    url = page.get('url') or f"file://{page['abs_path']}"
    a11y_detector.set_context(sc, page['file'])
    driver = None
    try:
        with _DRIVER_SEM:
            driver = make_driver(url)
            extracted = _extract_for_page(driver, sc)
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
        if not page.get('unlabeled'):
            correct = ((verdict['verdict'] in ('REPRODUCED', 'PARTIAL')) == (expected == 'failed'))
    return {
        'file': page['file'], 'sc': page['sc'], 'expected': expected,
        'ruleId': page.get('ruleId'), 'testcaseId': page.get('testcaseId'),
        'polarity': 'recall' if expected == 'failed' else 'specificity',
        'outcome': outcome, 'gena11y': verdict, 'correct': correct,
        'unlabeled': bool(page.get('unlabeled')), 'pageFile': page.get('pageFile'),
        'error': error,
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
                       'baselineVision': False, 'model': model, 'effort': cfg['effort']},
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
        # Unlabeled corpora (the 56 real saved pages) have NO ground truth. Scoring them into a
        # confusion matrix would silently label every flag a false positive, so they are tallied
        # by verdict only and excluded from tp/fp/tn/fn entirely.
        unlabeled = [r for r in self.results if r.get('unlabeled')]
        for r in self.results:
            if r.get('unlabeled'):
                sc = r['sc']
                d = by_sc.setdefault(sc, {'tp': 0, 'fp': 0, 'tn': 0, 'fn': 0, 'err': 0, 'nov': 0})
                d.setdefault('unlabeled', {'flagged': 0, 'notFlagged': 0, 'uncovered': 0,
                                           'noVerdict': 0, 'error': 0})
                u = d['unlabeled']
                if r['outcome'] == 'error':
                    u['error'] += 1; err += 1; d['err'] += 1
                elif r['outcome'] == 'uncovered':
                    u['uncovered'] += 1
                elif r['outcome'] == 'caught':
                    u['flagged'] += 1
                elif r['outcome'] == 'noVerdict':
                    u['noVerdict'] += 1; nov += 1; d['nov'] += 1
                else:
                    u['notFlagged'] += 1
                continue
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
        out = {
            'runName': self.tel['runName'], 'model': model,
            'effort': self.tel['config'].get('effort'), 'n': len(self.results),
            'elapsedMs': self.tel.get('elapsedMs'),
            'tally': self.tel['tally'],
            'confusion': {'tp': tp, 'fp': fp, 'tn': tn, 'fn': fn, 'error': err, 'noVerdict': nov},
            'recall': recall_v, 'fpRate': fp_rate, 'precision': prec, 'f1': f1,
            'bySc': by_sc, 'llm': dict(a11y_detector.LLM_STATS),
        }
        if unlabeled:
            flagged = [r for r in unlabeled if r['outcome'] == 'caught']
            out['unlabeled'] = {
                'cases': len(unlabeled),
                'pages': len({r.get('pageFile') or r['file'] for r in unlabeled}),
                'covered': len([r for r in unlabeled if r['outcome'] != 'uncovered']),
                'uncovered': len([r for r in unlabeled if r['outcome'] == 'uncovered']),
                'flagged': len(flagged),
                'notFlagged': len([r for r in unlabeled if r['outcome'] == 'missedAgree']),
                'noVerdict': len([r for r in unlabeled if r['outcome'] == 'noVerdict']),
                'error': len([r for r in unlabeled if r['outcome'] == 'error']),
                # element-level: GenA11y returns an xpath per violation, so the flagged-element
                # count is the unit that lines up with the harness's per-element sample.
                'violationElements': sum(len((r.get('gena11y') or {}).get('violations') or [])
                                         for r in flagged),
            }
            if len(unlabeled) == len(self.results):
                # nothing labeled ran — do not publish a confusion matrix built from no labels
                for k in ('confusion', 'recall', 'fpRate', 'precision', 'f1'):
                    out[k] = None
        return out


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    p = argparse.ArgumentParser(description='Run GenA11y over an ACT corpus with a chosen model.')
    p.add_argument('--corpus', choices=['act', 'act-rest', 'act-augmented', 'annotated-reliable',
                                        'saved-pages'], default='act')
    p.add_argument('--case-list', help='Explicit JSON case list; overrides --corpus selection.')
    p.add_argument('--model', default=CLAUDE_MODEL)
    p.add_argument('--effort', choices=['minimal', 'low', 'medium', 'high', 'xhigh', 'max'])
    p.add_argument('--sc', help='Restrict to one SC or a comma-separated SC list.')
    p.add_argument('--limit', type=int, help='Cap total cases.')
    p.add_argument('--pages', type=int, default=25, help='Parallel page workers.')
    p.add_argument('--tabs', type=int, default=25, help='Concurrent Chrome driver cap.')
    p.add_argument('--llm-conc', type=int, default=60, help='Global concurrent LLM-call cap.')
    p.add_argument('--out', default='gena11y', help='Run name → results/<name>/.')
    p.add_argument('--base', default=os.environ.get('A11Y_BASE', 'http://127.0.0.1:3001'),
                   help='saved-pages: annotator server origin the pages load from.')
    p.add_argument('--page-list', help='saved-pages: page-list JSON (default eval/56-page-baselines/page-list-56.json).')
    p.add_argument('--dry-run', action='store_true')
    args = p.parse_args()

    global _DRIVER_SEM
    _DRIVER_SEM = threading.Semaphore(args.tabs)

    out_dir = PROJECT_ROOT / 'results' / args.out
    out_dir.mkdir(parents=True, exist_ok=True)

    scs_filter = None
    if args.sc:
        scs_filter = [s.strip() for s in args.sc.split(',') if s.strip()]
        if not args.case_list and args.corpus not in ('annotated-reliable', 'saved-pages'):
            unsupported = [s for s in scs_filter if s not in COVERED_SCS]
            if unsupported:
                print(f'SC(s) {",".join(unsupported)} not covered by GenA11y.', file=sys.stderr)
                sys.exit(1)

    if args.case_list:
        pages = load_case_list(args.case_list)
    elif args.corpus == 'act':
        pages = load_act_cases(scs_filter)
    elif args.corpus == 'act-rest':
        pages = load_act_rest_cases()
    elif args.corpus == 'saved-pages':
        pages = load_saved_pages_cases(scs_filter, args.base.rstrip('/'), args.page_list)
    elif args.corpus == 'annotated-reliable':
        pages = load_reliable_annotated_cases(PROJECT_ROOT, scs_filter)
        for page in pages:
            page['covered'] = page['sc'] in COVERED_SCS
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
        if args.corpus == 'saved-pages':
            covered = [p for p in pages if p.get('covered')]
            print(f'pages   : {len({p["file"] for p in pages})} | '
                  f'covered cases (LLM): {len(covered)} | '
                  f'structural abstains: {len(pages) - len(covered)}')
            print('example url:', pages[0]['url'])
        return

    # trace sink: append every LLM call (prompt/raw/reasoning/usage/verdict) as JSONL
    trace_fh = open(out_dir / 'llm-trace.jsonl', 'w')

    def trace_sink(rec):
        trace_fh.write(json.dumps(rec) + '\n')
        trace_fh.flush()

    a11y_detector.configure(model=args.model, effort=args.effort,
                            llm_concurrency=args.llm_conc, trace_sink=trace_sink)

    cfg = {'pages': args.pages, 'tabs': args.tabs, 'llm_conc': args.llm_conc,
           'effort': args.effort}
    with open(out_dir / 'run.log', 'w') as log_fh:
        tel = Telemetry(args.out, out_dir, len(pages), args.model, cfg, log_fh)
        tel.log(f'GenA11y {args.corpus} run: {len(pages)} cases | model={args.model} | effort={args.effort} | '
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
        if c is None:
            # unlabeled corpus: report what was flagged, never a confusion matrix over absent labels
            u = summary['unlabeled']
            tel.log(f'DONE  n={summary["n"]}  pages={u["pages"]}  covered={u["covered"]} '
                    f'uncovered={u["uncovered"]}  (no ground truth — verdict tally only)')
            tel.log(f'      flagged={u["flagged"]} notFlagged={u["notFlagged"]} '
                    f'noVerdict={u["noVerdict"]} err={u["error"]}  '
                    f'violationElements={u["violationElements"]}')
        else:
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
