'use strict';
// Cross-checker COVERAGE runner over the "act-rest" ACT corpus (act-rest/subset.json): the 609-testcase
// COMPLEMENT of the project-scoped act-subset/ (50 ACT rules, majority proposed). Sibling of run-act-suite.js
// (the 5-tool pilot) and run-v3-act-suite.js (--local mode). This runner answers: for each of these 50 ACT
// rules, does ANY off-the-shelf checker implement it, and how accurate is each tool on the rule's testcases —
// scored two ways (SC-level, the pilot's WCAG-SC overlap view; and ACT-RULE-level, exact ACT-rule mapping).
//
// KEY DIFFERENCES FROM run-act-suite.js:
//   * NO approved-only filter — this corpus is majority proposed rules (do not drop them).
//   * Pages load from the LOCAL mirror (act-rest/pages/<ruleId>/<testcaseId>.html) via file:// — offline,
//     deterministic — following run-v3-act-suite.js --local. Rows whose local page has not been downloaded
//     yet are recorded as `pageMissing` (not run, not crashed) so a partial corpus is still scorable.
//   * ACT-RULE-level scoring in addition to SC-level. Each tool finding is tagged with the ACT rule id(s) it
//     implements (act-rule-maps.json), and a finding counts as rule-relevant iff it maps to the ROW's ruleId.
//
// QUALWEB LOADS OVER HTTP, NOT file:// (verified 2026-07: QualWeb launches its OWN browser and silently
// renders file:// pages BLANK — 0 assertions vs 8 passed / 2 failed / 58 inapplicable for the same page over
// http). So when qualweb is in --tools we start ONE tiny localhost static server rooted at act-rest/ and hand
// QualWeb http://127.0.0.1:<port>/<localPath> URLs. The other four tools (axe/ibm/htmlcs/alfa) run inside the
// puppeteer page, which renders file:// fine (parity with run-v3-act-suite.js --local).
//
// SINGLE QUALWEB INSTANCE REUSE (verified no leak): QualWeb.start() once, evaluate() per case, stop() at end
// — the pilot's per-case start/stop is the dominant cost. Probe evidence: running case A, then case B, then A
// again over the shared instance produced A1==A2 (no state carried over) and A!=B (results are page-specific),
// and the correct ACT rules fired (QW-ACT-R24→73f2c2, QW-ACT-R14→b4f0c3).
//
// Usage:
//   node run-rest-suite.js --stratified --limit=30 --out=act-rest-smoke     (smoke)
//   node run-rest-suite.js --resume                                         (full 609, resumable)
//   node run-rest-suite.js --rule=73f2c2 --tools=axe,qualweb
//   node run-rest-suite.js --rebuild-maps                                   (regenerate act-rule-maps.json)
//
// Outputs (upstream-evidence/act-rest/ by default, or --out=<subdir>):
//   raw.json             per-case findings + both-view buckets
//   summary.json         { scLevel:{tools,bySc}, ruleLevel:{tools,byActRule}, ... }
//   summary-by-rule.json compact per-ruleId digest for downstream coverage docs

const fs = require('fs');
const path = require('path');
const http = require('http');
const puppeteer = require('puppeteer');

// QualWeb's reused cluster adds one taskerror listener per evaluate(); with QW_RESTART_EVERY capping real
// growth (~50 before a fresh instance resets it), lift the warn threshold above that so the cosmetic
// MaxListenersExceededWarning stays quiet while still catching a genuinely unbounded leak elsewhere.
require('events').defaultMaxListeners = 200;

const CHROME = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const REST_DIR = path.join(__dirname, 'act-rest');
const SUBSET_PATH = path.join(REST_DIR, 'subset.json');
const MAPS_PATH = path.join(__dirname, 'act-rule-maps.json');
const AXE = require.resolve('axe-core/axe.min.js');
const HTMLCS = require.resolve('html_codesniffer/build/HTMLCS.js');

