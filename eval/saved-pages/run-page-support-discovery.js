#!/usr/bin/env node
'use strict';

// One page-centric, no-LLM pass over the saved-page corpus. Unlike the sampled
// element runners, this deliberately scans page/head facts and runs mutating
// viewport/spacing/behavior probes in fresh page loads. Results are candidate
// evidence; existing experiment barriers are raw probe signals until the
// catalog-backed finalization pass turns them into obligation-ledger decisions.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const puppeteer = require('puppeteer');

const ROOT = path.join(__dirname, '..', '..');
require('../../scripts/v3/lib/load-env.js').loadEnv(ROOT);

const { BROWSER_ARGS } = require('../../scripts/v3/lib/orchestrator.js');
const { createTabAllocator } = require('../../scripts/v3/lib/tab-allocator.js');
const { createBrowserShardPool } = require('../../scripts/v3/lib/browser-shard-pool.js');
const { sampleMemory } = require('../../scripts/v3/lib/run-telemetry.js');
const { RUNNERS } = require('../../scripts/v3/lib/exp-runners.js');
const {
  probeTextSpacing,
  probeResizeText,
  probeContextChanges,
} = require('../../scripts/v3/lib/broad-scope-probes.js');
const P = require('./page-support.js');
const { assetUrlUnder } = require('../../scripts/lib/asset-paths.js');

function arg(name, def = null) {
  const exact = `--${name}`;
  const found = process.argv.find((value) => value === exact || value.startsWith(`${exact}=`));
  if (!found) return def;
  if (found.startsWith(`${exact}=`)) return found.slice(exact.length + 1);
  const next = process.argv[process.argv.indexOf(found) + 1];
  return next && !next.startsWith('--') ? next : true;
}

const RUN_NAME = String(arg('out', 'saved-pages-page-support-discovery-server'));
const OUT = path.join(ROOT, 'results', RUN_NAME);
const BASE = String(arg('base', process.env.A11Y_BASE || 'http://127.0.0.1:3001'));
const CHROME = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome';
const PAGE_CONC = Math.max(1, Number(arg('pages', 32)) || 32);
const MAX_TABS = Math.max(1, Number(arg('max-tabs', 256)) || 256);
const BROWSER_SHARDS = Math.max(1, Math.min(PAGE_CONC, MAX_TABS, Number(arg('browsers', 16)) || 16));
const MAX_DOM = Math.max(100, Number(arg('max-dom', 25000)) || 25000);
const MAX_DYNAMIC_SUBJECTS = Math.max(1, Number(arg('max-dynamic-subjects', 100)) || 100);
const REUSE_SEQUENCE = path.resolve(ROOT, String(arg('reuse-sequence', 'results/saved-elements-low-count-evaluation-server-round-01')));
const FILE_FILTER = arg('file', null);
const SELECTION_PATH = arg('selection', null);
const LIMIT = Math.max(0, Number(arg('limit', 0)) || 0);

const safe = (value) => String(value).replace(/[^a-z0-9_.-]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 100);
const hashFile = (file) => {
  try { return crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, file))).digest('hex'); }
  catch { return null; }
};

