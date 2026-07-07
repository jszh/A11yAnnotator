#!/usr/bin/env node
'use strict';
// Run the current v3 deterministic harness (NO LLM, NO authority promotion) over the same W3C ACT
// testcase set used by run-act-suite.js. This is intentionally a PILOT scorer:
// ACT expected outcomes are ACT-rule-level, while v3 emits atomic claim-family observations. We score
// only same-SC deterministic observations and preserve mismatch records for later adjudication.
//
// Usage:
//   node run-v3-act-suite.js --limit=20 --max-auto=12                      (original: live network, full ACT)
//   node run-v3-act-suite.js --stratified --limit=80 --sc=1.4.3
//   node run-v3-act-suite.js --subset --local --axe --limit=0              (this project's SC subset, offline, + axe lane)
//
// --subset  : score the project-scoped subset (act-subset/subset.json, built by build-sc-subset.js); each
//             testcase already carries its resolved `sc[]` (direct + technique-mapped), so scsFromAct is bypassed.
// --local   : load the mirrored page (file://act-subset/pages/...) instead of the live URL — offline, deterministic.
// --axe     : additionally run axe-core on each page and score an axe lane + the v3∪axe UNION, to quantify how
//             much a scanner-import lane would lift coverage on this set (the harness goal).
//
// Outputs (default upstream-evidence/v3-act-pilot/; subset mode → upstream-evidence/v3-act-subset/):
//   raw.json  summary.json

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const puppeteer = require('puppeteer');

const { orchestrate } = require('../../scripts/v3/lib/orchestrator.js');
const { CATALOG } = require('../../scripts/v3/lib/catalog.js');
const { makeRunAgent, makeClaudeSdkTransport } = require('../../scripts/v3/lib/llm-agent-adapter.js');
const LIMITS = require('../../scripts/v3/lib/limits.js'); // budget/concurrency/ACT DEFAULTS (tiers C/D)

// SINGLE LLM ACTIVATION GATE (shared with run-evaluation.js): V3_LLM=1 turns the judge ON via the Claude
// Code SUBSCRIPTION (Agent SDK + CLAUDE_CODE_OAUTH_TOKEN — no metered key; .env never committed). Unset/0 =
// OFF = today's deterministic ACT run, unchanged. The corpus run is never auto-triggered (OFF is default).
const REPO_ROOT = path.join(__dirname, '..', '..');
require('../../scripts/v3/lib/load-env.js').loadEnv(REPO_ROOT);
const LLM_ON = process.env.V3_LLM === '1';
// PHASE 2: V3_LLM_TOOLS=1 (on top of V3_LLM=1) enables the live in-process CDP tool repertoire (multi-turn).
const LLM_TRANSPORT_CONFIG = LLM_ON ? {
  oauthToken: process.env.CLAUDE_CODE_OAUTH_TOKEN,
  model: process.env.V3_LLM_MODEL || 'claude-sonnet-4-6',
  effort: process.env.V3_LLM_EFFORT || 'medium', // reasoning depth; sonnet → medium (config, not a budget)
  perTurnTimeoutMs: +(process.env.V3_LLM_TURN_TIMEOUT_MS || LIMITS.llm.perTurnTimeoutMs),
  runTimeoutMs: +(process.env.V3_LLM_RUN_TIMEOUT_MS || LIMITS.llm.runTimeoutMs),
} : undefined;
const LLM_AGENT = LLM_ON ? makeRunAgent({ transport: makeClaudeSdkTransport(LLM_TRANSPORT_CONFIG), model: LLM_TRANSPORT_CONFIG.model }) : null;
const LLM_TOOLS = LLM_ON && process.env.V3_LLM_TOOLS === '1';

const CHROME = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ACT_JSON = process.env.ACT_TESTCASES_JSON
  || path.join(__dirname, '..', '..', 'testcases.json');
const SUBSET_DIR = path.join(__dirname, 'act-subset');
const AXE_PATH = process.env.AXE_PATH || path.join(__dirname, '..', '..', 'axe.min.js');