function arg(name, def = null) {
  const p = process.argv.find((x) => x === `--${name}` || x.startsWith(`--${name}=`));
  if (!p) return def;
  if (p === `--${name}`) return true;
  return p.slice(name.length + 3);
}

const LIMIT = Number(arg('limit', process.env.ACT_LIMIT || 0));
const RULE = arg('rule', process.env.ACT_RULE || null);
const SC = arg('sc', process.env.ACT_SC || null);
const STRATIFIED = !!arg('stratified', process.env.ACT_STRATIFIED === '1' ? true : null);
const RESUME = !!arg('resume', false);
const REBUILD_MAPS = !!arg('rebuild-maps', false);
const OUT_NAME = arg('out', null) || 'act-rest';
const OUT = path.join(__dirname, 'upstream-evidence', OUT_NAME);
const TOOLS = String(arg('tools', process.env.ACT_TOOLS || 'axe,ibm,htmlcs,alfa,qualweb'))
  .split(',').map((s) => s.trim()).filter(Boolean);
// QualWeb's reused puppeteer-cluster leaks one `taskerror` listener per evaluate() and never trims it, so
// restart the instance every N cases to bound listener/memory growth over the full 609-case run (still ~12
// starts vs the pilot's per-case restart). 0 disables (single instance for the whole run).
const QW_RESTART_EVERY = Number(arg('qw-restart-every', process.env.ACT_QW_RESTART_EVERY || 50));
fs.mkdirSync(OUT, { recursive: true });

// ---------------------------------------------------------------------------
// ACT rule id maps: tool-native rule id -> [ACT rule id]. Built from each checker's own metadata, cached to
// act-rule-maps.json (checked in) with provenance. axe/ibm/qualweb expose ACT ids programmatically; alfa &
// htmlcs do NOT (alfa's rule metadata carries only WCAG criteria + techniques; htmlcs has no ACT concept) —
// they are SC-level only, so their rule-level bucket is always `notImplemented`.
// ---------------------------------------------------------------------------
const IBM_HEX = /^[0-9a-f]{6}$/;
function normIbmAct(act) {
  // IBM getRules().act is a string, an array of strings, and/or an array of objects keyed by ACT id
  // (e.g. "c487ae" | ["6a7281"] | [{"23a2a8":{...}}]).
  const ids = [];
  const push = (v) => { if (typeof v === 'string' && IBM_HEX.test(v)) ids.push(v); };
  if (!act) return ids;
  if (typeof act === 'string') push(act);
  else if (Array.isArray(act)) for (const e of act) {
    if (typeof e === 'string') push(e);
    else if (e && typeof e === 'object') for (const k of Object.keys(e)) push(k);
  } else if (typeof act === 'object') for (const k of Object.keys(act)) push(k);
  return [...new Set(ids)];
}

async function buildActRuleMaps() {
  const maps = {
    _provenance: {
      generatedAt: new Date().toISOString(),
      note: 'tool-native rule id -> [ACT rule id]. Regenerate with: node run-rest-suite.js --rebuild-maps',
      axe: 'axe-core getRules()[].actIds',
      ibm: 'accessibility-checker getRules()[].act (string | string[] | [{<actId>:{}}])',
      qualweb: '@qualweb/act-rules dist/lib/rules.json — each rule .code (QW-ACT-Rxx) + .mapping (ACT id)',
      alfa: 'NONE — @siteimprove/alfa-rules exposes only WCAG criteria + techniques, no ACT rule id. SC-level only.',
      htmlcs: 'NONE — HTML_CodeSniffer has no ACT rule concept. SC-level only.',
    },
    axe: {}, ibm: {}, qualweb: {}, alfa: null, htmlcs: null,
  };
  // axe
  try {
    const axe = require('axe-core');
    for (const r of axe.getRules()) if (r.actIds && r.actIds.length) maps.axe[r.ruleId] = [...new Set(r.actIds)];
  } catch (e) { maps._provenance.axeError = String(e && e.message || e); }
  // ibm
  try {
    const checker = require('accessibility-checker');
    for (const r of await checker.getRules()) {
      const ids = normIbmAct(r.act);
      if (ids.length) maps.ibm[r.id] = ids;
    }
  } catch (e) { maps._provenance.ibmError = String(e && e.message || e); }
  // qualweb
  try {
    const qw = JSON.parse(fs.readFileSync(path.join(__dirname, 'node_modules', '@qualweb', 'act-rules', 'dist', 'lib', 'rules.json'), 'utf8'));
    for (const k of Object.keys(qw)) { const { code, mapping } = qw[k]; if (code && mapping) maps.qualweb[code] = [mapping]; }
  } catch (e) { maps._provenance.qualwebError = String(e && e.message || e); }
  fs.writeFileSync(MAPS_PATH, JSON.stringify(maps, null, 2));
  return maps;
}

