#!/usr/bin/env node
'use strict';
// Run the v3 deterministic harness over the ACT-REST EXPANSION corpus (the 8 out-of-paper-scope SCs), scoring
// the new static-DOM runners against ACT expected outcomes. Twin of run-v3-act-suite.js --subset --local, but:
//   • the corpus is act-rest/subset.json (DISJOINT from the frozen 581-case act-subset/ gate), filtered to the
//     expansion rules declared in expansion-scope.json (default: Round 1 static-deterministic rules);
//   • the collector additionally captures the Round-1 applicability facts (autocomplete / !important spacing)
//     and the head <meta> elements (viewport + first refresh), with a navigation FREEZE so a meta-refresh
//     fixture does not wander off-page during collection;
//   • scoring is per ACT rule (dev vs held-out split reported separately) — NEVER mixed with the 581 gate.
//
// NO LLM, NO authority promotion — the runners land as source:'deterministic' SHADOW observations (exactly
// what run-v3-act-suite.js scores). Usage:
//   node run-v3-act-rest-suite.js                       (all Round-1 rules)
//   node run-v3-act-rest-suite.js --rule=73f2c2         (one rule)
//   node run-v3-act-rest-suite.js --split=dev|heldout   (only the dev or held-out fixtures)

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const puppeteer = require('puppeteer');

const { orchestrate } = require('../../scripts/v3/lib/orchestrator.js');
const { CATALOG } = require('../../scripts/v3/lib/catalog.js');
const LIMITS = require('../../scripts/v3/lib/limits.js');

const REPO_ROOT = path.join(__dirname, '..', '..');
require('../../scripts/v3/lib/load-env.js').loadEnv(REPO_ROOT);

const CHROME = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const REST_DIR = path.join(__dirname, 'act-rest');
const SCOPE = require('./expansion-scope.json');

function arg(name, def = null) {
  const p = process.argv.find((x) => x === `--${name}` || x.startsWith(`--${name}=`));
  if (!p) return def;
  return p === `--${name}` ? true : p.slice(name.length + 3);
}
const RULE = arg('rule', null);
const ROUND = arg('round', '1-static-deterministic');
const SPLIT = arg('split', null); // 'dev' | 'heldout' | null (both)
const LIMIT = Number(arg('limit', 0));
const CASE_TIMEOUT = Number(arg('case-timeout', process.env.V3_ACT_CASE_TIMEOUT || LIMITS.act.caseTimeoutMs));
const MAX_AUTO = Number(arg('max-auto', process.env.V3_ACT_MAX_AUTO || LIMITS.act.maxAuto));
const ELEMENT_CAP = Number(arg('element-cap', process.env.V3_ACT_ELEMENT_CAP || LIMITS.act.elementCap));
const RUN_WALL = Number(arg('run-wall-ms', process.env.V3_ACT_RUN_WALL_MS || LIMITS.act.runWallClockMs));
const RESUME = !!arg('resume', false);
const OUT = path.join(__dirname, 'upstream-evidence', arg('out', 'v3-act-rest'));
fs.mkdirSync(OUT, { recursive: true });

const DETERMINISTIC_SCS = new Set(Object.values(CATALOG.experiments).map((e) => e.sc));

// HELD-OUT split: the fixtures the plan (§§3–7) marks held-out — the axe/checker blind-spot cases + boundaries.
// Dev = everything else. These are matched by testcaseId prefix so they can be run/reported separately and were
// NOT used to debug the runners. (The runners are spec-derived, so dev and held-out are expected to agree.)
const HELD_OUT_PREFIXES = new Set([
  // 1.4.4 b4f0c3 — the invalid-token pair axe leniently passes
  'c94a59f8', '9f288c28',
  // 2.2.1 bc659a — the exactly-72000 boundary
  '5d4d5b21',
  // 1.4.12 78fd32 — the px line-height case axe misses (20px/20px) + an empty-div inapplicable
  '67159173',
]);
const isHeldOut = (tc) => [...HELD_OUT_PREFIXES].some((p) => tc.testcaseId.startsWith(p));

function withTimeout(promise, ms, label) {
  let t;
  const timeout = new Promise((_, rej) => { t = setTimeout(() => rej(new Error(`case-timeout ${ms}ms (${label})`)), ms); });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(t));
}
function digestForUrl(url) { return 'sha256:url:' + crypto.createHash('sha256').update(String(url)).digest('hex'); }
function urlFor(tc) { return 'file://' + path.join(REST_DIR, tc.localPath); }

