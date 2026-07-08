// Harness 3.3 — C2: QualWeb as an AUTHORITATIVE two-lane checker. Unlike axe (C0) and IBM (C1), which are
// non-authoritative shadow cross-signals (HARNESS-3.3-IMPLEMENTATION.md §2), QualWeb's per-page ACT-rule
// output is wired as an obligation DISPOSITION on the strength of the verified counterfactual
// (docs/analysis/coverage/TARGETED-MULTI-CHECKER-COUNTERFACTUAL.md, commit b49c0236 — the "fully
// production-honest" portfolio: R 99.1 / P 91.7 / F1 0.953 on the 799). The user approved authority for
// THIS lane; the §2 invariant is deliberately carved out for QualWeb only.
//
// TWO LANES, NO CURATED RULE LIST (everything derives from QualWeb's own rule metadata + its per-page
// aggregate outcome):
//   • BARRIER  — a QualWeb ACT rule whose page-aggregate outcome is `failed` publishes an AUTHORITATIVE
//     barrier on the matching obligation(s). (Costs the one rule-level FP in the 799, afw4f7/ab4691ef,
//     while rescuing the residual 1.3.1 FN d0f69e/6bb6ca5d — QW-ACT-R39 catches th-assigned-cells that
//     axe only reviews.)
//   • DEFINITIVE-SILENT CLEAR — a QualWeb-implemented rule that is APPLICABLE to the page (aggregate
//     outcome `passed`) and emitted NEITHER a `failed` NOR a `warning` settles the matching obligation(s)
//     as checker-cleared, so they never reach the LLM. A `warning` (review) BLOCKS the clear — that gate
//     is what keeps the judgment rules (contrast afw4f7/R37, link-purpose fd3a94/R44) routed to the LLM.
//     The `passed`-applicability requirement is STRICTER than the counterfactual's rule-level silence: a
//     rule that emitted only `inapplicable` (never looked at a construct v3 enumerated) does NOT clear —
//     this is what makes the lane carry ZERO false-clears where the raw counterfactual lost fd3a94/8dc58c48.
//
// CONSTRUCT-GRANULAR: a rule's decision maps ONLY to obligations whose construct matches that rule's
// applicability (QW-ACT-R17/23a2a8 owns IN-TREE `<img>` name obligations; it must NOT clear a
// removed-from-tree decorative image — that belongs to the e88epe decorative lane, whose cross-rule
// catches must survive). Whole-SC suppression is WRONG. The construct predicate is applied in build-v3
// against the collector's element facts (removedFromA11yTree / decorativeConflict / tag / role) via
// MATCHERS below; the 1.3.1 structural rules (R33/R36/R38/R39) map their BARRIER onto the page-level
// info-relationships obligation but are EXCLUDED from the clear lane precisely because no single one of
// them clears the whole page's relationships.
//
// INERT BY DEFAULT-OFF SWITCH: V3_QUALWEB=0 disables the lane (behaviour degrades to exactly pre-QualWeb).
// The live runner lazy-requires @qualweb/core (present under eval/checker-comparison/node_modules); if the
// package is absent it returns `checkerUnavailable` rather than silently contributing nothing — engine
// availability must not quietly change results, exactly like checker-ibm.js.
'use strict';

const path = require('path');
const { createRequire } = require('module');

// tool-metadata map (code → { actId, sc[], name }), generated from @qualweb/act-rules by
// data/gen-qualweb-act-map.js. Sourced from the tool's own rule metadata, NEVER from corpus ground truth.
const QW_ACT_MAP = require('./data/qualweb-act-map.json');

