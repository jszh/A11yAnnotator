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
const { makeRunAgent, makeClaudeSdkTransport } = require('../../scripts/v3/lib/llm-agent-adapter.js');
const LIMITS = require('../../scripts/v3/lib/limits.js');
const { sensoryWordsIn } = require('../../scripts/v3/lib/sensory-lexicon.js'); // Round 3 (1.3.3) requirement-sourced pre-filter

const REPO_ROOT = path.join(__dirname, '..', '..');
require('../../scripts/v3/lib/load-env.js').loadEnv(REPO_ROOT);

// LLM lane (Round 3, 1.3.3) — gated exactly like run-v3-act-suite.js: V3_LLM=1 activates the Claude Code
// subscription judge (Agent SDK + CLAUDE_CODE_OAUTH_TOKEN in .env; no metered key). OFF by default = the
// deterministic-only run. The rubric lane is non-authoritative (LLM PROVISIONAL ceiling); nothing gates.
const LLM_ON = process.env.V3_LLM === '1';
const LLM_TRANSPORT_CONFIG = LLM_ON ? {
  oauthToken: process.env.CLAUDE_CODE_OAUTH_TOKEN,
  model: process.env.V3_LLM_MODEL || 'claude-sonnet-4-6',
  effort: process.env.V3_LLM_EFFORT || 'medium',
  perTurnTimeoutMs: +(process.env.V3_LLM_TURN_TIMEOUT_MS || LIMITS.llm.perTurnTimeoutMs),
  runTimeoutMs: +(process.env.V3_LLM_RUN_TIMEOUT_MS || LIMITS.llm.runTimeoutMs),
} : undefined;
const LLM_AGENT = LLM_ON ? makeRunAgent({ transport: makeClaudeSdkTransport(LLM_TRANSPORT_CONFIG), model: LLM_TRANSPORT_CONFIG.model }) : null;

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
// 2.4.1 (Round 2): develop against cf77f2 only; ye5d6e + 3e12e1 are the RULE-LEVEL held-out generalization check
// (the individual skip-link-focus-move / collapse limbs), run once at the end.
const HELD_OUT_RULES = new Set(['ye5d6e', '3e12e1']);
const isHeldOut = (tc) => HELD_OUT_RULES.has(tc.ruleId) || [...HELD_OUT_PREFIXES].some((p) => tc.testcaseId.startsWith(p));

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
      // ownText = the element's OWN direct text nodes (for the 1.3.3 sensory pre-filter — target the text
      // node's element, not every ancestor whose innerText transitively contains the word).
      let ownText = ''; for (const c of el.childNodes) if (c.nodeType === 3) ownText += c.textContent;
      els.push({
        xpath: xpathOf(el), text, ownText: ownText.replace(/\s+/g, ' ').trim().slice(0, 400), hasText: text.length > 0, focusable, isInteractive, isFormField,
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
    // Round-3 FIX 1 (ba678638 evidence starvation): mirror the production collector (act-page-collect.js:942) —
    // thread the heading tree + landmark set (role + accessible name) into `structure`. The 1.3.3 rubric's
    // non-visual-reference alternative needs this: a page with exactly ONE `navigation` landmark UNAMBIGUOUSLY
    // resolves "the navigation on the right" (ACT 9bd38c Passed Ex), whereas two unnamed navs do not; a heading's
    // text supplies the "visible words" alternative. Names via the same labelledText heuristic used for elements
    // (a plain <nav>/<h2> yields name:'' — an unnamed landmark carries role only, exactly the bare-nav case).
    const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role=heading]')].slice(0, 60).map((h) => {
      const tg = h.tagName.toLowerCase();
      return {
        tag: tg, role: h.getAttribute('role') || (/^h[1-6]$/.test(tg) ? 'heading' : null),
        level: h.getAttribute('aria-level') ? Number(h.getAttribute('aria-level')) : (/^h([1-6])$/.test(tg) ? Number(tg[1]) : null),
        text: (h.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120),
        name: labelledText(h),
      };
    });
    const landmarks = [...document.querySelectorAll('main,nav,header,footer,aside,[role=main],[role=navigation],[role=banner],[role=contentinfo],[role=complementary],[role=search],[role=region]')].slice(0, 40)
      .map((l) => ({ tag: l.tagName.toLowerCase(), role: l.getAttribute('role') || null, name: labelledText(l) }));
    return { title: document.title || '', lang: document.documentElement.getAttribute('lang') || '', elements: els, reflowApplicable: false, headings, landmarks };
  }, ELEMENT_CAP).catch(() => ({ elements: [] }));

  // Round 2 — SC 59br37 (1.4.4) applicability must be evaluated at the 640x512 zoom-equivalent viewport (some
  // fixtures only clip via @media (max-width:640px)). A dedicated 640x512 pass finds each nearest clip-ancestor
  // wrapping a visible applicable text node and mints ONE obligation targeting it; the runner (also at 640x512)
  // decides clipped-or-not. Done AFTER the main collection so the default-viewport facts are unaffected.
  await page.setViewport({ width: 640, height: 512, deviceScaleFactor: 1 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 120));
  const clipEls = await page.evaluate(() => {
    function xpathOf(e) { if (!e || !e.tagName) return ''; if (e === document.documentElement) return '/html'; const tag = e.tagName.toLowerCase(); let idx = 1; for (let s = e.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === e.tagName) idx++; return xpathOf(e.parentElement) + '/' + tag + '[' + idx + ']'; }
    const seen = new Set(); const out = [];
    const tw = document.createTreeWalker(document.body || document.documentElement, NodeFilter.SHOW_TEXT);
    let n; while ((n = tw.nextNode())) {
      if (!n.textContent.trim()) continue;
      const p = n.parentElement; if (!p) continue;
      if (p.namespaceURI && p.namespaceURI !== 'http://www.w3.org/1999/xhtml') continue; // SVG/MathML parent ⇒ inapplicable
      const pc = getComputedStyle(p); if (pc.display === 'none' || pc.visibility === 'hidden') continue; // not visible
      let ah = false; for (let a = p; a; a = a.parentElement) if (a.getAttribute && a.getAttribute('aria-hidden') === 'true') { ah = true; break; }
      if (ah) continue;
      // nearest ancestor with overflow-x/y hidden or clip
      let clip = null; for (let a = p; a; a = a.parentElement) { const cs = getComputedStyle(a); if (/(hidden|clip)/.test(cs.overflowX) || /(hidden|clip)/.test(cs.overflowY)) { clip = a; break; } }
      if (!clip || !clip.tagName) continue;
      const xp = xpathOf(clip); if (seen.has(xp)) continue; seen.add(xp);
      out.push(xp);
      if (out.length >= 40) break;
    }
    return out;
  }).catch(() => []);
  for (const xp of clipEls) (data.elements = data.elements || []).push({ xpath: xp, tag: 'zoomclip', hasText: false, focusable: false, isFormField: false, zoomClipApplicable: true });

  // Round 2 — SC efbfc7 (2.2.2): detect auto-updating INNER TEXT via two snapshots ~1.6s apart (only when the
  // page runs script — auto-updating text needs JS). Mints a motion-control obligation on each element whose OWN
  // text node changed (the innermost ticker). The runner re-confirms + drives the pause controls.
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 }).catch(() => {});
  const autoUpdated = await page.evaluate(async () => {
    if (!document.querySelector('script')) return [];
    function xpathOf(e) { if (!e || !e.tagName) return ''; if (e === document.documentElement) return '/html'; const t = e.tagName.toLowerCase(); let i = 1; for (let s = e.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === e.tagName) i++; return xpathOf(e.parentElement) + '/' + t + '[' + i + ']'; }
    const directText = (el) => { let t = ''; for (const c of el.childNodes) if (c.nodeType === 3) t += c.textContent; return t.trim(); };
    const cand = [...document.querySelectorAll('body *')].filter((el) => directText(el).length > 0);
    const before = new Map(cand.map((el) => [el, directText(el)]));
    await new Promise((r) => setTimeout(r, 1600));
    const changed = [];
    for (const el of cand) { if (directText(el) !== before.get(el)) { changed.push({ xpath: xpathOf(el), liveRegion: !!el.closest('[aria-live],[role=status],[role=alert],[role=log],output') }); } if (changed.length >= 10) break; }
    return changed;
  }).catch(() => []);
  for (const c of autoUpdated) (data.elements = data.elements || []).push({ xpath: c.xpath, tag: 'autoupdate', hasText: false, focusable: false, isFormField: false, autoUpdatingText: true, liveRegion: c.liveRegion });

  // Round 2 — SC cf77f2 (2.4.1): mint ONE body-scoped bypass obligation when the page has ≥1 visible repeated
  // block (nav/aside/header/footer or the matching landmark roles). The runner does the full limb analysis.
  const hasRepeated = await page.evaluate(() => {
    const REPEATED = 'nav,aside,header,footer,[role=navigation],[role=complementary],[role=banner],[role=contentinfo]';
    return [...document.querySelectorAll(REPEATED)].some((el) => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0; });
  }).catch(() => false);
  if (hasRepeated) (data.elements = data.elements || []).push({ xpath: '/html/body', tag: 'bypass', hasText: false, focusable: false, isFormField: false, bypassApplicable: true });

  // Round 3 — SC 9bd38c (1.3.3): the REQUIREMENT-SOURCED sensory-word pre-filter gates APPLICABILITY (which text
  // nodes owe an obligation). Runs in NODE over each element's OWN direct text (not ancestors) so the obligation
  // targets the text node's element; the LLM rubric judges whether a non-visual alternative exists.
  for (const el of (data.elements || [])) {
    if (el.tag === 'meta' || el.tag === 'zoomclip' || el.tag === 'autoupdate' || el.tag === 'bypass') continue;
    const words = sensoryWordsIn(el.ownText || '');
    if (words.length) { el.sensoryWordHint = true; el.sensoryWords = words; }
  }

  return {
    file: `act:${tc.testcaseId}`, sourceUrl: tc.url, runId, pageDigest: digestForUrl(tc.url), collectedAt,
    elements: data.elements || [], elementCount: (data.elements || []).length,
    page: { reflowApplicable: false }, structure: { title: data.title || '', lang: data.lang || '', headings: data.headings || [], landmarks: data.landmarks || [] },
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

// LLM lane (Round 3) — score the LLM's PROVISIONAL ledger fills for the testcase's SC(s). The rubric verdict
// maps: REPRODUCED → PROVISIONAL barrier (cleared:false); NOT REPRODUCED → PROVISIONAL clear (cleared:true);
// PARTIAL/N-A → no fill (stays auto-PARTIAL = abstain). Non-authoritative (canary-ceiling), scored vs the ACT label.
function scoreLlmLane(results, tc) {
  const want = new Set(tc.sc);
  const ledger = (results && results.obligationLedger) || [];
  const prov = ledger.filter((r) => r.disposition === 'PROVISIONAL' && want.has(r.sc));
  const provBarrier = prov.filter((r) => !r.cleared);
  const provClear = prov.filter((r) => r.cleared);
  const abstain = ledger.filter((r) => want.has(r.sc) && r.disposition === 'PARTIAL' && r.autoPartial).length;
  const hasBarrier = provBarrier.length > 0; const hasClear = provClear.length > 0;
  let bucket;
  if (tc.expected === 'failed') bucket = hasBarrier ? 'tp' : (hasClear ? 'clearOnFailed' : 'fn');
  else bucket = hasBarrier ? 'fp' : (hasClear ? 'tnWithClear' : 'tn');
  return { bucket, provBarrier: provBarrier.length, provClear: provClear.length, abstain, barrierXpaths: provBarrier.map((r) => r.xpath).slice(0, 5), mechanisms: [...new Set(prov.map((r) => (r.provisional && r.provisional.mechanism) || '').filter(Boolean))] };
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
  // LLM lane confusion (Round 3): per-rule, from rec.llm.bucket when the LLM ran.
  const llmByRule = {}; let anyLlm = false;
  for (const rec of raw) {
    if (!rec.llm) continue; anyLlm = true;
    llmByRule[rec.ruleId] = llmByRule[rec.ruleId] || confusion(); llmByRule[rec.ruleId].total++; llmByRule[rec.ruleId][rec.error ? 'error' : rec.llm.bucket]++;
  }
  const out = { generatedAt: new Date().toISOString(), n: raw.length, deterministicScs: [...DETERMINISTIC_SCS].sort(), byRule: mapRates(byRule), byRuleSplit: { dev: mapRates(byRuleSplit.dev), heldout: mapRates(byRuleSplit.heldout) }, perSc: mapRates(perSc), mismatches: raw.filter((r) => ['fp', 'fn', 'clearOnFailed'].includes(r.bucket) || r.error).map((r) => ({ ruleId: r.ruleId, testcaseId: r.testcaseId, expected: r.expected, bucket: r.error ? 'error' : r.bucket, heldOut: r.heldOut, observations: r.observations, error: r.error })) };
  if (anyLlm) {
    out.llm = { byRule: mapRates(llmByRule), cases: raw.filter((r) => r.llm).map((r) => ({ testcaseId: r.testcaseId, expected: r.expected, llmBucket: r.error ? 'error' : r.llm.bucket, provBarrier: r.llm.provBarrier, provClear: r.llm.provClear, abstain: r.llm.abstain })) };
  }
  return out;
}

async function main() {
  const all = JSON.parse(fs.readFileSync(path.join(REST_DIR, 'subset.json'), 'utf8'));
  // --round: a single round key, or 'all' to union the IMPLEMENTED rounds (R1+R2 = the 197-case regression view;
  // round 3's LLM lane is not built, so 'all' excludes it to avoid scoring an unimplemented SC).
  const roundKeys = ROUND === 'all' ? ['1-static-deterministic', '2-dynamic-instruments'] : [ROUND];
  const roundRules = new Set(roundKeys.flatMap((k) => Object.values(SCOPE.rounds[k] || {}).flat()));
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
          experimentConcurrency: 1,
          // LLM lane (Round 3): judge only THIS testcase's SC(s) (restrictScs) — the LLM is unscoreable off-target
          // (per-SC ACT ground truth) and it caps the slice cost. Vision captured so the rubric sees the page.
          runLlm: LLM_ON, runAgent: LLM_ON ? LLM_AGENT : undefined, captureVision: LLM_ON,
          llmConcurrency: +(process.env.V3_LLM_CONCURRENCY || LIMITS.concurrency.llm),
          restrictScs: LLM_ON ? new Set(tc.sc) : undefined,
        });
        if (!built.ok) rec.error = `v3 build refused: ${built.errors.slice(0, 6).join('; ')}`;
        else {
          rec.observations = comparableObservations(built.results, tc.sc); rec.bucket = score(tc.expected, rec.observations);
          rec.obligations = built.results.summary.obligations; rec.autoPartial = built.results.summary.autoPartial;
          if (LLM_ON) { rec.llm = scoreLlmLane(built.results, tc); }
        }
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
  console.log('\n=== per-rule confusion (DETERMINISTIC lane; dev + held-out combined) ===');
  for (const [rid, c] of Object.entries(summary.byRule)) console.log(`  ${rid}: tp=${c.tp} fn=${c.fn} fp=${c.fp} tn=${c.tn} tnClear=${c.tnWithClear} clearOnFailed=${c.clearOnFailed} err=${c.error} | recall=${c.recall} fpRate=${c.fpRate}`);
  if (summary.llm) {
    console.log('\n=== LLM lane confusion (non-authoritative PROVISIONAL; shadow-scored vs ACT labels) ===');
    for (const [rid, c] of Object.entries(summary.llm.byRule)) console.log(`  ${rid}: tp=${c.tp} fn=${c.fn} fp=${c.fp} tn=${c.tn} tnClear=${c.tnWithClear} clearOnFailed=${c.clearOnFailed} err=${c.error} | recall=${c.recall} fpRate=${c.fpRate}`);
  }
  console.log(`wrote ${OUT}`);
}

// Export the eval collector + helpers so the fp-experiments freezer can reuse the EXACT eval-side collection
// (the 1.3.3 sensory pre-filter + the FIX-1 headings/landmarks structure threading), which the production
// collectActPage does not do (DEFERRED-TODO J). Only run the CLI when invoked directly.
module.exports = { collectForV3, normalizeCollectRoles, urlFor, isHeldOut, REST_DIR, ELEMENT_CAP };
if (require.main === module) main().catch((e) => { console.error(e.stack || e.message); process.exit(1); });