function withTimeout(promise, ms, label) {
  let t;
  const timeout = new Promise((_, rej) => { t = setTimeout(() => rej(new Error(`case-timeout ${ms}ms (${label})`)), ms); });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(t));
}

function arg(name, def = null) {
  const p = process.argv.find((x) => x === `--${name}` || x.startsWith(`--${name}=`));
  if (!p) return def;
  if (p === `--${name}`) return true;
  return p.slice(name.length + 3);
}

const LIMIT = Number(arg('limit', process.env.ACT_LIMIT || 20));
const RULE = arg('rule', process.env.ACT_RULE || null);
const SC = arg('sc', process.env.ACT_SC || null);
const STRATIFIED = !!arg('stratified', process.env.ACT_STRATIFIED === '1' ? true : null);
const MAX_AUTO = Number(arg('max-auto', process.env.V3_ACT_MAX_AUTO || LIMITS.act.maxAuto));
const ELEMENT_CAP = Number(arg('element-cap', process.env.V3_ACT_ELEMENT_CAP || LIMITS.act.elementCap));
const RUN_WALL = Number(arg('run-wall-ms', process.env.V3_ACT_RUN_WALL_MS || LIMITS.act.runWallClockMs)); // experiment-lane wall-clock budget (TIME cap, not count)
const DETERMINISTIC_SCS = new Set(Object.values(CATALOG.experiments).map((e) => e.sc));
const SUMMARIZE_ONLY = !!arg('summarize-only', false);
const SUBSET = !!arg('subset', false);
const LOCAL = !!arg('local', false);
const AXE = !!arg('axe', false);
const PROPOSED = !!arg('proposed', false); // include non-approved (draft) ACT rules from the subset (default: approved-only)
// --resume: skip testcases already in OUT/raw.json (append the remainder). --case-timeout: per-case wall clock
// (a hung page/orchestrate becomes rec.error and the run moves on, instead of stalling the whole suite).
const RESUME = !!arg('resume', false);
const CASE_TIMEOUT = Number(arg('case-timeout', process.env.V3_ACT_CASE_TIMEOUT || LIMITS.act.caseTimeoutMs));
const DRAFT_ONLY = !!arg('draft-only', false); // run ONLY the non-approved (draft) cases (implies proposed inclusion)
const OUT_NAME = arg('out', null);             // override the output subdir (e.g. a rerun dir for diffing)
const OUT = path.join(__dirname, 'upstream-evidence',
  OUT_NAME || (SUBSET ? ((PROPOSED || DRAFT_ONLY) ? 'v3-act-subset-proposed' : 'v3-act-subset') : 'v3-act-pilot'));
fs.mkdirSync(OUT, { recursive: true });

function scsFromAct(tc) {
  const req = tc.ruleAccessibilityRequirements || {};
  const out = [];
  for (const k of Object.keys(req)) {
    const m = /wcag\d+:(\d+\.\d+\.\d+)/.exec(k);
    if (m && req[k] && req[k].forConformance) out.push(m[1]);
  }
  return [...new Set(out)];
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

function digestForUrl(url) {
  return 'sha256:url:' + crypto.createHash('sha256').update(String(url)).digest('hex');
}

// the resource to load: the local mirror (file://) under --local, else the live URL.
function urlFor(tc) {
  if (LOCAL && tc.localPath) return 'file://' + path.join(SUBSET_DIR, tc.localPath);
  return tc.url;
}

// ---- axe-core scanner lane (the "existing scanner tool" the harness should utilize). Inject axe.min.js,
// run it, and map each VIOLATION (and INCOMPLETE = review) to SC via its `wcag<p><g><c>` tags. ----
const axeTagToSc = (tag) => { const m = /^wcag(\d)(\d)(\d+)$/.exec(tag); return m ? `${m[1]}.${m[2]}.${m[3]}` : null; };
async function runAxe(page) {
  try {
    await page.addScriptTag({ path: AXE_PATH });
    return await page.evaluate(async () => {
      const toScs = (v) => [...new Set((v.tags || []).map((t) => { const m = /^wcag(\d)(\d)(\d+)$/.exec(t); return m ? `${m[1]}.${m[2]}.${m[3]}` : null; }).filter(Boolean))];
      try {
        const r = await axe.run(document, { resultTypes: ['violations', 'incomplete'], runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } });
        const flat = (arr, kind) => arr.flatMap((v) => toScs(v).map((sc) => ({ sc, ruleId: v.id, kind, n: (v.nodes || []).length })));
        return { violations: flat(r.violations || [], 'violation'), incomplete: flat(r.incomplete || [], 'review') };
      } catch (e) { return { error: String((e && e.message) || e) }; }
    }).catch((e) => ({ error: String((e && e.message) || e) }));
  } catch (e) { return { error: String((e && e.message) || e) }; }
}
// flag-based lane scorer (coverage view): a lane "flags" a barrier on an in-scope SC ⇒ tp/fp by expected.
function scoreLane(expected, flagged, comparable) {
  if (!comparable) return 'outOfScope';
  if (expected === 'failed') return flagged ? 'tp' : 'fn';
  return flagged ? 'fp' : 'tn';
}

