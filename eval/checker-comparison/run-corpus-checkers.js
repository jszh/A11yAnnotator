'use strict';
// The off-the-shelf checkers (axe, IBM Equal Access, HTML_CodeSniffer, Alfa, QualWeb) as baselines on InterA11y's
// evaluation sets: the validated test split (ACT + the 585 human-annotated cases) and the expert-study pages.
// Each page is loaded as InterA11y loads it (its session: label-free copies, viewport, settle, lazy images made
// eager), so every system sees the same page. Every finding keeps its element as an InterA11y XPath, so expert
// cases can be matched to the element as InterA11y's findings are (intera11y/eval/score.js).
//
// axe, IBM, HTML_CodeSniffer and Alfa run in the loaded page. QualWeb launches its own browser and needs http
// (file:// renders blank), so label-free copies are served from a local static server rooted at the repository;
// its findings' CSS pointers are resolved to XPaths in the loaded page.
//
//   node eval/checker-comparison/run-corpus-checkers.js --set=test|expert --out=<file.jsonl> [--shard=i/n] [--limit=N]
//     [--intera11y=<dir>]   InterA11y code directory (default intera11y/)
// Writes one JSON line per case (test) or page (expert); a rerun skips ids already in the file.
const fs = require('fs');
const path = require('path');
const http = require('http');

const arg = (n, d = null) => { const p = process.argv.find((x) => x.startsWith(`--${n}=`)); return p ? p.slice(n.length + 3) : d; };
const ROOT = path.join(__dirname, '..', '..');
const IA = path.resolve(ROOT, arg('intera11y', 'intera11y'));
const { CONFIG } = require(path.join(IA, 'src/core/config.js'));
const { launchBrowser, openSession, loadLazyContent } = require(path.join(IA, 'src/core/session.js'));
const { validated, CORPORA } = require(path.join(IA, 'eval/corpora.js'));

const SET = arg('set', 'test');
const OUT = path.resolve(arg('out', `results/checkers-${SET}.jsonl`));
const [SHARD, NSHARD] = (arg('shard', '0/1')).split('/').map(Number);
const LIMIT = Number(arg('limit', 0));
const TOOLS = String(arg('tools', 'axe,ibm,htmlcs,alfa,qualweb')).split(',');

const AXE = require.resolve('axe-core/axe.min.js');
const HTMLCS = require.resolve('html_codesniffer/build/HTMLCS.js');
const scFromAxeTags = (tags) => [...new Set((tags || []).map((t) => { const m = /^wcag(\d)(\d)(\d+)$/.exec(t); return m ? `${m[1]}.${m[2]}.${m[3]}` : null; }).filter(Boolean))];
const scFromHtmlcsCode = (code) => { const m = /Guideline\d_\d\.(\d+)_(\d+)_(\d+)/.exec(code || ''); return m ? [`${m[1]}.${m[2]}.${m[3]}`] : []; };
const scFromQualweb = (sc) => (sc || []).map((s) => s.name).filter(Boolean);

// an XPath (IBM's and Alfa's) → InterA11y's XPath of the same element, or null
const xpathViaEvaluate = (page, xps) => page.evaluate((list) => list.map((xp) => {
  try { const el = document.evaluate(xp, document, null, 9, null).singleNodeValue; return el && el.nodeType === 1 ? window.__ia.xpathOf(el) : null; } catch (e) { return null; }
}), xps);

async function runAxe(page) {
  await page.addScriptTag({ path: AXE });
  return page.evaluate(async () => {
    const r = await window.axe.run(document, { resultTypes: ['violations', 'incomplete'], elementRef: true });
    const out = [];
    for (const [kind, list] of [['violation', r.violations], ['review', r.incomplete]]) for (const v of list || []) for (const n of v.nodes || []) {
      out.push({ ruleId: v.id, tags: v.tags, outcome: kind, xpath: n.element && n.element.nodeType === 1 ? window.__ia.xpathOf(n.element) : null });
    }
    return out;
  }).then((rows) => rows.map((x) => ({ ruleId: x.ruleId, sc: scFromAxeTags(x.tags), outcome: x.outcome, xpath: x.xpath })));
}

async function runHtmlcs(page) {
  await page.addScriptTag({ path: HTMLCS });
  const msgs = await page.evaluate(() => new Promise((resolve) => {
    window.HTMLCS.process('WCAG2AA', window.document, () => {
      resolve(window.HTMLCS.getMessages().map((m) => ({ code: m.code, type: m.type, xpath: m.element && m.element.nodeType === 1 ? window.__ia.xpathOf(m.element) : null })));
    });
  }));
  return msgs.map((m) => ({ ruleId: (m.code || '').split('.').pop(), code: m.code, sc: scFromHtmlcsCode(m.code), outcome: ({ 1: 'violation', 2: 'review', 3: 'review' })[m.type] || 'review', xpath: m.xpath }));
}

