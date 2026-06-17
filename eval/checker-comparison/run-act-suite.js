'use strict';
// Cross-checker pilot over W3C ACT rule test cases.
//
// Why ACT first? Vendor suites are useful, but often encode that vendor's own rule semantics.
// ACT fixtures are closer to a shared, cross-tool target: each testcase has an expected
// passed/failed/inapplicable outcome and WCAG requirement mapping.
//
// Usage:
//   node run-act-suite.js --limit=120
//   node run-act-suite.js --rule=73f2c2 --limit=40
//   node run-act-suite.js --stratified --limit=120
//   node run-act-suite.js --tools=axe,ibm,htmlcs,alfa,qualweb --limit=20
//
// Outputs:
//   upstream-evidence/act-pilot/raw.json
//   upstream-evidence/act-pilot/summary.json

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ROOT = path.resolve(__dirname, '..', '..');
const ACT_JSON = process.env.ACT_TESTCASES_JSON
  || '/private/tmp/a11y-checker-upstream/qualweb-act-rules/test/fixtures/testcases.json';
const OUT = path.join(__dirname, 'upstream-evidence', 'act-pilot');
fs.mkdirSync(OUT, { recursive: true });

const AXE = require.resolve('axe-core/axe.min.js');
const HTMLCS = require.resolve('html_codesniffer/build/HTMLCS.js');

function arg(name, def = null) {
  const p = process.argv.find((x) => x === `--${name}` || x.startsWith(`--${name}=`));
  if (!p) return def;
  if (p === `--${name}`) return true;
  return p.slice(name.length + 3);
}

const LIMIT = Number(arg('limit', process.env.ACT_LIMIT || 80));
const RULE = arg('rule', process.env.ACT_RULE || null);
const SC = arg('sc', process.env.ACT_SC || null);
const STRATIFIED = !!arg('stratified', process.env.ACT_STRATIFIED === '1' ? true : null);
const TOOLS = String(arg('tools', process.env.ACT_TOOLS || 'axe,ibm,htmlcs,alfa,qualweb'))
  .split(',').map((s) => s.trim()).filter(Boolean);

const scFromAxeTags = (tags) => [...new Set((tags || []).map((t) => {
  const m = /^wcag(\d)(\d)(\d+)$/.exec(t);
  return m ? `${m[1]}.${m[2]}.${m[3]}` : null;
}).filter(Boolean))];
const scFromHtmlcsCode = (code) => {
  const m = /Guideline\d_\d\.(\d+)_(\d+)_(\d+)/.exec(code || '');
  return m ? [`${m[1]}.${m[2]}.${m[3]}`] : [];
};
const scFromQualweb = (sc) => (sc || []).map((s) => s.name).filter(Boolean);

function scsFromAct(tc) {
  const req = tc.ruleAccessibilityRequirements || {};
  const out = [];
  for (const k of Object.keys(req)) {
    const m = /wcag\d+:(\d+\.\d+\.\d+)/.exec(k);
    if (m && req[k] && req[k].forConformance) out.push(m[1]);
  }
  return [...new Set(out)];
}

async function runAxe(page) {
  await page.addScriptTag({ path: AXE });
  const r = await page.evaluate(async () => await window.axe.run(document, {
    resultTypes: ['violations', 'incomplete'],
    reporter: 'v2',
  }));
  const out = [];
  for (const v of r.violations || []) for (const n of v.nodes || []) {
    out.push({ tool: 'axe', ruleId: v.id, sc: scFromAxeTags(v.tags), outcome: 'violation', target: (n.target || []).join(' '), message: v.help });
  }
  for (const v of r.incomplete || []) for (const n of v.nodes || []) {
    out.push({ tool: 'axe', ruleId: v.id, sc: scFromAxeTags(v.tags), outcome: 'review', target: (n.target || []).join(' '), message: v.help });
  }
  return out;
}

async function runHtmlcs(page) {
  await page.addScriptTag({ path: HTMLCS });
  const msgs = await page.evaluate(() => new Promise((resolve) => {
    window.HTMLCS.process('WCAG2AA', window.document, () => {
      resolve(window.HTMLCS.getMessages().map((m) => ({
        code: m.code,
        type: m.type,
        msg: m.msg,
        tag: (m.element && m.element.tagName) || null,
      })));
    });
  }));
  return msgs.map((m) => ({
    tool: 'htmlcs',
    ruleId: (m.code || '').split('.').pop(),
    sc: scFromHtmlcsCode(m.code),
    outcome: ({ 1: 'violation', 2: 'review', 3: 'review' })[m.type] || 'review',
    target: m.tag,
    message: m.msg,
    raw: m.code,
  }));
}

let IBM_RULE2SC = null;
async function ibmRuleMap(checker) {
  if (IBM_RULE2SC) return IBM_RULE2SC;
  IBM_RULE2SC = {};
  try {
    const sets = await checker.getRulesets();
    const rs = sets.find((r) => /IBM_Accessibility/i.test(r.id)) || sets[0];
    for (const cp of (rs && rs.checkpoints) || []) {
      const m = String(cp.num || '').match(/^\d\.\d+\.\d+/);
      if (!m) continue;
      for (const ru of cp.rules || []) (IBM_RULE2SC[ru.id] = IBM_RULE2SC[ru.id] || []).push(m[0]);
    }
  } catch (e) {}
  return IBM_RULE2SC;
}