function nativeRole(tag, type, href) {
  tag = String(tag || '').toLowerCase();
  type = String(type || '').toLowerCase();
  if (tag === 'a' && href) return 'link';
  if (tag === 'button') return 'button';
  if (tag === 'select') return 'combobox';
  if (tag === 'textarea') return 'textbox';
  if (tag === 'img') return 'img';
  if (/^h[1-6]$/.test(tag)) return 'heading';
  if (tag === 'input') {
    if (['button', 'submit', 'reset'].includes(type)) return 'button';
    if (type === 'checkbox') return 'checkbox';
    if (type === 'radio') return 'radio';
    if (type === 'range') return 'slider';
    return 'textbox';
  }
  return '';
}

async function collectForV3(page, tc, runId) {
  await page.goto(urlFor(tc), { waitUntil: 'load', timeout: 45000 });
  await new Promise((r) => setTimeout(r, 250));
  const collectedAt = Date.now();
  const pageDigest = digestForUrl(tc.url);
  const file = `act:${tc.testcaseId}`;
  const data = await page.evaluate((cap) => {
    function nativeRoleInPage(tag, type, href) {
      tag = String(tag || '').toLowerCase();
      type = String(type || '').toLowerCase();
      if (tag === 'a' && href) return 'link';
      if (tag === 'button') return 'button';
      if (tag === 'select') return 'combobox';
      if (tag === 'textarea') return 'textbox';
      if (tag === 'img') return 'img';
      if (/^h[1-6]$/.test(tag)) return 'heading';
      if (tag === 'input') {
        if (['button', 'submit', 'reset'].includes(type)) return 'button';
        if (type === 'checkbox') return 'checkbox';
        if (type === 'radio') return 'radio';
        if (type === 'range') return 'slider';
        return 'textbox';
      }
      return '';
    }
    function xpathOf(e) {
      if (!e || !e.tagName) return '';
      if (e === document.documentElement) return '/html';
      if (e === document.body) return '/html/body';
      const tag = e.tagName.toLowerCase();
      let idx = 1;
      for (let s = e.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === e.tagName) idx++;
      return xpathOf(e.parentElement) + '/' + tag + '[' + idx + ']';
    }
    function visible(el) {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity || '1') !== 0
        && r.width > 0 && r.height > 0;
    }
    function textOf(el) { return (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim(); }
    function focusableByMarkup(el) {
      if (el.disabled || el.getAttribute('aria-disabled') === 'true' || el.getAttribute('aria-hidden') === 'true') return false;
      const tag = el.tagName.toLowerCase();
      if (el.tabIndex >= 0) return true;
      if (tag === 'a' && el.hasAttribute('href')) return true;
      return ['button', 'input', 'select', 'textarea', 'summary'].includes(tag);
    }
    function fieldLike(el) {
      const tag = el.tagName.toLowerCase();
      const role = el.getAttribute('role') || '';
      return ['input', 'select', 'textarea'].includes(tag) || /^(textbox|combobox|listbox|spinbutton|searchbox|slider)$/.test(role);
    }
    function labelledText(el) {
      const bits = [];
      const aria = el.getAttribute('aria-label');
      if (aria) bits.push(aria);
      const ids = (el.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean);
      for (const id of ids) {
        const n = document.getElementById(id);
        if (n) bits.push(textOf(n));
      }
      if (el.id) {
        for (const l of document.querySelectorAll(`label[for="${CSS.escape(el.id)}"]`)) bits.push(textOf(l));
      }
      const p = el.closest('label');
      if (p) bits.push(textOf(p));
      const alt = el.getAttribute('alt');
      if (alt) bits.push(alt);
      const title = el.getAttribute('title');
      if (title) bits.push(title);
      return bits.join(' ').replace(/\s+/g, ' ').trim();
    }
    const els = [];
    for (const el of document.querySelectorAll('body *')) {
      if (els.length >= cap) break;
      if (!visible(el)) continue;
      const tag = el.tagName.toLowerCase();
      const roleAttr = el.getAttribute('role') || '';
      const type = el.getAttribute('type') || '';
      const href = el.getAttribute('href') || '';
      const text = textOf(el).slice(0, 240);
      const sampledRole = roleAttr || nativeRoleInPage(tag, type, href);
      const box = el.getBoundingClientRect();
      const focusable = focusableByMarkup(el);
      const isFormField = fieldLike(el);
      const isInteractive = focusable || /^(button|link|checkbox|switch|tab|menuitem|combobox|radio|slider)$/.test(sampledRole);
      if (!focusable && !isFormField && !sampledRole && !text) continue;
      els.push({
        xpath: xpathOf(el),
        text,
        hasText: text.length > 0,
        focusable,
        isInteractive,
        isFormField,
        roleAttr,
        sampledRole,
        axRole: sampledRole,
        axName: labelledText(el),
        tag,
        type,
        box: { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) },
        inModal: !!el.closest('[role="dialog"],dialog,[aria-modal="true"]'),
        underOverlay: false,
        hasHoverContent: false,
        // C8 small-signal applicability facts (parity with eval-page.js so the ACT lane exercises the families).
        complexImageHint: (tag === 'img' || tag === 'svg' || tag === 'canvas' || roleAttr === 'img') && (!!el.closest('figure') || roleAttr === 'figure' || el.hasAttribute('aria-describedby')),
        tabindexEffective: (() => { const ti = el.getAttribute('tabindex'); return ti !== null ? +ti : (['a', 'button', 'input', 'select', 'textarea', 'summary'].includes(tag) && !el.disabled ? 0 : null); })(),
        hasGlyphText: (() => { let ot = ''; for (const n of el.childNodes) if (n.nodeType === 3) ot += n.textContent; return [...ot].some((ch) => { const c = ch.codePointAt(0); return (c >= 0xE000 && c <= 0xF8FF) || (c >= 0xF0000 && c <= 0xFFFFD) || (c >= 0x100000 && c <= 0x10FFFD); }) || (/[Ѐ-ӿͰ-Ͽ]/.test(ot) && /[a-zA-Z]/.test(ot)); })(),
        splitFieldGroup: (() => { if (tag !== 'input' && tag !== 'select') return false; const ml = parseInt(el.getAttribute('maxlength'), 10); if (!(Number.isFinite(ml) && ml <= 6)) return false; const grp = el.closest('fieldset, [role=group], form, div'); if (!grp) return false; return [...grp.querySelectorAll('input:not([type=hidden]):not([type=submit]):not([type=button]), select')].filter((i) => { const m = parseInt(i.getAttribute('maxlength'), 10); return Number.isFinite(m) && m <= 6; }).length >= 2; })(),
      });
    }
    return {
      title: document.title || '',
      lang: document.documentElement.getAttribute('lang') || '',
      elements: els,
      reflowApplicable: false,
    };
  }, ELEMENT_CAP);

  return {
    file,
    sourceUrl: tc.url,
    runId,
    pageDigest,
    collectedAt,
    elements: data.elements || [],
    elementCount: (data.elements || []).length,
    page: { reflowApplicable: !!data.reflowApplicable },
    structure: { title: data.title || '', lang: data.lang || '' },
  };
}