function loadSpecs() {
  const samples = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets', 'samples-saved.json'), 'utf8'));
  const pages = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets', 'pages.json'), 'utf8'));
  const meta = new Map((Array.isArray(pages) ? pages : pages.pages || []).filter((row) => row && row.file).map((row) => [row.file, row]));
  let specs = Object.entries(samples).map(([key, page]) => {
    const file = key.replace(/^saved\//, '');
    return { key, file, name: page.name, noscript: !!(meta.get(file) || {}).noscript };
  }).sort((a, b) => a.file.localeCompare(b.file));
  if (SELECTION_PATH) {
    const selectionFile = path.resolve(ROOT, String(SELECTION_PATH));
    const selection = JSON.parse(fs.readFileSync(selectionFile, 'utf8'));
    const selectedFiles = new Set(
      Array.isArray(selection.pageSupportPages)
        ? selection.pageSupportPages
        : (selection.pages || []).map((row) => row.file)
    );
    if (!selectedFiles.size) throw new Error(`selection ${selectionFile} contains no pageSupportPages/pages`);
    specs = specs.filter((row) => selectedFiles.has(row.file));
    const missing = [...selectedFiles].filter((file) => !specs.some((row) => row.file === file));
    if (missing.length) throw new Error(`selection contains unknown saved pages: ${missing.join(', ')}`);
  }
  if (FILE_FILTER) specs = specs.filter((row) => row.file === FILE_FILTER);
  if (LIMIT) specs = specs.slice(0, LIMIT);
  return specs;
}

function loadSequenceEvidence() {
  const out = new Map();
  const dir = path.join(REUSE_SEQUENCE, 'pages');
  if (!fs.existsSync(dir)) return out;
  for (const file of fs.readdirSync(dir).filter((value) => value.endsWith('.json'))) {
    const doc = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    const page = doc.spec && doc.spec.file;
    if (!page) continue;
    const ledger = ((doc.results && doc.results.obligationLedger) || []).filter((row) => row.sc === '1.3.2');
    const signals = ((doc.results && doc.results.instrumentFindings) || []).filter((row) => row.sc === '1.3.2');
    if (!ledger.length && !signals.length) continue;
    out.set(page, { ledger, signalCount: signals.length });
  }
  return out;
}

// Browser-context function. Keep it self-contained for page.evaluate().
function collectFullPageFacts(maxDom) {
  const xpathOf = (el) => {
    if (!el || !el.tagName) return '';
    if (el === document.documentElement) return '/html';
    // Match act-page-collect.js's canonical body identity so discovered paths
    // can be handed back to the subset collector without an identity rewrite.
    if (el === document.body && el.tagName === 'BODY') return '/html/body';
    const tag = el.tagName.toLowerCase();
    let index = 1;
    for (let sibling = el.previousElementSibling; sibling; sibling = sibling.previousElementSibling) if (sibling.tagName === el.tagName) index++;
    return `${xpathOf(el.parentElement)}/${tag}[${index}]`;
  };
  const visible = (el) => {
    if (!el || el.nodeType !== 1) return false;
    for (let node = el; node && node.nodeType === 1; node = node.parentElement) {
      if (node.hidden || node.hasAttribute('inert') || node.getAttribute('aria-hidden') === 'true') return false;
      const style = getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity || '1') === 0) return false;
    }
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  };
  const all = [...document.querySelectorAll('*')];
  const scanned = all.slice(0, maxDom);
  const textRecords = [];
  const spacingImportantXpaths = [];
  const zoomClipXpaths = [];
  const textSeen = new Set();
  const blockSelector = 'p,li,dt,dd,label,legend,summary,figcaption,blockquote,h1,h2,h3,h4,h5,h6,button,a,td,th,section,article';
  for (const el of scanned) {
    if (!visible(el)) continue;
    const direct = [...el.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE).map((node) => node.textContent || '').join(' ').replace(/\s+/g, ' ').trim();
    if (direct) {
      const block = el.closest(blockSelector) || el;
      const xpath = xpathOf(block);
      const text = String(block.innerText || block.textContent || direct).replace(/\s+/g, ' ').trim().slice(0, 1000);
      const key = `${xpath}\0${text}`;
      if (text && !textSeen.has(key)) { textSeen.add(key); textRecords.push({ xpath, text, lang: el.lang || document.documentElement.lang || null }); }
    }
    const style = getComputedStyle(el);
    const hasText = String(el.textContent || '').trim().length > 0;
    if (hasText && ['letter-spacing', 'word-spacing', 'line-height'].some((prop) => el.style.getPropertyPriority(prop) === 'important')) spacingImportantXpaths.push(xpathOf(el));
    const clips = /(hidden|clip)/.test(`${style.overflow} ${style.overflowX} ${style.overflowY}`);
    if (hasText && clips) zoomClipXpaths.push(xpathOf(el));
  }
  return {
    domElementCount: all.length,
    domScanned: scanned.length,
    domTruncated: all.length > scanned.length,
    lang: document.documentElement.lang || null,
    viewportContents: [...document.querySelectorAll('meta[name="viewport" i]')].map((node) => node.getAttribute('content')),
    refreshContents: [...document.querySelectorAll('meta[http-equiv="refresh" i]')].map((node) => node.getAttribute('content')),
    textRecords: textRecords.slice(0, 10000),
    spacingImportantXpaths: [...new Set(spacingImportantXpaths)].slice(0, 1000),
    zoomClipXpaths: [...new Set(zoomClipXpaths)].slice(0, 1000),
    crossOriginFrames: [...document.querySelectorAll('iframe,frame')].filter((frame) => { try { return !(frame.contentDocument && frame.contentDocument.documentElement); } catch { return true; } }).length,
    shadowHosts: scanned.filter((el) => !!el.shadowRoot).length,
  };
}