function nativeRole(tag, type, href) {
  tag = String(tag || '').toLowerCase(); type = String(type || '').toLowerCase();
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

// Freeze navigation: allow the first document load, abort any later top-frame document navigation (a
// meta-refresh / JS redirect), so a refresh fixture's meta is read on the ORIGINAL page. (Matches
// run-rest-suite.js.) A 0-second refresh may still race the abort; those are ACT-passed so an absent
// meta ⇒ no 2.2.1 obligation ⇒ correct `tn`, never a false clear/barrier.
async function freezeNavigation(page) {
  let mainNav = 0;
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    try {
      const isMainDoc = req.resourceType() === 'document' && req.frame() === page.mainFrame();
      if (isMainDoc && ++mainNav > 1) return req.abort();
      req.continue();
    } catch (e) { try { req.continue(); } catch (_) {} }
  });
}

async function collectForV3(page, tc, runId) {
  await freezeNavigation(page);
  await page.goto(urlFor(tc), { waitUntil: 'load', timeout: 45000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 250));
  const collectedAt = Date.now();
  const data = await page.evaluate((cap) => {
    function nativeRoleInPage(tag, type, href) {
      tag = String(tag || '').toLowerCase(); type = String(type || '').toLowerCase();
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
      const tag = e.tagName.toLowerCase();
      let idx = 1;
      for (let s = e.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === e.tagName) idx++;
      return xpathOf(e.parentElement) + '/' + tag + '[' + idx + ']';
    }
    function visible(el) {
      const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
      return cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity || '1') !== 0 && r.width > 0 && r.height > 0;
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
      const tag = el.tagName.toLowerCase(); const role = el.getAttribute('role') || '';
      return ['input', 'select', 'textarea'].includes(tag) || /^(textbox|combobox|listbox|spinbutton|searchbox)$/.test(role);
    }
    function labelledText(el) {
      const bits = [];
      const aria = el.getAttribute('aria-label'); if (aria) bits.push(aria);
      for (const id of (el.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean)) { const n = document.getElementById(id); if (n) bits.push(textOf(n)); }
      if (el.id) for (const l of document.querySelectorAll(`label[for="${CSS.escape(el.id)}"]`)) bits.push(textOf(l));
      const p = el.closest('label'); if (p) bits.push(textOf(p));
      const alt = el.getAttribute('alt'); if (alt) bits.push(alt);
      const title = el.getAttribute('title'); if (title) bits.push(title);
      return bits.join(' ').replace(/\s+/g, ' ').trim();
    }
    const EXEMPT_INPUT = new Set(['hidden', 'button', 'submit', 'reset', 'image', 'checkbox', 'radio', 'file']);
    function autocompleteApplicable(el, tag, type) {
      if (!(['input', 'select', 'textarea'].includes(tag) || fieldLike(el))) return false;
      const ac = el.getAttribute('autocomplete');
      if (ac == null || ac.trim() === '') return false;
      const first = ac.trim().toLowerCase().split(/\s+/)[0];
      if (first === 'on' || first === 'off') return false;
      if (el.disabled === true || el.getAttribute('aria-disabled') === 'true') return false;
      if (tag === 'input' && EXEMPT_INPUT.has(type)) return false;
      return visible(el);
    }
    const CASCADE_KW = new Set(['inherit', 'unset', 'revert', 'revert-layer']);
    function spacingImportant(el) {
      const props = ['letter-spacing', 'word-spacing', 'line-height'];
      // a cascade-deferring keyword (inherit/unset/revert) at !important does not LOCK a value ⇒ inapplicable
      const locks = props.some((p) => el.style.getPropertyPriority(p) === 'important' && !CASCADE_KW.has((el.style.getPropertyValue(p) || '').trim().toLowerCase()));
      if (!locks) return false;
      const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
      const vis = cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity || '1') > 0 && r.width > 0 && r.height > 0 && r.bottom > 0 && r.right > 0;
      return vis && (el.textContent || '').trim().length > 0;
    }
    // valid refresh content per the HTML shared-refresh algorithm (leading time, then ;/,/whitespace/end).
    function validRefreshContent(content) {
      if (content == null) return false;
      const mm = content.match(/^[ \t\n\f\r]*(\d+(?:\.\d+)?)/);
      if (!mm) return false;
      const after = content.slice(mm[0].length);
      return !(after.length && !/^[;,\s]/.test(after));
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
        xpath: xpathOf(el), text, hasText: text.length > 0, focusable, isInteractive, isFormField,
        roleAttr, sampledRole, axRole: sampledRole, axName: labelledText(el), tag, type,
        box: { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) },
        inModal: !!el.closest('[role="dialog"],dialog,[aria-modal="true"]'), underOverlay: false, hasHoverContent: false,
        // ACT-REST Round 1 applicability facts (the family gates; the runner re-measures the verdict)
        autocompleteApplicable: autocompleteApplicable(el, tag, type),
        spacingImportant: spacingImportant(el),
      });
    }
    // Head <meta> elements: the first http-equiv=refresh (2.2.1) + name=viewport (1.4.4). Element-level (not
    // page-level) so the applicability observer resolves the target and the runner's barrier can bind + score.
    const metaEls = [];
    // the FIRST meta refresh with a VALID content is the ACT target (an earlier invalid one is skipped).
    const firstValidRefresh = [...document.querySelectorAll('meta[http-equiv="refresh" i]')].find((m) => validRefreshContent(m.getAttribute('content')));
    if (firstValidRefresh) {
      metaEls.push({ xpath: xpathOf(firstValidRefresh), tag: 'meta', roleAttr: '', sampledRole: '', axRole: '', hasText: false, focusable: false, isFormField: false, metaRefreshValid: true, metaContent: firstValidRefresh.getAttribute('content') });
    }
    // ACT b4f0c3 applies to EACH keyed viewport meta; mint ONE obligation (target = the first KEYED viewport
    // meta) so a non-keyed first meta cannot mask a later keyed one. The runner reads ALL viewport metas.
    const keyedViewport = [...document.querySelectorAll('meta[name="viewport" i]')].find((m) => /(^|[,;\s])(user-scalable|maximum-scale)\s*=/i.test(m.getAttribute('content') || ''));
    if (keyedViewport) {
      metaEls.push({ xpath: xpathOf(keyedViewport), tag: 'meta', roleAttr: '', sampledRole: '', axRole: '', hasText: false, focusable: false, isFormField: false, metaViewportKeyed: true, metaContent: keyedViewport.getAttribute('content') });
    }
    for (const m of metaEls) if (els.length < cap) els.push(m);
    return { title: document.title || '', lang: document.documentElement.getAttribute('lang') || '', elements: els, reflowApplicable: false };
  }, ELEMENT_CAP).catch(() => ({ elements: [] }));

  return {
    file: `act:${tc.testcaseId}`, sourceUrl: tc.url, runId, pageDigest: digestForUrl(tc.url), collectedAt,
    elements: data.elements || [], elementCount: (data.elements || []).length,
    page: { reflowApplicable: false }, structure: { title: data.title || '', lang: data.lang || '' },
  };
}