function normalizeCollectRoles(collect) {
  for (const el of collect.elements || []) {
    if (!el.sampledRole) el.sampledRole = nativeRole(el.tag, el.type, el.href);
    if (!el.axRole) el.axRole = el.sampledRole || el.roleAttr || '';
  }
  return collect;
}

function comparableObservations(results, scs) {
  const want = new Set(scs);
  const out = [];
  for (const o of (results.shadowObservations || [])) {
    if (o.source !== 'deterministic' || !want.has(o.sc)) continue;
    const outcome = o.wouldBe && o.wouldBe.observationOutcome;
    if (outcome !== 'BARRIER_OBSERVED' && outcome !== 'NO_BARRIER_OBSERVED') continue;
    out.push({
      sc: o.sc,
      claimFamily: o.claimFamily,
      mechanism: o.mechanism,
      outcome,
      targetXpath: o.observationScope && o.observationScope.actionTargetRef,
      reason: o.reason || null,
    });
  }
  return out;
}

function score(expected, observations, scs) {
  if (!(scs || []).some((sc) => DETERMINISTIC_SCS.has(sc))) return 'outOfScope';
  const hasBarrier = observations.some((o) => o.outcome === 'BARRIER_OBSERVED');
  const hasClear = observations.some((o) => o.outcome === 'NO_BARRIER_OBSERVED');
  if (expected === 'failed') {
    if (hasBarrier) return 'tp';
    if (hasClear) return 'clearOnFailed';
    return 'fn';
  }
  if (hasBarrier) return 'fp';
  if (hasClear) return 'tnWithClear';
  return 'tn';
}