// ── Construct matchers (applied in build-v3 against a collector element) ────────────────────────────────
// Each maps a QualWeb rule's applicability domain to a predicate over a v3 collector element. Degrades
// gracefully when a fact is absent (e.g. the simplified ACT-suite collector has no removedFromA11yTree ⇒
// an image reads as in-tree, which is correct for that offline corpus); the production collector supplies
// the full facts so a decorative image is correctly excluded from the R17 clear.
const isImageEl = (el) => /^(img|image|figure)$/.test(String(el.axRole || el.sampledRole || el.roleAttr || '')) || el.isImage === true || String(el.tag).toLowerCase() === 'img';
const inTree = (el) => el.removedFromA11yTree !== true && el.decorativeConflict !== true && el.backgroundImageMeaningful !== true;
const roleOf = (el) => String(el.axRole || el.sampledRole || el.roleAttr || '').toLowerCase();
const tagOf = (el) => String(el.tag || '').toLowerCase();
const MATCHERS = Object.freeze({
  // 1.1.1 non-text-content — image family split by the exact construct each QualWeb rule owns.
  img: (el) => isImageEl(el) && tagOf(el) !== 'svg' && tagOf(el) !== 'object' && !(tagOf(el) === 'input' && String(el.type).toLowerCase() === 'image') && inTree(el), // R17/23a2a8
  svg: (el) => tagOf(el) === 'svg' && inTree(el),                                                        // R21/7d6734
  object: (el) => tagOf(el) === 'object',                                                                // R42/8fc3b6
  imageButton: (el) => tagOf(el) === 'input' && String(el.type).toLowerCase() === 'image',              // R6/59796f
  // 4.1.2 name-role-value — role/tag-precise.
  button: (el) => roleOf(el) === 'button' || tagOf(el) === 'button' || (tagOf(el) === 'input' && /^(button|submit|reset)$/.test(String(el.type).toLowerCase())), // R11/97a4e1
  formField: (el) => el.isFormField === true || /^(textbox|combobox|listbox|spinbutton|searchbox|slider)$/.test(roleOf(el)),  // R16/e086e5
  link: (el) => roleOf(el) === 'link' || (tagOf(el) === 'a' && (el.href != null || String(el.tag).toLowerCase() === 'a')),    // R12/c487ae (4.1.2 limb)
  iframe: (el) => tagOf(el) === 'iframe',                                                                // R19/cae760, R70/akn7bn
  menuitem: (el) => /^menuitem(checkbox|radio)?$/.test(roleOf(el)),                                      // R66/m6b1q3
  // page-level obligation targets (matched by their pseudo-xpath in build-v3, not an element predicate).
  pageTitle: () => false,
  pageInfoRel: () => false,
});