let IBM_RULE2SC = null;
async function runIbm(page, label) {
  const checker = require('accessibility-checker');
  if (!IBM_RULE2SC) {
    IBM_RULE2SC = {};
    const sets = await checker.getRulesets();
    const rs = sets.find((r) => /IBM_Accessibility/i.test(r.id)) || sets[0];
    for (const cp of (rs && rs.checkpoints) || []) {
      const m = String(cp.num || '').match(/^\d\.\d+\.\d+/);
      if (m) for (const ru of cp.rules || []) (IBM_RULE2SC[ru.id] = IBM_RULE2SC[ru.id] || []).push(m[0]);
    }
  }
  const res = await checker.getCompliance(page, label);
  const items = ((res && res.report && res.report.results) || []).filter((it) => it.value && it.value[1] !== 'PASS');
  const xps = await xpathViaEvaluate(page, items.map((it) => (it.path && it.path.dom) || ''));
  return items.map((it, i) => ({ ruleId: it.ruleId, sc: [...new Set(IBM_RULE2SC[it.ruleId] || [])], outcome: it.value[0] === 'VIOLATION' && it.value[1] === 'FAIL' ? 'violation' : 'review', level: it.value.join('/'), xpath: xps[i] }));
}

let ALFA_SC = null;
async function runAlfa(page) {
  const { Puppeteer } = require('@siteimprove/alfa-puppeteer');
  const rules = require('@siteimprove/alfa-rules').default;
  const { Audit } = require('@siteimprove/alfa-act');
  if (!ALFA_SC) {
    ALFA_SC = {};
    for (const r of (Array.isArray(rules) ? rules : [...rules])) {
      const sc = [];
      for (const q of (r.requirements ? [...r.requirements] : [])) { const j = q.toJSON ? q.toJSON() : q; if (j.type === 'criterion' && /^\d\.\d+\.\d+$/.test(j.chapter || '')) sc.push(j.chapter); }
      ALFA_SC[r.uri] = [...new Set(sc)];
    }
  }
  const handle = await page.evaluateHandle(() => window.document);
  const alfaPage = await Puppeteer.toPage(handle);
  let outcomes = await Audit.of(alfaPage, rules).evaluate();
  if (outcomes && typeof outcomes.get === 'function') outcomes = outcomes.get();
  const rows = [];
  for (const o of (Array.isArray(outcomes) ? outcomes : [...outcomes])) {
    const j = typeof o.toJSON === 'function' ? o.toJSON() : o;
    const verdict = j.outcome || (o.outcome && String(o.outcome));
    if (verdict !== 'failed' && verdict !== 'cantTell') continue;
    const uri = (j.rule && (j.rule.uri || j.rule.id)) || '';
    // the target is an Alfa node: its path() is an XPath (/html[1]/body[1]/…); a non-element target has none
    let p = null;
    try { p = o.target && typeof o.target.path === 'function' ? String(o.target.path()) : null; } catch (e) { p = null; }
    rows.push({ ruleId: uri.split('/').pop(), sc: ALFA_SC[uri] || [], outcome: verdict === 'failed' ? 'violation' : 'review', path: p });
  }
  // an attribute or text target (…/@role, …/text()[1]) belongs to its element; "/" is the document
  const xps = await xpathViaEvaluate(page, rows.map((r) => (r.path || '').replace(/\/(@[^/]+|text\(\)(\[\d+\])?)$/, '')));
  return rows.map((r, i) => ({ ruleId: r.ruleId, sc: r.sc, outcome: r.outcome, xpath: xps[i], path: xps[i] ? undefined : r.path }));
}