function summarize(raw) {
  const summary = {
    generatedAt: new Date().toISOString(),
    n: raw.length,
    maxAutomatic: MAX_AUTO,
    elementCap: ELEMENT_CAP,
    deterministicScs: [...DETERMINISTIC_SCS].sort(),
    v3: { tp: 0, fn: 0, fp: 0, tn: 0, tnWithClear: 0, clearOnFailed: 0, outOfScope: 0, error: 0, total: 0, comparableTotal: 0 },
    bySc: {},
    mismatchReview: [],
  };
  for (const rec of raw) {
    summary.v3.total++;
    if (rec.error) { summary.v3.error++; continue; }
    summary.v3[rec.bucket]++;
    if (!['outOfScope', 'error'].includes(rec.bucket)) summary.v3.comparableTotal++;
    for (const sc of rec.sc) {
      const scBucket = DETERMINISTIC_SCS.has(sc) ? rec.bucket : 'outOfScope';
      summary.bySc[sc] = summary.bySc[sc] || { tp: 0, fn: 0, fp: 0, tn: 0, tnWithClear: 0, clearOnFailed: 0, outOfScope: 0, error: 0, total: 0, comparableTotal: 0, observations: 0 };
      summary.bySc[sc].total++;
      summary.bySc[sc][scBucket]++;
      if (!['outOfScope', 'error'].includes(scBucket)) summary.bySc[sc].comparableTotal++;
      summary.bySc[sc].observations += (rec.observations || []).filter((o) => o.sc === sc).length;
    }
    if (['fn', 'fp', 'clearOnFailed'].includes(rec.bucket)) {
      summary.mismatchReview.push({
        testcaseId: rec.testcaseId,
        ruleId: rec.ruleId,
        ruleName: rec.ruleName,
        sc: rec.sc,
        expected: rec.expected,
        bucket: rec.bucket,
        url: rec.url,
        observations: (rec.observations || []).slice(0, 10),
        note: 'Needs adjudication: ACT rule-level truth may not match the v3 claim-family assertion.',
      });
    }
  }
  const decided = summary.v3.tp + summary.v3.fn + summary.v3.fp + summary.v3.tn;
  summary.v3.recallOnFailed = summary.v3.tp + summary.v3.fn ? summary.v3.tp / (summary.v3.tp + summary.v3.fn) : null;
  summary.v3.fpRateOnNonFailed = summary.v3.fp + summary.v3.tn ? summary.v3.fp / (summary.v3.fp + summary.v3.tn) : null;
  summary.v3.decisionAgreement = decided ? (summary.v3.tp + summary.v3.tn) / decided : null;

  // ---- flag-based LANES (coverage view): v3 / axe / union, overall + per SC (subset/axe mode) ----
  if (raw.some((r) => r.lanes)) {
    const blank = () => ({ tp: 0, fn: 0, fp: 0, tn: 0, outOfScope: 0 });
    const rates = (b) => ({ ...b, recall: b.tp + b.fn ? +(b.tp / (b.tp + b.fn)).toFixed(3) : null, fpRate: b.fp + b.tn ? +(b.fp / (b.fp + b.tn)).toFixed(3) : null });
    const names = [...new Set(raw.flatMap((r) => Object.keys(r.lanes || {})))];
    const overall = Object.fromEntries(names.map((n) => [n, blank()]));
    const bySc = {};
    for (const rec of raw) {
      if (rec.error || !rec.lanes) continue;
      for (const n of names) { const b = rec.lanes[n]; if (b) overall[n][b]++; }
      for (const sc of rec.sc || []) {
        bySc[sc] = bySc[sc] || Object.fromEntries(names.map((n) => [n, blank()]));
        for (const n of names) { const b = rec.lanes[n]; if (b) bySc[sc][n][b]++; }
      }
    }
    summary.lanes = { overall: Object.fromEntries(names.map((n) => [n, rates(overall[n])])),
      bySc: Object.fromEntries(Object.entries(bySc).map(([sc, ls]) => [sc, Object.fromEntries(names.map((n) => [n, rates(ls[n])]))])) };
  }
  return summary;
}