// ── POLICY: QualWeb ACT rule (by ACT id) → the v3 obligation families its BARRIER / CLEAR map onto ──────
// Derived from each rule's SEMANTICS (its metadata name + SC), NOT from corpus performance. A rule absent
// here contributes no ledger disposition (it can still flag its own case rule-level in the eval), which is
// the correct behaviour for the ARIA-validity nits that carry no WCAG SC (R20/R25/R27/R28/R34…). Each
// family entry: { sc, family, matchId, page? }. `clear:false` ⇒ the family barriers but never clears.
//
// CLEAR-ELIGIBILITY RULE (the sound criterion): a rule may CLEAR a v3 family only when the rule's `passed`
// FULLY decides that family's whole question AND no OTHER lane (another ACT rule OR a v3 LLM rubric /
// instrument) tests a different facet of the same obligation (a "cross-rule / cross-lane sibling"). A
// single rule's pass must never whole-family-suppress a sibling's barrier.
//
// CONCLUSION (adversarial verification, SHIP-WITH-FIXES): NO current family is clear-eligible — the CLEAR
// lane is EMPTY. Every candidate has a live LLM sibling on the same v3 obligation that a name/title-PRESENCE
// pass cannot decide, so clearing would suppress a real barrier (invisible to the deterministic corpus,
// which runs with no LLM/instrument observations). The BARRIER lane is unchanged and keeps the full measured
// benefit. Each family below is `clear:false` with the sibling that disqualifies it:
//   • IMAGE name rules 23a2a8/7d6734/8fc3b6 + 59796f 1.1.1 limb — v3 `non-text-content` is alt-ADEQUACY
//     (alt-text-adequacy / decorative-image-verification rubric + the e88epe decorative-conflict lane).
//   • IFRAME name rule cae760 — 4b1c6c tests iframe name-EQUIVALENCE on the same 4.1.2 obligation.
//   • PAGE TITLE 2779a5 — the `page-title-v0` rubric judges title DESCRIPTIVENESS (QualWeb's own sibling
//     rule c4a8a4); R1 only proves the title is non-empty. [BUG-1]
//   • 4.1.2 NAME-PRESENCE 97a4e1/e086e5/m6b1q3/c487ae(4.1.2 limb)/59796f(4.1.2 limb) — the
//     `accessible-name-adequacy-v0` rubric barriers a PRESENT-but-content-free name ("{{label}}", "undefined");
//     4.1.2 adequacy is a live rubric, so a name-PRESENCE pass is not authoritative. [BUG-2]
// To ADD a clear-eligible family later: prove the QualWeb rule's `passed` decides the v3 obligation's WHOLE
// question with NO LLM-rubric / instrument / cross-ACT-rule sibling on that obligation, and the build-v3
// cross-lane barrier-dominance guard (never clear an obligation any §5b lane would barrier) still applies.
const PAGE_TITLE = '/page-level::title';
const PAGE_INFOREL = '/page-level::info-relationships';
const QW_POLICY = Object.freeze({
  // 2.4.2 page title — BARRIER ONLY: page-title-v0 (descriptiveness) sibling; QualWeb's own c4a8a4 tests it. [BUG-1]
  '2779a5': { families: [{ sc: '2.4.2', family: 'page-title', matchId: 'pageTitle', page: PAGE_TITLE, clear: false }] },
  // 1.1.1 non-text-content IMAGE rules — BARRIER ONLY (alt-ADEQUACY + e88epe decorative cross-rule sibling).
  '23a2a8': { families: [{ sc: '1.1.1', family: 'non-text-content', matchId: 'img', clear: false }] },
  '7d6734': { families: [{ sc: '1.1.1', family: 'non-text-content', matchId: 'svg', clear: false }] },
  '8fc3b6': { families: [{ sc: '1.1.1', family: 'non-text-content', matchId: 'object', clear: false }] },
  '59796f': { families: [{ sc: '1.1.1', family: 'non-text-content', matchId: 'imageButton', clear: false }, { sc: '4.1.2', family: 'name-role-value', matchId: 'imageButton', clear: false }] },
  // 4.1.2 name-role-value NAME-PRESENCE rules — BARRIER ONLY: accessible-name-adequacy-v0 sibling. [BUG-2]
  '97a4e1': { families: [{ sc: '4.1.2', family: 'name-role-value', matchId: 'button', clear: false }] },
  'e086e5': { families: [{ sc: '4.1.2', family: 'name-role-value', matchId: 'formField', clear: false }] },
  // IFRAME name rule — BARRIER ONLY (4b1c6c name-equivalence cross-rule sibling on the same 4.1.2 obligation).
  'cae760': { families: [{ sc: '4.1.2', family: 'name-role-value', matchId: 'iframe', clear: false }] },
  'm6b1q3': { families: [{ sc: '4.1.2', family: 'name-role-value', matchId: 'menuitem', clear: false }] },
  // 2.4.4 + 4.1.2 link — BARRIER ONLY on both limbs: 4.1.2 name has the accessible-name-adequacy-v0 sibling [BUG-2],
  // 2.4.4 link-PURPOSE is a judgment rubric (R44/LLM owns it).
  'c487ae': { families: [{ sc: '4.1.2', family: 'name-role-value', matchId: 'link', clear: false }, { sc: '2.4.4', family: 'link-purpose', matchId: 'link', clear: false }] },
  // 4.1.2 structural (aria-hidden focusable / presentational children) — barrier only (no clean single-element clear predicate).
  '6cfa84': { families: [{ sc: '4.1.2', family: 'name-role-value', matchId: 'button', clear: false }] },
  '307n5z': { families: [{ sc: '4.1.2', family: 'name-role-value', matchId: 'button', clear: false }] },
  // 2.1.1 keyboard — iframe-tab-exclusion / scrollable-focus. Barrier maps to the iframe's keyboard obligation (minted if absent); no clear (structural).
  'akn7bn': { families: [{ sc: '2.1.1', family: 'keyboard-operable', matchId: 'iframe', clear: false }] },
  '0ssw9k': { families: [{ sc: '2.1.1', family: 'keyboard-operable', matchId: 'iframe', clear: false }] },
  // 1.3.1 structural rules — BARRIER onto the page-level info-relationships obligation; NEVER clear (a
  // single relationship check must not whole-SC-suppress the page's relationships — construct-granularity).
  'ff89c9': { families: [{ sc: '1.3.1', family: 'info-relationships', matchId: 'pageInfoRel', page: PAGE_INFOREL, clear: false }] },
  'a25f45': { families: [{ sc: '1.3.1', family: 'info-relationships', matchId: 'pageInfoRel', page: PAGE_INFOREL, clear: false }] },
  'bc4a75': { families: [{ sc: '1.3.1', family: 'info-relationships', matchId: 'pageInfoRel', page: PAGE_INFOREL, clear: false }] },
  'd0f69e': { families: [{ sc: '1.3.1', family: 'info-relationships', matchId: 'pageInfoRel', page: PAGE_INFOREL, clear: false }] },
  // 1.4.3 contrast / 2.4.4 link-purpose — JUDGMENT rules. Barrier when QualWeb `failed` (it rarely decides
  // these hard), but the clear lane is gated OFF: a `passed` is not authoritative for a judgment call, and
  // QualWeb usually `warning`s them anyway (which already blocks the clear). Keeps them routed to the LLM.
  'afw4f7': { families: [{ sc: '1.4.3', family: 'text-contrast', matchId: 'button', clear: false }] },
  'fd3a94': { families: [{ sc: '2.4.4', family: 'link-purpose', matchId: 'link', clear: false }] },
});