async function runIbm(page, label) {
  const checker = require('accessibility-checker');
  const rule2sc = await ibmRuleMap(checker);
  const res = await checker.getCompliance(page, label);
  const items = (res && res.report && res.report.results) || [];
  const ibmOutcome = (v) => (v && v[0] === 'VIOLATION' && v[1] === 'FAIL') ? 'violation' : 'review';
  return items.filter((it) => it.value && it.value[1] !== 'PASS').map((it) => ({
    tool: 'ibm',
    ruleId: it.ruleId,
    sc: [...new Set(rule2sc[it.ruleId] || [])],
    outcome: ibmOutcome(it.value),
    level: it.value && it.value[1],
    target: (it.path && (it.path.dom || it.path.aria)) || null,
    message: it.message,
    raw: it.reasonId,
  }));
}

let ALFA_SC = null;
function alfaScMap() {
  if (ALFA_SC) return ALFA_SC;
  ALFA_SC = {};
  const rules = require('@siteimprove/alfa-rules').default;
  for (const r of (Array.isArray(rules) ? rules : [...rules])) {
    const sc = [];
    for (const q of (r.requirements ? [...r.requirements] : [])) {
      const j = q.toJSON ? q.toJSON() : q;
      if (j.type === 'criterion' && /^\d\.\d+\.\d+$/.test(j.chapter || '')) sc.push(j.chapter);
    }
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
    const out = [];
    for (const o of (Array.isArray(outcomes) ? outcomes : [...outcomes])) {
      const j = typeof o.toJSON === 'function' ? o.toJSON() : o;
      const verdict = j.outcome || (o.outcome && String(o.outcome));
      if (verdict !== 'failed' && verdict !== 'cantTell') continue;
      const ruleUri = (j.rule && (j.rule.uri || j.rule.id)) || '';
      out.push({ tool: 'alfa', ruleId: ruleUri.split('/').pop(), sc: scMap[ruleUri] || [], outcome: verdict === 'failed' ? 'violation' : 'review', target: (j.target && (j.target.path || j.target.name)) || null, message: ruleUri });
    }
    return out;
  } catch (e) {
    return [{ tool: 'alfa', _error: String(e && e.message || e) }];
  }
}

async function runQualweb(url) {
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
        const oc = a.metadata && a.metadata.outcome;
        if (oc !== 'failed' && oc !== 'warning') continue;
        out.push({
          tool: 'qualweb',
          ruleId: code,
          sc: scFromQualweb(a.metadata['success-criteria']),
          outcome: oc === 'failed' ? 'violation' : 'review',
          target: ((a.results || []).flatMap((r) => (r.elements || []).map((e) => e.pointer || e.htmlCode)) || [])[0] || null,
          message: a.metadata.description || a.name,
          raw: modName,
        });
      }
    }
    return out;
  } finally {
    await q.stop();
  }
}

function relevantFindings(items, scs) {
  const set = new Set(scs);
  return (items || []).filter((it) => !it._error && (it.sc || []).some((sc) => set.has(sc)));
}

function scoreOne(expected, findings) {
  const hard = findings.some((f) => f.outcome === 'violation');
  const review = findings.some((f) => f.outcome === 'review');
  if (expected === 'failed') {
    if (hard) return 'tp';
    if (review) return 'reviewOnlyMiss';
    return 'fn';
  }
  if (hard) return 'fp';
  if (review) return 'tnWithReview';
  return 'tn';
}

function summarize(raw) {
  const summary = { generatedAt: new Date().toISOString(), n: raw.length, tools: {}, bySc: {}, mismatchReview: [] };
  for (const tool of TOOLS) summary.tools[tool] = { tp: 0, fn: 0, fp: 0, tn: 0, tnWithReview: 0, reviewOnlyMiss: 0, error: 0, total: 0 };
  for (const rec of raw) {
    for (const tool of TOOLS) {
      const stats = summary.tools[tool];
      stats.total++;
      const err = rec.errors[tool];
      if (err) { stats.error++; continue; }
      const rel = relevantFindings(rec.byTool[tool], rec.sc);
      const bucket = scoreOne(rec.expected, rel);
      stats[bucket]++;
      for (const sc of rec.sc) {
        summary.bySc[sc] = summary.bySc[sc] || {};
        summary.bySc[sc][tool] = summary.bySc[sc][tool] || { tp: 0, fn: 0, fp: 0, tn: 0, tnWithReview: 0, reviewOnlyMiss: 0, error: 0, total: 0 };
        summary.bySc[sc][tool][bucket]++;
        summary.bySc[sc][tool].total++;
      }
      if (bucket === 'fn' || bucket === 'fp' || bucket === 'reviewOnlyMiss') {
        summary.mismatchReview.push({
          testcaseId: rec.testcaseId,
          ruleId: rec.ruleId,
          ruleName: rec.ruleName,
          sc: rec.sc,
          expected: rec.expected,
          tool,
          bucket,
          classification: bucket === 'fp' ? 'needs-adjudication: possible tool false positive or SC-scope interpretation difference'
            : bucket === 'reviewOnlyMiss' ? 'needs-adjudication: tool produced review/manual instead of a hard failure'
              : 'needs-adjudication: possible miss, unsupported rule, or ACT/tool scope mismatch',
          url: rec.url,
          relevantFindings: rel.slice(0, 5),
        });
      }
    }
  }
  for (const stats of Object.values(summary.tools)) {
    const decided = stats.tp + stats.fn + stats.fp + stats.tn;
    stats.recallOnFailed = stats.tp + stats.fn ? stats.tp / (stats.tp + stats.fn) : null;
    stats.fpRateOnNonFailed = stats.fp + stats.tn ? stats.fp / (stats.fp + stats.tn) : null;
    stats.decisionAgreement = decided ? (stats.tp + stats.tn) / decided : null;
  }
  return summary;
}

