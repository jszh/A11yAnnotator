'use strict';
// Normalized multi-engine accessibility-checker comparison runner.
// Runs axe-core, IBM Equal Access, QualWeb (W3C ACT-Rules), HTML_CodeSniffer, and Alfa over the same
// DOMs and emits one normalized finding stream per fixture:
//   { tool, ruleId, sc:[..], outcome:'violation'|'review', impact, target, message }
// Outputs: ./evidence/<fixture>.json + combined.json. See README.md for what each engine is and how
// to read the results. Engines are installed via this folder's package.json (npm install here first).
//
// Env: CHROME_PATH overrides the Chrome executable (default = macOS Google Chrome).
const fs = require('fs');
const path = require('path');
const http = require('http');
const puppeteer = require('puppeteer');

const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const REPO = path.resolve(__dirname, '..', '..');         // repo root (this folder is eval/checker-comparison/)
const OUT = path.join(__dirname, 'evidence');
fs.mkdirSync(OUT, { recursive: true });

const AXE = require.resolve('axe-core/axe.min.js');
const HTMLCS = require.resolve('html_codesniffer/build/HTMLCS.js');

// Known-ground-truth v3 fixtures (each element self-documents CLEAR/BARRIER/INCONCLUSIVE) + 2 real pages.
const FIXTURES = process.argv.slice(2).length ? process.argv.slice(2) : [
  'fx-v3-c3-contrast.html', 'fx-v3-c3-adversarial.html', 'fx-v3-c6-fields.html',
  'fx-v3-c6b-formerror.html', 'fx-v3-c1-ax.html', 'fx-v3-c4-keyboard.html',
  'fx-v3-c5-trap.html', 'fx-v3-c5-modal.html', 'fx-v3-c7-consent.html',
  'fx-v3-c8-overflow.html', 'fx-v3-c9-autohide.html', 'fx-v3-focus.html',
  'fx-v3-status-4-1-3.html', 'fx-v3-vsr-semantic.html', 'fx-v3-adv-unlabeled-select.html',
  'Amazon Sign-In.htm', 'BuzzFeed.htm',
];