function loadOrBuildMaps() {
  if (!REBUILD_MAPS && fs.existsSync(MAPS_PATH)) {
    try { return JSON.parse(fs.readFileSync(MAPS_PATH, 'utf8')); } catch (e) {}
  }
  return null; // signal caller to build (async)
}

// ---------------------------------------------------------------------------
// SC extractors (parity with run-act-suite.js) + per-tool runners. Each finding carries { tool, ruleId, sc[],
// outcome } and is later tagged with actIds[] from the maps.
// ---------------------------------------------------------------------------
const scFromAxeTags = (tags) => [...new Set((tags || []).map((t) => {
  const m = /^wcag(\d)(\d)(\d+)$/.exec(t);
  return m ? `${m[1]}.${m[2]}.${m[3]}` : null;
}).filter(Boolean))];
const scFromHtmlcsCode = (code) => {
  const m = /Guideline\d_\d\.(\d+)_(\d+)_(\d+)/.exec(code || '');
  return m ? [`${m[1]}.${m[2]}.${m[3]}`] : [];
};
const scFromQualweb = (sc) => (sc || []).map((s) => s.name).filter(Boolean);

async function runAxe(page) {
  await page.addScriptTag({ path: AXE });
  const r = await page.evaluate(async () => await window.axe.run(document, {
    resultTypes: ['violations', 'incomplete'], reporter: 'v2',
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
      resolve(window.HTMLCS.getMessages().map((m) => ({ code: m.code, type: m.type, msg: m.msg, tag: (m.element && m.element.tagName) || null })));
    });
  }));
  return msgs.map((m) => ({
    tool: 'htmlcs',
    ruleId: (m.code || '').split('.').pop(),
    sc: scFromHtmlcsCode(m.code),
    outcome: ({ 1: 'violation', 2: 'review', 3: 'review' })[m.type] || 'review',
    target: m.tag, message: m.msg, raw: m.code,
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
    message: it.message, raw: it.reasonId,
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

// QualWeb over a single reused instance + http url (see header). Runs both modules for SC-level completeness;
// only QW-ACT-Rxx codes carry an ACT-rule mapping (WCAG techniques → actIds:[] → rule-level irrelevant).
async function runQualwebShared(qw, url) {
  const { ACTRules } = require('@qualweb/act-rules');
  const { WCAGTechniques } = require('@qualweb/wcag-techniques');
  const ev = await qw.evaluate({ url, modules: [new ACTRules({}), new WCAGTechniques({})] });
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
        message: a.metadata.description || a.name, raw: modName,
      });
    }
  }
  return out;
}

// tag each finding with the ACT rule id(s) it implements, from the maps
function tagActIds(findings, tool, maps) {
  const tbl = maps[tool];
  for (const f of findings || []) {
    if (f._error) { f.actIds = []; continue; }
    f.actIds = (tbl && tbl[f.ruleId]) ? tbl[f.ruleId] : [];
  }
  return findings;
}