function normalizeCollectRoles(collect) {
  for (const el of collect.elements || []) {
    if (el.tag === 'meta') continue;
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
    out.push({ sc: o.sc, claimFamily: o.claimFamily, mechanism: o.mechanism, outcome, targetXpath: o.observationScope && o.observationScope.actionTargetRef });
  }
  return out;
}

// SC-scoped confusion bucket vs the ACT expected label. barrier on failed = tp; barrier on passed/inapplicable
// = fp; a clear counts as a (correct-direction) abstain-with-signal on non-failed and as clearOnFailed on failed.
function score(expected, observations) {
  const hasBarrier = observations.some((o) => o.outcome === 'BARRIER_OBSERVED');
  const hasClear = observations.some((o) => o.outcome === 'NO_BARRIER_OBSERVED');
  if (expected === 'failed') { if (hasBarrier) return 'tp'; if (hasClear) return 'clearOnFailed'; return 'fn'; }
  if (hasBarrier) return 'fp';
  if (hasClear) return 'tnWithClear';
  return 'tn';
}

function confusion() { return { tp: 0, fn: 0, fp: 0, tn: 0, tnWithClear: 0, clearOnFailed: 0, error: 0, total: 0 }; }
function summarize(raw) {
  const byRule = {}; const byRuleSplit = { dev: {}, heldout: {} };
  const perSc = {};
  for (const rec of raw) {
    const bucket = rec.error ? 'error' : rec.bucket;
    const rid = rec.ruleId; const split = rec.heldOut ? 'heldout' : 'dev';
    byRule[rid] = byRule[rid] || confusion(); byRule[rid].total++; byRule[rid][bucket]++;
    byRuleSplit[split][rid] = byRuleSplit[split][rid] || confusion(); byRuleSplit[split][rid].total++; byRuleSplit[split][rid][bucket]++;
    for (const sc of rec.sc.filter((s) => DETERMINISTIC_SCS.has(s))) { perSc[sc] = perSc[sc] || confusion(); perSc[sc].total++; perSc[sc][bucket]++; }
  }
  const rate = (c) => ({ ...c, recall: c.tp + c.fn ? +(c.tp / (c.tp + c.fn)).toFixed(3) : null, fpRate: c.fp + c.tn + c.tnWithClear ? +(c.fp / (c.fp + c.tn + c.tnWithClear)).toFixed(3) : null });
  const mapRates = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, rate(v)]));
  return { generatedAt: new Date().toISOString(), n: raw.length, deterministicScs: [...DETERMINISTIC_SCS].sort(), byRule: mapRates(byRule), byRuleSplit: { dev: mapRates(byRuleSplit.dev), heldout: mapRates(byRuleSplit.heldout) }, perSc: mapRates(perSc), mismatches: raw.filter((r) => ['fp', 'fn', 'clearOnFailed'].includes(r.bucket) || r.error).map((r) => ({ ruleId: r.ruleId, testcaseId: r.testcaseId, expected: r.expected, bucket: r.error ? 'error' : r.bucket, heldOut: r.heldOut, observations: r.observations, error: r.error })) };
}