// QualWeb (and realism) need HTTP, not file:// — serve assets/saved over a tiny static server.
const SAVED = path.join(REPO, 'assets', 'saved');
const MIME = { '.html': 'text/html', '.htm': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff': 'font/woff', '.woff2': 'font/woff2', '.json': 'application/json' };
function startServer() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      try {
        const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '');
        const fp = path.join(SAVED, rel);
        if (!fp.startsWith(SAVED) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { res.writeHead(404); return res.end('nf'); }
        res.writeHead(200, { 'content-type': MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream' });
        fs.createReadStream(fp).pipe(res);
      } catch (e) { res.writeHead(500); res.end('err'); }
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}
let PORT = 0;
const httpUrl = (name) => `http://127.0.0.1:${PORT}/` + encodeURIComponent(name);

// ---- SC extractors ----
const scFromAxeTags = (tags) => [...new Set((tags || []).map((t) => { const m = /^wcag(\d)(\d)(\d+)$/.exec(t); return m ? `${m[1]}.${m[2]}.${m[3]}` : null; }).filter(Boolean))];
const scFromHtmlcsCode = (code) => { const m = /Guideline\d_\d\.(\d+)_(\d+)_(\d+)/.exec(code || ''); return m ? [`${m[1]}.${m[2]}.${m[3]}`] : []; };
const scFromQualweb = (sc) => (sc || []).map((s) => s.name).filter(Boolean);

async function runAxe(page) {
  await page.addScriptTag({ path: AXE });
  const r = await page.evaluate(async () => await window.axe.run(document, { resultTypes: ['violations', 'incomplete'], reporter: 'v2' }));
  const out = [];
  for (const v of r.violations) for (const n of v.nodes) out.push({ tool: 'axe', ruleId: v.id, sc: scFromAxeTags(v.tags), outcome: 'violation', impact: v.impact, target: (n.target || []).join(' '), message: v.help });
  for (const v of r.incomplete) for (const n of v.nodes) out.push({ tool: 'axe', ruleId: v.id, sc: scFromAxeTags(v.tags), outcome: 'review', impact: v.impact, target: (n.target || []).join(' '), message: v.help });
  return out;
}

async function runHtmlcs(page) {
  await page.addScriptTag({ path: HTMLCS });
  const msgs = await page.evaluate(() => new Promise((resolve) => {
    window.HTMLCS.process('WCAG2AA', window.document, () => {
      resolve(window.HTMLCS.getMessages().map((m) => ({ code: m.code, type: m.type, msg: m.msg, tag: (m.element && m.element.tagName) || null })));
    });
  }));
  return msgs.map((m) => ({ tool: 'htmlcs', ruleId: (m.code || '').split('.').pop(), sc: scFromHtmlcsCode(m.code), outcome: ({ 1: 'violation', 2: 'review', 3: 'review' })[m.type] || 'review', impact: m.type === 1 ? 'error' : 'warning', target: m.tag, message: m.msg, raw: m.code }));
}

async function runIbm(page, label) {
  const checker = require('accessibility-checker');
  const res = await checker.getCompliance(page, label);
  const items = (res && res.report && res.report.results) || [];
  // IBM `value` = [category, level]: category ∈ {VIOLATION,RECOMMENDATION,INFORMATION}, level ∈ {PASS,FAIL,POTENTIAL,MANUAL}.
  // A decided VIOLATION is ONLY category===VIOLATION && level===FAIL. Everything else (POTENTIAL/MANUAL =
  // needs-human-review, RECOMMENDATION = best practice) is 'review' — NOT a violation. (Keying on
  // category alone, as an earlier version did, mislabeled every POTENTIAL/MANUAL flag as a violation.)
  const ibmOutcome = (v) => (v && v[0] === 'VIOLATION' && v[1] === 'FAIL') ? 'violation' : 'review';
  let rule2sc = {};
  try {
    const rs = (await checker.getRulesets()).find((r) => /IBM_Accessibility/i.test(r.id)) || (await checker.getRulesets())[0];
    for (const cp of (rs && rs.checkpoints) || []) { const sc = (cp.num || '').match(/^\d\.\d+\.\d+/); for (const ru of cp.rules || []) if (sc) (rule2sc[ru.id] = rule2sc[ru.id] || []).push(sc[0]); }
  } catch (e) {}
  return items.filter((it) => it.value && it.value[1] !== 'PASS').map((it) => ({
    tool: 'ibm', ruleId: it.ruleId, sc: [...new Set(rule2sc[it.ruleId] || [])],
    outcome: ibmOutcome(it.value), level: it.value && it.value[1],
    impact: it.value && it.value[0], target: (it.path && (it.path.dom || it.path.aria)) || null, message: it.message, raw: it.reasonId,
  }));
}

async function runQualweb(url, label) {
  const { QualWeb } = require('@qualweb/core');
  const { ACTRules } = require('@qualweb/act-rules');
  const { WCAGTechniques } = require('@qualweb/wcag-techniques');
  const q = new QualWeb({});
  await q.start({ maxConcurrency: 1, timeout: 60000 }, { headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'], executablePath: CHROME });
  try {
    const ev = await q.evaluate({ url, modules: [new ACTRules({}), new WCAGTechniques({})] });
    const rep = ev[url] || Object.values(ev)[0];
    const out = [];
    for (const modName of ['act-rules', 'wcag-techniques']) {
      const mod = rep && rep.modules && rep.modules[modName];
      for (const [code, a] of Object.entries((mod && mod.assertions) || {})) {
        const oc = a.metadata && a.metadata.outcome; // passed|failed|warning|inapplicable
        if (oc !== 'failed' && oc !== 'warning') continue;
        out.push({ tool: 'qualweb', ruleId: code, sc: scFromQualweb(a.metadata['success-criteria']), outcome: oc === 'failed' ? 'violation' : 'review', impact: oc, target: ((a.results || []).flatMap((r) => (r.elements || []).map((e) => e.pointer || e.htmlCode)) || [])[0] || null, message: a.metadata.description || a.name, raw: modName });
      }
    }
    return out;
  } finally { await q.stop(); }
}

// rule uri -> [SC chapters], built once from the alfa-rules requirements (.chapter holds e.g. "1.4.3").
let ALFA_SC = null;
function alfaScMap() {
  if (ALFA_SC) return ALFA_SC;
  ALFA_SC = {};
  const rules = require('@siteimprove/alfa-rules').default;
  for (const r of (Array.isArray(rules) ? rules : [...rules])) {
    const sc = [];
    for (const q of (r.requirements ? [...r.requirements] : [])) { const j = q.toJSON ? q.toJSON() : q; if (j.type === 'criterion' && /^\d\.\d+\.\d+$/.test(j.chapter || '')) sc.push(j.chapter); }
    ALFA_SC[r.uri] = [...new Set(sc)];
  }
  return ALFA_SC;
}
async function runAlfa(page) {
  try {
    const { Puppeteer } = require('@siteimprove/alfa-puppeteer');
    const rules = require('@siteimprove/alfa-rules').default;
    const { Audit } = require('@siteimprove/alfa-act');
    const scMap = alfaScMap();
    const handle = await page.evaluateHandle(() => window.document);
    const alfaPage = await Puppeteer.toPage(handle);
    let outcomes = await Audit.of(alfaPage, rules).evaluate();
    if (outcomes && typeof outcomes.get === 'function') outcomes = outcomes.get();
    const arr = Array.isArray(outcomes) ? outcomes : [...outcomes];
    const out = [];
    for (const o of arr) {
      const j = typeof o.toJSON === 'function' ? o.toJSON() : o;
      const verdict = j.outcome || (o.outcome && String(o.outcome));
      if (verdict !== 'failed' && verdict !== 'cantTell') continue;
      const ruleUri = (j.rule && (j.rule.uri || j.rule.id)) || '';
      out.push({ tool: 'alfa', ruleId: ruleUri.split('/').pop(), sc: scMap[ruleUri] || [], outcome: verdict === 'failed' ? 'violation' : 'review', impact: verdict, target: (j.target && (j.target.path || j.target.name)) || (typeof j.target === 'string' ? j.target : null), message: ruleUri, raw: ruleUri });
    }
    return out;
  } catch (e) { return [{ tool: 'alfa', _error: String(e && e.message || e) }]; }
}

(async () => {
  const srv = await startServer();
  PORT = srv.address().port;
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const combined = {};
  for (const fx of FIXTURES) {
    const url = httpUrl(fx);
    const rec = { fixture: fx, url, byTool: {}, errors: {} };
    const page = await browser.newPage();
    try {
      await page.goto(url, { waitUntil: 'load', timeout: 30000 });
      await new Promise((r) => setTimeout(r, 300));
      for (const [name, fn] of [['axe', () => runAxe(page)], ['htmlcs', () => runHtmlcs(page)], ['ibm', () => runIbm(page, fx)], ['alfa', () => runAlfa(page)]]) {
        try { rec.byTool[name] = await fn(); } catch (e) { rec.byTool[name] = []; rec.errors[name] = String(e && e.message || e); }
      }
    } catch (e) { rec.errors.page = String(e && e.message || e); }
    await page.close();
    try { rec.byTool.qualweb = await runQualweb(url, fx); } catch (e) { rec.byTool.qualweb = []; rec.errors.qualweb = String(e && e.message || e); }
    const counts = Object.fromEntries(Object.entries(rec.byTool).map(([k, v]) => [k, (v || []).filter((x) => !x._error).length]));
    rec.counts = counts;
    fs.writeFileSync(path.join(OUT, fx.replace(/[^\w.-]/g, '_') + '.json'), JSON.stringify(rec, null, 2));
    combined[fx] = { counts, errors: rec.errors };
    console.log(fx, JSON.stringify(counts), Object.keys(rec.errors).length ? 'ERR:' + Object.keys(rec.errors).join(',') : '');
  }
  await browser.close();
  srv.close();
  fs.writeFileSync(path.join(OUT, 'combined.json'), JSON.stringify(combined, null, 2));
  console.log('DONE -> ' + OUT);
})();