function experimentRequest(page, sc, targetXpath, suffix) {
  return {
    candidateId: `${page}::${sc}::${suffix}`,
    targetXpath,
    environment: 'headless-chromium',
  };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(path.join(OUT, 'pages'), { recursive: true });
  const specs = loadSpecs();
  const sequence = loadSequenceEvidence();
  const health = await fetch(`${BASE}/engine/status`).catch(() => null);
  if (!health || !health.ok) throw new Error(`annotator server is not reachable at ${BASE}`);

  const sourceFiles = [
    'scripts/v3/lib/sensory-lexicon.js', 'scripts/v3/lib/static-checks.js',
    'scripts/v3/lib/exp-runners.js', 'scripts/v3/lib/broad-scope-probes.js',
    'eval/saved-pages/page-support.js', 'eval/saved-pages/run-page-support-discovery.js',
  ];
  const manifest = {
    schema: 'saved-pages-page-support/2', runName: RUN_NAME, startedAt: new Date().toISOString(), base: BASE,
    mode: 'full-page-no-llm-discovery', targets: P.TARGET_SCS,
    reuseSequence: path.relative(ROOT, REUSE_SEQUENCE),
    limits: { maxDom: MAX_DOM, maxDynamicSubjectsPerLane: MAX_DYNAMIC_SUBJECTS },
    concurrency: { pages: PAGE_CONC, maxTabs: MAX_TABS, browserShards: BROWSER_SHARDS },
    selection: SELECTION_PATH ? path.relative(ROOT, path.resolve(ROOT, String(SELECTION_PATH))) : null,
    requestedPages: specs.length,
    sourceHashes: Object.fromEntries(sourceFiles.map((file) => [file, hashFile(file)])),
  };
  try { manifest.commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim(); }
  catch { manifest.commit = null; }
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));

  const tel = { phase: 'launching', startedAt: Date.now(), done: 0, total: specs.length, errors: [], workers: {}, tabs: {}, mem: {} };
  const persist = () => fs.writeFileSync(path.join(OUT, 'status.json'), JSON.stringify({ ...tel, elapsedMs: Date.now() - tel.startedAt }, null, 2));
  const launchBrowser = () => puppeteer.launch({ executablePath: CHROME, headless: 'new', args: BROWSER_ARGS, protocolTimeout: 300000 });
  const pool = await createBrowserShardPool({ browserCount: BROWSER_SHARDS, totalTabs: MAX_TABS, launchBrowser, createAllocator: (browser, cap) => createTabAllocator({ browser, maxTabs: cap }) });
  tel.phase = 'running'; persist();
  let sampling = false;
  const timer = setInterval(async () => {
    tel.tabs = pool.stats();
    if (!sampling) { sampling = true; try { tel.mem = await sampleMemory(process.pid); } finally { sampling = false; } }
    persist();
  }, 1000); timer.unref?.();

  const results = [];
  let cursor = 0;
  const worker = async (wid, workerIndex) => {
    const shard = pool.shardFor(workerIndex);
    const onFreshPage = async (url, phase, fn) => {
      tel.workers[wid].phase = phase;
      const lease = await shard.alloc.acquire();
      try {
        await lease.page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
        await lease.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
        await new Promise((resolve) => setTimeout(resolve, 250));
        return await fn(lease.page);
      } finally { await lease.release(); }
    };

    while (true) {
      const index = cursor++;
      if (index >= specs.length) { delete tel.workers[wid]; return; }
      const spec = specs[index];
      const started = Date.now();
      const pageUrl = assetUrlUnder(BASE, spec.file) + '?offline=1' + (spec.noscript ? '&noscript=1' : '');
      tel.workers[wid] = { index, file: spec.file, phase: 'facts', startedAt: started };
      const rec = { key: spec.key, file: spec.file, name: spec.name, noscript: spec.noscript, candidates: [], probes: {}, warnings: [] };
      try {
        const facts = await onFreshPage(pageUrl, 'facts', (page) => page.evaluate(collectFullPageFacts, MAX_DOM));
        rec.coverage = {
          domElementCount: facts.domElementCount, domScanned: facts.domScanned, domTruncated: facts.domTruncated,
          crossOriginFrames: facts.crossOriginFrames, shadowHosts: facts.shadowHosts,
        };
        if (facts.domTruncated) rec.warnings.push('page-truncated-risk');
        if (facts.crossOriginFrames) rec.warnings.push('cross-origin-frame-untested');
        if (facts.shadowHosts) rec.warnings.push('shadow-root-coverage-needed');
        rec.candidates.push(...P.sensoryCandidates(spec.file, facts.textRecords));
        rec.candidates.push(...P.metaEvidence(spec.file, facts));

        const seq = sequence.get(spec.file);
        if (seq) for (const row of seq.ledger) {
          const barrier = row.disposition === 'PROVISIONAL' && !row.cleared;
          rec.candidates.push(P.candidate({
            page: spec.file, sc: '1.3.2', kind: 'meaningful-sequence', xpath: row.xpath,
            status: barrier ? 'barrier' : row.cleared ? 'clear' : 'partial', detected: barrier,
            evidence: { reusedFrom: path.relative(ROOT, REUSE_SEQUENCE), signalCount: seq.signalCount, disposition: row.disposition, outcome: row.provisional && row.provisional.outcome },
          }));
        }

        rec.probes.reflow = await onFreshPage(pageUrl, 'reflow', (page) => RUNNERS['reflow-overflow-probe'](page, experimentRequest(spec.file, '1.4.10', '/html/body', 'reflow')));
        const reflow = P.reflowStatus(rec.probes.reflow);
        rec.candidates.push(P.candidate({ page: spec.file, sc: '1.4.10', kind: 'reflow-320', xpath: '/page-level::reflow', ...reflow, evidence: { outcome: rec.probes.reflow.outcome, measurement: rec.probes.reflow.measurement } }));

        rec.probes.textSpacing = await onFreshPage(pageUrl, 'text-spacing', probeTextSpacing);
        for (const row of rec.probes.textSpacing.candidates || []) rec.candidates.push(P.candidate({ page: spec.file, sc: '1.4.12', kind: 'text-spacing-override', xpath: row.path, evidence: row }));
        rec.probes.spacingImportant = await onFreshPage(pageUrl, 'spacing-important', async (page) => {
          const out = [];
          for (const xpath of facts.spacingImportantXpaths.slice(0, MAX_DYNAMIC_SUBJECTS)) out.push(await RUNNERS['text-spacing-adequate'](page, experimentRequest(spec.file, '1.4.12', xpath, `spacing-${out.length}`)));
          return out;
        });
        for (const result of rec.probes.spacingImportant) rec.candidates.push(P.candidate({ page: spec.file, sc: '1.4.12', kind: 'important-spacing-lock', xpath: result.targetXpath, ...P.staticExperimentStatus(result), evidence: { outcome: result.outcome, measurement: result.measurement } }));

        rec.probes.resizeText = await onFreshPage(pageUrl, 'resize-text', probeResizeText);
        for (const row of rec.probes.resizeText.candidates || []) rec.candidates.push(P.candidate({ page: spec.file, sc: '1.4.4', kind: 'resize-text-200', xpath: row.path, evidence: row }));
        rec.probes.zoomClip = await onFreshPage(pageUrl, 'zoom-clip', async (page) => {
          const out = [];
          for (const xpath of facts.zoomClipXpaths.slice(0, MAX_DYNAMIC_SUBJECTS)) out.push(await RUNNERS['zoom-clip-probe'](page, experimentRequest(spec.file, '1.4.4', xpath, `zoom-${out.length}`)));
          return out;
        });
        for (const result of rec.probes.zoomClip) {
          if (result.outcome && result.outcome.zoomClipApplicable) rec.candidates.push(P.candidate({ page: spec.file, sc: '1.4.4', kind: 'zoom-clip-640', xpath: result.targetXpath, ...P.staticExperimentStatus(result), evidence: { outcome: result.outcome, measurement: result.measurement } }));
        }

        rec.probes.bypass = await onFreshPage(pageUrl, 'bypass', (page) => RUNNERS['bypass-blocks'](page, experimentRequest(spec.file, '2.4.1', '/html/body', 'bypass')));
        if (rec.probes.bypass.outcome && rec.probes.bypass.outcome.bypassApplicable) rec.candidates.push(P.candidate({ page: spec.file, sc: '2.4.1', kind: 'bypass-blocks', xpath: '/page-level::bypass-blocks', ...P.staticExperimentStatus(rec.probes.bypass), evidence: { outcome: rec.probes.bypass.outcome, measurement: rec.probes.bypass.measurement } }));

        rec.probes.contextChanges = await onFreshPage(pageUrl, 'context-change', probeContextChanges);
        for (const row of rec.probes.contextChanges.candidates || []) for (const sc of ['2.2.4', '3.2.5']) rec.candidates.push(P.candidate({ page: spec.file, sc, kind: 'automatic-context-change', xpath: row.path, evidence: row }));
      } catch (error) {
        const message = String(error && error.stack || error);
        rec.error = message;
        tel.errors.push({ file: spec.file, error: message.split('\n')[0] });
      }
      rec.elapsedMs = Date.now() - started;
      results.push(rec);
      fs.writeFileSync(path.join(OUT, 'pages', `${safe(spec.file)}.json`), JSON.stringify(rec, null, 2));
      fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));
      tel.done = results.length; persist();
    }
  };

  await Promise.all(Array.from({ length: Math.min(PAGE_CONC, specs.length || 1) }, (_, index) => worker(`w${index + 1}`, index)));
  clearInterval(timer); tel.tabs = pool.stats(); await pool.close();
  results.sort((a, b) => a.file.localeCompare(b.file));
  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));
  const aggregate = P.summarize(results);
  const summary = { pages: results.length, errors: results.filter((row) => row.error).length, ...aggregate, targets: P.TARGET_SCS, tabs: tel.tabs, elapsedMs: Date.now() - tel.startedAt };
  fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 2));
  manifest.finishedAt = new Date().toISOString(); manifest.summary = summary;
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
  tel.phase = 'done'; persist();
  console.log(JSON.stringify(summary, null, 2));
}

if (require.main === module) main().catch((error) => { console.error(error && error.stack || error); process.exit(1); });

module.exports = { collectFullPageFacts, loadSpecs, loadSequenceEvidence };