// ---------------------------------------------------------------------------
// Scoring. Two relevance views:
//   SC-level  : finding.sc overlaps the row's WCAG SCs (pilot semantics). Only meaningful for sc-non-empty rows.
//   Rule-level: finding.actIds includes the row's ACT ruleId (exact ACT-rule match). Defined for every row,
//               including the 112 sc:[] pure-ARIA/composite rows. A tool that does not implement the row's ACT
//               rule is bucketed `notImplemented` (not a miss — it never claimed to cover this rule).
// ---------------------------------------------------------------------------
function relevantBySc(items, scs) {
  const set = new Set(scs);
  return (items || []).filter((it) => !it._error && (it.sc || []).some((sc) => set.has(sc)));
}
function relevantByRule(items, ruleId) {
  return (items || []).filter((it) => !it._error && (it.actIds || []).includes(ruleId));
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

function blankBucket() { return { tp: 0, fn: 0, fp: 0, tn: 0, tnWithReview: 0, reviewOnlyMiss: 0, notImplemented: 0, error: 0, total: 0 }; }
function addRates(stats) {
  stats.recallOnFailed = stats.tp + stats.fn ? +(stats.tp / (stats.tp + stats.fn)).toFixed(4) : null;
  stats.fpRateOnNonFailed = stats.fp + stats.tn ? +(stats.fp / (stats.fp + stats.tn)).toFixed(4) : null;
  const decided = stats.tp + stats.fn + stats.fp + stats.tn;
  stats.decisionAgreement = decided ? +((stats.tp + stats.tn) / decided).toFixed(4) : null;
  return stats;
}

function toolImplementsSet(maps, tool) {
  // set of ACT rule ids the tool claims to implement
  const s = new Set();
  const tbl = maps[tool];
  if (tbl) for (const ids of Object.values(tbl)) for (const id of ids) s.add(id);
  return s;
}

function summarize(raw, maps) {
  const ran = raw.filter((r) => !r.pageMissing);
  const implementsSets = Object.fromEntries(TOOLS.map((t) => [t, toolImplementsSet(maps, t)]));
  const summary = {
    generatedAt: new Date().toISOString(),
    n: raw.length,
    ran: ran.length,
    pageMissing: raw.filter((r) => r.pageMissing).length,
    noScRows: ran.filter((r) => !r.sc || !r.sc.length).length,
    tools: TOOLS,
    scLevel: { tools: {}, bySc: {} },
    ruleLevel: { tools: {}, byActRule: {} },
    scMismatchReview: [],
    ruleMismatchReview: [],
  };
  for (const tool of TOOLS) { summary.scLevel.tools[tool] = blankBucket(); summary.ruleLevel.tools[tool] = blankBucket(); summary.ruleLevel.tools[tool].implementsCount = implementsSets[tool].size; }

  for (const rec of ran) {
    const hasSc = rec.sc && rec.sc.length;
    // ----- SC-level (sc-non-empty rows only) -----
    if (hasSc) {
      for (const tool of TOOLS) {
        const stats = summary.scLevel.tools[tool];
        stats.total++;
        if (rec.errors[tool]) { stats.error++; continue; }
        const rel = relevantBySc(rec.byTool[tool], rec.sc);
        const bucket = scoreOne(rec.expected, rel);
        stats[bucket]++;
        for (const sc of rec.sc) {
          const bs = (summary.scLevel.bySc[sc] = summary.scLevel.bySc[sc] || {});
          const ts = (bs[tool] = bs[tool] || blankBucket());
          ts[bucket]++; ts.total++;
        }
        if (['fn', 'fp', 'reviewOnlyMiss'].includes(bucket)) {
          summary.scMismatchReview.push({ testcaseId: rec.testcaseId, ruleId: rec.ruleId, sc: rec.sc, expected: rec.expected, tool, bucket, relevantFindings: rel.slice(0, 4).map((f) => ({ ruleId: f.ruleId, outcome: f.outcome })) });
        }
      }
    }
    // ----- ACT-rule-level (every row) -----
    const anyImpl = TOOLS.some((t) => implementsSets[t].has(rec.ruleId));
    const byRule = (summary.ruleLevel.byActRule[rec.ruleId] = summary.ruleLevel.byActRule[rec.ruleId] || {
      ruleName: rec.ruleName, sc: rec.sc, anyToolImplements: anyImpl, byExpected: {}, tools: {},
    });
    byRule.byExpected[rec.expected] = (byRule.byExpected[rec.expected] || 0) + 1;
    for (const tool of TOOLS) {
      const stats = summary.ruleLevel.tools[tool];
      stats.total++;
      const rt = (byRule.tools[tool] = byRule.tools[tool] || blankBucket());
      rt.implements = implementsSets[tool].has(rec.ruleId);
      rt.total++;
      if (!implementsSets[tool].has(rec.ruleId)) { stats.notImplemented++; rt.notImplemented++; continue; }
      if (rec.errors[tool]) { stats.error++; rt.error++; continue; }
      const rel = relevantByRule(rec.byTool[tool], rec.ruleId);
      const bucket = scoreOne(rec.expected, rel);
      stats[bucket]++; rt[bucket]++;
      if (['fn', 'fp', 'reviewOnlyMiss'].includes(bucket)) {
        summary.ruleMismatchReview.push({ testcaseId: rec.testcaseId, ruleId: rec.ruleId, expected: rec.expected, tool, bucket, relevantFindings: rel.slice(0, 4).map((f) => ({ ruleId: f.ruleId, outcome: f.outcome })) });
      }
    }
  }
  for (const tool of TOOLS) { addRates(summary.scLevel.tools[tool]); addRates(summary.ruleLevel.tools[tool]); }
  for (const bs of Object.values(summary.scLevel.bySc)) for (const ts of Object.values(bs)) addRates(ts);
  for (const br of Object.values(summary.ruleLevel.byActRule)) for (const rt of Object.values(br.tools)) addRates(rt);
  return summary;
}

// compact per-ruleId digest for downstream docs
function byRuleDigest(summary) {
  const out = {};
  for (const [ruleId, br] of Object.entries(summary.ruleLevel.byActRule)) {
    out[ruleId] = {
      ruleName: br.ruleName,
      sc: br.sc,
      nCases: Object.values(br.byExpected).reduce((a, b) => a + b, 0),
      byExpected: br.byExpected,
      anyToolImplements: br.anyToolImplements,
      perTool: Object.fromEntries(Object.entries(br.tools).map(([tool, rt]) => [tool, {
        implements: !!rt.implements,
        recallOnFailed: rt.recallOnFailed,
        fpRateOnNonFailed: rt.fpRateOnNonFailed,
        tp: rt.tp, fn: rt.fn, fp: rt.fp, tn: rt.tn, reviewOnlyMiss: rt.reviewOnlyMiss, tnWithReview: rt.tnWithReview, error: rt.error,
      }])),
    };
  }
  return out;
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
    if (!g || !g.length) { groups.delete(key); keys.splice(keys.indexOf(key), 1); if (!keys.length) break; pos = pos % keys.length; }
    else pos++;
  }
  return out;
}