// actId → the QW-ACT code(s) that map to it (usually 1:1). Built once from the vendored metadata map.
const ACTID_TO_CODES = (() => {
  const m = Object.create(null);
  for (const [code, meta] of Object.entries(QW_ACT_MAP.rules || {})) (m[meta.actId] = m[meta.actId] || []).push(code);
  return m;
})();

// ── PURE CORE ───────────────────────────────────────────────────────────────────────────────────────
// normalizeQualweb: given the per-code page-aggregate outcomes, produce the lane decisions. `ruleOutcomes`
// is { [code]: 'passed'|'failed'|'warning'|'inapplicable' } (QualWeb's own metadata.outcome per ACT rule).
// Output: { barriers, clears, reviews }, each entry carrying the v3 family targets (with matchId/page) that
// build-v3 resolves against enumerated obligations. Only rules present in QW_POLICY (an SC-mapped construct)
// yield ledger targets — but ALL implemented rules are considered so a `failed` still records a barrier
// intent even if unmapped (build-v3 drops the unmapped ones). Deterministic + browser-free ⇒ unit-tested.
function normalizeQualweb(ruleOutcomes, opts = {}) {
  const kill = opts.killSwitch === true || String(process.env.V3_QUALWEB || '') === '0';
  if (kill || !ruleOutcomes || typeof ruleOutcomes !== 'object') return { ran: !kill && !!ruleOutcomes, disabled: kill, barriers: [], clears: [], reviews: [] };
  // aggregate per ACT id across its code(s): worst outcome wins (failed ▸ warning ▸ passed ▸ inapplicable).
  const rank = { failed: 3, warning: 2, passed: 1, inapplicable: 0 };
  const byAct = Object.create(null);
  for (const [code, outcome] of Object.entries(ruleOutcomes)) {
    const meta = QW_ACT_MAP.rules[code];
    if (!meta || !meta.actId) continue;
    const oc = String(outcome || 'inapplicable');
    if (!Object.prototype.hasOwnProperty.call(rank, oc)) continue;
    const cur = byAct[meta.actId];
    if (!cur || rank[oc] > rank[cur.outcome]) byAct[meta.actId] = { code, outcome: oc, actId: meta.actId };
    else if (cur && cur.code !== code && rank[oc] === rank[cur.outcome]) cur.code = cur.code; // stable
  }
  const barriers = [], clears = [], reviews = [];
  for (const [actId, r] of Object.entries(byAct)) {
    const pol = QW_POLICY[actId];
    if (r.outcome === 'failed') {
      barriers.push({ actId, code: r.code, families: pol ? pol.families.map((f) => ({ ...f })) : [] });
    } else if (r.outcome === 'warning') {
      reviews.push({ actId, code: r.code, families: pol ? pol.families.map((f) => ({ ...f })) : [] });
    } else if (r.outcome === 'passed') {
      // APPLICABLE + definitively clear. Only clear-enabled families settle; barrier-only families are skipped.
      const cf = pol ? pol.families.filter((f) => f.clear === true).map((f) => ({ ...f })) : [];
      if (cf.length) clears.push({ actId, code: r.code, families: cf });
    }
    // inapplicable ⇒ nothing (never looked at a construct — no barrier, no clear).
  }
  return { ran: true, disabled: false, barriers, clears, reviews };
}