async function main() {
  const all = JSON.parse(fs.readFileSync(path.join(REST_DIR, 'subset.json'), 'utf8'));
  const roundRules = new Set(Object.values(SCOPE.rounds[ROUND] || {}).flat());
  let selected = all.filter((tc) => roundRules.has(tc.ruleId) && ['failed', 'passed', 'inapplicable'].includes(tc.expected));
  if (RULE) selected = selected.filter((tc) => tc.ruleId === RULE);
  selected = selected.map((tc) => ({ ...tc, heldOut: isHeldOut(tc) }));
  if (SPLIT === 'dev') selected = selected.filter((tc) => !tc.heldOut);
  if (SPLIT === 'heldout') selected = selected.filter((tc) => tc.heldOut);
  if (Number.isFinite(LIMIT) && LIMIT > 0) selected = selected.slice(0, LIMIT);

  const raw = [];
  if (RESUME && fs.existsSync(path.join(OUT, 'raw.json'))) {
    try { const prior = JSON.parse(fs.readFileSync(path.join(OUT, 'raw.json'), 'utf8')); const done = new Set(prior.map((r) => r.testcaseId)); raw.push(...prior); selected = selected.filter((tc) => !done.has(tc.testcaseId)); } catch (e) {}
  }

  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage', '--allow-file-access-from-files'] });
  for (const [i, tc] of selected.entries()) {
    const rec = { testcaseId: tc.testcaseId, ruleId: tc.ruleId, ruleName: tc.ruleName, sc: tc.sc, expected: tc.expected, heldOut: tc.heldOut, url: tc.url, observations: [] };
    console.log(`[${i + 1}/${selected.length}] ${tc.ruleId} ${tc.expected}${tc.heldOut ? ' (held-out)' : ''} ${tc.testcaseId.slice(0, 8)}`);
    const page = await browser.newPage();
    try {
      await withTimeout((async () => {
        const collect = normalizeCollectRoles(await collectForV3(page, tc, `v3-actrest-${tc.testcaseId}`));
        const drive = { file: collect.file, runId: collect.runId, pageDigest: collect.pageDigest, drivenAt: collect.collectedAt + 1, elements: [] };
        const { built } = await orchestrate(collect, drive, {
          resolveUrl: () => urlFor(tc), executablePath: CHROME, now: collect.collectedAt + 2,
          maxAutomatic: Number.isFinite(MAX_AUTO) ? MAX_AUTO : Infinity, budgetOpts: { maxRunWallClockMs: RUN_WALL },
          runLlm: false, experimentConcurrency: 1,
        });
        if (!built.ok) rec.error = `v3 build refused: ${built.errors.slice(0, 6).join('; ')}`;
        else { rec.observations = comparableObservations(built.results, tc.sc); rec.bucket = score(tc.expected, rec.observations); rec.obligations = built.results.summary.obligations; rec.autoPartial = built.results.summary.autoPartial; }
      })(), CASE_TIMEOUT, `${tc.ruleId}/${tc.testcaseId.slice(0, 8)}`);
    } catch (e) { rec.error = String((e && e.stack) || e).slice(0, 400); }
    finally { await page.close().catch(() => {}); }
    if (!rec.bucket && !rec.error) rec.bucket = score(tc.expected, rec.observations || []);
    raw.push(rec);
    fs.writeFileSync(path.join(OUT, 'raw.json'), JSON.stringify(raw, null, 2));
    fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summarize(raw), null, 2));
  }
  await browser.close();
  const summary = summarize(raw);
  fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log('\n=== per-rule confusion (dev + held-out combined) ===');
  for (const [rid, c] of Object.entries(summary.byRule)) console.log(`  ${rid}: tp=${c.tp} fn=${c.fn} fp=${c.fp} tn=${c.tn} tnClear=${c.tnWithClear} clearOnFailed=${c.clearOnFailed} err=${c.error} | recall=${c.recall} fpRate=${c.fpRate}`);
  console.log(`wrote ${OUT}`);
}

main().catch((e) => { console.error(e.stack || e.message); process.exit(1); });