function stratifiedPick(cases, limit) {
  if (!Number.isFinite(limit) || limit <= 0 || cases.length <= limit) return cases;
  const groups = new Map();
  for (const tc of cases) {
    const key = `${tc.ruleId}|${tc.expected}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(tc);
  }
  const keys = [...groups.keys()].sort();
  const out = [];
  let pos = 0;
  while (out.length < limit && keys.length) {
    const key = keys[pos % keys.length];
    const g = groups.get(key);
    if (g && g.length) out.push(g.shift());
    if (!g || !g.length) {
      groups.delete(key);
      keys.splice(keys.indexOf(key), 1);
      if (!keys.length) break;
      pos = pos % keys.length;
    } else {
      pos++;
    }
  }
  return out;
}

async function main() {
  if (!fs.existsSync(ACT_JSON)) throw new Error(`ACT testcase JSON not found: ${ACT_JSON}`);
  const all = JSON.parse(fs.readFileSync(ACT_JSON, 'utf8')).testcases || [];
  let selected = all
    .filter((tc) => tc.approved || tc.isApproved)
    .map((tc) => ({ ...tc, sc: scsFromAct(tc) }))
    .filter((tc) => tc.sc.length && ['failed', 'passed', 'inapplicable'].includes(tc.expected));
  if (RULE) selected = selected.filter((tc) => tc.ruleId === RULE);
  if (SC) selected = selected.filter((tc) => tc.sc.includes(SC));
  if (STRATIFIED) selected = stratifiedPick(selected, LIMIT);
  if (Number.isFinite(LIMIT) && LIMIT > 0) selected = selected.slice(0, LIMIT);

  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const raw = [];
  for (const [i, tc] of selected.entries()) {
    const rec = {
      source: 'w3c-act',
      index: i,
      testcaseId: tc.testcaseId,
      ruleId: tc.ruleId,
      ruleName: tc.ruleName,
      sc: tc.sc,
      expected: tc.expected,
      url: tc.url,
      byTool: {},
      errors: {},
    };
    console.log(`[${i + 1}/${selected.length}] ${tc.ruleId} ${tc.expected} ${tc.sc.join(',')} ${tc.testcaseTitle || ''}`);
    const page = await browser.newPage();
    try {
      await page.goto(tc.url, { waitUntil: 'load', timeout: 45000 });
      await new Promise((r) => setTimeout(r, 200));
      for (const tool of TOOLS.filter((t) => t !== 'qualweb')) {
        try {
          if (tool === 'axe') rec.byTool[tool] = await runAxe(page);
          else if (tool === 'htmlcs') rec.byTool[tool] = await runHtmlcs(page);
          else if (tool === 'ibm') rec.byTool[tool] = await runIbm(page, tc.testcaseId);
          else if (tool === 'alfa') rec.byTool[tool] = await runAlfa(page);
          else rec.byTool[tool] = [];
        } catch (e) {
          rec.byTool[tool] = [];
          rec.errors[tool] = String(e && e.message || e);
        }
      }
    } catch (e) {
      rec.errors.page = String(e && e.message || e);
    } finally {
      await page.close();
    }
    if (TOOLS.includes('qualweb')) {
      try { rec.byTool.qualweb = await runQualweb(tc.url); } catch (e) { rec.byTool.qualweb = []; rec.errors.qualweb = String(e && e.message || e); }
    }
    raw.push(rec);
    fs.writeFileSync(path.join(OUT, 'raw.json'), JSON.stringify(raw, null, 2));
    fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summarize(raw), null, 2));
  }
  await browser.close();
  const summary = summarize(raw);
  fs.writeFileSync(path.join(OUT, 'raw.json'), JSON.stringify(raw, null, 2));
  fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary.tools, null, 2));
  console.log(`wrote ${OUT}`);
}

main().catch((e) => { console.error(e.stack || e.message); process.exit(1); });