let QW = null;
async function startQw() {
  const { QualWeb } = require('@qualweb/core');
  QW = new QualWeb({});
  await QW.start({ maxConcurrency: 1, timeout: 120000 }, { headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'], executablePath: CONFIG.chromePath });
}
async function runQualweb(page, url) {
  const { ACTRules } = require('@qualweb/act-rules');
  const { WCAGTechniques } = require('@qualweb/wcag-techniques');
  const ev = await QW.evaluate({ url, viewport: { mobile: false, landscape: true, resolution: { width: CONFIG.viewport.width, height: CONFIG.viewport.height } }, modules: [new ACTRules({}), new WCAGTechniques({})] });
  const rep = ev[url] || Object.values(ev)[0];
  const rows = [];
  for (const mod of ['act-rules', 'wcag-techniques']) {
    for (const [code, a] of Object.entries((rep && rep.modules && rep.modules[mod] && rep.modules[mod].assertions) || {})) {
      const sc = scFromQualweb(a.metadata && a.metadata['success-criteria']);
      for (const r of a.results || []) {
        if (r.verdict !== 'failed' && r.verdict !== 'warning') continue;
        const els = (r.elements && r.elements.length) ? r.elements : [{}];
        for (const e of els) rows.push({ ruleId: code, sc, outcome: r.verdict === 'failed' ? 'violation' : 'review', pointer: e.pointer || null });
      }
    }
  }
  const xps = await page.evaluate((ps) => ps.map((p) => { if (!p) return null; try { const el = document.querySelector(p); return el ? window.__ia.xpathOf(el) : null; } catch (e) { return null; } }), rows.map((r) => r.pointer));
  return rows.map((r, i) => ({ ruleId: r.ruleId, sc: r.sc, outcome: r.outcome, xpath: xps[i], pointer: xps[i] ? undefined : r.pointer }));
}

// static server for QualWeb: file:// urls under the repository → http
let HTTP_BASE = null;
async function startServer() {
  const server = http.createServer((req, res) => {
    const p = path.normalize(path.join(ROOT, decodeURIComponent(req.url.split('?')[0])));
    if (!p.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
    fs.readFile(p, (e, buf) => {
      if (e) { res.writeHead(404); res.end(); return; }
      const ext = path.extname(p).toLowerCase();
      const type = { '.html': 'text/html; charset=utf-8', '.htm': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.gif': 'image/gif', '.json': 'application/json' }[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': type }); res.end(buf);
    });
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  HTTP_BASE = `http://127.0.0.1:${server.address().port}`;
  return server;
}
const httpUrl = (url) => (url.startsWith('file://') ? HTTP_BASE + encodeURI(decodeURIComponent(new URL(url).pathname).slice(ROOT.length)) : url);

(async () => {
  let cases = SET === 'expert' ? CORPORA['expert-annotated']() : validated('test');
  cases = cases.filter((c, i) => i % NSHARD === SHARD);
  if (LIMIT) cases = cases.slice(0, LIMIT);
  const done = new Set(fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l).id) : []);
  const server = TOOLS.includes('qualweb') ? await startServer() : null;
  if (TOOLS.includes('qualweb')) await startQw();
  let browser = await launchBrowser();
  let n = 0;
  for (const c of cases) {
    if (done.has(c.id)) continue;
    const rec = { id: c.id, scs: c.scs, expected: c.expected, file: c.meta && c.meta.file, tools: {}, errors: {}, ms: {} };
    let s = null;
    try {
      s = await openSession(browser, c.url);
      await loadLazyContent(s.page);
      for (const t of TOOLS) {
        const t0 = Date.now();
        try {
          rec.tools[t] = t === 'axe' ? await runAxe(s.page) : t === 'htmlcs' ? await runHtmlcs(s.page) : t === 'ibm' ? await runIbm(s.page, `case-${SHARD}-${n}`)
            : t === 'alfa' ? await runAlfa(s.page) : await runQualweb(s.page, httpUrl(c.url));
        } catch (e) {
          rec.errors[t] = String((e && e.message) || e).slice(0, 300);
          if (t === 'qualweb') { await QW.stop().catch(() => {}); await startQw().catch(() => {}); }
        }
        rec.ms[t] = Date.now() - t0;
      }
    } catch (e) {
      rec.error = String((e && e.message) || e).slice(0, 300);
      await browser.close().catch(() => {}); browser = await launchBrowser();
    } finally { if (s) await s.close().catch(() => {}); }
    fs.appendFileSync(OUT, JSON.stringify(rec) + '\n');
    n++;
    if (QW && n % 50 === 0) { await QW.stop().catch(() => {}); await startQw(); }
    console.error(`[${SHARD}/${NSHARD}] ${n} ${c.id} ${rec.error ? 'ERROR ' + rec.error : Object.keys(rec.errors).length ? 'tool errors: ' + Object.keys(rec.errors).join(',') : 'ok'}`);
  }
  await browser.close().catch(() => {});
  if (QW) await QW.stop().catch(() => {});
  if (server) server.close();
  try { await require('accessibility-checker').close(); } catch (e) {}
  console.error(`[${SHARD}/${NSHARD}] done ${n}`);
  process.exit(0);
})();