function writeOut(raw, maps) {
  const summary = summarize(raw, maps);
  fs.writeFileSync(path.join(OUT, 'raw.json'), JSON.stringify(raw, null, 2));
  fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 2));
  fs.writeFileSync(path.join(OUT, 'summary-by-rule.json'), JSON.stringify(byRuleDigest(summary), null, 2));
  return summary;
}

async function main() {
  if (!fs.existsSync(SUBSET_PATH)) throw new Error(`act-rest subset not found: ${SUBSET_PATH}`);
  let maps = loadOrBuildMaps();
  if (!maps || REBUILD_MAPS) { console.log('building act-rule-maps.json …'); maps = await buildActRuleMaps(); }
  console.log(`act-rule maps: axe=${Object.keys(maps.axe).length} ibm=${Object.keys(maps.ibm).length} qualweb=${Object.keys(maps.qualweb).length} rules mapped (alfa/htmlcs: SC-level only)`);

  let selected = JSON.parse(fs.readFileSync(SUBSET_PATH, 'utf8')); // NO approved-only filter
  if (RULE) { const set = new Set(String(RULE).split(',').map((s) => s.trim()).filter(Boolean)); selected = selected.filter((tc) => set.has(tc.ruleId)); }
  if (SC) selected = selected.filter((tc) => (tc.sc || []).includes(SC));
  if (STRATIFIED) selected = stratifiedPick(selected, LIMIT);
  if (Number.isFinite(LIMIT) && LIMIT > 0) selected = selected.slice(0, LIMIT);

  // --resume: carry forward already-RUN records (pageMissing rows are re-attempted in case the page arrived).
  const raw = [];
  if (RESUME && fs.existsSync(path.join(OUT, 'raw.json'))) {
    try {
      const prior = JSON.parse(fs.readFileSync(path.join(OUT, 'raw.json'), 'utf8')).filter((r) => !r.pageMissing);
      const done = new Set(prior.map((r) => r.testcaseId));
      raw.push(...prior);
      const before = selected.length;
      selected = selected.filter((tc) => !done.has(tc.testcaseId));
      console.log(`resume: ${prior.length} prior run records; skipping ${before - selected.length}, running ${selected.length} remaining`);
    } catch (e) { console.log(`resume: could not read prior raw.json (${e.message}); running full set`); }
  }

  // IBM accessibility-checker writes a per-label JSON report to ./results by default (polluting the project's
  // experiment-results dir). Redirect it into this run's own output dir instead.
  if (TOOLS.includes('ibm')) {
    try { await require('accessibility-checker').setConfig({ outputFolder: path.join(OUT, 'ibm-reports'), outputFormat: ['json'] }); }
    catch (e) { console.log(`ibm setConfig failed (reports may land in ./results): ${e.message}`); }
  }

  // shared localhost static server (rooted at act-rest/) — only if qualweb requested (it can't read file://)
  let server = null; let httpBase = null;
  if (TOOLS.includes('qualweb')) {
    server = http.createServer((req, res) => {
      const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '');
      const p = path.join(REST_DIR, rel);
      if (!p.startsWith(REST_DIR)) { res.writeHead(403); res.end(); return; }
      fs.readFile(p, (e, buf) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(buf); });
    });
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    httpBase = `http://127.0.0.1:${server.address().port}/`;
    console.log(`qualweb static server: ${httpBase} (root=act-rest/)`);
  }

  // reused QualWeb instance (restarted every QW_RESTART_EVERY cases — see flag comment)
  let qw = null; let qwStartedAt = 0;
  const startQw = async () => {
    const { QualWeb } = require('@qualweb/core');
    qw = new QualWeb({});
    await qw.start({ maxConcurrency: 1, timeout: 60000 }, { headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'], executablePath: CHROME });
  };
  if (TOOLS.includes('qualweb')) await startQw();

  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    for (const [i, tc] of selected.entries()) {
      if (qw && QW_RESTART_EVERY > 0 && i - qwStartedAt >= QW_RESTART_EVERY) {
        await qw.stop().catch(() => {}); await startQw(); qwStartedAt = i;
      }
      const localAbs = tc.localPath ? path.join(REST_DIR, tc.localPath) : null;
      const rec = {
        source: 'w3c-act-rest',
        index: i,
        testcaseId: tc.testcaseId,
        ruleId: tc.ruleId,
        ruleName: tc.ruleName,
        sc: tc.sc || [],
        expected: tc.expected,
        approved: tc.approved !== false,
        url: tc.url,
        localPath: tc.localPath,
        byTool: {},
        errors: {},
      };
      if (!localAbs || !fs.existsSync(localAbs)) {
        rec.pageMissing = true;
        console.log(`[${i + 1}/${selected.length}] ${tc.ruleId} ${tc.expected} PAGE MISSING (${tc.localPath})`);
        raw.push(rec);
        writeOut(raw, maps);
        continue;
      }
      console.log(`[${i + 1}/${selected.length}] ${tc.ruleId} ${tc.expected} ${(tc.sc || []).join(',') || '(no-sc)'} ${tc.testcaseId.slice(0, 8)}`);
      // file:// tools in the puppeteer page
      const page = await browser.newPage();
      try {
        // Freeze navigation: allow the initial document load, then abort any further top-frame document
        // navigation (meta-refresh / JS redirect). Without this, refresh-rule fixtures (bc659a, bisz58, …)
        // navigate away after `load`, destroying the execution context so window.axe/HTMLCS become undefined
        // and axe/htmlcs record spurious errors. addScriptTag(path) injects inline (no network) so unaffected.
        let mainNav = 0;
        await page.setRequestInterception(true);
        page.on('request', (req) => {
          try {
            const isMainDoc = req.resourceType() === 'document' && req.frame() === page.mainFrame();
            if (isMainDoc && ++mainNav > 1) return req.abort();
            req.continue();
          } catch (e) { try { req.continue(); } catch (_) {} }
        });
        await page.goto('file://' + localAbs, { waitUntil: 'load', timeout: 45000 });
        await new Promise((r) => setTimeout(r, 200));
        for (const tool of TOOLS.filter((t) => t !== 'qualweb')) {
          try {
            if (tool === 'axe') rec.byTool[tool] = await runAxe(page);
            else if (tool === 'htmlcs') rec.byTool[tool] = await runHtmlcs(page);
            else if (tool === 'ibm') rec.byTool[tool] = await runIbm(page, tc.testcaseId);
            else if (tool === 'alfa') rec.byTool[tool] = await runAlfa(page);
            else rec.byTool[tool] = [];
            tagActIds(rec.byTool[tool], tool, maps);
          } catch (e) { rec.byTool[tool] = []; rec.errors[tool] = String(e && e.message || e); }
        }
      } catch (e) {
        rec.errors.page = String(e && e.message || e);
        for (const tool of TOOLS.filter((t) => t !== 'qualweb')) rec.byTool[tool] = rec.byTool[tool] || [];
      } finally {
        await page.close().catch(() => {});
      }
      // qualweb over http, shared instance
      if (TOOLS.includes('qualweb')) {
        try { rec.byTool.qualweb = tagActIds(await runQualwebShared(qw, httpBase + tc.localPath), 'qualweb', maps); }
        catch (e) { rec.byTool.qualweb = []; rec.errors.qualweb = String(e && e.message || e); }
      }
      raw.push(rec);
      writeOut(raw, maps);
    }
  } finally {
    await browser.close().catch(() => {});
    if (qw) await qw.stop().catch(() => {});
    if (server) server.close();
  }

  const summary = writeOut(raw, maps);
  console.log('\n=== SC-level (tools overall) ===');
  for (const t of TOOLS) { const s = summary.scLevel.tools[t]; console.log(`  ${t.padEnd(8)} recall ${s.recallOnFailed == null ? '-' : (100 * s.recallOnFailed).toFixed(0) + '%'} (${s.tp}/${s.tp + s.fn})  fp ${s.fpRateOnNonFailed == null ? '-' : (100 * s.fpRateOnNonFailed).toFixed(0) + '%'} (${s.fp}/${s.fp + s.tn})  err ${s.error}`); }
  console.log('=== ACT-rule-level (tools overall; scored only on rules the tool implements) ===');
  for (const t of TOOLS) { const s = summary.ruleLevel.tools[t]; console.log(`  ${t.padEnd(8)} implements ${s.implementsCount} rules; recall ${s.recallOnFailed == null ? '-' : (100 * s.recallOnFailed).toFixed(0) + '%'} (${s.tp}/${s.tp + s.fn})  fp ${s.fpRateOnNonFailed == null ? '-' : (100 * s.fpRateOnNonFailed).toFixed(0) + '%'} (${s.fp}/${s.fp + s.tn})  notImpl ${s.notImplemented}`); }
  console.log(`\nran ${summary.ran}/${summary.n} (pageMissing ${summary.pageMissing}, noScRows ${summary.noScRows})`);
  console.log(`wrote ${OUT}`);
}

main().catch((e) => { console.error(e.stack || e.message); process.exit(1); });