// ── LIVE RUNNER (lazy, single shared instance, http url) ────────────────────────────────────────────────
// QualWeb renders file:// pages BLANK (it launches its own browser); callers MUST hand it an http URL (the
// eval twins stand up a localhost static server). `opts.qw` is a shared, already-started QualWeb instance
// (the QW_RESTART_EVERY leak workaround lives with the caller). Returns { ran, engineVersion, ruleOutcomes,
// barrierTargets } or { checkerUnavailable, reason }. `ruleOutcomes` feeds the pure core; `barrierTargets`
// carries the CSS pointers of failed/warning assertions for optional element-granular landing.
// @qualweb packages use an `exports` map, so resolve them BY NAME via a require bound to a package root
// that has them installed (a bare directory require ignores exports and fails). Try the repo root first
// (in case @qualweb is ever hoisted) then the eval install where it currently lives. Cached once resolved.
let _qwRequire = null;
function qwRequire() {
  if (_qwRequire) return _qwRequire;
  const roots = [
    path.join(__dirname, '..', '..', '..', 'package.json'),
    path.join(__dirname, '..', '..', '..', 'eval', 'checker-comparison', 'package.json'),
  ];
  for (const r of roots) {
    try { const req = createRequire(r); req.resolve('@qualweb/core'); _qwRequire = req; return req; } catch (e) { /* try next root */ }
  }
  throw new Error('@qualweb/core not resolvable from repo root or eval/checker-comparison');
}
function requireQualweb() { return qwRequire()('@qualweb/core'); }
function requireQualwebModules() {
  const req = qwRequire();
  return { ACTRules: req('@qualweb/act-rules').ACTRules, WCAGTechniques: req('@qualweb/wcag-techniques').WCAGTechniques };
}

// Extract per-ACT-code aggregate outcomes + failed/warning targets from a QualWeb page report.
function extractRuleOutcomes(rep) {
  const ruleOutcomes = {};
  const barrierTargets = {};
  const mod = rep && rep.modules && rep.modules['act-rules'];
  for (const [code, a] of Object.entries((mod && mod.assertions) || {})) {
    const oc = (a && a.metadata && a.metadata.outcome) || 'inapplicable';
    ruleOutcomes[code] = oc;
    if (oc === 'failed' || oc === 'warning') {
      const targets = [];
      for (const res of (a.results || [])) {
        if (res && (res.verdict === 'failed' || res.verdict === 'warning')) {
          for (const el of (res.elements || [])) if (el && (el.pointer || el.htmlCode)) targets.push(el.pointer || el.htmlCode);
        }
      }
      barrierTargets[code] = targets;
    }
  }
  return { ruleOutcomes, barrierTargets };
}

async function runQualweb(url, opts = {}) {
  if (String(process.env.V3_QUALWEB || '') === '0') return { ran: false, disabled: true, ruleOutcomes: {}, barrierTargets: {} };
  let QualWeb, mods;
  try { ({ QualWeb } = requireQualweb()); mods = requireQualwebModules(); }
  catch (e) { return { checkerUnavailable: true, reason: `@qualweb/core not installed (${e.message})` }; }
  let engineVersion = null; try { engineVersion = qwRequire()('@qualweb/core/package.json').version; } catch (e) {}
  const { ACTRules, WCAGTechniques } = mods;
  let qw = opts.qw, own = false;
  try {
    if (!qw) {
      qw = new QualWeb({});
      await qw.start({ maxConcurrency: 1, timeout: opts.timeout || 60000 }, { headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'], ...(opts.executablePath ? { executablePath: opts.executablePath } : {}) });
      own = true;
    }
    const ev = await qw.evaluate({ url, modules: [new ACTRules({}), new WCAGTechniques({})] });
    const rep = ev[url] || Object.values(ev)[0];
    const { ruleOutcomes, barrierTargets } = extractRuleOutcomes(rep);
    return { ran: true, engine: 'qualweb', engineVersion, ruleOutcomes, barrierTargets };
  } catch (e) {
    return { checkerUnavailable: true, reason: `QualWeb run failed: ${e.message}` };
  } finally {
    if (own && qw) await qw.stop().catch(() => {});
  }
}

module.exports = {
  normalizeQualweb, extractRuleOutcomes, runQualweb,
  QW_POLICY, MATCHERS, QW_ACT_MAP, ACTID_TO_CODES,
  PAGE_TITLE_XPATH: PAGE_TITLE, PAGE_INFOREL_XPATH: PAGE_INFOREL,
};