async function main() {
  if (SUMMARIZE_ONLY) {
    const rawPath = path.join(OUT, 'raw.json');
    if (!fs.existsSync(rawPath)) throw new Error(`cannot --summarize-only; raw not found: ${rawPath}`);
    const raw = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
    const summary = summarize(raw);
    fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 2));
    console.log(JSON.stringify(summary.v3, null, 2));
    console.log(`rewrote ${path.join(OUT, 'summary.json')}`);
    return;
  }
  let selected;
  if (SUBSET) {
    // project-scoped local subset: SCs are pre-resolved (direct + technique) by build-sc-subset.js.
    const subPath = path.join(SUBSET_DIR, 'subset.json');
    if (!fs.existsSync(subPath)) throw new Error(`subset not found: ${subPath} — run build-sc-subset.js first`);
    selected = JSON.parse(fs.readFileSync(subPath, 'utf8'));
    // default: approved rules only. `--proposed` also includes draft rules (built via build-sc-subset.js
    // --include-proposed). Records predating the `approved` tag are treated as approved (back-compat).
    if (!PROPOSED && !DRAFT_ONLY) selected = selected.filter((tc) => tc.approved !== false);
    if (DRAFT_ONLY) selected = selected.filter((tc) => tc.approved === false); // draft cases only
  } else {
    if (!fs.existsSync(ACT_JSON)) throw new Error(`ACT testcase JSON not found: ${ACT_JSON}`);
    const all = JSON.parse(fs.readFileSync(ACT_JSON, 'utf8')).testcases || [];
    selected = all
      .filter((tc) => tc.approved || tc.isApproved)
      .map((tc) => ({ ...tc, sc: scsFromAct(tc) }))
      .filter((tc) => tc.sc.length && ['failed', 'passed', 'inapplicable'].includes(tc.expected));
  }
  if (RULE) selected = selected.filter((tc) => tc.ruleId === RULE);
  if (SC) selected = selected.filter((tc) => tc.sc.includes(SC));
  if (STRATIFIED) selected = stratifiedPick(selected, LIMIT);
  if (Number.isFinite(LIMIT) && LIMIT > 0) selected = selected.slice(0, LIMIT);

  // --resume: carry forward already-scored records and run only the remainder (raw.json is rewritten from
  // the in-memory `raw` each iteration, so prepopulating it preserves prior cases).
  const raw = [];
  if (RESUME && fs.existsSync(path.join(OUT, 'raw.json'))) {
    try {
      const prior = JSON.parse(fs.readFileSync(path.join(OUT, 'raw.json'), 'utf8'));
      const done = new Set(prior.map((r) => `${r.ruleId}|${r.testcaseId}`)); // testcaseIds are shared across ACT rules — key on both
      raw.push(...prior);
      const before = selected.length;
      selected = selected.filter((tc) => !done.has(`${tc.ruleId}|${tc.testcaseId}`));
      console.log(`resume: ${prior.length} prior records; skipping ${before - selected.length}, running ${selected.length} remaining`);
    } catch (e) { console.log(`resume: could not read prior raw.json (${e.message}); running full set`); }
  }

  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  for (const [i, tc] of selected.entries()) {
    const runId = `v3-act-${tc.testcaseId}`;
    const rec = {
      source: 'w3c-act-v3',
      index: i,
      testcaseId: tc.testcaseId,
      ruleId: tc.ruleId,
      ruleName: tc.ruleName,
      sc: tc.sc,
      expected: tc.expected,
      approved: tc.approved !== false, // false ⇒ proposed/draft rule
      url: tc.url,
      observations: [],
    };
    console.log(`[${i + 1}/${selected.length}] ${tc.ruleId} ${tc.expected} ${tc.sc.join(',')} ${tc.testcaseTitle || ''}`);
    const page = await browser.newPage();
    try {
      await withTimeout((async () => {
      const collect = normalizeCollectRoles(await collectForV3(page, tc, runId));
      if (AXE) rec.axe = await runAxe(page); // axe on the loaded page (v3 experiments run in a separate browser)
      const drive = { file: collect.file, runId, pageDigest: collect.pageDigest, drivenAt: collect.collectedAt + 1, elements: [] };
      const { built, experiments } = await orchestrate(collect, drive, {
        resolveUrl: () => urlFor(tc),
        executablePath: CHROME,
        now: collect.collectedAt + 2,
        maxAutomatic: Number.isFinite(MAX_AUTO) ? MAX_AUTO : Infinity,
        budgetOpts: { maxRunWallClockMs: RUN_WALL }, // deterministic lane bounded by TIME (2 min), not count
        runLlm: LLM_ON,
        runAgent: LLM_ON ? LLM_AGENT : undefined,
        captureVision: LLM_ON,
        experimentConcurrency: Math.min(LIMITS.concurrency.experimentCap, Math.max(1, +(process.env.V3_EXPERIMENT_CONCURRENCY || LIMITS.concurrency.experiment))), // DETERMINISTIC lane: default 1 = byte-identical serial; opt into parallel tab-copies, hard cap 6
        llmConcurrency: +(process.env.V3_LLM_CONCURRENCY || LIMITS.concurrency.llm),
        llmTools: LLM_TOOLS, llmTransportConfig: LLM_TRANSPORT_CONFIG, // PHASE 2 live CDP tools
        llmToolConcurrency: +(process.env.V3_LLM_TOOL_CONCURRENCY || LIMITS.concurrency.llmTool),
        llmToolMaxTurns: +(process.env.V3_LLM_TOOL_MAX_TURNS || LIMITS.llm.toolMaxTurns),
        llmToolRunTimeoutMs: +(process.env.V3_LLM_TOOL_RUN_TIMEOUT_MS || LIMITS.llm.toolRunTimeoutMs),
      });
      if (!built.ok) {
        rec.error = `v3 build refused: ${built.errors.slice(0, 8).join('; ')}`;
      } else {
        rec.v3Summary = built.results.summary;
        rec.obligations = built.results.summary.obligations;
        rec.autoPartial = built.results.summary.autoPartial;
        rec.observations = comparableObservations(built.results, tc.sc);
        rec.experimentResults = ((experiments && experiments.results) || [])
          .filter((r) => (tc.sc || []).includes(r.sc))
          .map((r) => ({
            claimId: r.claimId,
            experimentId: r.experimentId,
            sc: r.sc,
            targetXpath: r.targetXpath,
            completed: r.completed,
            valid: r.valid,
            outcome: r.outcome,
            measurement: r.measurement,
          }));
        rec.bucket = score(tc.expected, rec.observations, tc.sc);
      }
      })(), CASE_TIMEOUT, `${tc.ruleId}/${tc.testcaseId.slice(0, 8)}`);
    } catch (e) {
      rec.error = String(e && e.stack || e);
    } finally {
      await page.close().catch(() => {});
    }
    if (!rec.bucket && !rec.error) rec.bucket = score(tc.expected, rec.observations || [], tc.sc);
    // flag-based lanes (coverage view): v3 (deterministic), axe (scanner), and their union.
    const v3Flag = (rec.observations || []).some((o) => o.outcome === 'BARRIER_OBSERVED');
    const axeFlag = !!(AXE && rec.axe && Array.isArray(rec.axe.violations) && rec.axe.violations.some((v) => tc.sc.includes(v.sc)));
    // axe's INCOMPLETE (needs-review) lane was collected but never consulted, so a case axe flagged FOR REVIEW
    // (e.g. aria-prohibited-attr, frame-title-unique) read as "axe silent" in bothFail. Record it as a SEPARATE
    // review signal — NOT folded into axeFlag (review is not a decided barrier; folding it would over-flag).
    const axeReview = !!(AXE && rec.axe && Array.isArray(rec.axe.incomplete) && rec.axe.incomplete.some((v) => tc.sc.includes(v.sc)));
    rec.v3Flag = v3Flag; rec.axeFlag = axeFlag; rec.axeReview = axeReview;
    // COVERAGE view: all lanes scored over the WHOLE subset (a lane that structurally doesn't attempt an SC
    // scores it as uncovered, not "out of scope") — so v3-deterministic's gaps on its non-catalog SCs and
    // axe's fill-in are both visible on one denominator. (summary.v3 above keeps the catalog-only view.)
    rec.lanes = {
      v3: scoreLane(tc.expected, v3Flag, true),
      ...(AXE ? { axe: scoreLane(tc.expected, axeFlag, true), union: scoreLane(tc.expected, v3Flag || axeFlag, true) } : {}),
    };
    raw.push(rec);
    fs.writeFileSync(path.join(OUT, 'raw.json'), JSON.stringify(raw, null, 2));
    fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summarize(raw), null, 2));
  }
  await browser.close();
  const summary = summarize(raw);
  fs.writeFileSync(path.join(OUT, 'raw.json'), JSON.stringify(raw, null, 2));
  fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary.v3, null, 2));
  if (summary.lanes) {
    console.log('\n=== coverage lanes (flag-based: recall on ACT-failed / FP on ACT-not-failed) ===');
    for (const [n, b] of Object.entries(summary.lanes.overall)) {
      console.log(`  ${n.padEnd(6)} recall ${b.recall == null ? '-' : (100 * b.recall).toFixed(0) + '%'} (${b.tp}/${b.tp + b.fn})   fp ${b.fpRate == null ? '-' : (100 * b.fpRate).toFixed(0) + '%'} (${b.fp}/${b.fp + b.tn})`);
    }
  }
  console.log(`wrote ${OUT}`);
}

main().catch((e) => { console.error(e.stack || e.message); process.exit(1); });
