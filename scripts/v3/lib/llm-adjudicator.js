// Harness 3.1 — the FOURTH evidence source: a whole-obligation LLM verdict, realized as a
// `source:'llm'` SHADOW-emitting mechanism (plan 3.1 §2/§3). It directly inherits the v2.9 per-skill
// agent evaluation, but — unlike a deterministic runner — it can NEVER publish authoritative: its
// outputs are shadow observations, scored against the hand-labeled gold before any promotion, and
// even then capped at `canary` (authority.js). This module is the untrusted lane, treated like
// judgments.js: the builder consumes its artifact as DATA, never gospel.
//
// Two halves:
//   • CONSUMER  — processLlm(): validate + bind + verdict-map a frozen `llm` artifact into v3 shadow
//     observations (structured-only; free text stays in the side `llm-rationale` artifact). build-v3
//     calls this; it is a pure function over the artifact.
//   • PRODUCER  — runAdjudication(): the offline fan-out that PRODUCES that artifact. It reuses the
//     v2.9 pure signal pre-compute (a11y-eval) + skill prompts, judges per (element, skill) under a
//     budget, and binds each verdict to (xpath, sc, family). The agent call is INJECTABLE so this is
//     testable with a stub and a live API run is a thin adapter — never an accidental call.
'use strict';

const V = require('./v3-schema.js');
const A = require('../../lib/a11y-eval.js');
const oracle = require('./applicability-oracle.js');
const { toolsForSubject, renderToolGuidance } = require('./cdp-tool-catalog.js');
const { detectConfusableText } = require('./confusable-text.js');
const { colorReferencesIn } = require('./color-reference-lexicon.js'); // F13 mint-reason signal (batch-3 #7)

const MECHANISM = 'llm-agent';
const V2_9_VERDICTS = ['REPRODUCED', 'NOT REPRODUCED', 'PARTIAL', 'N/A'];
const SCOPE_FIELDS = ['actionTargetRef', 'state', 'action', 'environment'];
const isStr = (v) => typeof v === 'string' && v.length > 0;
const isObj = (v) => v != null && typeof v === 'object' && !Array.isArray(v);

// A legacy verdict token in an OPAQUE-ID position (evidenceRef / id) would trip build-v3's strict
// scanner and cause a non-deterministic PUBLISH REFUSAL (3.1 §2.3 / C3). Ids are opaque, so we simply
// SCRUB any ref that is literally a legacy token — it carries no meaning as an id, and dropping it
// keeps the structured record legacy-token-free by construction.
const LEGACY = new Set(['REPRODUCED', 'NOT REPRODUCED', 'N/A']);
// coerce first (a boxed `new String('N/A')` is typeof 'object' but serializes to the bare token).
const isLegacyToken = (s) => s != null && LEGACY.has(String(s).trim().toUpperCase().replace(/\s+/g, ' '));
const scrubRefs = (refs) => (Array.isArray(refs) ? refs.map(String).filter((r) => !isLegacyToken(r)) : []);
// A legacy token in an agent-controlled STRUCTURAL field (claimFamily / xpath / id / scope subfield)
// must be rejected at validation — with a CLEAR message — not survive to the terminal strict scan
// (which would be a confusing non-deterministic publish refusal) or, worse, leak via a wrapper object.
const rejectLegacy = (E, p, field, val) => { if (val != null && isLegacyToken(val)) E.push(`${p}.${field} must not be a legacy verdict token ${JSON.stringify(String(val))} (v3 schema break)`); };

// ---- CONSUMER: validate the frozen `llm` artifact shape (closed records) ----
// NOTE on the field name `agentVerdict` (NOT `verdict`): the artifact carries the RAW v2.9 token
// ('REPRODUCED'/'NOT REPRODUCED'/'PARTIAL'/'N/A'). The bundle's lenient legacy scan checks the VALUE
// of any field literally named `verdict`, so storing a raw token under `verdict` would make the
// cross-artifact gate reject the whole bundle. `agentVerdict` is the untrusted agent's raw reply — a
// non-schema string, exactly what the lenient scan is designed to tolerate. processLlm maps it to a v3
// outcome; only the mapped v3 enum ever reaches `results` (strict-scanned).
function validateLlmShape(art) {
  const E = [];
  if (art == null) return E;
  if (!isObj(art)) return ['llm: must be an object'];
  if (!Array.isArray(art.verdicts)) return ['llm.verdicts must be an array'];
  const KEYS = ['verdictId', 'sc', 'claimFamily', 'targetXpath', 'observationScope', 'agentVerdict', 'confidence', 'evidenceRefs', 'rationaleRef'];
  art.verdicts.forEach((v, i) => {
    const p = `llm.verdicts[${i}]`;
    if (!isObj(v)) return E.push(`${p}: must be an object`);
    for (const k of Object.keys(v)) if (!KEYS.includes(k)) E.push(`${p}: unknown key ${JSON.stringify(k)}`);
    if (!isStr(v.verdictId)) E.push(`${p}.verdictId required`);
    if (!V.ALL_SCS.includes(v.sc)) E.push(`${p}.sc ${JSON.stringify(v.sc)} is not a known SC`);
    if (!isStr(v.targetXpath)) E.push(`${p}.targetXpath required`);
    if (!V2_9_VERDICTS.includes(v.agentVerdict)) E.push(`${p}.agentVerdict must be one of ${V2_9_VERDICTS.join('|')}`);
    if (v.confidence != null && !V.LLM_CONFIDENCE.includes(v.confidence)) E.push(`${p}.confidence must be ${V.LLM_CONFIDENCE.join('|')}`);
    if (v.evidenceRefs != null && !Array.isArray(v.evidenceRefs)) E.push(`${p}.evidenceRefs must be an array`);
    if (v.observationScope != null) {
      if (!isObj(v.observationScope)) E.push(`${p}.observationScope must be an object`);
      else {
        for (const f of SCOPE_FIELDS) { if (!isStr(v.observationScope[f])) E.push(`${p}.observationScope.${f} must be a non-empty string`); else rejectLegacy(E, `${p}.observationScope`, f, v.observationScope[f]); }
        // the obligation is matched by observationScope.actionTargetRef — it must AGREE with targetXpath,
        // or a verdict could silently fill a DIFFERENT element's obligation than the one it names (adversarial).
        if (isStr(v.observationScope.actionTargetRef) && isStr(v.targetXpath) && v.observationScope.actionTargetRef !== v.targetXpath)
          E.push(`${p}.observationScope.actionTargetRef ${JSON.stringify(v.observationScope.actionTargetRef)} must equal targetXpath ${JSON.stringify(v.targetXpath)}`);
      }
    }
    // agent-controlled STRUCTURAL strings reach results — they may never be a legacy token (a boxed
    // wrapper is coerced by isLegacyToken). evidenceRefs are SCRUBBED instead (opaque ids), not rejected.
    for (const f of ['verdictId', 'targetXpath', 'rationaleRef', 'claimFamily']) rejectLegacy(E, p, f, v[f]);
  });
  return E;
}

// Bind + verdict-map the artifact into v3 shadow observations. Returns { shadowObservations[], errors[] }.
// Every record is STRUCTURED-ONLY (enum / xpath / SC / opaque id) — the rationale stays in the side
// artifact, referenced by id. An unmappable verdict is an ERROR (fail closed), not a guessed direction.
function processLlm(llmArt, opts = {}) {
  const errors = validateLlmShape(llmArt);
  if (errors.length) return { shadowObservations: [], errors };
  const shadowObservations = [];
  for (const v of (llmArt && llmArt.verdicts) || []) {
    const outcome = V.mapVerdict(v.agentVerdict, V.V2_9_VERDICT_MAP);
    if (outcome == null) { errors.push(`llm agentVerdict ${JSON.stringify(v.agentVerdict)} for ${v.targetXpath}/${v.sc} is not mappable to a v3 outcome`); continue; }
    const scope = v.observationScope || { actionTargetRef: v.targetXpath };
    shadowObservations.push(V.llmShadowObservation({
      sc: v.sc,
      claimFamily: v.claimFamily || null,
      observationScope: scope,
      observationOutcome: outcome,
      // the LLM may not assert INAPPLICABLE — N/A is an abstention (→ INCONCLUSIVE/UNKNOWN, H1).
      wcagApplicability: outcome === 'INCONCLUSIVE' ? 'UNKNOWN' : 'APPLICABLE',
      mechanism: MECHANISM,
      confidence: v.confidence,
      evidenceRefs: scrubRefs(v.evidenceRefs),
      decisionCoverageRef: v.verdictId || null,
      rationaleRef: v.rationaleRef || null,
    }));
  }
  return { shadowObservations, errors };
}

// ============================ PRODUCER (offline; the agent call is injectable) ============================

// SUBJECT SELECTION (3.1 §3 Coverage): prioritize obligations that are auto-PARTIAL (no deterministic
// CLAIM) — those give the 14 runner-less SCs a gold-gradeable opinion for the first time. We judge per
// (element, skill) — NOT per obligation — so the fan-out is the element×skill grid, not element×sc (M4).
//
// PARTITION BY CONSTRUCTION (3.2): an SC that a more-specific atomic rubric covers is filled by that
// rubric ALONE — the whole-obligation agent SKIPS those rows (`ownedScs`), so the two LLM producers
// never co-fire on one cell. Without this the agent and the rubric both emit a `source:'llm'` shadow obs
// on the identical (xpath, sc, family) cell (the rubric SC set is a subset of the agent's), so on every
// such cell mergeProvisional pays two LLM calls + two vision-frame sets and the tie-break discards one on
// agreement. The agent stays the FALLBACK for the rubric-less SCs. We filter owned rows BEFORE the
// per-skill fan-out, so a skill still fires for any rubric-less SC it covers on the element and never
// binds its verdict to an owned SC.
function selectSubjects(collect, ledger, { onlyAutoPartial = true, ownedScs } = {}) {
  const elByXpath = {};
  for (const el of (collect && collect.elements) || []) if (el && el.xpath) elByXpath[el.xpath] = el;
  const structure = (collect && collect.structure) || null; // page facts threaded to page-structure subjects (Tier-0 #3)
  const owned = ownedScs instanceof Set ? ownedScs : new Set(ownedScs || []);
  const rows = (ledger || []).filter((r) => (onlyAutoPartial ? r.autoPartial : true) && !owned.has(r.sc));
  // collapse (xpath, sc, family) obligations to (xpath, skill) judging subjects.
  const seen = new Set();
  const subjects = [];
  for (const r of rows) {
    for (const skill of oracle.skillsForFamily(r.claimFamily)) {
      const key = `${r.xpath}::${skill}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const baseEl = elByXpath[r.xpath] || { xpath: r.xpath };
      const element = (structure && PAGE_STRUCTURE_SKILLS.has(skill)) ? { ...baseEl, __pageStructure: structure } : baseEl;
      subjects.push({ xpath: r.xpath, skill, sc: r.sc, claimFamily: r.claimFamily, element });
    }
  }
  return subjects;
}

// PAGE-LEVEL skills whose subject needs the whole-page structure (title/headings/landmarks/tables) threaded —
// a page-level synthetic xpath has no element, and per-element precompute is blind to page structure (Tier-0 #3).
// NOTE `focus-management` is deliberately NOT here: that skill is shared by 2.4.7 focus-visible, 2.4.11
// focus-not-obscured AND 2.4.3, and the first two are ELEMENT-level. The 2.4.3 page-level subject gets its
// structure attached by rubric id instead (see focus-order-meaning-v0 below), so widening this set cannot
// leak page facts into the element-level focus prompts.
const PAGE_STRUCTURE_SKILLS = new Set(['page-structure', 'grouping-and-reading-order']);

// PER-FACET RUBRIC GATING (Item 7, route-by-facet): some rubrics share an SC with a deterministic owner or apply
// to only a SUB-facet of the element type their SC enumerates. A gate returning false skips creating that
// (element, rubric) subject — keeping a settled-by-a-runner facet (computable contrast) or a wrong-facet image
// (a logo for long-description) out of the LLM lane. Element-level rubrics only; a missing element ⇒ skip (safe).
const RUBRIC_GATE = {
  // 1.3.1 now has TWO rubrics sharing sc:'1.3.1' (routing is by SC, not claimFamily — see selectRubricSubjects):
  // info-relationships-v0 owns the single PAGE-LEVEL pseudo-element (headings/lists/table-header-association);
  // field-programmatic-association-v0 owns PER-FIELD form-element rows (TT 5.C). Without these gates each would
  // also fire on the other's rows (info-relationships-v0 has no per-field judgment to make; the field rubric has
  // no page-level judgment to make) — wasted/nonsensical LLM calls, not just noise.
  'info-relationships-v0': (el) => !!el && el.xpath === oracle.PAGE_INFOREL_XPATH,
  'field-programmatic-association-v0': (el) => !!el && (el.isFormField === true || oracle.FORMFIELD_ROLE.test(el.role || el.roleAttr || el.axRole || el.sampledRole || '')),
  // ...and a THIRD (residual RCA S6): control-semantics-v0 is the F42 "emulated control" rubric. Its whole premise
  // is a collected FACT — `emulatedControl === true`, the element carries a script activation handler while being
  // NON-focusable, role-less, tabindex-less and containing no interactive descendant (act-page-collect.js:601/1165,
  // coverage-registry.js:94, applicability-oracle.js:366). Shipped WITHOUT a gate it inherited the by-SC routing and
  // fired on EVERY 1.3.1 row: measured on results/aug-annot-s9-tools it produced 116 verdicts across all 53 1.3.1
  // cases — the page-level `/page-level::info-relationships` pseudo-element in every single one, plus 63 form-field
  // rows — where the premise the rubric asserts as "settled, you do not need to re-derive" is FALSE. Handed a false
  // premise the model does not abstain: 84/116 came back LIKELY_OK (82 at high confidence), which then FILLS the
  // obligation and displaces the incumbent rubric's barrier verdict under mergeProvisional. Present in 5 of the 10
  // recall regressions. The gate is the same fact the oracle used to mint the obligation, so the rubric now fires
  // ONLY where its premise holds. It cannot collide with the two gates above: `emulatedControl` requires a
  // non-focusable, non-native-tag element, so it is never a form field, and never the page-level pseudo-xpath.
  // batch-3 #18 (defensive): `emulatedControlFocusable` is the SIBLING fact for the FOCUSABLE role-less
  // variant (same handler guards, tabindex>=0 / natively focusable, no interactive role) — the collector-side
  // fact is a sibling deliverable and may not be in the tree yet; feature-detected here so the lane opens the
  // moment it lands, and the gate is byte-inert until then. The rubric carries the matching premise branch.
  'control-semantics-v0': (el) => !!el && (el.emulatedControl === true || el.emulatedControlFocusable === true),
  // 7a: the complex-backdrop 1.4.3 rubric is for a NON-flat backdrop ONLY — a reliably COMPUTABLE ratio is owned
  // by the deterministic text-contrast-pixel runner (Tier-0 #2). Route only when the runner abstained.
  // `contrastReliable` was dead until the collector began emitting it, so this gate was unconditionally true in
  // production; switching it on drops every subject with a sound ratio. Passing ones SHOULD be dropped — that is
  // the facet the runner owns. A sound ratio that FAILS must not be: the subject is only here because the
  // deterministic runner abstained, so this rubric is the last lane that can see it.
  'contrast-over-complex-backdrop-v0': (el) => !!el && !(el.contrastReliable === true
    && Number.isFinite(el.contrastSolid) && Number.isFinite(el.contrastThreshold)
    && el.contrastSolid >= el.contrastThreshold),
  // 7b: long-description-completeness is for genuinely data-bearing images (figure / role=figure / aria-describedby);
  // a logo/icon gets alt-text-adequacy only (long-desc on a simple logo was UNCERTAIN noise on 2/3 of them). NOT a
  // decorative-suspect (removed-from-tree) image — the dedicated verification rubric owns that question.
  'long-description-completeness-v0': (el) => !!el && el.complexImageHint === true && !oracle.decorativeSuspect(el),
  // Decorative-verification lane: fires ONLY on a SUBSTANTIAL unnamed removed-from-tree image (the "is this genuinely
  // decorative or an informative image wrongly given alt=""?" redundancy call). The oracle mints its 1.1.1/1.4.5
  // obligation; this gate makes it the SOLE 1.1.1 rubric for that image (alt-text-adequacy is excluded below).
  'decorative-image-verification-v0': (el) => oracle.decorativeSuspect(el),
  // TT gap G3: the captcha-alternative rubric (1.1.1) fires ONLY on a detected CAPTCHA — without this gate it would
  // fire on every image's 1.1.1 obligation (routing is by SC).
  'captcha-alternative-v0': (el) => !!el && el.isCaptcha === true,
  // R2 G3-1/CC-1/CC-3: alt-text-adequacy is KEPT for a captcha that is an actual <img> (its alt still owes a
  // purpose description — TT 7.A.1.c — and captcha-alternative self-abstains to PARTIAL, so both run harmlessly);
  // it is skipped only for a captcha that is a non-image widget (div/iframe), where there is no alt to judge. This
  // also stops an over-broad isCaptcha FP (a non-captcha image with "captcha" in a class) from losing its alt judgment.
  // ...and NOT a decorative-suspect (unnamed removed-from-tree image): there is no author name/alt to judge there, so
  // the empty-alt would only false-barrier — the decorative-image-verification rubric owns that image's 1.1.1 instead.
  'alt-text-adequacy-v0': (el) => (!el || el.isCaptcha !== true || el.isImage === true) && !oracle.decorativeSuspect(el),
  // #9 fix: accessible-name-adequacy-v0 ALSO shares sc:'4.1.2' (frame-title/iframe-name/accessible-name rows) —
  // without this gate auto-update-notification-v0 would fire on every 4.1.2 row (any iframe/link/button), not just
  // the timer-driven carousel the collector actually flagged. Confirmed live: without this gate, real DHS pages
  // routed the rubric onto plain iframes/links and produced malformed/empty prompts that OpenAI rejected outright.
  'auto-update-notification-v0': (el) => !!el && el.autoUpdatingContent === true,
};

// PER-FACET CLAIM-FAMILY BINDING (companion to RUBRIC_GATE). A gate decides WHETHER a rubric fires on an element;
// this map decides WHICH of that element's claim-families its verdict is bound to — i.e. which OBLIGATION the
// verdict fills. Routing is by SC, and an element can own several families on ONE SC, so without this the binding
// is "whichever family the oracle happened to emit first" (see the FACET REBIND in selectRubricSubjects). Declare
// an entry ONLY for a rubric that answers a specific, separately-enumerated facet; the obligations.js facet
// precedence is the second half of the same rule (an off-facet verdict may not CLEAR a facet it did not answer).
const RUBRIC_FAMILY = {
  'long-description-completeness-v0': 'long-description', // 1.1.1 — "is the LONG DESCRIPTION complete", not "is the NAME adequate"
  'alt-text-adequacy-v0': 'non-text-content',             // 1.1.1 — the alt/name-adequacy facet
};

// 2.4.2 TITLE ↔ PRIMARY-HEADING CORRESPONDENCE (companion to resolveSummaryField's per-subject join; same
// principle — remove a REASONING STEP by handing over the fact, rather than adding rubric prose telling the
// judge to reason more carefully). page-title-v0's F25/TT-12.B clause is anchored on the page's own main
// heading, and the judge was left to identify that heading off a screenshot and perform the word-level
// comparison itself. Both of the SC's residual errors on results/aug-annot-s{9,10}-tools are failures of that
// step and not of the judgment: on one page the <title> contains the <h1> VERBATIM and the judge failed it for
// omitting a subtitle line; on another the <title> is a strict PREFIX of the <h1> and the judge read that as a
// match and cleared. This computes both answers deterministically.
//
// PRIMARY HEADING = the first heading that a sighted user would read as the page naming itself: the first
// level-1 heading that is neither aria-hidden nor rendered off-screen; if the page has none, the first
// non-hidden heading at the SHALLOWEST level present. Hidden/off-screen headings are excluded because they do
// not present the page's identity to anyone. No heading, or no title ⇒ null (the rubric keeps today's
// read-it-from-the-viewport behaviour), never a guess.
//
// COMPARISON is word-level and diacritic/case-insensitive, NOT a substring test: a title is only credited with
// carrying the heading when EVERY content word of the heading also appears in the title. Function words are
// dropped on both sides so "Contact us" vs "Contact ..." is not a difference of substance, and the residue is
// reported verbatim so the rubric's "quote the exact words the heading has and the title lacks" step is
// answerable from the signal instead of from the crop. This is a FACT about two strings, never a verdict:
// a title can carry every heading word and still fail 2.4.2 on other grounds (a placeholder, a contradiction
// elsewhere), and a title can drop heading words that identify nothing.
//
// APERTURE, measured over the 926-page eval/act-augmented corpus: 47 pages have no <h1>, and of the rest the
// split is 468 carries / 411 drops (53.2% / 46.8%) — a balanced discriminator, not a blanket clear.
const _TITLE_FUNCTION_WORDS = new Set([
  'the', 'a', 'an', 'of', 'for', 'and', 'or', 'to', 'in', 'on', 'at', 'by', 'with',
  'de', 'la', 'el', 'los', 'las', 'un', 'una', 'y', 'du', 'des', 'le', 'les', 'et',
  'der', 'die', 'das', 'und', 'il', 'lo', 'gli', 'di', 'e',
]);
// NFKD + combining-mark strip folds accents so "Lámina" and "lamina" are one word; the Unicode property
// classes keep CJK/Arabic/Cyrillic intact (a `\w`-based split would erase every non-Latin heading).
const _titleWords = (s) => (typeof s === 'string' ? s : '')
  .normalize('NFKD').replace(/\p{M}+/gu, '').toLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu, ' ').trim().split(' ')
  .filter((w) => w && !_TITLE_FUNCTION_WORDS.has(w));
function resolvePrimaryHeading(headings) {
  const hs = (Array.isArray(headings) ? headings : []).filter((h) => h
    && typeof h.text === 'string' && h.text.trim().length > 0
    && h.ariaHidden !== true && h.offscreen !== true);
  if (!hs.length) return null;
  const levels = hs.map((h) => (Number.isFinite(h.level) ? h.level : 99));
  const want = Math.min(...levels);
  const i = levels.indexOf(want);
  return { text: hs[i].text.trim(), level: Number.isFinite(hs[i].level) ? hs[i].level : null, headingCount: hs.length };
}
function titleHeadingCorrespondence(title, headings) {
  const t = typeof title === 'string' ? title.trim() : '';
  if (!t) return null;
  const h = resolvePrimaryHeading(headings);
  if (!h) return null;
  const hw = _titleWords(h.text);
  if (!hw.length) return null;                       // a punctuation/emoji-only heading says nothing to compare
  const tw = new Set(_titleWords(t));
  const missing = [...new Set(hw.filter((w) => !tw.has(w)))].slice(0, 12);
  return {
    headingText: h.text.slice(0, 160),
    headingLevel: h.level,
    titleCarriesHeadingWords: missing.length === 0,
    headingWordsMissingFromTitle: missing,
    note: 'DETERMINISTIC comparison of the <title> against the page\'s PRIMARY visible heading (the shallowest '
      + 'non-hidden, on-screen heading — what the page presents as naming itself). `titleCarriesHeadingWords` is '
      + 'true when EVERY content word of that heading also appears in the title (case- and accent-insensitive, '
      + 'function words ignored, order and extra title text irrelevant); `headingWordsMissingFromTitle` lists the '
      + 'heading\'s content words the title does NOT contain. These are FACTS about two strings, not a verdict: '
      + 'a title carrying every heading word can still fail on other grounds, and dropped words may identify '
      + 'nothing. Absent when the page has no usable heading — then read the page\'s identity from the viewport.',
  };
}

// v2.9 PURE SIGNAL PRE-COMPUTE (3.1 §3): reuse a11y-eval verbatim where the inputs exist on the
// element facts, so the agent reasons over the SAME deterministic measures v2.9 surfaced — never
// re-deriving them. Side-effect-free; returns a structured signal bundle the prompt embeds.
// Raw-markup evidence (element outerHTML + parent's). `stripStyle` drops inline `style=` so the LLM cannot
// re-derive a DETERMINISTIC facet (colour→contrast) off the markup and override the runner that owns it — RCA
// (afw4f7): HTML's #1 FP source was the model reading `style="color:#888"` and re-judging 1.4.3 contrast.
// Stripping inline style keeps structural markup (tags, ARIA, href, text); the colour/geometry stays the
// deterministic facet's job.
function htmlEvidence(element, stripStyle) {
  let h = element.htmlSnippet || null, e = element.enclosingHtml || null;
  if (stripStyle) {
    const strip = (s) => (typeof s === 'string' ? s.replace(/\sstyle=("[^"]*"|'[^']*')/gi, '') : s);
    h = strip(h); e = strip(e);
  }
  return { rawElementHtml: h || null, enclosingHtml: e || null };
}
// HTML augmentation is FACET-ROUTED: the RCA showed raw markup over-flags on facets a DETERMINISTIC producer
// owns — contrast (inline colour, 1.4.3), ARIA-validity (aria-hidden="", 4.1.2), keyboard-trap (onblur, 2.1.2)
// — so HTML is gated OFF for those runner-owned SCs and ON for STRUCTURAL SCs (1.3.1 ARIA-tables, 2.4.4/2.4.6
// context, 2.4.10) where markup is the recall benefit. This is the DEPLOYED default (F1-best config: 77.3
// recall / 81.0 precision on the reaches-LLM set, dominating the no-HTML Full on both axes).
// Env-configurable (V3_HTML_GATE_SCS, comma-separated) for gate-set tuning; default is the runner-owned set.
// NOTE (adversarial review): 2.1.2 is a MIXED-facet SC — the onblur markup helps the LLM catch real traps too,
// so SC-level gating loses TPs with the FPs; the principled fix is facet-level deferral to the live keyboard
// instrument on the ESCAPE question. Kept under review; gate set is tunable here.
const HTML_RUNNER_OWNED_SC = new Set((process.env.V3_HTML_GATE_SCS || '1.4.3,4.1.2,2.1.2').split(',').map((x) => x.trim()).filter(Boolean));
function precomputeSignals(element, skill, sc) {
  element = element || {}; // the `= {}` default only fires on undefined; a malformed `null` must not crash
  const s = {};
  // ABLATION (V3_HTML_EVIDENCE): replace the v3 structured signals with the element's RAW markup (+ its parent's),
  // so we can measure whether raw HTML beats the route-by-facet evidence bundle. No other signals; no vision/tools.
  if (process.env.V3_HTML_EVIDENCE === '1') return htmlEvidence(element, process.env.V3_HTML_NOSTYLE === '1');
  // ABLATION (V3_MINIMAL_EVIDENCE): strip ALL v3 evidence-provisioning signals — the LLM judges from the bare
  // subject (name/role in the prompt) only, i.e. axe-level evidence. Used to measure the value of v3 precompute.
  if (process.env.V3_MINIMAL_EVIDENCE === '1') return s;
  const num = (v) => (Number.isFinite(v) ? v : undefined);
  // TERMINAL ABSTENTION (s10 RCA a3; set by selectRubricSubjects on every terminal-PARTIAL row). Skill-agnostic:
  // whatever the facet, the judge must know the deterministic owner of this obligation RAN and could not decide —
  // otherwise "no deterministic finding" reads as a quiet pass, which is the exact inversion the ledger encodes.
  if (element.__terminalPartial === true) {
    s.deterministicAbstained = {
      uncertainReason: 'the deterministic experiment that owned this obligation RAN and ABSTAINED (terminal PARTIAL): '
        + 'it could not decide this shape, and its silence is NOT evidence of a pass. Judge from the evidence you are '
        + 'given; if that evidence cannot settle the question either, return PARTIAL rather than clearing.',
    };
  }
  // 1.1.1 text-lookalike-glyph-substitution: the element's visible text / accessible name RENDERS as words but is
  // built from non-letter codepoints an SR cannot read (math-styled / fullwidth / enclosed / Cyrillic-Greek homoglyph
  // mixed into a Latin word). DETERMINISTIC — surfaced so the judge sees the SEEN text vs the AT-readable fold.
  {
    const probe = (typeof element.text === 'string' && element.text) ? element.text : (typeof element.axName === 'string' ? element.axName : '');
    // Audit #7: thread the element's NEAREST declared lang/xml:lang (collected as `nearestLang`) into the
    // detector — a fully-substituted all-Cyrillic/Greek word is suppressed when the declared lang natively
    // writes that script ('СОВА' under lang=ru), and the lang is surfaced in the reason otherwise so the
    // judge can weigh 'folds to PayPal; lang=en — likely spoof' against legitimate multilingual content.
    const cf = detectConfusableText(probe, typeof element.nearestLang === 'string' ? element.nearestLang : null);
    if (cf.hasConfusables) {
      // the 'may be legitimate' softening applies ONLY to fully-substituted words (homoglyph-full): a native-
      // script lang plausibly explains an all-Cyrillic/Greek word, but NO language mixes Latin+Cyrillic/Greek
      // INSIDE one word — softening a homoglyph-mix ('Аpple' under lang=ru) would soothe the judge on the
      // classic spoof shape (adversarial-review defect 4). Mixed hits keep a firm steer regardless of lang.
      const hasMix = Array.isArray(cf.kinds) && cf.kinds.includes('homoglyph-mix');
      const langNote = cf.lang == null ? ''
        : (cf.langMatchesScript === false
          ? ' The nearest declared lang is "' + cf.lang + '", which is NOT written in the substituted script — the Latin fold is likely the intended reading (spoof / styled substitution).'
          : (cf.langMatchesScript === true
            ? (hasMix
              ? ' The nearest declared lang is "' + cf.lang + '", which natively uses this script — but a MIXED-script word (Latin and Cyrillic/Greek letters inside ONE word) is not natural text in any language; treat the substitution as suspect despite the matching lang.'
              : ' The nearest declared lang is "' + cf.lang + '", which natively uses this script — the word may be legitimate ' + cf.lang + ' text; weigh the fold against the surrounding language.')
            : ' The nearest declared lang is "' + cf.lang + '".'));
      // shape extended ADDITIVELY (lang/langMatchesScript only when a lang was declared) — existing consumers unchanged.
      s.confusableText = { kinds: cf.kinds, count: cf.count, asciiFold: cf.asciiFold, samples: cf.samples, ...(cf.lang != null ? { lang: cf.lang, langMatchesScript: cf.langMatchesScript } : {}), uncertainReason: 'this element\'s visible text uses CONFUSABLE codepoints (' + cf.kinds.join(', ') + ') that render as ordinary words but are NOT readable letters to assistive technology — a screen reader gets gibberish, the wrong language, or nothing. The seen word folds to "' + cf.asciiFold + '" but the markup does not contain those ASCII letters. Treat styled/decorative glyph-substituted TEXT as non-text content lacking a text alternative (1.1.1) unless a proper text equivalent is present.' + langNote };
    }
  }
  // S7 (RCA R7): target-size is a 2.5.x GEOMETRY check — it belongs to the pointer/target-size skill, NOT the
  // contrast skill. Attaching it to `color-and-visual-text` contaminated the contrast/complex-backdrop judgment
  // (evalTargetSize's "zero-size/hidden — not a rendered target" verdict bled into the 1.4.3 call, afw4f7) AND
  // starved the actual target-size rubric of its signal. Gate it to the reflow-and-pointer-affordances skill.
  if (skill === 'reflow-and-pointer-affordances' && element.box && typeof element.box === 'object') {
    s.targetSize = A.evalTargetSize(element.box, element.targetOpts || {});
  }
  if (element.fontPx != null) {
    s.largeText = A.isLargeText(element.fontPx, element.fontWeight);
    s.contrastThreshold = A.contrastThresholdFor(element.fontPx, element.fontWeight);
  }
  // parseRGB does `(s||'').match(...)`, so a non-string fg/bg (e.g. `{}`) would THROW and abort the
  // whole producer run — guard the types so one malformed element can't deny the page its LLM lane.
  if (typeof element.fg === 'string' && typeof element.bg === 'string') {
    const fg = A.parseRGB(element.fg), bg = A.parseRGB(element.bg);
    if (fg && bg) s.contrastRatio = A.contrastRatio([fg.r, fg.g, fg.b], [bg.r, bg.g, bg.b]);
  }
  // #44 UNCERTAINTY PROPAGATION: the deterministic CONTRAST runner's verdict — and, crucially, WHY it
  // abstained — must reach the agent, not a bare absence. A complex-backdrop element reaches a rubric
  // PRECISELY because the runner could not reduce the backdrop to two flat colors; handing it neither a
  // ratio nor a reason invites the agent to mistake "no deterministic finding" for "passes". So always
  // surface reliability + the abstention reason. Real collected elements carry color/effBg +
  // contrastReliable/contrastUnreliableReason/needsPixelContrast/contrastSolid (the older fg/bg branch
  // above was dead on real records — they use color/effBg — which is exactly how this gap hid).
  if (skill === 'color-and-visual-text' || element.contrastReliable != null || element.needsPixelContrast != null || element.contrastSolid != null || element.contrastUnreliableReason != null) {
    const reliable = element.contrastReliable === true;
    let ratio = Number.isFinite(s.contrastRatio) ? s.contrastRatio : undefined;
    if (ratio == null && reliable && Number.isFinite(element.contrastSolid)) ratio = element.contrastSolid;
    if (ratio == null && reliable && typeof element.color === 'string' && typeof element.effBg === 'string') {
      const fg = A.parseRGB(element.color), bg = A.parseRGB(element.effBg);
      if (fg && bg) ratio = A.contrastRatio([fg.r, fg.g, fg.b], [bg.r, bg.g, bg.b]);
    }
    s.contrast = {
      ratio,
      computable: ratio != null,
      reliable,
      threshold: Number.isFinite(element.contrastThreshold) ? element.contrastThreshold : (Number.isFinite(s.contrastThreshold) ? s.contrastThreshold : undefined),
      needsPixelContrast: element.needsPixelContrast === true,
      // INTERIM MITIGATION (Tier-0 #2): hand the LITERAL foreground colour the runner resolved, so when the
      // pixel runner abstained (irreducible photo backdrop) and this still reaches vision, the model cannot
      // invent "light/white text" and clear — afw4f7 #2 hallucinated the fg as white over a #555-on-black case.
      fg: typeof element.color === 'string' ? element.color : (typeof element.fg === 'string' ? element.fg : undefined),
      // ...and the BACKDROP the ratio was computed against. Publishing the foreground alone still leaves the
      // backdrop to be read off a crop, which is the half that gets mis-attributed to a neighbouring control.
      bg: typeof element.effBg === 'string' ? element.effBg : (typeof element.bg === 'string' ? element.bg : undefined),
      // present IFF the runner could not produce a sound ratio — the explicit "why I abstained" the agent needs:
      uncertainReason: ratio == null
        ? (element.contrastUnreliableReason || 'the backdrop could not be reduced to two flat colors (gradient / image / overlay / semi-transparency), so a sound contrast ratio is not computable — judge readability from the pixels')
        : undefined,
    };
  }
  if (skill === 'focus-visibility' && element.focusStats) {
    s.focusRing = A.focusRingDecision({ realTabSpatial: element.focusStats });
  }
  if (skill === 'keyboard-operability') {
    if (element.pageScriptsDisabled === true) {
      s.scriptsDisabled = { value: true, uncertainReason: 'this page was captured with scripting OFF. Script-driven key behaviour (arrow-key roving focus in a tablist/listbox/menu/radiogroup, carousel dot navigation, custom key handlers) cannot run here, so its absence is NOT evidence of a keyboard barrier — judge that half PARTIAL. Static facts still stand: a control with no role, or one no member of its widget can reach by Tab, is judged as usual.' };
    }
    s.keyboard = A.keyboardOperabilitySignal({
      role: element.role, tabindex: element.tabindex, reachedByTab: element.reachedByTab,
      respondedToSyntheticKey: element.respondedToSyntheticKey, respondsToArrows: element.respondsToArrows, focusable: element.focusable,
    });
    // 2.1.2 keyboard-trap (keyboard-trap-v0): the CONFINED set the deterministic instrument confirmed (attached as
    // __confinement when this element is a confinement member). The rubric reveals/verifies the documented escape.
    if (element.__confinement && Array.isArray(element.__confinement.members)) {
      const ow = (element.__confinement.oneway && typeof element.__confinement.oneway === 'object') ? element.__confinement.oneway : null;
      s.keyboardTrap = {
        members: element.__confinement.members,
        setSize: element.__confinement.setSize,
        ...(ow ? { oneway: ow } : {}),
        uncertainReason: ow
          ? ('a deterministic sweep observed ONE-WAY confinement: sequential navigation in the ' + (ow.direction || 'forward') + ' direction loops focus inside these elements, and ' + (Number.isFinite(ow.unreachedCount) ? ow.unreachedCount : (ow.unreached || []).length) + ' rendered focusable(s) outside the set were never reached in that direction (focus DOES escape the other way — a tester workaround, not a pass, per TT 4.C). Apply the rubric\'s one-way REVIEW branch: a section that genuinely requires input or interaction — completable by keyboard — before allowing focus to progress is NOT a failure; a loop that merely walls off later content with no advertised working exit IS. Verify behaviorally with observe_state_after_activation and interact_and_observe exactly as for a full confinement.')
          : 'a deterministic probe confirmed focus is CONFINED to these elements (cannot leave by Tab, Shift+Tab, or Escape, and an element outside the set is never reached). This is a 2.1.2 barrier UNLESS the user is told how to escape (a non-standard key, possibly behind a help control) AND that key works. Activate each member with observe_state_after_activation to reveal any escape instructions, then drive a focus-then-press sequence with interact_and_observe pressing THE COMBO THE PAGE ADVISES — never a key of your own invention (actions:[{op:focus,xpath:member},{op:press,key:"Alt+F6"}] if Alt+F6 were the advertised exit) — and read the press step.activeAfter: if it is OUTSIDE this set the key freed focus, otherwise it did nothing. Undocumented or non-working ⇒ REPRODUCED.',
      };
    }
    // S5 (RCA R5): the 2.1.2 no-keyboard-trap judgment needs the trap-RISK context. A trap means focus is
    // RETAINED (cannot Tab/Shift+Tab/Esc out). Absent a focus-trapping region or inline focus handler, a normal
    // focusable is almost never a trap — surface this so the rubric does not invent one from operability alone.
    const trapRisk = element.focusRisk === true || element.inModal === true;
    const detTrap = element.deterministicTrapConfirmed === true; // S5: a real Tab/Shift+Tab/Esc walk confirmed a trap here
    s.keyboardTrapContext = {
      inTrapRiskRegion: trapRisk,
      deterministicTrapConfirmed: detTrap,
      uncertainReason: detTrap
        ? 'a DETERMINISTIC keyboard-trap check (real Tab/Shift+Tab/Esc walk) CONFIRMED that focus cannot escape this element/region — this IS a 2.1.2 keyboard trap (REPRODUCED).'
        : (trapRisk
            ? 'this control sits in a focus-trapping region (modal/menu/listbox/grid) or carries an inline focus handler — a 2.1.2 trap is PLAUSIBLE here, but the deterministic walk did NOT confirm one; flag a barrier ONLY if you can confirm focus cannot be moved away by Tab / Shift+Tab / Esc (a state-and-capture or screen-reader probe can verify)'
            : 'the deterministic trap walk confirmed no trap here AND no focus-trapping region or inline focus handler was detected — a standard focusable that can be Tabbed past is NOT a keyboard trap; do NOT flag 2.1.2 from mere operability/focusability'),
    };
    // #4 (RCA R4): a focusable CONTAINER role is not necessarily an operable CONTROL. Instead of a hard-coded
    // oracle role-denylist (which risks suppressing a real custom widget — an FN), hand the agent the facts and
    // let it judge applicability: a container that merely holds its own controls, or is a focusable scroll region,
    // owes NO 2.1.1 operation barrier; only an element that IS meant to be key-operated, yet cannot be, is a barrier.
    const kbRole = String(element.cdpRole || element.role || element.axRole || element.sampledRole || '').toLowerCase();
    const CONTAINER_ROLE = /^(region|group|document|application|navigation|complementary|banner|contentinfo|article|toolbar|tabpanel|main|grid|tablist|tree|listbox|menu|menubar)$/;
    if (CONTAINER_ROLE.test(kbRole)) {
      s.focusableContainer = {
        role: kbRole,
        ownsInteractiveDescendants: element.ownsInteractiveDescendants === true,
        hasKeyHandler: element.hasKeyHandler === true,
        uncertainReason: 'this focusable element is a CONTAINER role (' + kbRole + '), NOT necessarily an operable widget. A container that is merely in the tab order — a labelled group holding its OWN controls (ownsInteractiveDescendants=' + (element.ownsInteractiveDescendants === true) + '), or a focusable scroll region — carries NO 2.1.1 OPERATION barrier: judge NOT REPRODUCED / N/A. Flag 2.1.1 ONLY if this element is itself meant to be operated by keyboard (custom-widget behaviour — hasKeyHandler=' + (element.hasKeyHandler === true) + ') yet cannot be operated. Do NOT flag merely because a container is focusable.',
      };
    }
  }
  // S7 (RCA R7, 0va7u6): an <svg> rendering LIVE <text> is not an image of text — clear 1.4.5 for it.
  if (element.svgLiveText === true) {
    s.svgLiveText = { value: true, uncertainReason: 'this <svg> renders LIVE <text>/<tspan> — its text is REAL and machine-readable (not flattened pixels), so it is NOT an image of text and carries NO 1.4.5 barrier (judge NOT REPRODUCED for the images-of-text concern)' };
  }
  // NON-AUTHORITATIVE EXPERIMENT EVIDENCE (orchestrator → el.__experimentEvidence): a deterministic experiment ran on
  // this element for this criterion but did not decide it with authority. Its observation is EVIDENCE for the judge,
  // not a verdict: a shadow runner's outcome is unvalidated, and INCONCLUSIVE means it could not measure.
  if (Array.isArray(element.__experimentEvidence)) {
    const evs = element.__experimentEvidence.filter((e) => e && (!sc || e.sc === sc)).slice(0, 4);
    if (evs.length) {
      const say = (e) => (e.outcome === 'BARRIER_OBSERVED' ? 'observed a barrier' : e.outcome === 'NO_BARRIER_OBSERVED' ? 'observed no barrier' : 'could not decide');
      s.experimentEvidence = {
        observations: evs.map((e) => ({ experiment: e.mechanism, outcome: e.outcome, note: e.reason })),
        uncertainReason: 'a deterministic experiment already ran on this element for this criterion and is NOT authoritative: '
          + evs.map((e) => (e.mechanism || 'experiment') + ' ' + say(e)).join('; ')
          + '. Use it as evidence — confirm or overturn it from the element, the crops and your tools; do not copy it as the verdict, and "could not decide" is not a pass.',
      };
    }
  }
  // V2 EXPOSURE (collect-exposure.js): when the at-rest crop cannot show this element, say so and say why —
  // the oracle already removed the families that cannot apply; these are the ones that still do.
  if (element.exposure && typeof element.exposure === 'object') {
    const x = element.exposure;
    if (x.srOnly === true && x.revealedOnFocus === true) {
      s.revealedOnFocus = { value: true, uncertainReason: 'this element is VISUALLY HIDDEN AT REST and becomes visible when it receives keyboard focus (the skip-link pattern). An at-rest crop shows nothing here — that is by design, not a defect. Judge focus visibility and any visual property on the FOCUSED state only; if no focused-state evidence is provided, return PARTIAL for visual questions.' };
    } else if (x.srOnly === true && skill === 'focus-visibility') {
      s.invisibleWhenFocused = { value: true, labelProxy: x.labelProxy || null,
        uncertainReason: 'this focusable element stays VISUALLY HIDDEN even while focused (sr-only / 1px / off-page) — keyboard focus lands on something no sighted user can see. '
          + (x.labelProxy ? 'A rendered label (' + x.labelProxy + ') stands in for it visually: focus is visible ONLY if that label (or the control\'s visible wrapper) shows a focus indication when this control is focused — judge that; if it shows none, this is a 2.4.7 barrier.' : 'No visible stand-in was found: unless focusing it reveals a visible indication elsewhere, focus is not visible (2.4.7 barrier).') };
    }
    if (x.clippedOut && x.clippedOut.scrollReachable !== true) {
      s.clippedOutOfView = { container: x.clippedOut.container || null, uncertainReason: 'at capture this element was wholly CLIPPED OUT OF VIEW by an overflow container (' + (x.clippedOut.container || 'a carousel/scroller') + ') — typically an off-screen carousel slide. The crop may show neighbouring content instead of this element. For any VISUAL question, judge only if the element is actually visible in the crop; otherwise return PARTIAL (not a barrier, not a pass).' };
    }
  }
  // V8 SHADOW-CONTROL IDENTITY (expert-study C658): this record is a custom-element HOST whose operable control
  // lives inside its shadow root; the collector judged the host on that control's computed role/name/focus. Tell
  // the judge which node the facts describe and what the host's own ARIA does (or does not) contribute.
  if (element.delegatedToShadowControl === true && element.innerControl && typeof element.innerControl === 'object') {
    const ic = element.innerControl;
    const hostLabel = ic.hostLabel || null;
    const innerName = typeof ic.axName === 'string' ? ic.axName : null;
    const hostLabelReaches = !!(hostLabel && innerName && innerName.toLowerCase().includes(hostLabel.toLowerCase()));
    s.shadowInnerControl = {
      innerTag: ic.tag, innerRole: ic.axRole || null, innerAccessibleName: innerName, innerFocusable: ic.focusable === true,
      hostAriaLabel: hostLabel, hostLabelReachesControl: hostLabelReaches,
      uncertainReason: 'this element is a custom-element HOST. Its operable control is the <' + ic.tag + '> inside its shadow root (role ' + (ic.axRole || 'unknown') + ', ' + (ic.focusable === true ? 'keyboard-focusable' : 'not focusable') + '), and the role/name/focus facts here describe THAT control. Judge name, role, state and keyboard access on the inner control, NOT on the host: the host being role-less or unfocusable is not a defect when the control inside it is a real, focusable ' + (ic.axRole || 'control') + '. '
        + (hostLabel
          ? (hostLabelReaches ? 'The host\'s aria-label reaches the control\'s accessible name, so it is not a separate defect.' : 'The host carries aria-label "' + hostLabel + '", but the control\'s computed accessible name is ' + (innerName ? '"' + innerName + '"' : 'EMPTY') + ' — the label on the host does not reach the control. If the name is empty, that is a 4.1.2 name defect of the control; report it as such, not as ARIA legality on the host.')
          : ''),
    };
  }
  // RASTER PROVENANCE (expert-study C226): what the crop of an <img> actually shows. A raster that did not load
  // is not evidence of the image's content, and live HTML text painted over the image box is not IN the raster.
  if (element.imgRender && typeof element.imgRender === 'object') {
    const ir = element.imgRender;
    if (ir.loaded === false) {
      s.imageNotLoaded = { value: true, uncertainReason: 'this <img> had NOT loaded when the page was captured (no decoded pixels, naturalWidth 0). The crop shows a broken-image placeholder or whatever is painted over the box — NOT the image\'s content. Do not judge what the image depicts or whether it contains text (1.1.1 alt adequacy against the pictured content, 1.4.5 images of text) from these pixels: return PARTIAL for those questions. Questions that need no pixels (an empty/absent alt on an informative image, a file-name alt) can still be judged.' };
    }
    if (Array.isArray(ir.overlayText) && ir.overlayText.length) {
      s.htmlTextOverImage = { strings: ir.overlayText.slice(0, 3), uncertainReason: 'these strings are LIVE HTML TEXT whose rendered boxes lie over this image — the DOM owns them, so they are NOT part of the image raster. If the crop shows only this text, it is NOT an image of text (1.4.5 NOT REPRODUCED for that text); judge the raster on any OTHER text it visibly contains.' };
    }
  }
  // #9 (round-3 overfit audit): SC 2.2.2 has TWO clauses with DIFFERENT conditions — tell the motion-control
  // rubric WHICH mechanical signal minted this obligation so it applies the right one. MOVING/blinking/
  // scrolling (autoMotion) carries the "lasts more than 5 seconds" condition; AUTO-UPDATING (autoUpdatingText —
  // a deterministic MutationObserver saw recurring timer-driven text swaps on a visible in-parallel element)
  // has NO 5-second grace: pause/stop/hide/frequency-control is owed whenever it auto-starts in parallel.
  if (skill === 'timing-and-motion' && (element.autoMotion === true || element.autoUpdatingText === true)) {
    s.motionMechanism = {
      autoMotion: element.autoMotion === true,
      autoUpdatingText: element.autoUpdatingText === true,
      uncertainReason: element.autoUpdatingText === true
        ? 'a deterministic MutationObserver window saw this element\'s TEXT rewritten repeatedly on a timer while presented in parallel with other content — this is AUTO-UPDATING content: it owes a pause/stop/hide (or update-frequency) mechanism whenever it auto-starts in parallel. The 5-second grace applies ONLY to moving/blinking/scrolling content; "auto-stops within 5 seconds" can NOT clear auto-updating content.'
        : 'the collector detected auto-MOVING content (a looping/>5s CSS animation, <marquee>, or autoplay media) — the moving/blinking/scrolling clause applies: a pause/stop/hide mechanism is owed when it starts automatically, lasts more than 5 seconds, and is presented in parallel with other content.',
    };
  }
  // #44 / adversarial verify #7: for name-role-state, surface the deterministic NAME-PRESENCE result. The
  // ax-name-presence detector is a SHADOW signal (not a CLAIM), so an empty-name 4.1.2 obligation still
  // reaches the (now 4.1.2-owning) adequacy rubric — which must NOT mistake an ABSENT name for an adequate
  // one. Hand it the presence result + the explicit "absence IS the barrier" reading so it can't false-clear.
  if (skill === 'name-role-state') {
    const an = typeof element.axName === 'string' ? element.axName : null;
    // S2 (RCA R2): the "absence IS the barrier" steer must be ROLE-GATED. An empty name is a barrier ONLY for
    // roles that REQUIRE a name (interactive widgets — and a nameless LINK genuinely fails 2.4.4/4.1.2). A
    // COMPOSITE CONTAINER (menu/tablist/group/region…) usually does NOT require a name, so an empty name there
    // is normally fine — flag only on multiplicity (multiple same-role containers needing disambiguation). The
    // previous all-roles steer drove the composite-empty-name FP storm (menu/tablist flagged at high confidence).
    const role = String(element.cdpRole || element.role || element.axRole || element.sampledRole || '').toLowerCase(); // S1/S2: prefer the AUTHORITATIVE CDP-computed role over the heuristic sampledRole
    const NAME_REQUIRING = /^(button|link|menuitem|menuitemcheckbox|menuitemradio|checkbox|radio|switch|tab|combobox|textbox|searchbox|slider|spinbutton|option|treeitem)$/;
    const COMPOSITE_CONTAINER = /^(menu|menubar|tablist|tree|treegrid|grid|listbox|radiogroup|group|region|toolbar|navigation|tabpanel|dialog)$/;
    const emptyName = an !== null && an.trim() === '';
    s.accessibleName = {
      value: an,
      present: !!(an && an.trim().length > 0),
      resolved: an !== null, // null ⇒ CDP did not resolve a name (uncertain), distinct from '' (resolved-empty)
      uncertainReason: !emptyName
        ? (an === null ? 'the accessible name could not be resolved deterministically — judge presence/adequacy from the evidence' : undefined)
        : (NAME_REQUIRING.test(role)
            ? 'the deterministic name-presence detector found an EMPTY accessible name on a control whose role (' + role + ') REQUIRES a name — that absence IS the barrier (judge REPRODUCED); only judge adequacy when a name is present'
            : (COMPOSITE_CONTAINER.test(role)
                ? 'this is a nameless ' + role + ' CONTAINER — most container roles do NOT require an accessible name, so an empty name is USUALLY NOT a barrier; flag one ONLY if the role genuinely needs a name here (e.g. MULTIPLE same-role containers coexist and must be told apart), otherwise NOT a barrier'
                : 'the accessible name is empty — judge from the evidence whether this element\'s role actually requires a name (an absent name is NOT an automatic barrier for non-widget roles)')),
    };
    // DECORATIVE-MARKING conflict (Tier-0 #5, e88epe): a rendered-meaningful image marked decorative / removed
    // from the a11y tree is the barrier the adequacy rubric kept missing — it saw the author alt ("W3C logo") +
    // a logo crop and cleared. Hand it the hidden-mechanism so it judges the PIXELS, not the (AT-unspoken) name.
    // #3: CDP `!inTree` SECONDARY trigger — Chrome computed this image as OUT of the a11y tree by a mechanism the
    // three DOM heuristics (aria-hidden / role=none / empty-alt) MISS (e.g. an inert/role-none ancestor, or an
    // aria-hidden set via JS property). Guarded: only a VISIBLE image, and NOT ignored merely for an active
    // modal / inert subtree (those are CORRECTLY removed — flagging them would FP). Adds recall, no over-flag.
    const cdpRemoved = element.inTree === false && element.isImage === true && element.renderedVisible === true && element.ignoredByModal !== true;
    if (element.removedFromA11yTree === true || element.ariaHiddenWithName === true || cdpRemoved) {
      s.decorativeMarking = {
        removedFromA11yTree: element.removedFromA11yTree === true || cdpRemoved,
        hiddenMechanism: element.hiddenMechanism || (cdpRemoved ? 'ax-ignored (Chrome removed it from the a11y tree by a mechanism other than aria-hidden/role-none/empty-alt)' : (element.ariaHiddenWithName ? 'aria-hidden' : null)),
        renderedVisible: element.renderedVisible === true, // S3 (R3): SIZE/visibility ONLY — NOT a meaningfulness signal
        nearbyText: element.nearbyText || null,            // S3 (R3): the adjacent text, for the REDUNDANCY judgment
        ariaHiddenWithName: element.ariaHiddenWithName === true,
        uncertainReason: 'this image is REMOVED from the accessibility tree (' + (element.hiddenMechanism || 'aria-hidden') + '), so AT never announces it. Decide from the CROP + nearbyText whether the image carries INFORMATION a non-sighted user is DENIED: (a) if its content is REDUNDANT with the adjacent text (nearbyText), or it is purely decorative (a spacer / flourish / background / illustrative photo adding no information), then removing it is CORRECT — NOT a barrier; (b) if it conveys UNIQUE meaning absent from the surrounding text (a logo/wordmark identifying the page, a chart, an informative diagram, or text baked into the image), hiding it IS a barrier (REPRODUCED). `renderedVisible` only means the image has a non-trivial SIZE — it does NOT mean the image is meaningful; do not flag from size alone.',
      };
    }
    // 1.1.1 DEDICATED CAPTION/LONG-DESCRIPTION TEXT (batch-3 #16b threading; collector fact `captionText`,
    // complexImageHint-gated at collection). WHY: the 2800-cap `enclosingHtml` is eaten by SVG markup on
    // exactly the images that own a long-description obligation, truncating the caption mid-sentence — so
    // the completeness procedure's quoting standard failed on evidence defects, not on the page. This is the
    // caption/aria-describedby text collected SEPARATELY, immune to that cap. Feature-detected: absent on
    // every element the collector did not mark, so all other prompts stay byte-identical.
    if (typeof element.captionText === 'string' && element.captionText) {
      s.captionText = {
        text: element.captionText,
        note: 'the image\'s DEDICATED caption/long-description text — the enclosing figure caption plus every '
          + 'aria-describedby target, collected separately so markup-cap truncation cannot eat it. QUOTE from '
          + 'this when applying the completeness/redundancy procedures; it is the authoritative source for '
          + '"what the caption actually says" when the enclosingHtml excerpt appears clipped. Its ABSENCE on '
          + 'other subjects means nothing (it is collected only for complex images).',
      };
    }
    // TT gap G2 (TT 7.C, 1.1.1): a meaningful CSS background-image owes a text alternative. Unlike an <img> it has
    // NO `alt` — the equivalent must come from an accessible name (surfaced above) or adjacent text. Hand the rubric
    // the bg-image facts + the explicit decorative-default so it does not flag a decorative texture, but DOES flag an
    // interactive control or an informational icon/badge whose meaning is conveyed ONLY by the background pixels.
    if (element.backgroundImageMeaningful === true) {
      s.backgroundImage = {
        url: element.backgroundImageUrl || null,
        interactive: element.isInteractive === true || element.focusable === true,
        hasAccessibleName: !!(typeof element.axName === 'string' && element.axName.trim().length > 0),
        uncertainReason: 'this element conveys its visible content through a CSS background-image (it is removed by TT\'s "hide backgrounds" step), and it has NO text and NO accessible name. Decide from the CROP: (a) if the image is DECORATIVE (a texture/gradient/flourish/spacer adding no information) it is NOT a barrier — decorative is the DEFAULT for an ambiguous background; (b) if it CONVEYS INFORMATION a non-sighted user would be denied — an INTERACTIVE control whose only label is the image (also a 4.1.2 failure), an informational icon/badge ("New", "Sold out", a status/warning glyph), text baked into the image, or a chart — and no text equivalent exists, hiding it IS a barrier (REPRODUCED). If you cannot tell whether it carries information, return PARTIAL.',
      };
    }
    // Item 14a (2.4.4 in-context): surface the OTHER links sharing this link's accessible name + their destinations,
    // so the rubric can judge whether identically-named links resolve to DIFFERENT places (a 2.4.4 barrier).
    if (Array.isArray(element.__sameNameLinks) && element.__sameNameLinks.length) {
      // RAW hrefs only — NOT settled destinations. A redirect / meta-refresh / SPA route can make identical raw
      // hrefs resolve to DIFFERENT places (and different hrefs to the same place), so this count must NEVER be
      // read as "destinations match → clear" (the FN-run false-clear: two same-named links, distinctRawHrefs=1,
      // cleared at high confidence on fd3a94). Settled resolution is the resolve_destination tool's job.
      // include THIS link's own href in the set (peers exclude self) so the count reflects the WHOLE same-named
      // set: 1 ⇒ every same-named link shares a raw href (still not safe — could diverge via redirect); ≥2 ⇒ the
      // same-named links point at DIFFERENT raw hrefs (a strong 2.4.4 smell). The old peers-only count was ~useless.
      const rawHrefs = new Set([element.href || element.jsHref, ...element.__sameNameLinks.map((l) => l.href)].map((h) => h || '').filter(Boolean));
      s.sameNameLinks = {
        count: element.__sameNameLinks.length,
        peers: element.__sameNameLinks,
        distinctRawHrefs: rawHrefs.size,
        uncertainReason: 'other links on this page share this name — 2.4.4 fails if any resolve to a DIFFERENT destination. The values shown are RAW hrefs, NOT settled destinations: identical raw hrefs can still diverge (redirect/meta-refresh/SPA route) and different raw hrefs can be equivalent, so distinctRawHrefs is NOT sufficient to clear. If a tool is available, call resolve_destination on the SET of same-named links to compare SETTLED destinations; otherwise, if you cannot confirm the destinations are truly equivalent, return PARTIAL — never a confident clear on raw-href equality alone',
      };
      // FORCE-INVOKE result (orchestrator.js): the same-named set was ALREADY resolved deterministically (isolated
      // read-only GETs) and compared field-by-field, so a passive model no longer depends on calling the tool. When
      // present, this settled grid is AUTHORITATIVE over the raw hrefs above — judge PURPOSE from it, not the paths.
      if (element.__destinationGrid && element.__destinationGrid.equality) {
        s.sameNameLinks.settledDestinations = {
          resolvedCount: element.__destinationGrid.resolvedCount,
          equality: element.__destinationGrid.equality,
          uncertainReason: 'DETERMINISTIC settled-destination grid (resolve_destination was already run on the SET). Each equality.* is byte-equality across the RESOLVED destinations: true = all identical on that field, false = they differ, null = fewer than 2 resolved ⇒ COULD NOT COMPARE (never read null as "different"). This SUPERSEDES the raw hrefs/paths above — do NOT flag on "about/… vs careers/…" path differences. If the destinations match on title/h1/mainFirstParagraph/visibleText (or finalUrl), the same-named links serve an EQUIVALENT purpose ⇒ NOT REPRODUCED, even when the raw paths differ. Flag REPRODUCED only when the SETTLED content genuinely diverges in PURPOSE (not merely different wording for the same function — "Get in touch" and "Contact us" are equivalent) and the enclosing context does not disambiguate. If resolvedCount < 2 (equality null), you could not confirm ⇒ PARTIAL, never a confident barrier.',
        };
      }
    }
    // 4.1.2 relational duplicate-name (4b1c6c): the OTHER iframes sharing THIS iframe's accessible name + their src,
    // so the duplicate-name-equivalence rubric can judge whether same-named frames serve an EQUIVALENT purpose.
    if (Array.isArray(element.__sameNameIframes) && element.__sameNameIframes.length) {
      const norm = (u) => (typeof u === 'string' ? u.trim().replace(/[?#].*$/, '').replace(/\/+$/, '').toLowerCase() : '');
      const selfSrc = typeof element.iframeSrc === 'string' ? element.iframeSrc : '';
      const rawSrcs = new Set([selfSrc, ...element.__sameNameIframes.map((f) => f.src)].map(norm)); // includes self; '' = srcdoc/empty (kept — un-inspectable)
      s.sameNameIframes = {
        count: element.__sameNameIframes.length,
        name: typeof element.axName === 'string' ? element.axName : null,
        peers: element.__sameNameIframes,
        selfSrc: selfSrc || null,
        distinctSrcs: rawSrcs.size,
        allSameSrc: rawSrcs.size === 1,
        uncertainReason: 'two or more iframes on this page share THIS accessible name. 4.1.2 (ACT 4b1c6c) requires same-named frames to serve an EQUIVALENT purpose, so the user is not misdirected. distinctSrcs=1 (allSameSrc) means every same-named frame loads the SAME resource, so they serve an equivalent purpose and this is NOT a barrier (NOT REPRODUCED). distinctSrcs of 2 or more means the frames load DIFFERENT src strings — this is a TRIGGER TO INSPECT the rendered content, NOT a verdict: a different src does NOT by itself prove a different purpose. Clear (NOT REPRODUCED) when the crops show the frames render the SAME content (a copy/mirror, the same file under a different path, or a CDN/locale variant) OR when the shared name denotes a CATEGORY whose purpose both frames fulfil (e.g. two advertising frames showing different ads). Flag (REPRODUCED) only when the crops show the frames serve genuinely DIFFERENT purposes (e.g. a contributor list vs a contact form). src is the RAW attribute (query/hash/trailing-slash normalized), not settled content; an EMPTY src is a srcdoc or JS-set frame you must inspect or return PARTIAL. Never decide distinctSrcs of 2 or more on the src strings alone.',
      };
    }
    // #12 (2.4.4 enclosing context): the link's PROGRAMMATICALLY-DETERMINED context is the text of its NEAREST block
    // ancestor (collector `enclosingBlockText`), NOT the flattened vision neighbourhood. A link ALONE in its block
    // (blockText == its own name) has NO enclosing context beyond its name — descriptive prose in a SEPARATE sibling
    // block is not enclosing. This EXPLICIT signal must be preferred over the surrounding-region crop, which leaks a
    // preceding paragraph and lets the rubric falsely "read" context the AT user never gets programmatically.
    if (typeof element.enclosingBlockText === 'string' && (element.axRole === 'link' || element.roleAttr === 'link' || element.tag === 'a')) {
      const ownName = ((typeof element.axName === 'string' && element.axName) || element.text || '').replace(/\s+/g, ' ').trim().toLowerCase();
      const block = element.enclosingBlockText.replace(/\s+/g, ' ').trim();
      const blockLc = block.toLowerCase();
      // alone-in-block: the block text IS just the name (modulo punctuation/whitespace) ⇒ no disambiguating context.
      const aloneInBlock = !block || blockLc === ownName || (!!ownName && blockLc.replace(ownName, '').replace(/[^a-z0-9]+/g, '').length === 0);
      // #12b: a link in a table cell also has its cell's associated ROW/COLUMN header as programmatic context (kept
      // DISTINCT so a specific row-subject header can disambiguate while a generic column category cannot). Surfaced
      // deterministically so the passive models (which won't call query_ax_node) still get it.
      const chc = element.cellHeaderContext && (Array.isArray(element.cellHeaderContext.rowHeaders) || Array.isArray(element.cellHeaderContext.colHeaders)) ? element.cellHeaderContext : null;
      const hasCellHdr = !!(chc && ((chc.rowHeaders || []).length || (chc.colHeaders || []).length));
      // `linkAloneInBlock` means "no PROGRAMMATIC context beyond the name". A table cell WITH associated headers is NOT
      // that: the header IS programmatic 2.4.4 context (whether it RESOLVES the purpose is the specificity judgment the
      // cell-header uncertainReason asks for). Sending linkAloneInBlock:true ALONGSIDE cellColHeaders:["Ulysses"] is a
      // self-contradiction that biased passive models toward a barrier despite a resolving header (the Ulysses download
      // table false-positived in 3/4 models). Report block-only aloneness ONLY when there is no cell-header context;
      // when headers are present, the generic-vs-specific call lives entirely in the uncertainReason, not this boolean.
      const aloneNoContext = aloneInBlock && !hasCellHdr;
      s.enclosingContext = {
        blockText: block.slice(0, 200),
        linkAloneInBlock: aloneNoContext,
        ...(hasCellHdr ? { cellRowHeaders: (chc.rowHeaders || []).slice(0, 4), cellColHeaders: (chc.colHeaders || []).slice(0, 4), cellHeaderSource: chc.headerSource || 'positional' } : {}),
        uncertainReason: hasCellHdr
          ? 'this link sits in a DATA-TABLE CELL: beyond its own block, its programmatic context includes the cell\'s associated headers — cellRowHeaders and cellColHeaders (the cell\'s row/column header text). Per WCAG 2.4.4 the cell\'s row/column header IS enclosing context. The test is SPECIFICITY, NOT row-vs-column: a header (ROW or COLUMN) that names a SPECIFIC SUBJECT/DESTINATION resolves a format-only/action-only link name ⇒ NOT REPRODUCED — e.g. name "EPUB"/"Download" + a header ["Ulysses"] (a specific book) = "download Ulysses as EPUB", determinable. A header that is only a GENERIC CATEGORY or ACTION label ("Books", "Downloads", "Format", "Links") names no specific destination and does NOT resolve it; if neither the name nor a subject-naming header identifies the destination, that is a barrier. (Row headers are MORE OFTEN the subject and column headers MORE OFTEN the category, but judge the actual text, not the slot.) Judge the name TOGETHER WITH these headers; do not demand the name itself restate the subject.'
          : aloneNoContext
            ? 'this link is ALONE in its enclosing block (paragraph/list-item/cell) — its programmatically-determined CONTEXT is ONLY its own name. Any descriptive prose in a SEPARATE sibling block is NOT enclosing context for 2.4.4, and the vision crop showing nearby text must NOT be read as link context. If the name alone (a generic/format/action word) does not identify the link purpose, that is a 2.4.4 barrier — do not clear on neighbouring text the link does not programmatically own.'
            : 'this link sits within enclosing block text that MAY disambiguate it — judge whether the name TOGETHER WITH this enclosing-block context identifies the link purpose.',
      };
    }
    // 2.4.4 LINK-TARGET FACTS (residual RCA S10) — collected per link by collect-link-facts.js and joined by
    // xpath in act-page-collect.js. DOM-RESOLVED and deterministic: for a same-document fragment href the
    // collector resolved the target element IN the document (exists? what does its own heading / accessible
    // name say?); for every link it states the href's terminal path segment + file extension and whether
    // another link on the page shares this trimmed name while resolving to a DIFFERENT href. Replaces a
    // stochastic resolve_destination call on the fragment-destination question with a fact. Not a detector:
    // it MINTS nothing and changes no routing.
    if (element.linkTargetFacts && typeof element.linkTargetFacts === 'object'
        && (element.tag === 'a' || element.tag === 'area' || element.axRole === 'link' || element.roleAttr === 'link')) {
      s.linkTarget = {
        ...element.linkTargetFacts,
        uncertainReason: 'DOM-RESOLVED destination facts for THIS link (no tool call, no OCR). When `fragment` is present the href is a same-document fragment: `targetExists` says whether the target element exists in the DOM, and `targetHeadingText` / `firstHeadingText` / `targetName` are what the destination says it is, in its own words — AUTHORITATIVE over screenshots/OCR for what the fragment destination is; judge name-vs-destination agreement against these strings, and treat targetExists:false as a destination the name cannot be describing. `terminalSegment`/`extension` are the href\'s final path segment and file type — ADVISORY, never a contradiction alone: a document title linked straight to its file is an ordinary passing convention; the extension is contradiction evidence only when the name or its rendered presentation promises a purpose the file type cannot serve. `sameNameDifferentTarget:true` means another link on this page shares this trimmed name but resolves to a DIFFERENT href (the identical-names mode\'s precondition); false means the name is unique here or all bearers go the same place. The asymmetry stands: these facts may REFUTE a name, never RESCUE a vague one.',
      };
    }
    // Item 12 (composite name-role-state): surface the already-collected states/axStates bundle so the rubric can
    // judge whether a container exposes its required child states (selected/expanded/checked/level). axStates is the
    // authoritative CDP-computed set (eval-page); states is the DOM-attribute fallback. Absent ⇒ rubric self-abstains.
    if (element.axStates || element.states) {
      const st = element.axStates || element.states;
      const kept = {};
      for (const k of ['checked', 'expanded', 'pressed', 'selected', 'disabled', 'current', 'level', 'required', 'invalid', 'haspopup', 'readonly']) {
        if (st[k] !== undefined && st[k] !== null) kept[k] = st[k];
      }
      if (Object.keys(kept).length) s.states = kept;
    }
    // Item 13 (scrutiny hint, not a presumed barrier): a native control that OVERRIDES its role (<button role=link>,
    // <a role=button>) — verify the announced role matches its actual behavior. Many overrides are benign.
    if (element.roleOverridesNative === true) {
      s.roleScrutiny = {
        overridesNativeRole: true, nativeTag: element.tag || null, roleAttr: element.roleAttr || null,
        uncertainReason: 'this control overrides its native role — verify the ANNOUNCED role matches its actual behavior; treat as SCRUTINY, not a presumed barrier (many overrides are benign)',
      };
    }
  }
  // TT gap G3 (TT 7.D, 1.1.1): a CAPTCHA must have a non-visual AND non-auditory alternative. This is a REVIEW-tier
  // question a single static page rarely resolves — surface the detection + the explicit instruction to ask the
  // question and PARTIAL rather than verdict (TT itself prompts a human here). Never a confident clear.
  if (skill === 'captcha') {
    s.captcha = {
      detected: true,
      tag: element.tag || null,
      uncertainReason: 'a CAPTCHA is present. WCAG 1.1.1 requires an alternative form for users who CANNOT see AND an alternative for users who CANNOT hear (e.g. a visual puzzle MUST be paired with an audio option, and ideally a non-auditory path too). From a single static page you usually cannot confirm BOTH modalities exist — look in the crop/surrounding region for an explicit audio-challenge control or an alternative path. If you can SEE that only one modality is offered (a visual-only puzzle with no audio option), that IS a barrier (REPRODUCED). If you cannot confirm the alternatives either way, return PARTIAL (review) — do NOT issue a confident clear.',
    };
  }
  // Item 13: surface a field's placeholder into the forms/field-label signals — flag the placeholder-as-SOLE-label
  // smell (the placeholder disappears on input), without auto-failing a placeholder used ALONGSIDE a real label.
  if (skill === 'forms-instructions-errors' && typeof element.placeholder === 'string' && element.placeholder.trim().length > 0) {
    const hasName = typeof element.axName === 'string' && element.axName.trim().length > 0 && element.axName.trim() !== element.placeholder.trim();
    s.placeholder = {
      value: element.placeholder,
      isOnlyLabelSource: !hasName,
      uncertainReason: hasName ? undefined : 'the placeholder may be the field\'s ONLY label source — it disappears on input and is not a reliable label (3.3.2). Confirm a persistent visible/programmatic label exists',
    };
  }
  // Item 10 (1.2.x media): surface the collected media facts so the rubric judges captions PRESENCE + plausibility
  // (sync/quality are not statically judgeable → abstain). "absence ≠ pass": a present-but-EMPTY track is not captions.
  if (skill === 'media-alternatives' && element.mediaInfo && typeof element.mediaInfo === 'object') {
    const m = element.mediaInfo;
    s.media = {
      mediaTag: m.mediaTag || null,
      hasCaptionsTrack: m.hasCaptionsTrack === true,
      captionsTrackEmpty: m.captionsTrackEmpty === true,
      hasDescriptionsTrack: m.hasDescriptionsTrack === true,
      trackKinds: Array.isArray(m.trackKinds) ? m.trackKinds : [],
      mediaErrorName: element.mediaErrorName === true,
      uncertainReason: 'judge whether an ADEQUATE captions alternative exists: a <track kind=captions> that is PRESENT but EMPTY (no src) is NOT captions (absence ≠ pass); caption SYNC/quality cannot be judged from a static frame ⇒ return PARTIAL on those',
    };
  }
  // PAGE-STRUCTURE / READING-ORDER provisioning (Tier-0 #3): the page-level rubrics (2.4.2 title, 2.4.6/2.4.10
  // headings, 1.3.1 relationships) bind to a SYNTHETIC xpath with NO element, and the off-screen b49b2e heading
  // is omitted from the viewport crop — so without this branch the model gets an EMPTY stub and judged "a plain
  // span" / "no title supplied". Surface the threaded page structure + the subject heading's own role/level/text/
  // offscreen so an off-viewport heading is still judgeable. `__pageStructure` is attached by selectRubricSubjects.
  // 2.4.3 FOCUS-ORDER provisioning: hand over the recorded tab SEQUENCE the rubric is written around.
  // Each stop carries its rect so the judge can relate the order to the visible layout (the actual 2.4.3
  // question) instead of re-deriving an order it cannot observe. `backward` is surfaced separately because
  // a one-way escape is invisible in the forward ring. Truncated to keep the prompt bounded; `truncated`
  // is stated explicitly so a clipped tail is never mistaken for the end of the ring.
  // Gated on the THREADED EVIDENCE, not on `skill`: focus-management is shared with the element-level
  // 2.4.7/2.4.11 rubrics, and only focus-order-meaning-v0 is handed __focusOrder. So this branch cannot
  // fire on a focus-visible / focus-not-obscured subject and their prompts stay byte-identical.
  if (element.__focusOrder) {
    const fo = element.__focusOrder;
    // Landmarks/headings only — enough to name the REGION a tab stop lands in ("footer", "nav"), which is
    // how a 2.4.3 order is argued about. Deliberately NOT the full page-structure payload: table-association
    // and title facts are noise here, and reusing that branch would perturb the 1.3.1/2.4.2 prompts.
    const struct = element.__pageStructure || null;
    if (struct) {
      s.structure = {
        headings: Array.isArray(struct.headings) ? struct.headings.slice(0, 40) : [],
        landmarks: Array.isArray(struct.landmarks) ? struct.landmarks.slice(0, 40) : undefined,
      };
    }
    if (Array.isArray(fo.forward)) {
      const CAP = 60;
      const trim = (list) => (Array.isArray(list) ? list.slice(0, CAP) : []);
      // batch-3 #25 (defensive): per-stop `occludedBy` and the page-set `initialFocus` stop are SIBLING
      // instrument facts (probeActive) that may not be in the tree yet. Stops are threaded whole, so a
      // per-stop occludedBy rides automatically; the note documents both ONLY when at least one exists,
      // keeping every current focus-order prompt byte-identical until the instrument emits them.
      const occlusionFacts = [...trim(fo.forward), ...trim(fo.backward)].some((st) => st && st.occludedBy != null) || fo.initialFocus != null;
      s.focusOrder = {
        forward: trim(fo.forward), backward: trim(fo.backward),
        ...(fo.initialFocus != null ? { initialFocus: fo.initialFocus } : {}),
        count: fo.count != null ? fo.count : fo.forward.length,
        wrapped: fo.wrapped === true, exhausted: fo.exhausted === true,
        truncated: (fo.forward.length > CAP) || ((fo.backward || []).length > CAP),
        // Whether index 0 is the page's genuine FIRST tab stop. The walk records a ring; the instrument
        // un-rotates it at the document boundary, but a ring with no boundary crossing cannot be un-rotated
        // and the judge must not then argue from where the list begins (residual RCA S5, clause B).
        startAnchored: fo.startAnchored !== false,
        // Did the instrument lane hit its wall-clock cap? A SALVAGED sequence is still sound evidence about
        // order; it is only a warning that later instruments (traps, status) may be missing.
        partial: fo.partial === true,
        // 2.4.3 INTRINSIC ORDINALS (FN round 1). Present ONLY on the unambiguous violation, so every other
        // page's focus-order prompt stays byte-identical: the stops carry distinct numbers, those numbers
        // ascend under row-major reading geometry, and the recorded ring does not follow them.
        ...(fo.intrinsicOrdinals && fo.intrinsicOrdinals.violated === true ? { intrinsicOrdinals: fo.intrinsicOrdinals } : {}),
        note: 'ORDERED tab stops recorded by the deterministic keyboard instrument (forward = Tab, '
          + 'backward = Shift+Tab); each stop carries its on-page rect, its accessible NAME (label), and — '
          + 'when a modal is open — modalOpen/insideOpenModal/modalXpath. The ring is UN-ROTATED at the '
          + 'document boundary, so index 0 is the true first stop WHEN startAnchored is true. This is the '
          + 'SEQUENCE only — whether it preserves meaning is YOUR judgment. Empty/degenerate ⇒ PARTIAL.'
          + (fo.intrinsicOrdinals && fo.intrinsicOrdinals.violated === true
            ? ' `intrinsicOrdinals` is present, which means the stops are NUMBERED and their numbers ascend '
              + 'in the page\'s visual reading order (`visualOrdinals`) but NOT in the recorded ring '
              + '(`navOrdinals`). That is the page declaring its own sequence and the ring departing from '
              + 'it — the numbers are printed for the reader. A FACT about the labels and the geometry, '
              + 'never a verdict: whether departing from it destroys meaning or operability is still yours.'
            : '')
          + (occlusionFacts
            ? ' Stops may additionally carry `occludedBy` — the xpath of the element visually COVERING that '
              + 'stop\'s rect when it was probed — plus, on the SAME stop, `occluderPosition` (that '
              + 'element\'s CSS position), `occluderRect`, and `occluderViewportCoverage` (the fraction of '
              + 'the VIEWPORT its own box covers, 0-1) — and the artifact may carry `initialFocus`, the stop '
              + 'the PAGE ITSELF placed focus on at load, before any Tab. These are deterministic occlusion/'
              + 'initial-focus FACTS for the visually-modal-overlay case (an overlay with no dialog '
              + 'semantics); a bare `occludedBy` is NOT by itself that case — the rubric\'s scrim test on '
              + 'position + coverage decides it. All are absent wherever the instrument observed neither.'
            : ''),
      };
    }
  }
  // 1.4.13 HOVER-CONTENT FACETS — see selectRubricSubjects. The per-facet measurements the deterministic
  // tri-probe made on THIS trigger, handed to the facet rubric that owns each one. Gated on the THREADED
  // evidence, not on `skill`: `color-and-visual-text` is shared with the 1.4.1/1.4.3 element rubrics, whose
  // prompts must stay byte-identical.
  //
  // WHY. The probe already measures dismissability, hoverability and persistence separately and records them
  // as typed outcomes — and none of it reached a prompt. The rubric that consumed these obligations opened by
  // telling the judge to defer to "a concrete CLAIM" it was never given, then asked it to settle all three
  // from a before/after screenshot pair. Two of the three are not answerable from stills at all.
  //
  // The NOTE is the load-bearing half. Each field's measurement has a known SUFFICIENCY, and they differ: a
  // successful Escape or a successful pointer travel is sufficient under the criterion, while a bounded dwell
  // is not — so `persistent: true` is reported here as the bounded observation it is, never as a clearance.
  if (element.__hoverFacets && typeof element.__hoverFacets === 'object') {
    const f = element.__hoverFacets;
    s.hoverFacets = {
      ...f,
      note: 'PER-FACET measurements from the deterministic hover/focus probe on THIS trigger. `dismissible` '
        + 'true means Escape removed the content with the trigger still held, OR the content obscures nothing '
        + '(which exempts it) — either is SUFFICIENT under the criterion. `hoverable` true means the content '
        + 'survived a real pointer travel from the trigger onto it — also sufficient. `persistent` is the ONE '
        + 'field whose true is NOT sufficient: it means only "still present after `dwellMs`", so content on a '
        + 'timer longer than that dwell measures true and still fails. `revealMode` is which channel revealed '
        + 'it (hover / focus). A facet reported as `null` was NOT MEASURED on this trigger — the probe could not '
        + 'stage it — so it is neither a pass nor a failure; do not read an unmeasured facet as either. '
        + 'THE NEGATIVES ARE WEAK: the probe finds revealed content by diffing the '
        + 'visibility of real ELEMENTS, so a tooltip drawn by a CSS pseudo-element, painted into a canvas, or '
        + 'hosted in a namespace the probe could not address reports `contentAppeared: false` while plainly '
        + 'showing on screen — read that as "the probe saw nothing", never as "nothing appears". Likewise '
        + '`nativeTitleOnly` is an ATTRIBUTE test: per the HTML spec an EMPTY `title=""` carries no advisory '
        + 'information and renders no UA tooltip, so the flag does not establish that what is on '
        + 'screen is the browser\'s own tooltip. These are FACTS with stated limits, never a verdict.'
        + (f.redundantWithVisibleText && typeof f.redundantWithVisibleText === 'object'
          ? ' `redundantWithVisibleText` is the runner\'s check of whether the revealed text was ALREADY visible at '
            + 'rest in the trigger\'s local container (or equals the trigger\'s accessible name): `redundant: false` '
            + (f.redundantWithVisibleText.revealedText
              ? 'means the reveal adds text that was not on screen — it is additional content and every facet is owed.'
              : 'with no `revealedText` means the check found no rest-visible duplicate to compare (a text-free, '
                + 'graphical reveal) — the content is additional and every facet is owed.')
          : '')
        // batch-3 #9: document the held-state samples ONLY when the probe produced them, so every other
        // hover prompt stays byte-identical. `vanishedWhileHeld: true` is a POSITIVE timed-dismissal
        // observation; the sole refutation is a LONGER held dwell than the last sample's offset.
        + (Array.isArray(f.persistenceSamples)
          ? ' `persistenceSamples` are re-reads at fixed offsets after a fresh reveal with the trigger state '
            + 'held (`held: true` = the hold was POSITIVELY verified at that sample; `atMs` = the offset). '
            + '`vanishedWhileHeld: true` means the content went away WHILE the hold demonstrably survived — a '
            + 'positive self-withdrawal observation, refutable only by a longer held dwell (one exceeding the '
            + 'last sample\'s `atMs`) that still finds the content present, never by reasoning from the markup. '
            + 'Whether the SC\'s information-no-longer-valid exception applies stays yours.'
          : ''),
    };
  }
  // 1.4.1 COLOUR PEER GROUP — see selectRubricSubjects. Gated on the threaded evidence, so an ordinary
  // element-level 1.4.1 subject (a link, a form field, a graphic) keeps its prompt byte-identical.
  if (element.__colourPeerGroup) {
    const g = element.__colourPeerGroup;
    s.colourPeerGroup = {
      members: (g.members || []).slice(0, 12),
      distinctColours: g.distinctColours,
      ...(g.tokenLane === true ? { tokenLane: true, legendText: g.legendText || undefined } : {}),
      note: g.tokenLane === true
        ? 'These elements are TEXT-LESS COLOUR TOKENS: the same tag and class, spread across DIFFERENT '
          + 'parents, each painting its own background, with no text of their own — and the same token class '
          + 'also appears inside a text-bearing context (legendText). The SET is the question, not the anchor '
          + 'element alone. What is yours to judge: whether the colour codes information (a status, a '
          + 'category), and whether that information is available in text AT THE POINT OF USE — a legend '
          + 'elsewhere that only NAMES the colours does not by itself make each token readable without colour '
          + 'perception (G14). A token set whose meaning is also conveyed per-instance in text, a pattern, or '
          + 'an icon is not a failure.'
        : 'These elements are STRUCTURAL PEERS (same tag, same role, same parent) that are IDENTICAL on every '
        + 'non-colour axis the collector measured — font weight, style, size, text-decoration, border style, and '
        + 'presence of an icon or generated-content marker — and DIFFER in used colour. Zebra striping, syntax '
        + 'highlighting, colour-uniform sets, images and text-less swatches are already excluded. What is NOT '
        + 'settled, and is yours to judge: whether the colour is carrying INFORMATION at all (a purely aesthetic '
        + 'palette is not a 1.4.1 failure), and whether that information is also available as text elsewhere '
        + '(a label, a legend entry attached to each item, an accessible name).',
    };
  }
  // 1.4.1 THE FIELD'S OWN RESOLVED COLOURS AND STATE (residual RCA S10) — collected per element by
  // act-page-collect.js, present ONLY on a form field whose form is not colour-uniform. Not a detector: it
  // MINTS nothing and changes no routing; it supplies the counter-fact a colour judgment needs.
  //
  // WHY. A 1.4.1 form-field subject arrived with no colour facts at all — `s.contrast` is a stub on this
  // collector (it never emits color/effBg), so the only source for "is this field red / is it in the error
  // state" was the crops. The `surrounding-region` crop is a RECTANGLE: on a two-column row it carries the
  // NEIGHBOURING field's border. Measured — a default-state input beside an invalid one was reported as
  // having a "red LEFT border ... sole error indicator" on a page whose markup gives it no error class and
  // no aria-invalid. The judge was not inventing a colour, it was ATTRIBUTING a real pixel to the wrong
  // element, and nothing in the prompt could contradict it. A rubric prohibition cannot fix that; the
  // element's own computed style can.
  // 1.4.1/1.1.1 F13 MINT REASON (batch-3 #7) — the image's OWN text alternative declares colour coding.
  // The oracle mints `use-of-color` on an image precisely because its alt/name/long-description states a
  // STRONG colour construction (applicability-oracle.js F13 branch), but that reason reached no prompt: the
  // judge saw an image subject with no stated ground for the colour question and could clear it on an
  // unstated visual covariate. Same pattern as `deterministicAbstained`: a stated reason, never a verdict.
  // The STRONG-patterns-only restriction is re-declared here exactly as coverage-registry.js re-declares it
  // (the lexicon is the shared input contract; the surface→signal logic is local by design — Rule 16).
  // Gated on sc 1.4.1 as well as the skill: `color-and-visual-text` is shared with the 1.4.3/1.4.13 rubrics,
  // whose prompts must stay byte-identical (only use-of-color-v0 owns the F13 colour-coding question).
  if (skill === 'color-and-visual-text' && sc === '1.4.1') {
    const f13Role = String(element.roleAttr || element.role || element.axRole || element.sampledRole || '');
    if ((oracle.IMG_ROLE.test(f13Role) || element.isImage === true) && element.removedFromA11yTree !== true) {
      for (const f13Field of ['alt', 'axName', 'describedByText', 'longDescriptionText']) {
        const t = element[f13Field];
        if (typeof t !== 'string' || !t) continue;
        const hits = colorReferencesIn(t).filter((h) => h.pattern === 'presented-in-colour' || h.pattern === 'ui-noun-in-colour' || h.pattern === 'colour-coding');
        if (!hits.length) continue;
        s.imageAltColorReferences = {
          field: f13Field,
          matchedText: t.replace(/\s+/g, ' ').trim().slice(0, 200),
          constructions: hits,
          uncertainReason: 'this image\'s OWN text alternative states a colour CONSTRUCTION — the author\'s own '
            + 'declaration that the image encodes information BY COLOUR (the F13 shape), and the reason this '
            + 'obligation exists at all. It settles applicability only, never the verdict: what stays yours is '
            + 'whether the colour-RESOLVED information (which item/region is in which coded state) is available '
            + 'IN TEXT — in the alternative itself or in on-page text you can point to.',
        };
        break;
      }
    }
  }
  if (skill === 'color-and-visual-text' && element.fieldColourState && typeof element.fieldColourState === 'object') {
    // Leg (i) of the rubric's key/legend test, ANSWERED deterministically (iteration-2 replays measured
    // judges reading a mixed "lighter X vs dark Y" key as hue-named 3/3 despite a prose tie-break): does
    // the key's own phrasing hand the reader a lightness word to apply? Hue words alongside do not defeat
    // it; only a key with NO lighter/darker language leaves hue as the sole handle. Generic English
    // lightness vocabulary — no corpus phrasing involved.
    const keyText = element.fieldColourState.colourKeyText;
    const lightnessWorded = typeof keyText === 'string'
      ? /\b(light(er|est)?|pale(r|st)?|dark(er|est)?|deep(er|est)?|bright(er|est)?|dim(mer|mest)?|shade[sd]?|greyed|grayed|faded|muted)\b/i.test(keyText)
      : null;
    s.fieldColourState = {
      ...element.fieldColourState,
      ...(lightnessWorded === null ? {} : { colourKeyLightnessWorded: lightnessWorded }),
      uncertainReason: 'these are THIS element\'s OWN computed values, read off its resolved style — they are '
        + 'AUTHORITATIVE over the crops for what colour it is and what state it is in. The surrounding-region '
        + 'crop is a rectangle and on a multi-column form it contains the EDGES OF NEIGHBOURING FIELDS, so a '
        + 'coloured border seen near this element may belong to the control beside it; if no side of `border` '
        + 'carries that colour, this field does not have it. `errorStated`/`requiredStated`/`state.*` are what '
        + 'the page programmatically says about THIS field. `sameAppearanceAs` are the peers rendering exactly '
        + 'as it does and `differentAppearanceFrom` the rest, each with its own `errorStated` and `nonColourCue` '
        + '— a field matching the peers that carry no cue, and differing from the peers stated to be in a state, '
        + 'is in the DEFAULT state, which is not a colour-alone failure. `labelColourContrasts` is the MEASURED '
        + 'luminance separation from each other label colour in the set; use it instead of estimating a ratio. '
        + '`borderColourContrasts` is the same measurement for uniform BORDER colours vs differently-bordered '
        + 'peers — the number the rubric\'s lightness-escape clause requires; never derive a ratio yourself '
        + 'from raw colour values. `boxShadow` is this field\'s own shadow declaration (\'none\' when unset), '
        + 'reported so the state styling is described COMPLETELY: a coloured ring drawn with a shadow spread '
        + 'moves no layout and so used to be invisible here, leaving a field whose coded state is a halo '
        + 'described as carrying only its border. Raw styling, never a verdict, and it cuts both ways — a '
        + 'shadow that merely restates the border\'s colour is one more COLOUR cue, while a ring the peer '
        + 'fields do not have AT ALL is a difference in visual presentation. Decide which from the peer rows '
        + '(`differentAppearanceFrom[].boxShadow` is present only where a peer\'s shadow differs from this '
        + 'one\'s); its mere presence is never a cue. When `colourKeyLightnessWorded` is present it ANSWERS leg (i) of the '
        + 'key/legend test: true = the key\'s own phrasing hands the reader a lightness word to apply (hue '
        + 'words alongside do NOT defeat it); false = hue is the key\'s sole handle and leg (i) fails — do '
        + 'not re-litigate the phrasing either way. These are FACTS, not a verdict: whether the colour '
        + 'carries INFORMATION, and '
        + 'whether a non-colour cue exists where one is needed, is yours to judge.',
    };
  }
  // 1.4.1 F73 LINK CUE PARITY (item 27; user doctrine ruling 2026-08-18): deterministic style math for an
  // in-prose link — collected by collect-link-facts.js, attached by act-page-collect.js as its own element
  // key precisely so the 2.4.4 payload stayed byte-identical while the doctrine decision was pending. The
  // key exists only on in-prose links with enough surrounding prose, so every other subject's prompt is
  // untouched.
  if (skill === 'color-and-visual-text' && element.linkCueParity && typeof element.linkCueParity === 'object') {
    const cp = element.linkCueParity;
    // The CLASS is computed HERE, deterministically, because iteration-1/2 replays measured judges
    // fumbling the same boolean reads in prose: an identical-to-prose link maxes every intuition about
    // "indistinguishable" while being exactly the shape the applicability precondition excludes, and two
    // GT-inapplicable pages became stable FPs the moment the raw numbers were handed over. One token, one
    // class-specific sentence, no judge-side arithmetic.
    const identical = cp.linkColor === cp.proseColor && cp.linkWeight === cp.proseWeight;
    const cueParityClass = identical ? 'identical-to-prose'
      : (cp.nonLinkSameStyleCount > 0 ? 'distinct-shared' : 'distinct-unique');
    const escapeMet = typeof cp.contrastLinkVsProse === 'number' ? cp.contrastLinkVsProse >= 3 : null;
    const CLASS_NOTE = {
      'identical-to-prose': 'CLASS identical-to-prose: the link\'s colour AND weight equal its prose '
        + 'block\'s own (measured ratio ~1). Colour differentiates NOTHING here, so this is the '
        + 'APPLICABILITY PRECONDITION\'s case, not a colour-alone failure: a zero difference is evidence '
        + 'AGAINST 1.4.1 applying, never for a barrier. Do not flag the link\'s mere indistinguishability '
        + 'under this SC.',
      'distinct-shared': 'CLASS distinct-shared: the link\'s styling differs from its prose block, but '
        + 'non-link text in the SAME block renders in that exact colour+weight signature '
        + '(`nonLinkSameStyleSamples` quotes up to three) — the rubric\'s measured-parity exception: an '
        + 'axe link-in-text-block PASS does not settle this link, judge it under the cue-parity clause.',
      'distinct-unique': 'CLASS distinct-unique: the link\'s signature is unique inside its block — no '
        + 'parity problem exists; the axe deferral and the ordinary second-cue analysis govern, and '
        + '`f73LightnessEscapeMet` tells you whether the MEASURED separation already satisfies F73\'s '
        + '>=3:1 lightness escape (true = it does; never re-derive it).',
    };
    s.linkCueParity = {
      ...cp,
      cueParityClass,
      f73LightnessEscapeMet: escapeMet,
      note: 'MEASURED style facts for this in-prose link, computed from resolved styles and AUTHORITATIVE '
        + 'over the crop for what the styles are; `contrastLinkVsProse` is the measured link-vs-prose '
        + 'luminance ratio (null = not soundly computable, never estimate it). '
        + CLASS_NOTE[cueParityClass] + ' Facts and a computed class, not a verdict.',
    };
  }
  // 1.3.1 CONTROL-GROUP CORRESPONDENCE — collected per element by act-page-collect.js, present only on a
  // member of a set that genuinely forms ONE question (radios/checkboxes sharing a control name, or sibling
  // controls none of which carries a label element / aria-label / aria-labelledby). Not a detector: it MINTS
  // nothing and changes no routing.
  //
  // WHY. Whether a visible group label has a programmatic counterpart is a fieldset/legend or
  // role=group|radiogroup + accessible-name lookup, and it reached no prompt. Its absence produced errors in
  // BOTH directions from the same judge on one page shape: on a set that WAS grouped (a radiogroup naming its
  // heading through aria-labelledby) it asserted the visible text was "NOT programmatically associated" with
  // the controls; on sets that were NOT grouped it declined to decide — "could not confirm programmatic
  // grouping", "could not complete an accessibility-tree query" — with zero tool calls made. The collector's
  // own note closes both directions; nothing further is added here.
  if ((skill === 'grouping-and-reading-order' || skill === 'forms-instructions-errors')
      && element.controlGroup && typeof element.controlGroup === 'object') {
    s.controlGroup = element.controlGroup;
  }
  // 1.3.1 LABEL-GEOMETRY MISMATCH (batch-3 #20 threading; collector fact `labelGeometryMismatch` from
  // collectLabelGeometry, landed with the batch-3 collectors work). WHY: for/id can be textually perfect
  // while the layout renders every field under a DIFFERENT control's label — no lane saw geometry, so the
  // inverted visible pairing reached no prompt. Element-level and flood-tightened at collection; gated on
  // the grouping skill so only the per-field 1.3.1 association subject's prompt changes.
  if (skill === 'grouping-and-reading-order' && element.labelGeometryMismatch && typeof element.labelGeometryMismatch === 'object') {
    s.labelGeometryMismatch = {
      ...element.labelGeometryMismatch,
      uncertainReason: 'MEASURED from rendered geometry: this field\'s programmatic label (`ownLabelText`, a '
        + 'resolving for/id) renders somewhere else, while the label visually adjacent ABOVE the field — '
        + 'overlapping its column, `gapPx` away — is a DIFFERENT control\'s label (`visuallyAdjacentLabelText`, '
        + 'whose for= names `visuallyAdjacentLabelFor`). A sighted user reads the adjacent label as this '
        + 'field\'s name; AT announces the programmatic one. These are facts about the two pairings, never a '
        + 'verdict: whether the visual arrangement genuinely conveys the inverted pairing (versus an obvious '
        + 'columnar layout a sighted user reads correctly) is yours to judge from the crops.',
    };
  }
  // 1.3.1 F42 FOCUSABLE ROLE-LESS VARIANT (batch-3 #18, defensive): the collector-side fact is a sibling
  // deliverable (feature-detected — inert until it lands). control-semantics-v0's stated premise is the
  // NON-focusable shape, so a subject admitted under the sibling premise must be told which branch it is on
  // — otherwise the judge reads the element's focusability as refuting the rubric's "settled facts".
  if (skill === 'grouping-and-reading-order' && element.emulatedControlFocusable === true) {
    s.emulatedControlFocusable = {
      uncertainReason: 'this element was admitted as the FOCUSABLE role-less variant of the emulated-control '
        + 'shape: it carries a script activation handler and IS keyboard-focusable (tabindex >= 0 or native '
        + 'focusability) while declaring no interactive role and containing no natively-interactive '
        + 'descendant. Its focusability is the PREMISE of this variant, not a refutation of the rubric — a '
        + 'keyboard user can reach it, but AT still announces it as ordinary content. Whether it visibly '
        + 'presents as a control is yours to judge.',
    };
  }
  // 1.3.1 PAGE-LEVEL CONTROL-GROUP SUMMARY — see selectRubricSubjects. The per-member record above answers
  // "which set is THIS field part of"; this one answers the page-level question — which sets exist, what
  // visible text governs each, and whether a programmatic group NAME exists — on the subject where that
  // question is actually judged.
  if (element.__controlGroupsPage) {
    const cg = element.__controlGroupsPage;
    s.controlGroups = {
      groups: (cg.groups || []).slice(0, 8),
      splitFieldGroupXpaths: (cg.splitFieldGroupXpaths || []).slice(0, 12),
      note: 'Each entry is a control SET that forms ONE question by construction (radios/checkboxes sharing '
        + 'a control name, or sibling controls of which NONE carries a label element / aria-label / '
        + 'aria-labelledby). `hasProgrammaticGroupName` and `programmaticGroup` state whether a grouping '
        + 'mechanism (fieldset+legend, role=group/radiogroup with an accessible name) names the set — '
        + 'CHECKED in the DOM, a determined result in BOTH directions: where it is true, do NOT report the '
        + 'visible text as "not programmatically associated"; where `correspondence` is '
        + 'no-programmatic-group, do not report it as unconfirmable and do not ask for an '
        + 'accessibility-tree query to settle it. `visibleLabelCandidates` are the visible text blocks '
        + 'immediately before the set, in reading order — which one (if any) is the question the controls '
        + 'answer is yours to read, and the absence of a group is a barrier only when that text carries '
        + 'meaning the members\' own names (`memberOwnNames`) do not carry alone. `splitFieldGroupXpaths` '
        + 'are inputs that are PARTS of one multipart field (short-maxlength siblings named, if at all, by '
        + 'title/placeholder); their group question belongs to this subject too. These are FACTS about the '
        + 'page\'s grouping state, never a verdict.',
    };
  }
  // 1.3.1 VISUAL-STRUCTURE DISCOVERIES — see selectRubricSubjects. The broad-scope visual-structure probe
  // now runs per-case in the collector (one read-only evaluate); its heading discoveries give the judge a
  // deterministic anchor for the styled-non-semantic-heading shape instead of a live-AX-check-shaped
  // question answered from the crop.
  if (element.__visualHeadings) {
    s.visualHeadings = {
      entries: element.__visualHeadings.slice(0, 8),
      note: 'Rendered text blocks that LOOK like headings — heading-scale font size/weight, short, '
        + 'block-level — while being neither h1-h6 nor role=heading. Each ENTRY is deterministic; the LIST '
        + 'is NOT exhaustive — these are additive anchors, not the complete inventory, so a heading-looking '
        + 'line the probe did not list is still yours to judge from the viewport, and the absence of an '
        + 'entry asserts nothing. The visual-heading PREMISE of a listed entry is '
        + 'established from computed style, deterministically: do not re-derive it from the crop and do '
        + 'not request a live accessibility-tree check to establish it. What stays yours: whether the text '
        + 'actually INTRODUCES the content below it as a section (text serving branding, emphasis, or '
        + 'display purposes rather than introducing what follows is not a heading), and whether a real programmatic heading already carries '
        + 'that structure. A styled line that does introduce a section, with no programmatic heading '
        + 'anywhere for it, is the visual-structure-without-markup direction of 1.3.1.',
    };
  }
  // 1.3.1 EXACT DECLARED-STRUCTURE / GROUPING-STATE FACTS — see selectRubricSubjects and
  // act-page-collect.js collectStructuralMarkupFacts. Each converts a previously-unanswerable page-level
  // question into a stated, checked result; each is DATA with a reading rule, never a verdict.
  if (element.__structuralMarkupFacts) {
    const smf = element.__structuralMarkupFacts;
    if (Array.isArray(smf.blockquotesWithoutSource) && smf.blockquotesWithoutSource.length) {
      s.blockquotesWithoutSource = {
        entries: smf.blockquotesWithoutSource.slice(0, 4),
        note: 'Each entry is a visible <blockquote> with NO cite= attribute, NO <cite> descendant, and NO '
          + 'adjacent attribution (no figcaption in an enclosing figure, no dash-led attribution line '
          + 'beside or inside it) — the element declares a quotation relationship and names no source '
          + 'anywhere the DOM can see. CHECKED, not unconfirmable. Yours to judge from the text: whether '
          + 'it reads as first-party prose merely styled as a quote — markup asserting the words belong to '
          + 'an outside source that does not exist is the declared-structure-must-be-true failure — or as '
          + 'a genuine quotation whose source is simply unstated, which is not by itself a 1.3.1 barrier.',
      };
    }
    if (Array.isArray(smf.dlOrderAnomalies) && smf.dlOrderAnomalies.length) {
      s.dlOrderAnomalies = {
        entries: smf.dlOrderAnomalies.slice(0, 4),
        note: 'dt/dd ordering facts for each anomalous <dl>. `leadingDd` = a description before any term; '
          + '`trailingDt` = a trailing term with no description; `invertedDivGroups` = spec-legal <div> '
          + 'wrappers whose description PRECEDES its term — each of these can bind the announced '
          + 'term→description pairing to the wrong items. `countMismatch` is ONLY a count fact: several '
          + 'descriptions per term and several terms per description are both legal, so judge it from the '
          + 'rendered pairs, not the arithmetic.',
      };
    }
    if (Array.isArray(smf.radioGroupsWithoutGrouping) && smf.radioGroupsWithoutGrouping.length) {
      s.radioGroupsWithoutGrouping = {
        entries: smf.radioGroupsWithoutGrouping.slice(0, 4),
        note: 'Radio sets sharing a control name with NO accessibly-named grouping container — no fieldset '
          + 'named by a legend or by aria-label/aria-labelledby, no role=radiogroup, and no accessibly-named '
          + 'role=group — anywhere from their common ancestor up to the form — a CHECKED '
          + 'absence, so do not report grouping as unconfirmable and do not ask for an accessibility-tree '
          + 'query to settle it. `precedingText` is the visible text block immediately before the set with '
          + 'its computed weight/size. The absence is a barrier when that text is the question the radios '
          + 'answer and their own labels do not carry it alone; it is NOT one when each radio\'s own '
          + 'accessible name already suffices.',
      };
    }
    if (Array.isArray(smf.requiredStateInventory) && smf.requiredStateInventory.length) {
      s.requiredStateInventory = {
        entries: smf.requiredStateInventory.slice(0, 6),
        note: 'Per-form counts: fields with required= / aria-required=true, visible required-word tokens in '
          + 'the form\'s text, and label/legend asterisk markers (CSS-generated ones included). ZERO IS A '
          + 'MEASURED ABSENCE, not an unavailable signal — but the counts are FACTS ONLY, never a verdict. '
          + 'requiredAttrCount and ariaRequiredCount both 0 makes a visibly-announced required state a '
          + 'barrier ONLY IF the required indication is ALSO absent from the fields\' accessible names and '
          + 'associated label text: an asterisk or a required-word that sits INSIDE a field\'s associated '
          + 'label is part of that field\'s accessible name and IS programmatically conveyed, attributes or '
          + 'not. The unprogrammatic shape is a required indication carried only by styling, colour, layout, '
          + 'or text associated with no field. A form where the counts line up with the visible '
          + 'marking needs no further required-state scrutiny.',
      };
    }
    // batch-3 #19c threading (collector fact landed with the batch-3 collectors work): a fieldset+legend
    // that contains NO form control anywhere in its subtree — declared grouping around plain content.
    if (Array.isArray(smf.fieldsetsWithoutControls) && smf.fieldsetsWithoutControls.length) {
      s.fieldsetsWithoutControls = {
        entries: smf.fieldsetsWithoutControls.slice(0, 4),
        note: 'Each entry is a visible fieldset (with its legend text and a content sample) whose subtree '
          + 'contains NO form control of any kind — a CHECKED absence, not an unconfirmable one. The markup '
          + 'declares a control-group relationship and announces the legend as a group name, while there is '
          + 'no group of controls for it to name. Yours to judge from the content sample: markup asserting a '
          + 'grouping the content does not have is the declared-structure-must-be-true direction of 1.3.1; a '
          + 'container whose controls are merely associated from elsewhere is NOT reported here, so the '
          + 'fact\'s absence claims nothing.',
      };
    }
  }
  // 3.3.1 THE ERROR STATE ALREADY PRESENT AT REST — collected per field by act-page-collect.js, present only
  // on a form that is not pristine as loaded (a field flagged at rest, or values already in the boxes).
  //
  // WHY. The 3.3.1 lane routes through a before/after driver. On a server-rendered redisplay that driver is
  // guaranteed to abstain — no script, novalidate, nothing to trigger — AND it destroys the evidence: the
  // retained value clears, so a transcript showing the field emptying is the probe erasing the barrier, not
  // the page passing. The barrier only ever existed in the state the page loaded in. The collector's note
  // carries that reading rule; nothing further is added here.
  if (skill === 'forms-instructions-errors' && element.atRestErrorState && typeof element.atRestErrorState === 'object') {
    s.atRestErrorState = element.atRestErrorState;
  }
  // 3.3.1 ERROR-SUMMARY COHERENCE — see selectRubricSubjects. Gated on threaded evidence, so a 3.3.1
  // subject on a page with no summary keeps its prompt byte-identical.
  if (element.__errorSummaries) {
    s.errorSummaries = {
      summaries: element.__errorSummaries.slice(0, 3),
      // PER-SUBJECT correspondence (see resolveSummaryField). The page-level sets above are about the FORM; this
      // says where THIS field sits in them, so the judge does not have to run the set-membership step itself.
      // Absent whenever the field could not be resolved unambiguously — never a guess.
      ...(element.__errorSummaryField ? { thisField: element.__errorSummaryField } : {}),
      note: 'The page carries an error SUMMARY that names specific fields. `namedFields` are the fields it '
        + 'points at; `flaggedFields` are the fields actually marked in error (aria-invalid, or an associated '
        + 'message). `namedButNotFlagged` and `flaggedButNotNamed` are the two set differences, and `coherent` '
        + 'is true only when both are empty. These are FACTS about correspondence, not a verdict: a summary '
        + 'may legitimately name a field whose error is server-side and not yet reflected in the DOM.'
        + (element.__errorSummaryField
          ? ' `thisField` places THE FIELD YOU ARE JUDGING in that correspondence (resolved by '
            + element.__errorSummaryField.resolvedVia + '): `named` = the summary points at this field, `flagged` = '
            + 'this field is actually marked in error, and the two booleans below them say which set difference it '
            + 'falls in. Judge THIS field\'s row, not the page totals — and note that this field\'s OWN markup being '
            + 'correct does not settle it, because the mismatch lives between the summary and the flagged state, '
            + 'not inside the field.'
          : ''),
    };
  }
  // 4.1.3 STATUS OBSERVATIONS — see selectRubricSubjects. Gated on the THREADED evidence, not on `skill`,
  // so auto-update-notification-v0 (same skill) is untouched.
  if (element.__statusObservations) {
    const obs = element.__statusObservations;
    const CAP = 12;
    s.statusObservations = {
      triggers: obs.slice(0, CAP),
      count: obs.length,
      truncated: obs.length > CAP,
      note: 'Per-TRIGGER record from the deterministic status instrument: each entry is what activating that '
        + 'control actually did. `regionsBornWithContent` = live regions INSERTED already holding their message '
        + '(an AT watches regions that existed BEFORE the change, so these announce NOTHING). `regionsUpdated` = '
        + 'pre-existing regions whose text changed, with politeness/atomic/emptied. `removedText` = status text '
        + 'that LEFT the page (appearedThenRemoved marks a message added and then withdrawn inside the same '
        + 'observation). THE THREE FOCUS FACTS ARE NOT INTERCHANGEABLE: `focusMoved` = focus came to rest on a '
        + 'REAL element (the change-of-context exclusion); `focusMovedIntoNewContent` = it landed INSIDE the '
        + 'content that appeared (the strongest exclusion — the AT announced it by focusing it); `focusDropped` '
        + '= the activation DESTROYED the focused element and focus fell back to the document body, which '
        + 'announces nothing and silently loses the user\'s place — a barrier SYMPTOM, never an exclusion. '
        + 'These are FACTS about what happened, never a verdict about what was owed.',
    };
  }
  // 4.1.3 MULTI-STEP TIMELINE — the phase-B sidecar to statusObservations (threaded by rubric id, same
  // gate). One entry per ACTIVE trigger; `timeline` is the complete ordered record of the activation.
  if (Array.isArray(element.__autoUpdateCadence) && element.__autoUpdateCadence.length) {
    s.autoUpdateCadence = {
      regions: element.__autoUpdateCadence.slice(0, 6),
      note: 'SPONTANEOUS auto-update cadence, observed with NO user action (harness interactions '
        + 'excluded by boundary mark): updateCount changes at medianIntervalMs inside the named '
        + 'region. Judge the politeness against the interruption frequency: an assertive region '
        + 'that re-announces on a timer interrupts the user at every cycle; a polite region '
        + 'updating faster than it can be read may never be heard at all. Cadence is evidence of '
        + 'HOW OFTEN, never of whether the content is a status message — apply the scope '
        + 'exclusions first.',
    };
  }
  if (element.__statusTimelines) {
    const tls = element.__statusTimelines;
    const CAPT = 8;
    s.statusTimelines = {
      triggers: tls.slice(0, CAPT),
      count: tls.length, truncated: tls.length > CAPT,
      note: 'Per-trigger ORDERED record of everything that happened after activation, to a longer horizon '
        + 'than the single before/after observation (each row: atMs since activation + kind). Kinds: '
        + 'content-added/content-removed (with inLiveRegion/fromLiveRegion), live-region-emptied/-refilled/'
        + '-updated (a pre-existing region\'s text transitions, in order), state-change (an attribute flip '
        + 'such as disabled/aria-busy/aria-expanded — onTrigger marks the activated control itself), '
        + 'visibility-flip (a class/style-driven show/hide of pre-rendered content), value-emptied (a form '
        + 'control\'s value cleared). Read the END of the flow, not an intermediate phase: after a busy or '
        + 'progress message is removed or its region emptied, whatever conveys the OUTCOME must itself be '
        + 'announced. The hard failure shape is TEXTUAL status that reaches no AT: an outcome carried only '
        + 'by a content-added row OUTSIDE any live region, or a live-region-emptied with no announced '
        + 'follow-up. A flow whose only outcome rows are state-changes or visibility-flips is NOT that '
        + 'shape ONLY IF no announced busy/progress message preceded them: a flow that earlier announced '
        + 'interim status (a content-added inside a live region, or a live-region-updated/-refilled row '
        + 'carrying interim text) and then removed or emptied it has established that this operation '
        + 'reports status as announced text — an attribute flip is not that announced follow-up, so apply '
        + 'the removal test to it. Only when no interim status was ever announced does the softer reading '
        + 'hold: an attribute flip IS programmatically determinable, so decide instead whether any VISIBLE '
        + 'status message conveys the outcome — if sighted users receive no status message either, there '
        + 'may be no status message in scope at all. These are FACTS about what happened, '
        + 'never a verdict about what was owed.',
    };
  }
  // 4.1.3 LIVE-REGION BIRTHS — document-start recorder facts (per region, from before the first byte of
  // the document): whether it existed-and-was-empty BEFORE receiving content, or was mounted/wired with
  // its message already in place, and whether it later removed itself.
  if (element.__liveRegionBirths) {
    const b = element.__liveRegionBirths;
    const birthRegions = (Array.isArray(b.regions) ? b.regions : []).slice(0, 6);
    s.liveRegionBirths = {
      regions: birthRegions,
      documentAgeMs: b.documentAgeMs,
      note: 'Recorded from DOCUMENT-START, so unlike every other signal it can see state from before the '
        + 'page finished loading. mountedAfterLoad + emptyAtBirth:false = the region was INSERTED already '
        + 'carrying its message (an AT observes regions that pre-existed the change, so this announces '
        + 'nothing on many AT); via:"attribute-wired" + emptyAtBirth:false = live semantics were added onto '
        + 'content that was already set (same problem); removedAtMs = the region later left the document, '
        + 'so the message may never be readable on demand. emptyAtBirth:true with a later firstContentAtMs '
        + 'is the healthy shape and corroborates correct WIRING — never, on its own, a clear: wiring says '
        + 'the region COULD announce, not that any observed change WAS announced. Facts, not a verdict.'
        // batch-3 #35: the emptied-transition facts ride only when the birth observer recorded them, so
        // every other 4.1.3 prompt stays byte-identical until that instrument fact exists on a page.
        + (birthRegions.some((r) => r && r.emptiedAtMs != null)
          ? ' emptiedAtMs = the region\'s content was REMOVED at that offset; with no later refill/announced '
            + 'follow-up that is a silent emptying — a state change delivered to no AT — and the region\'s '
            + 'healthy birth earlier in its life says nothing about it.'
          : ''),
    };
  }
  // 1.4.1 POST-ACTIVATION COLOUR DELTAS — see selectRubricSubjects (use-of-color only). Page-level
  // instrument fact: rows/tiles whose computed colours changed when a control was activated.
  if (element.__colourStateDeltas) {
    s.colourStateDeltas = {
      deltas: element.__colourStateDeltas.slice(0, 8),
      note: 'Deterministic post-activation measurement, PAGE-LEVEL: each delta row records that activating '
        + 'its `trigger` changed the computed background/colour of the element named by THAT ROW\'S xpath '
        + 'from the before value to the after value — the listed element may or may not be the element you '
        + 'are judging, so match the row\'s xpath against your subject before attributing any delta to it. '
        + 'textAlsoChangedNearby says '
        + 'whether any TEXT was also added in or around that element in the same window. A state change '
        + 'conveyed ONLY by such a colour flip (textAlsoChangedNearby:false, and no other persistent visual '
        + 'cue in the crop) is information conveyed by colour alone. The at-rest screenshot CANNOT show any '
        + 'of this — judge the delta, not the crop. Facts, not a verdict.',
    };
  }
  if (skill === 'page-structure' || skill === 'grouping-and-reading-order') {
    const struct = element.__pageStructure || null;
    if (struct) {
      if (skill === 'page-structure') {
        const t = typeof struct.title === 'string' ? struct.title : '';
        // #3 fix: frameTitles are distinct child-frame <title> values that differ from the outer title — a
        // frameset's real rendered content can carry its own title unrelated to the outer document's. Surfaced
        // ONLY when non-empty so a non-framed page's pageTitle shape is byte-identical to before this fix.
        const fts = Array.isArray(struct.frameTitles) ? struct.frameTitles.filter((x) => typeof x === 'string' && x) : [];
        // TITLE ↔ PRIMARY-HEADING CORRESPONDENCE (see resolvePrimaryHeading). The F25/TT-12.B clause in
        // page-title-v0 is anchored on "what the page presents as its own identity", and until now the judge had
        // to pick that anchor BY EYE off the viewport crop and then do the word-level comparison itself. Measured
        // on results/aug-annot-s9-tools + s10-tools, that is exactly where both of the SC's residual errors live:
        // a STABLE false positive on a page whose <title> contains its <h1> verbatim (the judge walked past the
        // heading to a subtitle line and failed the title for omitting it), and a lost true positive on a page
        // whose <title> is a strict PREFIX of its <h1> (the judge read prefix-match as match and cleared).
        // Both are anchor-selection errors, not judgment errors, so the lever is to REMOVE the step: hand over
        // the heading and the exact word-level difference. Absent whenever there is no usable heading or no
        // title — never a guess, and the rubric then falls back to reading the viewport as before.
        const hc = titleHeadingCorrespondence(t, struct.headings);
        // batch-3 #22 (defensive): `titleInstanceConflict` is a SIBLING collector fact (a title-volunteered
        // instance token that appears on NO page identity surface while a different same-kind token does).
        // Feature-detected passthrough — byte-inert until the collector emits it; the page-title-v0 clause
        // that consumes it fires only on a PRESENT, conflicting token, never on an absent one.
        const tic = struct.titleInstanceConflict && typeof struct.titleInstanceConflict === 'object' ? struct.titleInstanceConflict : null;
        s.pageTitle = { value: t || null, present: t.trim().length > 0, ...(fts.length ? { frameTitles: fts } : {}), ...(hc ? { headingCorrespondence: hc } : {}), ...(tic ? { titleInstanceConflict: tic } : {}) };
      }
      s.structure = {
        title: typeof struct.title === 'string' ? struct.title : null,
        lang: struct.lang || null,
        headings: Array.isArray(struct.headings) ? struct.headings.slice(0, 60) : [],
        landmarks: Array.isArray(struct.landmarks) ? struct.landmarks.slice(0, 40) : undefined,
        tables: Array.isArray(struct.tables) ? struct.tables : undefined, // Tier-0 #4 (when collected)
        lists: Array.isArray(struct.lists) ? struct.lists : undefined,    // TT gap G1 (1.3.1 / TT 10.D — when collected)
      };
      // #1 TABLE-ASSOCIATION SUBTRACTION — a DETERMINISTIC per-table verdict from the collector's wiring flags, so a
      // weaker judge cannot hallucinate a header-association barrier where the facts settle it. NO_DATA: not a data
      // table (presentation/none, or no th+td grid) ⇒ no 1.3.1 association is owed. VALID: scope present OR a resolving
      // `headers=` ref AND no broken-ref flag ⇒ the association IS programmatic. BROKEN: a dangling/non-cell/self ref
      // ⇒ a real barrier. UNCERTAIN: a data table with NO scope and NO headers= — the genuine judgment zone (a no-scope
      // table can be associable-by-position OR not; the GT-pass and GT-fail d0f69e cases are collector-identical here),
      // so it is NOT subtracted — the rubric judges it. Page verdict drives the rubric's hard gate (rubric §lead).
      const tbls = Array.isArray(struct.tables) ? struct.tables : [];
      // ARIA-table records (collect-tables `ariaTable: true`) carry NO native wiring facts, so the
      // association projection below stays NATIVE-ONLY — exactly what the rubric documents for this hard
      // gate. The collector orders natives FIRST, so per[i] stays index-aligned with structure.tables[i]
      // for every native record; aria records have no association entry and their one deterministic
      // verdict rides tableSemantics below.
      const nativeTbls = tbls.filter((t) => !(t && t.ariaTable === true));
      const tVerdict = (t) => {
        const isData = t && t.looksLikeDataTable === true && t.roleOverride !== 'presentation' && t.roleOverride !== 'none';
        if (!isData) return 'NOT_DATA';
        if (t.danglingIdref || t.headersRefsNonCell || t.headersRefsSelf) return 'BROKEN';
        const hasScope = Array.isArray(t.headers) && t.headers.some((h) => h && h.scope);
        const hasHeadersRef = Number(t.tdWithHeaders) > 0;
        if (hasScope || hasHeadersRef) return 'VALID';
        // SIMPLE-POSITIONAL VALID (#3 FP/FN fix): a REGULAR grid whose header cells sit ONLY in the first row
        // and/or first column, with NO scattered (mid-body) th, NO rowspan, and a SINGLE leading header row, is
        // associable BY POSITION via HTML's implicit header-scanning algorithm — no scope/headers= required (the
        // d0f69e GT-pass tables: a <thead> column-header table with a colspan-matched data row, and a 2-D
        // first-row+first-column table). The irregular GT-fail twin (a 2-col header over a 1-cell data row, no
        // colspan) has regularGrid=false ⇒ stays UNCERTAIN for the judge, so recall is preserved. A table missing
        // these collector facts (older packs) also stays UNCERTAIN — backward-compatible.
        //
        // #4 FP fix: an axis is only trusted alone when the OTHER axis's boundary is NOT a half-marked header
        // attempt. A table whose row 0 mixes real <th> ("Rank") with plain <td> ("First"/"Second"/"Third") is
        // trying to be a two-axis grid but only got the row-header column right — DHS Trusted-Tester 14.B's
        // exact failure shape (column headers never marked <th> at all). Crediting firstColAllTh alone there
        // would suppress a real association barrier the rubric must judge. A clean two-axis table (both
        // firstRowAllTh AND firstColAllTh true) is unaffected: each axis's partial flag is false by definition
        // once that axis is fully <th>.
        const rowAxisOk = t.firstRowAllTh === true && t.firstColPartialTh !== true;
        const colAxisOk = t.firstColAllTh === true && t.firstRowPartialTh !== true;
        const simplePositional = (rowAxisOk || colAxisOk)
          && t.regularGrid === true && Number(t.bodyTh) === 0 && Number(t.headerRows) <= 1;
        return simplePositional ? 'VALID' : 'UNCERTAIN';
      };
      const per = nativeTbls.map(tVerdict);
      const dataN = per.filter((v) => v !== 'NOT_DATA').length;
      const page = dataN === 0 ? 'NO_DATA_TABLE'
        : per.includes('BROKEN') ? 'HAS_BROKEN'
          : per.includes('UNCERTAIN') ? 'HAS_UNCERTAIN' : 'ALL_VALID';
      s.structure.tableAssociation = { page, hasDataTable: dataN > 0, perTable: per };
      // DECLARED-STRUCTURE SEMANTICS (residual RCA S2 — F46 / F92 / F91). `tableAssociation` above answers
      // exactly ONE question — is a DATA table's header→data association programmatic — and answers it with a
      // HARD GATE. That gate is the wrong instrument for the OPPOSITE failures, and INVERTS on them:
      //   · F46 (layout table fabricating data semantics): the `<th scope=col>` that IS the failure makes
      //     `looksLikeDataTable` true and `hasScope` true ⇒ verdict VALID ⇒ "do NOT flag it".
      //   · F92 (data table suppressed with role=presentation): `isTableRole` is false ⇒ NOT_DATA ⇒ cleared.
      //   · F91 (data grid with no headers marked at all): thCount 0 and no caption ⇒ NOT_DATA ⇒ cleared —
      //     the table is excused BY the very omission that fails it.
      // This is an ADDITIVE second verdict computed from independent facts; `tVerdict` is untouched, so every
      // FP protection it accumulated (simple-positional, partial-axis, dangling-ref) survives byte-identically.
      const tSemantics = (t) => {
        // ARIA table/grid record (residual RCA S10): one deterministic verdict from the collector's two
        // independent checks — the OWNED-ELEMENT CONTRACT (rows present, every cell owned by a row,
        // consistent per-row counts, aria-owns honoured) and the CELL-CONTENT SHAPE. The collector's
        // `fabricatedTableSemantics` flag (contract HOLDS while the majority of data cells hold
        // block/region content) maps onto the SAME F46 verdict name this rubric's declared-structure
        // branch already receives — LAYOUT_STRUCTURE_SUSPECT: markup declaring data semantics over content
        // that is not tabular data. A well-formed ARIA grid — or one whose contract is BROKEN, a different
        // defect visible in its own record fields — stays OK here and is judged under the rubric's
        // existing ARIA guidance (positional association, aria-owns, query_ax_node).
        if (t && t.ariaTable === true) {
          const declared = ['role=' + (t.role || 'table')];
          if (Number(t.columnheaderCount) > 0) declared.push('role=columnheader');
          if (Number(t.rowheaderCount) > 0) declared.push('role=rowheader');
          return {
            verdict: t.fabricatedTableSemantics === true ? 'LAYOUT_STRUCTURE_SUSPECT' : 'OK',
            declared, presentational: false, ariaTable: true,
            ownedContractHolds: t.ownedContractHolds === true,
            rowCount: t.rowCount, colCount: t.colCount, cellsWithBlockContent: t.cellsWithBlockContent,
            summary: null, caption: null,
          };
        }
        const presentational = t.roleOverride === 'presentation' || t.roleOverride === 'none';
        const declared = [];
        if (Number(t.thCount) > 0) declared.push('th');
        if (t.hasCaption === true) declared.push('caption');
        if (t.hasNonEmptySummary === true) declared.push('summary');   // F46 names NON-EMPTY summary only
        if (Number(t.scopeCount) > 0) declared.push('scope');
        if (Number(t.headersAttrCount) > 0) declared.push('headers');
        // "not tabular data" evidence, any one of which is independently sound:
        //  · a cell holds a page REGION (heading / list / form / nav / nested table), not a value;
        //  · one column, or one row — there is no row×column relationship for the markup to convey.
        // NOTE all three read as false on a pre-S2 collector pack (undefined ⇒ NaN comparison), so every
        // verdict below degrades to OK rather than mis-firing on old evidence.
        const layoutShaped = Number(t.cellsWithBlockContent) > 0 || Number(t.colCount) <= 1 || Number(t.rowCount) <= 1;
        const dataShaped = Number(t.cellsWithBlockContent) === 0 && Number(t.rowCount) > 1 && Number(t.colCount) > 1;
        // CREDIBLE HEADER AXIS — the exemption that keeps a real data table out of the F46 lane. Measured
        // held-out over 872 pages, `layoutShaped` alone flipped two genuine data tables to suspect: a
        // medication schedule whose cell holds a tooltip `<h2>`, and a booking grid whose cells hold session
        // titles. Both have a FULL header row; neither is layout. So require the absence of a real header
        // axis, defined as an axis that is (a) entirely `<th>`, (b) not contradicted by the other axis being
        // half-marked — the existing #4 partial-axis guard — and (c) at least TWO header cells wide, which is
        // what separates a header row from a single `<th colspan=3>` masthead (F46 case-01's exact shape).
        const rowAxisReal = t.firstRowAllTh === true && t.firstColPartialTh !== true && Number(t.headerRowThCount) >= 2 && Number(t.colCount) >= 2;
        const colAxisReal = t.firstColAllTh === true && t.firstRowPartialTh !== true && Number(t.headerColThCount) >= 2 && Number(t.rowCount) >= 2;
        const credibleHeaderAxis = rowAxisReal || colAxisReal;
        let verdict = 'OK';
        // F46 — GUARD: `role=presentation`/`none` is TT 14.C's own PASS condition for a layout table (it
        // strips the table's required-owned semantics, so the <th> is never exposed as a header) and must
        // never be failed here. A nested <table> is NOT a required owned element of its parent table, so an
        // ancestor's role=presentation does not cover it — that nested case is a genuine F46.
        if (declared.length && layoutShaped && !presentational && !credibleHeaderAxis) verdict = 'LAYOUT_STRUCTURE_SUSPECT';
        // F92 — GUARD: requires POSITIVE data evidence (declared header markup on a real grid). A bare
        // role=presentation layout table with no th/caption/summary is the CORRECT pattern, never a failure.
        else if (presentational && declared.length && dataShaped) verdict = 'DATA_SEMANTICS_SUPPRESSED';
        // F91 / TT 14.B — a ≥2×2 grid with not one <th>. Suspect only: it is equally the shape of a plain
        // layout table, so the judge must confirm from the viewport that the content is data.
        else if (t.allTdGrid === true && !presentational && dataShaped) verdict = 'HEADERLESS_GRID_SUSPECT';
        return {
          verdict, declared, presentational, credibleHeaderAxis,
          rowCount: t.rowCount, colCount: t.colCount, cellsWithBlockContent: t.cellsWithBlockContent,
          summary: t.summaryAttr || null, caption: t.captionText || null,
        };
      };
      // 1.3.1 F34 / F2 (residual RCA S7): structure carried by TEXT LAYOUT or by TEXT PRESENTATION, neither
      // of which any role/attribute check can see. Surfaced next to the table verdicts because they are the
      // same question — is a relationship a sighted reader gets also declared in markup — asked of content
      // that never became a <table> in the first place.
      if (Array.isArray(struct.fauxColumns) && struct.fauxColumns.length) s.structure.fauxColumns = struct.fauxColumns.slice(0, 4);
      if (Array.isArray(struct.presentationOutliers) && struct.presentationOutliers.length) s.structure.presentationOutliers = struct.presentationOutliers.slice(0, 4);
      if (Array.isArray(struct.presentationConventions) && struct.presentationConventions.length) s.structure.presentationConventions = struct.presentationConventions.slice(0, 4);
      const perSem = tbls.map(tSemantics);
      s.structure.tableSemantics = {
        perTable: perSem,
        suspectCount: perSem.filter((x) => x.verdict !== 'OK').length,
      };
      // HEADING-OUTLINE SUSPECT SIGNAL (#5, TT 10.C): a pure level-NUMBER-sequence check can flag a classic
      // forward SKIP (h2 straight to h4, skipping h3) with confidence — a well-established anti-pattern. It
      // CANNOT, by itself, decide the DHS Trusted-Tester 405382-14 shape (an <h6> section immediately followed
      // by <h4>/<h5> "subsections" — level going SHALLOWER) because that direction is ambiguous from numbers
      // alone: legitimately closing several nested sections and starting a new, shallower one (e.g. h4 -> h1) is
      // NORMAL and must not be flagged, yet the DHS case IS a real defect where the shallower headings are
      // visually/structurally subordinate to the deeper one they follow. Distinguishing the two needs the
      // screenshot (does the numerically-shallower heading actually render SMALLER than the heading it visually
      // sits under?) — so BOTH directions are marked SUSPECT ONLY, never a verdict; the rubric must confirm via
      // `viewport` before treating either as a barrier. `structure.headings` already includes frame-sourced
      // entries (#2) in document order, so the outline spans the whole rendered page, not just the top document.
      const hs = Array.isArray(struct.headings) ? struct.headings : [];
      const outlineSeq = [];
      let prevLevel = null;
      for (const h of hs) {
        const level = Number.isFinite(h && h.level) ? h.level : null;
        let suspect = null;
        if (level != null && prevLevel != null) {
          if (level > prevLevel + 1) suspect = 'SKIP_DEEPER';       // e.g. h2 -> h4 (h3 skipped)
          // level > 1 excludes a full reset to the top (h4 -> h1 closing several nested sections and starting a
          // brand-new top-level one is completely normal and universal — a corpus scan confirmed flagging it
          // produced the ONLY clearly-benign false trigger found). Landing on an INTERMEDIATE level (h6 -> h4,
          // neither fully closed nor simply one level up) is the genuinely ambiguous case worth the rubric's look.
          else if (level < prevLevel - 1 && level > 1) suspect = 'JUMP_SHALLOWER';
        }
        outlineSeq.push({ level, text: (h && h.text) || '', xpath: (h && h.xpath) || null, suspect });
        if (level != null) prevLevel = level;
      }
      s.structure.headingOutline = { sequence: outlineSeq, suspectCount: outlineSeq.filter((e) => e.suspect).length };
    }
    // the SUBJECT heading itself (b49b2e): surface role/level/text + offscreen so the off-viewport heading the
    // crop omits is judgeable as a heading, not "a plain span". Reads the element's own collected facts.
    const tag = typeof element.tag === 'string' ? element.tag.toLowerCase() : '';
    const role = element.roleAttr || element.role || element.axRole || '';
    if (/(^|\s)heading(\s|$)/i.test(role) || /^h[1-6]$/.test(tag)) {
      const lvl = Number.isFinite(element.ariaLevel) ? element.ariaLevel
        : (element.axStates && Number.isFinite(element.axStates.level) ? element.axStates.level
          : (/^h([1-6])$/.test(tag) ? Number(tag[1]) : undefined));
      const box = element.box && typeof element.box === 'object' ? element.box : null;
      const bw = box ? (box.width != null ? box.width : box.w) : null;
      const bh = box ? (box.height != null ? box.height : box.h) : null;
      const isOffscreen = !!(box && ((Number.isFinite(box.x) && box.x <= -1000) || (Number.isFinite(box.y) && box.y <= -1000) || (Number(bw) <= 1 && Number(bh) <= 1)));
      s.heading = {
        text: typeof element.text === 'string' && element.text ? element.text : (typeof element.axName === 'string' ? element.axName : null),
        role: role || 'heading',
        ariaLevel: Number.isFinite(lvl) ? lvl : undefined,
        isOffscreen,
      };
    }
    // 2.4.6 LABEL facet (cc0f0a): a form field / <label> is routed to heading-descriptive by the oracle, but it
    // is NOT a heading, so the branch above never fires and the rubric got an EMPTY s.heading — it cleared a
    // non-descriptive label by default. Surface the field's COMPUTED ACCESSIBLE NAME (axName: the resolved
    // aria-label/aria-labelledby/label/title, in ANNOUNCE order) as the heading text so the rubric judges label
    // descriptiveness — e.g. an aria-labelledby="submit search" that resolves to the confusing "Go Search".
    // isFormFieldLabel tells the rubric this `text` is the field's announced name, not a page heading.
    const FORMFIELD_ROLE_RE = /^(textbox|combobox|listbox|spinbutton|searchbox|slider)$/;
    if (!s.heading && (element.isFormField === true || FORMFIELD_ROLE_RE.test(role) || (tag === 'label' && typeof element.text === 'string' && element.text.trim()))) {
      const nm = typeof element.axName === 'string' ? element.axName.trim() : '';
      s.heading = {
        text: nm || (typeof element.text === 'string' && element.text ? element.text : null),
        role: role || (tag === 'label' ? 'label' : 'form-field'),
        isFormFieldLabel: true,
        fieldRole: role || tag,
      };
    }
  }
  // 2.4.6 (improvement A): the nearest preceding VISIBLE section heading — disambiguation context for a duplicate
  // label ("Name" under a visible "Billing" heading IS descriptive in context). null ⇒ no perceivable section
  // heading (an off-screen one does NOT disambiguate the visible labels — the rubric must treat that as a barrier).
  if (typeof element.sectionHeading === 'string' && element.sectionHeading) s.sectionHeading = element.sectionHeading;
  s.boxMin = num(element.box && typeof element.box === 'object' ? Math.min(element.box.w, element.box.h) : undefined);
  // V3_HTML_AUGMENT: ADD raw markup ON TOP of the full structured signals (vs V3_HTML_EVIDENCE which REPLACES
  // them). Tests whether the grounding signals can restore precision while HTML supplies the extra recall.
  // DEPLOYED DEFAULT: facet-gated, style-stripped HTML augmentation on top of the structured signals. Opt-outs
  // for ablation: V3_NO_HTML_EVIDENCE (no augment, the prior default), V3_HTML_NO_GATE (augment all SCs),
  // V3_HTML_KEEP_STYLE (keep inline style). (V3_HTML_AUGMENT/_NOSTYLE/_FACET_GATE are now the default and retired.)
  const augHtml = process.env.V3_NO_HTML_EVIDENCE !== '1';
  const gateHtml = process.env.V3_HTML_NO_GATE !== '1';
  // #9 fix: the 4.1.2 HTML gate exists because accessible-name-adequacy-v0 (skill:name-role-state) over-flagged
  // on visible inline markup (aria-hidden, etc.) — but auto-update-notification-v0 (skill:dynamic-announcement)
  // needs raw markup for the OPPOSITE reason: confirming aria-live/role=status PRESENCE is a structural fact a
  // screenshot cannot show at all, so blanket-gating it off left the rubric evidence-starved (confirmed live: the
  // model correctly abstained UNCERTAIN — "cannot determine ... whether ... announces" — rather than hallucinate).
  const htmlGateExempt = sc === '4.1.2' && skill === 'dynamic-announcement';
  if (augHtml && !(gateHtml && HTML_RUNNER_OWNED_SC.has(sc) && !htmlGateExempt)) {
    const he = htmlEvidence(element, process.env.V3_HTML_KEEP_STYLE !== '1');
    s.rawElementHtml = he.rawElementHtml; s.enclosingHtml = he.enclosingHtml;
  }
  return s;
}

// Assemble the agent prompt for one subject. Inherits the v2.9 skill rubric (the skills/*.md file when
// available) and embeds the pre-computed signals + the (realism-corrected) VSR transcript excerpt for
// the element. The agent must NAME the claimFamily (M3) and return {verdict, confidence, basis,
// evidenceRefs}. Pure string assembly — no I/O beyond an optional rubric read passed in via opts.
// ALWAYS-ON shared KNOWLEDGE LAYER (cross-cutting WCAG-judging principles, derived from the spec, NOT a fixture).
// These were previously scattered inconsistently across the rubric .md files (and an OFF-by-default apply-gate), so a
// model that lacked the clause in a given rubric over-flagged (e.g. invisible aria-hidden text judged for 1.4.3
// contrast). Stating them ONCE, for every SC, levels the models. Each is FACET-AWARE — note the EXCEPTION on (1).
const KNOWLEDGE_LAYER = [
  '1. REMOVED FROM THE ACCESSIBILITY TREE. An element that is aria-hidden="true", role="presentation"/"none", or a',
  '   rendering image with empty alt="" exposes NOTHING to assistive technology. Do NOT judge its OWN perceivable-',
  '   element facets: its CONTRAST (1.4.3/1.4.11), its accessible-NAME adequacy (4.1.2), the keyboard operability of a',
  '   hidden control — those facets do not apply to something AT cannot perceive ⇒ NOT REPRODUCED. (Invisible',
  '   white-on-white text that is ALSO aria-hidden is not a 1.4.3 barrier — nobody perceives it; a focusable but',
  '   aria-hidden sentinel link is not a 4.1.2 name barrier — AT never reaches its name.) EXCEPTION — when the SC is',
  '   about whether HIDING the element is itself the harm: a MEANINGFUL image removed from the tree (1.1.1), or a',
  '   section\'s ONLY heading made aria-hidden (2.4.6/2.4.10), DENIES the AT user information/structure the sighted',
  '   user gets — THAT is the barrier. Judge it per the rubric; do not auto-exempt it.',
  '2. DECORATIVE DEFAULT. Ambiguous non-text with no semantic content — a plain shape, spacer, flourish, gradient,',
  '   background texture — defaults to DECORATIVE (no text alternative owed) UNLESS the evidence shows it carries',
  '   information. Do not flag a contentless graphic merely for lacking a name.',
  '3. JUDGE ONLY THIS SC\'s FACET. A requirement that is literally MET is not a barrier because it could be better:',
  '   a PRESENT name that identifies a control satisfies 4.1.2 even if terse (richness is 2.4.6); a PRESENT title that',
  '   IDENTIFIES the page\'s topic or purpose satisfies 2.4.2 even if terse (richer wording is 2.4.6). Do not escalate a',
  '   stylistic preference, and do not judge a stricter neighbouring SC\'s facet here.',
].join('\n');

function buildPrompt(subject, signals, transcriptExcerpt, opts = {}) {
  const rubric = opts.rubric || `(rubric for skill "${subject.skill}" — judge whether a WCAG ${subject.sc} barrier is present)`;
  const fpStrip = process.env.V3_FP_STRIP_QUESTION === '1';
  // Controlled prompt-order ablation. This reproduces the pre-cache-prefix ordering byte-for-byte while leaving
  // the cache-friendly ordering below as the default for every provider. It is intentionally an environment-only
  // test switch so production callers do not need a second prompt API.
  if (process.env.V3_PROMPT_ORDER === 'original') return [
    ...(fpStrip
      ? ['You are evaluating one element. Judge ONLY from the rubric and the evidence provided below.']
      : [`You are the ${subject.skill} skill evaluating WCAG ${subject.sc} for one element.`,
         `Element xpath: ${subject.xpath}`,
         `Claim family (bind your verdict to this): ${subject.claimFamily}`]),
    '--- cross-cutting judgment principles (apply to EVERY SC; the rubric below adds the SC-specific detail) ---',
    KNOWLEDGE_LAYER,
    '--- rubric ---',
    rubric,
    ...(process.env.V3_NO_VISION_RUBRIC === '1' ? ['--- IMPORTANT: NO visual evidence is available for this judgment ---',
      'No screenshot, crop, image, or rendered-pixel view is provided. DISREGARD every rubric instruction to examine a crop / image / surrounding-region / rendered pixels / "what you can SEE". Judge ONLY from the TEXTUAL evidence in this prompt (accessible name, role, signals, markup, context). Do NOT return PARTIAL merely because you cannot see the rendering — make your best determination from the available textual facts; return PARTIAL only if those facts THEMSELVES genuinely cannot resolve it.'] : []),
    '--- pre-computed deterministic signals (do not re-derive; a signal\'s `uncertainReason` says WHY a checker abstained — an ABSENT signal or ratio means it could NOT decide, NOT that the page passes) ---',
    JSON.stringify(signals),
    ...(opts.checkerHint ? ['--- external-checker cross-signal (flagged this for REVIEW — could not auto-decide) ---', JSON.stringify(opts.checkerHint)] : []),
    '--- VSR announcement (realistic accessible name) ---',
    transcriptExcerpt ? JSON.stringify(transcriptExcerpt) : '(none)',
    ...(opts.toolsEnabled ? (() => { const g = renderToolGuidance(toolsForSubject(subject.sc, subject.skill)); return g ? [g] : []; })() : []),
    ...(process.env.V3_FP_BOUNDARY === '1' ? ['--- when NOT to flag a barrier ---',
      ['A WCAG barrier exists ONLY if a real user is ACTUALLY blocked. Return NOT REPRODUCED when ANY of these holds:',
       '• the SC\'s literal requirement IS met and the issue is merely sub-optimal quality/style/wording — e.g. an accessible name that is PRESENT and matches the role satisfies an SC that only requires a name to EXIST; un-descriptive ≠ absent;',
       '• a recognized WCAG exception applies — e.g. images of text that are ESSENTIAL (the visual presentation itself conveys the information), or decorative/incidental content;',
       '• the element is removed from the accessibility tree (aria-hidden=true / role=presentation / alt="" on a rendering image) and so exposes nothing to assistive tech;',
       '• the programmatically-determined CONTEXT (enclosing list item, table cell, row/column header, owning paragraph) already resolves the concern, even when the element\'s own name is generic or format-only;',
       '• a deterministic checker owns the facet and the provided evidence does not show it FAILING — do NOT re-derive a contrast ratio, target size, or computed role yourself to manufacture a failure.',
       'If the requirement is literally satisfied, do NOT escalate a preference or a stylistic concern into a barrier.'].join('\n')] : []),
    ...((process.env.V3_FP_412_SHARPEN === '1' && subject.sc === '4.1.2') ? ['--- 4.1.2 name decision procedure (follow in order) ---',
      ['1. Is the accessible name an UN-SUBSTITUTED CODE TOKEN ({{...}}, %LABEL%, raw markup) or the BARE literal "undefined"/"null"/"aria-label"/"role"? If yes → REPRODUCED. If no → continue.',
       '2. Does the name describe a DIFFERENT control than the one rendered (e.g. "Search" on a Menu icon), or name only the ICON/file for an icon-only control? If yes → REPRODUCED. If no → continue.',
       '3. Is a prohibited/invalid ARIA attribute the routed concern (checkerHint = aria-prohibited-attr etc.)? If yes → judge ARIA legality (REPRODUCED if prohibited). If no → continue.',
       '4. Otherwise the name is PRESENT and real → NOT REPRODUCED. A name made of real words — INCLUDING words that name the control TYPE ("button", "link", "button/link", "menu") or that are terse/generic — satisfies 4.1.2. "Could be more descriptive" is 2.4.6, which you DEFER. Do NOT call a real, type-naming name a "placeholder/filler".'].join('\n')] : []),
    ...(process.env.V3_FP_GROUNDED === '1' ? ['--- grounding requirement (applies before any REPRODUCED verdict) ---',
      'Before returning REPRODUCED you MUST (a) cite the SPECIFIC provided evidence field or visible region that establishes the barrier, and (b) state the most likely benign explanation and rule it out using that same evidence. If you cannot do BOTH from the evidence ACTUALLY provided — without assuming facts not in evidence — return PARTIAL, not REPRODUCED.'] : []),
    '--- output ---',
    'Return STRICT JSON: {"verdict": "REPRODUCED"|"NOT REPRODUCED"|"PARTIAL"|"N/A", "confidence":"low"|"medium"|"high", "summary": string, "reasoning": string, "evidenceRefs": string[]}.',
    'REPRODUCED = a barrier is present; NOT REPRODUCED = no barrier; PARTIAL = cannot decide; N/A = abstain (do NOT use for "out of scope" — that is the oracle\'s job).',
    '"summary" = ONE sentence stating the verdict in plain language (for a human annotator). "reasoning" = ONE sentence citing the specific evidence that drove it.',
  ].join('\n');
  return [
    // CACHEABLE PREFIX: everything before `case-specific evidence` is identical for judgments sharing a rubric/SC
    // and run configuration. Gemini implicit caching keys common leading content, so never put XPath/claim/signals
    // ahead of this layer. Grouped-SC evaluation runs can now reuse this substantial prefix.
    'You are evaluating one page element for a WCAG accessibility barrier. Judge ONLY from the rubric and supplied evidence.',
    '--- cross-cutting judgment principles (apply to EVERY SC; the rubric below adds the SC-specific detail) ---',
    KNOWLEDGE_LAYER,
    '--- rubric ---',
    rubric,
    // NO-VISION ablation fairness (V3_NO_VISION_RUBRIC): neutralize the rubric's visual-examination instructions so a
    // text-only run is NOT penalized for abstaining on a crop it was never given. Without this, the rubric's "judge
    // from the crop" lines make the LLM return PARTIAL for lack of vision — confounding the no-vision measurement.
    ...(process.env.V3_NO_VISION_RUBRIC === '1' ? ['--- IMPORTANT: NO visual evidence is available for this judgment ---',
      'No screenshot, crop, image, or rendered-pixel view is provided. DISREGARD every rubric instruction to examine a crop / image / surrounding-region / rendered pixels / "what you can SEE". Judge ONLY from the TEXTUAL evidence in this prompt (accessible name, role, signals, markup, context). Do NOT return PARTIAL merely because you cannot see the rendering — make your best determination from the available textual facts; return PARTIAL only if those facts THEMSELVES genuinely cannot resolve it.'] : []),
    // LIVE TOOLS (only when the orchestrator actually built the CDP server): inject the tools RELEVANT to this
    // subject's SC, each with params + when-to-use + a directive to call them when the evidence is insufficient.
    // Without this the model was offered tools but never told it had them ⇒ 0 tool calls (the FN×LLM finding).
    ...(opts.toolsEnabled ? (() => { const g = renderToolGuidance(toolsForSubject(subject.sc, subject.skill)); return g ? [g] : []; })() : []),
    // POSITIVE-CLASS BOUNDARY lever (V3_FP_BOUNDARY, inert by default): GENERAL WCAG-judging guardrails (derived
    // from the WCAG spec, NOT from any test fixture) that define when a barrier does NOT exist. Targets
    // over-flagging on exceptions / quality-not-conformance / out-of-AT-tree / context-resolved / checker-owned facets.
    ...(process.env.V3_FP_BOUNDARY === '1' ? ['--- when NOT to flag a barrier ---',
      ['A WCAG barrier exists ONLY if a real user is ACTUALLY blocked. Return NOT REPRODUCED when ANY of these holds:',
       '• the SC\'s literal requirement IS met and the issue is merely sub-optimal quality/style/wording — e.g. an accessible name that is PRESENT and matches the role satisfies an SC that only requires a name to EXIST; un-descriptive ≠ absent;',
       '• a recognized WCAG exception applies — e.g. images of text that are ESSENTIAL (the visual presentation itself conveys the information), or decorative/incidental content;',
       '• the element is removed from the accessibility tree (aria-hidden=true / role=presentation / alt="" on a rendering image) and so exposes nothing to assistive tech;',
       '• the programmatically-determined CONTEXT (enclosing list item, table cell, row/column header, owning paragraph) already resolves the concern, even when the element\'s own name is generic or format-only;',
       '• a deterministic checker owns the facet and the provided evidence does not show it FAILING — do NOT re-derive a contrast ratio, target size, or computed role yourself to manufacture a failure.',
       'If the requirement is literally satisfied, do NOT escalate a preference or a stylistic concern into a barrier.'].join('\n')] : []),
    // 4.1.2 NAME-SCOPE SHARPENER (V3_FP_412_SHARPEN, inert; sc 4.1.2 only): a tight DECISION PROCEDURE that
    // sharpens the rubric's existing (but LLM-ignored) "type-words are not placeholders" clause — an empirical test
    // of whether a procedural phrasing lands where prose did not. 4.1.2 = name presence + identity, NOT descriptiveness.
    ...((process.env.V3_FP_412_SHARPEN === '1' && subject.sc === '4.1.2') ? ['--- 4.1.2 name decision procedure (follow in order) ---',
      ['1. Is the accessible name an UN-SUBSTITUTED CODE TOKEN ({{...}}, %LABEL%, raw markup) or the BARE literal "undefined"/"null"/"aria-label"/"role"? If yes → REPRODUCED. If no → continue.',
       '2. Does the name describe a DIFFERENT control than the one rendered (e.g. "Search" on a Menu icon), or name only the ICON/file for an icon-only control? If yes → REPRODUCED. If no → continue.',
       '3. Is a prohibited/invalid ARIA attribute the routed concern (checkerHint = aria-prohibited-attr etc.)? If yes → judge ARIA legality (REPRODUCED if prohibited). If no → continue.',
       '4. Otherwise the name is PRESENT and real → NOT REPRODUCED. A name made of real words — INCLUDING words that name the control TYPE ("button", "link", "button/link", "menu") or that are terse/generic — satisfies 4.1.2. "Could be more descriptive" is 2.4.6, which you DEFER. Do NOT call a real, type-naming name a "placeholder/filler".'].join('\n')] : []),
    // GROUNDED-VERDICT lever (V3_FP_GROUNDED, inert by default): a positive verdict must cite concrete provided
    // evidence AND rule out the benign explanation; otherwise abstain. Targets ungrounded inference / hallucinated facts.
    ...(process.env.V3_FP_GROUNDED === '1' ? ['--- grounding requirement (applies before any REPRODUCED verdict) ---',
      'Before returning REPRODUCED you MUST (a) cite the SPECIFIC provided evidence field or visible region that establishes the barrier, and (b) state the most likely benign explanation and rule it out using that same evidence. If you cannot do BOTH from the evidence ACTUALLY provided — without assuming facts not in evidence — return PARTIAL, not REPRODUCED.'] : []),
    '--- output ---',
    'Return STRICT JSON: {"verdict": "REPRODUCED"|"NOT REPRODUCED"|"PARTIAL"|"N/A", "confidence":"low"|"medium"|"high", "summary": string, "reasoning": string, "evidenceRefs": string[]}.',
    'REPRODUCED = a barrier is present; NOT REPRODUCED = no barrier; PARTIAL = cannot decide; N/A = abstain (do NOT use for "out of scope" — that is the oracle\'s job).',
    '"summary" = ONE sentence stating the verdict in plain language (for a human annotator). "reasoning" = ONE sentence citing the specific evidence that drove it.',
    '--- case-specific evidence (not part of the reusable prefix) ---',
    // DISTRACTOR-STRIP lever (V3_FP_STRIP_QUESTION, inert by default): drop the dynamic task framing + claim-family
    // priming that can nudge the judge toward over-flagging. The shared prefix and grounded evidence remain.
    ...(fpStrip ? [] : [`Skill: ${subject.skill}`, `WCAG SC: ${subject.sc}`, `Element xpath: ${subject.xpath}`,
      `Claim family (bind your verdict to this): ${subject.claimFamily}`]),
    // #44: tell the agent how to READ the deterministic signals — an `uncertainReason` is WHY a checker
    // abstained, and an absent signal/ratio means "could not decide", never "passes".
    '--- pre-computed deterministic signals (do not re-derive; a signal\'s `uncertainReason` says WHY a checker abstained — an ABSENT signal or ratio means it could NOT decide, NOT that the page passes) ---',
    JSON.stringify(signals),
    // CHECKER-UNCERTAINTY hint (DEFERRED-TODO A): an external checker (axe/IBM) ran a rule here and returned
    // NEEDS-REVIEW (it could not decide). That is exactly why this obligation reached the agent.
    ...(opts.checkerHint ? ['--- external-checker cross-signal (flagged this for REVIEW — could not auto-decide) ---', JSON.stringify(opts.checkerHint)] : []),
    '--- VSR announcement (realistic accessible name) ---',
    transcriptExcerpt ? JSON.stringify(transcriptExcerpt) : '(none)',
  ].join('\n');
}

// MULTIMODAL prompt (Harness 3.2 §12) — text + image blocks. The text is buildPrompt's; each declared
// vision frame for this element becomes an image block carrying the base64 crop (the agent must SEE the
// pixels). The blocks go to the injected multimodal `runAgent(messages, subject)`; they are NOT persisted
// in the structured `llm` artifact (the crops live in the side `llmVision` artifact, referenced by id).
function buildMessages(subject, signals, transcriptExcerpt, frames, opts = {}) {
  const blocks = [{ type: 'text', text: buildPrompt(subject, signals, transcriptExcerpt, opts) }];
  if (frames && frames.length) blocks.push({ type: 'text', text: `--- vision evidence (${frames.map((f) => f.state).join(', ')}) ---` });
  for (const f of frames || []) blocks.push({ type: 'image', id: f.id, state: f.state, mediaType: f.mediaType || 'image/png', data: f.data });
  return blocks;
}

// ===================== FP-reduction judge-design levers (all inert unless V3_FP_* env is set) =====================
// Structural levers that wrap the raw agent call. A normal run sets none of these ⇒ judgeWithMethod is a single
// runAgent call, byte-identical to before. Used by the FP-reduction experiments (eval/checker-comparison/fp-experiments)
// and toggleable in a live run the SAME way, so a replay win transfers to a full run without a code change.
const CONF_RANK = { low: 0, medium: 1, high: 2 };
const isBarrierVerdict = (v) => v === 'REPRODUCED';

// CONFIDENCE-GATED ABSTENTION (V3_FP_ABSTAIN=high|medium): downgrade a BARRIER below the bar to PARTIAL (abstain).
function applyAbstain(out) {
  const bar = process.env.V3_FP_ABSTAIN;
  if (!bar || !out || !isBarrierVerdict(out.verdict)) return out;
  const need = CONF_RANK[bar] != null ? CONF_RANK[bar] : 2;
  const have = CONF_RANK[out.confidence] != null ? CONF_RANK[out.confidence] : 0;
  return have < need ? { ...out, verdict: 'PARTIAL', _abstainedFrom: out.verdict } : out;
}

// SELF-CONSISTENCY (V3_FP_VOTES=N, V3_FP_VOTE_BAR=unanimous|majority): sample N, keep BARRIER only above the bar.
async function applyVotes(runAgent, messages, subj, firstOut) {
  const n = Math.max(1, Number(process.env.V3_FP_VOTES) || 1);
  if (n <= 1) return firstOut;
  const outs = [firstOut];
  for (let k = 1; k < n; k++) { let o; try { o = await runAgent(messages, subj); } catch (e) { o = null; } outs.push(o); }
  const valid = outs.filter((o) => o && V2_9_VERDICTS.includes(o.verdict));
  if (!valid.length) return firstOut;
  const barrierVotes = valid.filter((o) => isBarrierVerdict(o.verdict)).length;
  const need = process.env.V3_FP_VOTE_BAR === 'majority' ? Math.ceil(valid.length / 2) : valid.length; // unanimous default
  if (barrierVotes >= need) return valid.find((o) => isBarrierVerdict(o.verdict));
  return valid.find((o) => o.verdict === 'NOT REPRODUCED') || valid.find((o) => o.verdict === 'PARTIAL') || { ...firstOut, verdict: 'PARTIAL' };
}

// REFUTATION CASCADE (V3_FP_REFUTE=1): a distinct skeptical 2nd pass must OVERTURN each BARRIER; survives only if
// the refuter cannot. Fail-closed on recall: a refutation that yields no verdict keeps the original BARRIER.
async function applyRefute(runAgent, messages, subj, out) {
  if (process.env.V3_FP_REFUTE !== '1' || !out || !isBarrierVerdict(out.verdict)) return out;
  const refuteBlock = { type: 'text', text: [
    '--- ADVERSARIAL REVIEW: you are now a SKEPTIC whose job is to OVERTURN the verdict ---',
    `A first-pass judge returned REPRODUCED (a WCAG ${subj.sc} barrier). Its reasoning: ${JSON.stringify(oneSentence(out.reasoning) || oneSentence(out.summary) || '')}.`,
    'Argue why this is NOT a violation. Keep REPRODUCED ONLY if, using the CONCRETE evidence already provided, you cannot refute it: a real user must be ACTUALLY blocked, the SC\'s literal requirement must be UNMET, no recognized exception applies, the element is exposed to assistive tech, programmatic context does not already resolve it, and no deterministic checker owns the facet. Do NOT invent evidence not provided.',
    'Return STRICT JSON {"verdict":"REPRODUCED"|"NOT REPRODUCED"|"PARTIAL","confidence":"low"|"medium"|"high","summary":string,"reasoning":string,"evidenceRefs":string[]}. If you can refute it, return NOT REPRODUCED; if genuinely undecidable, PARTIAL.',
  ].join('\n') };
  let r; try { r = await runAgent([...messages, refuteBlock], subj); } catch (e) { r = null; }
  if (r && V2_9_VERDICTS.includes(r.verdict)) return { ...r, _refutedFrom: out.verdict };
  return out; // refuter produced nothing usable → keep the original barrier (do not silently drop recall)
}

// 4.1.3 STAND-ALONE CHECK — ENFORCEMENT (FN round 1, 2026-08-19). `status-message-v0` carries TWO checks: the
// WIRING check (a pre-existing region, sane politeness, no change of context) and the STAND-ALONE check (does
// the announced string say WHAT it happened to). The rubric ALREADY requires that a clear CARRY the second
// check's result — quote the announced string, and name either the referent or one of its two guards — and
// says to return PARTIAL when it does not. Prose cannot enforce itself: measured on the annotated corpus,
// EVERY 4.1.3 miss was a high-confidence clear whose reasoning cited the wiring half alone, while the referent
// the announcement dropped sat in the SAME prompt (the activated control's own accessible name, the section
// heading, or — on a non-atomic update — the mutated fragment). This is the enforcement, and it fires ONLY on
// a clear that skipped the check: the second question is then asked ALONE, decomposed, exactly the way the
// applicability gate asks its own. A clear that DID the work is never re-asked and never costs a call.
// FAIL-CLOSED ON FP: anything other than a REPRODUCED from the focused pass keeps the original clear, so the
// gate can only recover a check that was owed and skipped — it can never overturn a performed one.
const STANDALONE_GUARD_RE = /terse-outcome|region-carries-its-own-referent/i;
const normQuote = (s) => String(s == null ? '' : s).toLowerCase().replace(/\s+/g, ' ').trim();
// The announced strings + the referents a sighted user has, read off the SAME threaded evidence the rubric
// receives. `atomic:false` announces only the mutated fragment, so that — not the region's full text — is what
// the AT speaks and what the check must be applied to.
function announcedFactsOf(subj) {
  const el = subj && subj.element;
  const obs = (el && Array.isArray(el.__statusObservations)) ? el.__statusObservations : null;
  if (!obs) return null;
  // PAIRED, not two flat lists (adversarial self-review of this hunk). A page with many triggers would
  // otherwise hand the judge every label on the page next to every string, inviting it to pair an
  // announcement with a referent from an unrelated control. Each spoken string travels with the accessible
  // name of the control that ACTUALLY caused it; the section heading is page-level and rides once.
  const pairs = [];
  for (const t of obs) {
    if (!t || typeof t !== 'object') continue;
    const lab = typeof t.triggerLabel === 'string' ? t.triggerLabel.trim() : '';
    const push = (s0) => { const v = typeof s0 === 'string' ? s0.trim() : ''; if (v) pairs.push({ spoken: v, byControl: lab || null }); };
    for (const r of (Array.isArray(t.regionsUpdated) ? t.regionsUpdated : [])) {
      if (!r || typeof r !== 'object') continue;
      const frag = typeof r.mutatedFragment === 'string' ? r.mutatedFragment.trim() : '';
      if (r.atomic === false && frag) push(frag);
      else push(r.after);
    }
    for (const a of (Array.isArray(t.addedInsideLiveRegion) ? t.addedInsideLiveRegion : [])) push(a);
  }
  const seenPair = new Set();
  const announcements = pairs.filter((p) => { const k = `${p.spoken}\u0000${p.byControl}`; return !seenPair.has(k) && seenPair.add(k); });
  const head = (el && typeof el.sectionHeading === 'string') ? el.sectionHeading.trim() : '';
  return { announcements, announced: [...new Set(announcements.map((p) => p.spoken))], sectionHeading: head || null };
}
// Did the clear carry the second check? Either it named one of the rubric's two guards, or it quoted the
// string it was asked to read alone. Deliberately generous — a clear that shows ANY trace of the check is
// left alone, so the gate spends calls only where the check demonstrably did not happen.
function standaloneCheckPerformed(out, announced) {
  const text = normQuote(`${(out && out.reasoning) || ''} ${(out && out.summary) || ''}`);
  if (!text) return false;
  if (STANDALONE_GUARD_RE.test(text)) return true;
  // >= 3 chars: a one- or two-character announcement (a bare numeral on a non-atomic update) would otherwise
  // be "quoted" by any sentence that happens to contain those characters, waving through the very clears the
  // gate exists to catch. Such a string simply cannot satisfy this test, so it is always re-asked — the right
  // default, since a subject-less numeral is the hardest case here, and the cost is one call.
  return announced.some((a) => { const n = normQuote(a); return n.length >= 3 && text.includes(n); });
}
async function applyStandaloneCheck(runAgent, messages, subj, out) {
  if (process.env.V3_413_STANDALONE === '0') return out;                       // opt-out for ablation
  if (!subj || subj.rubricId !== 'status-message-v0') return out;
  if (!out || out.verdict !== 'NOT REPRODUCED') return out;
  // a clear a SKEPTIC produced by overturning a barrier is not an unperformed check — it is a decision this
  // gate has no business re-opening (adversarial self-review: without this, the refutation cascade and this
  // gate could hand the same subject back and forth).
  if (out._refutedFrom) return out;
  const facts = announcedFactsOf(subj);
  if (!facts || !facts.announced.length) return out;                           // nothing announced ⇒ not owed
  if (standaloneCheckPerformed(out, facts.announced)) return out;              // the clear carried it
  const block = { type: 'text', text: [
    '--- STEP 2 of 2: THE STAND-ALONE CHECK, ASKED ALONE (the delivery question is SETTLED — do not re-open it) ---',
    'A first-pass judge cleared this element on DELIVERY: the live region is correctly wired. Correct delivery settles HOW the message reaches assistive technology, never WHAT it says, and that second question has not been answered. Answer ONLY it.',
    `The exact string(s) an AT would speak, each paired with the accessible name of the control whose activation CAUSED it (\`byControl\`, null when the instrument could not name it): ${JSON.stringify(facts.announcements.slice(0, 8))}.`,
    `The heading of the section these updates belong to: ${JSON.stringify(facts.sectionHeading)}.`,
    'Those two — the causing control\'s own name and the section heading — are referents this page\'s evidence shows a sighted user HAS at the moment of the update. Pair a string only with ITS OWN control; another control\'s name is not a referent the user had for this update.',
    'Read the announced string ALONE, with no screen. Return REPRODUCED only when ALL THREE hold: (i) the string names no subject — it states an outcome, quantity or state change without saying what it applies to; (ii) one of the referents above IS on screen for a sighted user at that moment and identifies what the update is about; and (iii) that referent text sits OUTSIDE the announced region and is not re-announced with the update. Quote the announced string in your reasoning.',
    'Return NOT REPRODUCED when the string stands on its own, or when a guard applies: `terse-outcome` (a one-word outcome after a single unambiguous action, where no on-screen text supplies a referent the string lacks) or `region-carries-its-own-referent` (the announced region\'s own persistent text or accessible name says what is being reported and travels with the update). Brevity alone is never the finding; the finding is a referent the sighted user gets and the announced string drops.',
    'Return STRICT JSON {"verdict":"REPRODUCED"|"NOT REPRODUCED"|"PARTIAL","confidence":"low"|"medium"|"high","summary":string,"reasoning":string,"evidenceRefs":string[]}.',
  ].join('\n') };
  let r; try { r = await runAgent([...messages, block], subj); } catch (e) { r = null; }
  if (r && r.verdict === 'REPRODUCED') return { ...r, _standaloneEnforced: true };
  return out;
}

// DECOMPOSED APPLICABILITY GATE (V3_FP_APPLY_GATE=1): a FOCUSED step-1 judgment on applicability/exemption BEFORE
// the barrier framing primes over-flagging (FLASK-style decomposition, NOT the refuted in-rubric prose — the
// exemption clause is asked as its OWN narrow decision). Returns a NOT-REPRODUCED verdict to short-circuit when the
// SC does not apply / an exemption holds; otherwise `undefined` to proceed to the normal barrier judgment.
async function applyApplicabilityGate(runAgent, messages, subj) {
  if (process.env.V3_FP_APPLY_GATE !== '1') return undefined;
  const gateBlock = { type: 'text', text: [
    '--- STEP 1 of 2: APPLICABILITY / EXEMPTION CHECK ONLY (do NOT assess barrier quality yet) ---',
    `Decide ONLY whether WCAG ${subj.sc} genuinely applies to THIS element as presented, and whether a recognized WCAG EXEMPTION removes the obligation. Do not look for a barrier.`,
    'Return NOT REPRODUCED if the SC does NOT apply OR a recognized exemption holds — e.g. an image of text that is ESSENTIAL (the visual presentation itself conveys the information); decorative or incidental content; an element removed from the accessibility tree (aria-hidden=true / role=presentation / empty alt on a rendering image); or content that is not human-language text.',
    'Return PARTIAL if the SC DOES apply and no exemption holds (a barrier assessment is still required).',
    'Return STRICT JSON {"verdict":"NOT REPRODUCED"|"PARTIAL","confidence":"low"|"medium"|"high","summary":string,"reasoning":string,"evidenceRefs":string[]}.',
  ].join('\n') };
  let g; try { g = await runAgent([...messages, gateBlock], subj); } catch (e) { g = null; }
  if (g && g.verdict === 'NOT REPRODUCED') return { ...g, _gatedInapplicable: true }; // short-circuit: no barrier
  return undefined; // applies (or the gate produced nothing usable) → proceed to the barrier judgment
}

// the single seam both producers call instead of the raw runAgent: applicability-gate → judge → consensus → skeptic → abstain.
async function judgeWithMethod(runAgent, messages, subj) {
  const gated = await applyApplicabilityGate(runAgent, messages, subj);
  if (gated !== undefined) return gated;
  let out; try { out = await runAgent(messages, subj); } catch (e) { out = null; }
  if (!out) return out;
  out = await applyVotes(runAgent, messages, subj, out);
  out = await applyRefute(runAgent, messages, subj, out);
  out = await applyStandaloneCheck(runAgent, messages, subj, out);
  out = applyAbstain(out);
  return out;
}

// ONE sentence, normalized + bounded — for the human-readable annotation companion (NOT scored).
function oneSentence(s) {
  if (typeof s !== 'string') return '';
  const t = s.trim().replace(/\s+/g, ' ');
  if (!t) return '';
  const m = t.match(/^.*?[.!?](\s|$)/);
  return (m ? m[0] : t).trim().slice(0, 240);
}
// The compact VSR evidence an annotator should see: what the screen reader actually announced.
function compactVsr(step) {
  if (!step || typeof step !== 'object') return null;
  return { phrase: step.phrase, name: step.name, role: step.role, states: step.states, axName: step.axName, rawName: step.rawName };
}

// Bounded, ORDER-PRESERVING worker pool. Runs `fn(item, i)` over `items` with at most `concurrency` tasks in
// flight; `results[i]` aligns to `items[i]` regardless of completion order, so a downstream sequential pass
// produces the SAME verdicts/ids as the prior serial loop — only wall-clock changes. `shouldStop()` (optional)
// is checked before each pull: once true, workers take no NEW items (in-flight finish), mirroring the serial
// budget early-break. A task that throws yields `null` for its slot (the caller drops it). concurrency 1 ⇒
// byte-identical to the old serial loop (the production default is 1; run-evaluation passes V3_LLM_CONCURRENCY).
async function runPool(items, concurrency, fn, shouldStop, afterEach) {
  const arr = Array.isArray(items) ? items : [];
  const results = new Array(arr.length).fill(null);
  let cursor = 0, stop = false;
  const worker = async () => {
    while (!stop) {
      if (shouldStop && shouldStop()) { stop = true; return; }
      const i = cursor++;
      if (i >= arr.length) return;
      try { results[i] = await fn(arr[i], i); } catch (e) { results[i] = null; }
      // per-subject hook (e.g. reap any leaked tool tab AFTER this worker's subject is done). Must never
      // throw into the pool. Runs once the subject's judge call (and all its tool turns) have completed.
      if (afterEach) { try { await afterEach(i, arr[i]); } catch (e) {} }
    }
  };
  const c = Math.max(1, Math.min(Number(concurrency) || 1, arr.length || 1));
  await Promise.all(Array.from({ length: c }, () => worker()));
  return results;
}

// Run the offline adjudication. `runAgent(prompt, subject) -> { verdict, confidence, basis, evidenceRefs }`
// is INJECTABLE (default REFUSES, so a misconfigured run cannot silently hit an API). `budget` is the
// run-budget; `transcriptByXpath` maps xpath -> the realism-corrected VSR step. Returns the two frozen
// artifacts: `llm` (structured verdicts) + `llmRationale` (free text, bound by id). Subjects are judged with
// bounded concurrency (`opts.llmConcurrency`, default 1) then assembled IN ORDER.
async function runAdjudication(subjects, opts = {}) {
  const runAgent = opts.runAgent || (() => { throw new Error('llm-adjudicator: no runAgent configured (refusing to call an API by default)'); });
  const budget = opts.budget || null;
  const id = { file: opts.file || null, runId: opts.runId || null, pageDigest: opts.pageDigest || null };
  const transcriptByXpath = opts.transcriptByXpath || {};
  const visionByXpath = opts.visionByXpath || {}; // xpath -> { 'element-crop': base64, 'state-before': base64, ... }
  const checkerHintsByXpath = opts.checkerHintsByXpath || {}; // xpath -> [{ sc, checker, rule, note }] (DEFERRED-TODO A)
  // rubric source: the loader's { skills:{[skill]:{text,visionEvidence}} } OR a plain { skill: text } map.
  const rubricsBySkill = (opts.llmRubrics && opts.llmRubrics.skills) || opts.rubrics || {};
  const getRubric = (skill) => { const r = rubricsBySkill[skill]; if (!r) return { text: null, visionEvidence: [], toolMode: 'auto' }; if (typeof r === 'string') return { text: r, visionEvidence: [], toolMode: 'auto' }; return { text: r.text || null, visionEvidence: Array.isArray(r.visionEvidence) ? r.visionEvidence : [], toolMode: r.toolMode || 'auto' }; };
  const scope = (xpath) => ({ actionTargetRef: xpath, state: opts.state || 'fresh-load', action: opts.action || 'inspect', environment: opts.environment || 'headless-chromium' });
  const verdicts = [];
  const rationales = [];
  const traces = [];       // → the side llmTrace artifact: full reasoning/tool trace + per-subject latency (analysis)
  const visionImages = []; // → the side llmVision artifact (crops, never in results)
  const concurrency = Math.max(1, Number(opts.llmConcurrency) || 1);
  // a malformed budget (exceeded() that throws) must not crash the producer — degrade to "run".
  const stop = () => { if (budget && typeof budget.exceeded === 'function') { try { return budget.exceeded(); } catch (e) { return false; } } return false; };
  // PHASE A (bounded-parallel, PURE per subject): judge each subject. The per-subject frame id uses the
  // subject's INDEX `i` (stable, independent of whether the verdict survives), so a dropped verdict can never
  // make another subject reuse an id and bind the wrong element's crop. No shared mutation here.
  const computed = await runPool(subjects, concurrency, async (subj, i) => {
    const transcriptExcerpt = transcriptByXpath[subj.xpath];
    const signals = precomputeSignals(subj.element, subj.skill, subj.sc);
    const { text: rubricText, visionEvidence, toolMode } = getRubric(subj.skill);
    // supply EXACTLY the vision frames the rubric declares AND the collector captured for this element.
    const avail = visionByXpath[subj.xpath] || {};
    // #13 fix: same as runRubricJudgments below — a native dialog's captured text is otherwise discarded.
    if (typeof avail.nativeDialogText === 'string' && avail.nativeDialogText) signals.nativeDialogText = avail.nativeDialogText;
    const frames = [];
    // BASELINE-VISION ablation (V3_BASELINE_VISION): for the SAME subjects the v3 design would give vision to
    // (visionEvidence non-empty), replace the DESIGNED element/surrounding crops with the page-wide full-page
    // `viewport` screenshot — i.e. "just show the model the page" vs the targeted per-SC crops.
    const visStates = (process.env.V3_BASELINE_VISION === '1' && visionEvidence.length) ? ['viewport'] : visionEvidence;
    for (const state of visStates) {
      const data = avail[state];
      if (typeof data === 'string' && data.length) frames.push({ id: `vis:${subj.skill}:${i}:${state}`, state, data, mediaType: 'image/png' });
    }
    const checkerHint = (checkerHintsByXpath[subj.xpath] || []).find((h) => h.sc === subj.sc) || null;
    const messages = buildMessages(subj, signals, transcriptExcerpt, frames, { rubric: rubricText, checkerHint, toolsEnabled: opts.toolsEnabled });
    let out; const t0 = Date.now();
    try { out = await judgeWithMethod(runAgent, messages, { ...subj, toolMode }); } catch (e) { out = null; }
    const latencyMs = Date.now() - t0;
    return { subj, frames, out, signals, transcriptExcerpt, latencyMs };
  }, stop, opts.afterEach);
  // PHASE B (sequential, IN SUBJECT ORDER): assemble surviving verdicts — dense verdictId, no orphan crops.
  let n = 0;
  for (const c of computed) {
    if (!c) continue; // budget-stopped (not run) or task error
    const { subj, frames, out, signals, transcriptExcerpt, latencyMs } = c;
    // TRACE every judged subject (even one whose verdict is dropped — the reasoning shows WHY it failed).
    if (out && Array.isArray(out.trace) && out.trace.length) traces.push({ sc: subj.sc, targetXpath: subj.xpath, skill: subj.skill, verdict: out.verdict || null, latencyMs, trace: out.trace });
    if (!out || !V2_9_VERDICTS.includes(out.verdict)) continue; // a malformed agent reply is dropped, never guessed
    // the verdict survived → NOW persist its frames (no orphan crops for dropped verdicts).
    for (const f of frames) visionImages.push({ id: f.id, xpath: subj.xpath, state: f.state, mediaType: f.mediaType, data: f.data });
    const verdictId = `llm:${subj.skill}:${n++}`;
    const rationaleRef = `${verdictId}#basis`;
    verdicts.push({
      verdictId, sc: subj.sc, claimFamily: subj.claimFamily, targetXpath: subj.xpath,
      observationScope: scope(subj.xpath), agentVerdict: out.verdict,
      confidence: V.LLM_CONFIDENCE.includes(out.confidence) ? out.confidence : 'low',
      // the vision frame ids join the agent's own evidenceRefs (opaque ids → the llmVision artifact).
      evidenceRefs: [...scrubRefs(out.evidenceRefs), ...frames.map((f) => f.id)], rationaleRef,
    });
    // The ANNOTATION COMPANION (free text — lives ONLY in the side artifact, never in strict results):
    // for every verdict we record the EVIDENCE the LLM actually saw (the deterministic signals + the VSR
    // announcement) plus a 1-sentence SUMMARY and 1-sentence REASONING, so a hand-annotator can review
    // the verdict against its basis without re-deriving anything (3.1 §4 step 2: hand-label after the run).
    rationales.push({
      id: rationaleRef,
      verdictId, sc: subj.sc, targetXpath: subj.xpath, mechanism: MECHANISM, agentVerdict: out.verdict,
      summary: oneSentence(out.summary) || oneSentence(out.basis),
      reasoning: oneSentence(out.reasoning) || oneSentence(out.basis),
      evidence: { signals, vsr: compactVsr(transcriptExcerpt), evidenceRefs: scrubRefs(out.evidenceRefs) },
      basis: typeof out.basis === 'string' ? out.basis.slice(0, 2000) : '',
    });
  }
  return {
    llm: { ...id, model: opts.model || null, promptHash: (opts.llmRubrics && opts.llmRubrics.promptHash) || opts.promptHash || null, verdicts },
    llmRationale: { ...id, rationales },
    llmTrace: { ...id, traces }, // full turn-by-turn reasoning/tool trace + per-subject latency (non-authoritative, not hashed)
    // crops live HERE (a side artifact, like llmRationale) — referenced by opaque id in evidenceRefs;
    // binary can't pass the strict text scanner, so it NEVER rides results. Empty unless vision was supplied.
    llmVision: { ...id, images: visionImages },
  };
}

// ============================ ATOMIC RUBRIC producer (llm-rubric:<id>) — wires the authored rubric set ============================
// The whole-obligation `runAdjudication` above emits `llm-agent`. This producer runs the ATOMIC,
// versioned rubrics (scripts/v3/llm-rubrics/*.md, loaded by rubric-loader) — each scoped to ONE SC, with
// its own `visionEvidence` — and emits a `judgments` artifact whose `rubricRef` is the rubric id, so the
// builder's existing judgments lane lifts it to a `llm-rubric:<id>` shadow obs (and, calibrated, a
// PROVISIONAL fill). This is the wiring the audit (D12-1) found missing: without it the authored rubrics
// never reach a prompt.
const RUBRIC_VERDICT_FROM_V29 = Object.freeze({ REPRODUCED: 'LIKELY_BARRIER', 'NOT REPRODUCED': 'LIKELY_OK', PARTIAL: 'UNCERTAIN', 'N/A': 'UNCERTAIN' });
const mapToRubricVerdict = (v29) => RUBRIC_VERDICT_FROM_V29[v29] || null;

// Build (element, rubric) judging subjects: each auto-PARTIAL obligation × every atomic rubric whose
// `sc` matches the obligation's SC. `rubrics` is loadRubrics().rubrics ({ [id]: {id, sc, skill, text, visionEvidence} }).
// per-page index of links sharing an accessible name (2.4.4 set test) — {xpath, name, href} grouped by lowercased
// name. Extracted so both selectRubricSubjects (the __sameNameLinks prompt evidence) and orchestrator.js's tool
// session (the #8 resolve_destination self-coalescing fix, below) build this from the SAME logic, not two copies
// that could drift.
function buildLinksByName(collect) {
  const linksByName = {};
  for (const el of (collect && collect.elements) || []) {
    if (!el || !el.xpath) continue;
    if ((el.axRole || el.sampledRole || el.roleAttr) !== 'link') continue;
    // 2.4.4 is a set test over AT-REACHABLE links: an aria-hidden / a11y-tree-removed link is NOT a real
    // same-name peer (no user reaches it). Excluding it stops a phantom peer — re-introduced via the el.text
    // fallback below — from inventing an identical-names barrier (a 2.4.4 false positive).
    if (el.removedFromA11yTree === true || el.inTree === false) continue;
    const nm = (typeof el.axName === 'string' && el.axName.trim()) || (typeof el.text === 'string' && el.text.trim()) || '';
    if (!nm) continue;
    const k = nm.toLowerCase();
    // #11: a JS-nav link (span/div role=link with onclick="location='…'") carries its destination in `jsHref`, not
    // href — fall back so same-named JS-links are destination-compared like anchor links (and resolve_destination follows it).
    (linksByName[k] = linksByName[k] || []).push({ xpath: el.xpath, name: nm, href: el.href || el.jsHref || null });
  }
  return linksByName;
}

// 3.3.1 per-field error-summary correspondence. Resolves THE FIELD BEING JUDGED to its entry in the page's
// error-summary correspondence, so the judge is told "this field is one the summary names but the page does not
// flag" instead of being handed a page-level list and left to do the set-membership step itself.
//
// The join is the awkward part and is deliberately FAIL-SAFE — an unresolvable field yields null and the prompt
// keeps exactly today's page-level evidence, never a guessed correspondence. collect-error-summary.js identifies
// a field as `f.id || f.getAttribute('name') || xpathOf(f)`, and the collected element record carries NEITHER id
// NOR name, so there are exactly two sound joins:
//   · XPATH — an id-less, name-less field is keyed BY its xpath, which the element record does carry (exact match);
//   · ACCESSIBLE NAME — `namedVia[{via:'label-text', text:<label text>, field:<key>}]` records the label text the
//     summary matched, and a labelled field's accessible name IS that label text. Required to be UNIQUE among the
//     page's form fields (two fields named "Postcode" cannot be told apart this way) and to resolve to exactly ONE
//     key across every summary on the page; ambiguity ⇒ null.
// `via:'link'` entries carry the SUMMARY LINK's text, not the field's label, so they are not used for the name
// join — but a link-named field still resolves through the xpath join when it is id-less, and through the name
// join when a label-text entry also names it. A field that is FLAGGED but never NAMED appears in no `namedVia`
// entry, so it only resolves via xpath; that gap is a collector-side limitation (the summaries do not publish a
// per-field xpath) and is recorded in DEFERRED-TODO terms in the report, not papered over here.
const _normName = (s) => (typeof s === 'string' ? s.replace(/\s+/g, ' ').trim().toLowerCase() : '');
const FORMFIELD_TAG = /^(input|select|textarea)$/;
function resolveSummaryField(collect, el, summaries) {
  if (!el || !Array.isArray(summaries) || !summaries.length) return null;
  const has = (arr, k) => Array.isArray(arr) && arr.includes(k);
  const keysOf = (s) => [...(s.namedFields || []), ...(s.flaggedFields || [])];
  // (1) XPATH join — exact, no ambiguity possible, and TRIED FIRST for that reason. Three sources, in order of
  // directness: the per-entry `fieldXpath` the collector records for every field a summary NAMES; the
  // `flaggedFieldsXpath` array it publishes index-aligned with `flaggedFields` (the only way to reach a field
  // that is FLAGGED but never NAMED, which is precisely the `flaggedButNotNamed` shape); and a key that IS an
  // xpath, which is how an id-less, name-less field is keyed in the first place.
  let key = null, via = null;
  const xp = typeof el.xpath === 'string' ? el.xpath : '';
  if (xp) {
    for (const s of summaries) {
      for (const v of (s.namedVia || [])) if (v && v.fieldXpath === xp && v.field) { key = v.field; break; }
      if (key == null && Array.isArray(s.flaggedFieldsXpath) && Array.isArray(s.flaggedFields)) {
        const i = s.flaggedFieldsXpath.indexOf(xp);
        if (i >= 0 && s.flaggedFields[i] != null) key = s.flaggedFields[i];
      }
      if (key == null && has(keysOf(s), xp)) key = xp;
      if (key != null) { via = 'xpath'; break; }
    }
  }
  // (2) ACCESSIBLE-NAME join — only when the name is unique among the page's form fields AND maps to one key.
  if (key == null) {
    const nm = _normName(el.axName);
    if (!nm) return null;
    const fields = ((collect && collect.elements) || []).filter((e) => e && (e.isFormField === true || FORMFIELD_TAG.test(e.tag || '')));
    if (fields.filter((e) => _normName(e.axName) === nm).length !== 1) return null; // ambiguous subject ⇒ say nothing
    const keys = new Set();
    for (const s of summaries) for (const v of (s.namedVia || [])) {
      if (v && v.via === 'label-text' && _normName(v.text) === nm && v.field) keys.add(v.field);
    }
    if (keys.size !== 1) return null;                                              // ambiguous mapping ⇒ say nothing
    key = [...keys][0]; via = 'accessible-name';
  }
  const named = summaries.some((s) => has(s.namedFields, key));
  const flagged = summaries.some((s) => has(s.flaggedFields, key));
  return {
    named,
    flagged,
    namedButNotFlagged: summaries.some((s) => has(s.namedButNotFlagged, key)),
    flaggedButNotNamed: summaries.some((s) => has(s.flaggedButNotNamed, key)),
    resolvedVia: via,
  };
}

// #8 fix (2.4.4 resolve_destination self-coalescing): a page-level xpath -> [peer xpaths] map, threaded onto the
// tool session (orchestrator.js) so resolve_destination can auto-expand a single-target call into the WHOLE known
// same-name-link set server-side. Root cause this closes: a documented, cross-model failure (limits.js's
// toolMaxTurns comment; reproduced independently on gpt-5.4-mini on a real DHS Trusted-Tester page) where the model
// issues SEPARATE resolve_destination calls per same-named link instead of batching, burning its whole turn budget
// with zero usable output. The rubric directive to batch ("pass the WHOLE set in one call") already exists
// (link-name-equivalence-v0.md) and the tool already ACCEPTS a batch (`linkXpaths[]`) — the gap is that both are
// purely LLM-discretionary. This makes the batching happen regardless of whether the model complies: even a
// single-target call resolves the full set (and subsequent calls for other members of the SAME set hit
// resolveDestination's own `_DEST_CACHE`, so redundant model calls are cheap, not turn-exhausting).
function computeLinkPeerGroups(collect) {
  const linksByName = buildLinksByName(collect);
  const groups = new Map();
  for (const peers of Object.values(linksByName)) {
    if (peers.length < 2) continue; // a lone link has no set to coalesce
    const xpaths = peers.map((p) => p.xpath);
    for (const xp of xpaths) groups.set(xp, xpaths);
  }
  return groups;
}

// ── FACET-SPLIT ROUTING (1.4.13 + 2.4.3) ────────────────────────────────────────────────────────────
// Both SCs used to run ONE rubric that fused several INDEPENDENT sub-requirements into a single verdict,
// and both were the least stable rubrics in the set (measured by pairing every (case, rubric, xpath) across
// two corpus runs: 66.7% and 65.2%, against 96.7% for the most atomic page-level rubric). A fused rubric
// cannot be stable: each sub-requirement needs DIFFERENT evidence, so the judge is forced to answer the ones
// it has no facts for, and a judge handed a false or absent premise does not abstain — it answers
// confidently, and differently each time.
//
// The split is safe at the AGGREGATION layer for free: obligations.js `mergeProvisional` is barrier-dominant,
// so N rubrics filling one obligation compute exactly the disjunction the fused rubric was asking one prompt
// to compute ("a failure of ANY of these reproduces the barrier"). Nothing in obligations.js changes.
//
// What makes it work is the GATE. Routing is BY SC, so a rubric added to an SC without one fires on every
// subject of that SC. These gates key on the DETERMINISTIC facts the runner/instrument already measured, and
// they are FAIL-OPEN: a facet is subtracted only when a probe POSITIVELY settled it, never merely because a
// probe reported nothing. That direction is not stylistic — the 1.4.13 tri-probe detects revealed content by
// diffing the visibility of real ELEMENTS, so a tooltip drawn by a CSS pseudo-element (`::after { content }`),
// painted into a canvas, or hosted in a namespace `document.evaluate` cannot address reports
// `contentAppeared: false` on a page that plainly shows one. Subtracting on that negative would drop real
// barriers; subtracting only on a positive cannot.
// The claim families the a3 terminal-PARTIAL carve-out admits (see the row filter in selectRubricSubjects).
// Exactly the starved lanes the s10 residual RCA priced: 1.4.13 (hover experiment abstains terminally),
// 2.1.2 (keyboard-trap-escape abstains; largely covered by the confinement carve-out but kept for parity),
// and 3.3.1 (form-error probe abstains on at-rest error states).
const TERMINAL_PARTIAL_FAMILIES = new Set(['hover-content', 'no-keyboard-trap', 'error-identification']);
const HOVER_FACET_RUBRICS = new Set(['hover-dismissable-v0', 'hover-hoverable-v0', 'hover-persistent-v0']);
// `f` is the hover-content-tri observation for this trigger, or null when the probe never produced one.
function hoverFacetOpen(rubricId, f) {
  if (!f) return true;                                   // unmeasured ⇒ every facet is open
  // NOT ADDITIONAL BY MEASURED REDUNDANCY (#30) — the runner found the reveal's whole text already visible at
  // rest beside the trigger (or equal to its accessible name), and on that finding the deterministic lane
  // treats the SC as not reaching this content. Every facet is a property OF additional content, so none is
  // owed; keeping them open only let the LLM lane re-open an applicability question the measurement closed
  // (measured: a redundant name bubble flagged on all three facets, on two judges). Closed on the
  // POSITIVE redundancy fact only — `contentIsAdditional:false` for any other reason (native title, nothing
  // appeared) leaves the facets open exactly as before, and the runner's own conservatism (whole-text,
  // local, contiguous) is the width of this gate.
  if (f.contentIsAdditional === false && f.redundantWithVisibleText && f.redundantWithVisibleText.redundant === true) return false;
  // DISMISSABLE — the probe pressed Escape with the trigger still held, and separately checked whether the
  // content obscures anything at all (the criterion only owes dismissability when it does). Either outcome is
  // a SUFFICIENT condition under WCAG, so a `true` genuinely closes the question.
  if (rubricId === 'hover-dismissable-v0') return f.dismissible !== true;
  // HOVERABLE — the probe travelled a real pointer from the trigger onto the content; surviving that is
  // sufficient. Also vacuous for a FOCUS-only reveal: the Hoverable condition is about pointer-hover-triggered
  // content, and the runner itself records `revealMode: 'focus'` precisely when hovering revealed nothing.
  if (rubricId === 'hover-hoverable-v0') return f.hoverable !== true && f.revealMode !== 'focus';
  // PERSISTENT — deliberately NOT subtractable. The probe's `persistent` is "still present after `dwellMs`",
  // and the criterion is "remains until hover/focus is removed, it is dismissed, or its info is invalid". A
  // tooltip on a timer LONGER than the dwell measures `true` and still fails, so a `true` leaves a real
  // residue. Its premise ("additional content is revealed on hover or focus") is the very fact that mints the
  // obligation, so the SC routing already guarantees it — this rubric's gate IS the obligation.
  return true;
}
// 2.4.3 — one entry per CLAUSE that carries its own pre-computed fact on a recorded tab stop. The incumbent
// `focus-order-meaning-v0` keeps the residual meaning-of-the-resting-order question and is NOT listed here:
// it fires wherever a sequence exists, which is what preserves the SC's recall when none of the clause facts
// are present (a page whose only defect is a scrambled order lights up no clause fact at all).
const FOCUS_CLAUSE_OF = {
  'focus-modal-containment-v0': 'modal',
  'focus-reveal-adjacency-v0': 'revealInsertion',
  'focus-return-after-dismissal-v0': 'revealReturn',
  'focus-redundant-stop-v0': 'redundant',
};
// UNDECLARED-MODAL SHAPE (FN round 1, 2026-08-19). Returns the tab stops that are (a) fully occluded by a
// positioned overlay that covers essentially the whole viewport, while (b) at least one OTHER stop lies
// INSIDE that same overlay — i.e. the ring walks controls the user cannot see, and the thing hiding them has
// focusable content of its own. That pair is what an ARIA-declared modal leak looks like measured
// geometrically; neither half alone is it (a full-page cookie banner with nothing focusable behind it, or an
// overlay with no stops of its own, produce an empty list). Deliberately strict on coverage: a dropdown or a
// sticky header occludes a little, a modal scrim occludes the viewport.
const OVERLAY_MIN_VIEWPORT_COVERAGE = 0.8;
function occludedStopsUnderOverlay(stops) {
  const rows = Array.isArray(stops) ? stops : [];
  const out = [];
  for (const s of rows) {
    if (!s || typeof s.occludedBy !== 'string' || !s.occludedBy) continue;
    if (s.occluderPosition !== 'fixed' && s.occluderPosition !== 'absolute') continue;
    if (!(Number(s.occluderViewportCoverage) >= OVERLAY_MIN_VIEWPORT_COVERAGE)) continue;
    const inside = rows.some((t) => t && typeof t.xpath === 'string' && t.xpath.startsWith(`${s.occludedBy}/`));
    if (inside) out.push(s);
  }
  return out;
}
// Which clause facts this page's recorded ring actually carries. Computed ONCE per page from the same
// artifact the rubrics read, so a gate can never disagree with the evidence its rubric is handed.
function focusClauseFacts(focusOrder) {
  const stops = (focusOrder && Array.isArray(focusOrder.forward)) ? focusOrder.forward : [];
  const rev = (s) => (s && s.reveal && typeof s.reveal === 'object') ? s.reveal : null;
  return {
    // clause C — a stop was taken while a modal was RENDERED open (leak or not; the rubric decides which),
    // OR (batch-3 #10, the opened-ring feeder) a reveal state's containment aggregate measured stops
    // tabbable OUTSIDE an open modal. leakedStops > 0 only: a contained modal (aggregate present, zero
    // leaks) opens no containment question, and the aggregate's absence (null) claims nothing.
    modal: stops.some((s) => s && s.modalOpen === true)
      || stops.some((s) => { const r = rev(s); return !!r && r.containmentLeak && typeof r.containmentLeak === 'object' && Number(r.containmentLeak.leakedStops) > 0; })
      // ...OR (FN round 1, 2026-08-19) the UNDECLARED modal, recognised from GEOMETRY instead of ARIA. Both
      // facts above require the page to SAY it opened a modal — `modalOpen` is `dialog[open]`/`aria-modal`
      // and `containmentLeak` is computed from the opened-state ring of one of those. A promo/consent card
      // over a full-viewport scrim declares neither, so the containment clause never opened and the case
      // fell to focus-order-meaning-v0, which asks whether the sequence is MEANINGFUL and has no containment
      // doctrine to apply — measured, it answered "logical, unbroken order" while five background controls
      // were tabbable underneath an opaque overlay. The per-stop occlusion facts recording exactly this
      // shape were added for it (kbd-graph #25) and no gate consumed them. `occludedStopsUnderOverlay`
      // below is the geometric analogue of `leakedStops > 0`: stops the user CANNOT SEE are in the ring
      // while other stops sit INSIDE the thing covering them. It only ROUTES a rubric — the rubric still
      // decides whether the overlay is modal in intent and whether the order breaks meaning.
      || occludedStopsUnderOverlay(stops).length > 0,
    // clause D, insertion half — the instrument could ASK where the revealed region sits. A `null` on both
    // fields means the question could not be asked, and the rubric is told never to argue from a null, so
    // routing it there would be a guaranteed abstain.
    revealInsertion: stops.some((s) => { const r = rev(s); return !!r && (r.adjacent != null || r.focusMovedIntoRevealed != null); }),
    // clause D, return half — INDEPENDENT of insertion, and gated on the one precondition the requirement
    // has: something was actually dismissed. Without that nothing is owed and the rubric says so itself.
    revealReturn: stops.some((s) => { const r = rev(s); return !!r && r.regionHiddenAfterDismiss === true; }),
    // clause E — a wrapper stop or an explicit-tabindex container stop exists to judge.
    redundant: stops.some((s) => s && (s.wrapsNextStop === true || s.genericContainerStop === true)),
  };
}
function selectRubricSubjects(collect, ledger, rubrics, { onlyAutoPartial = true, confinement = null, contrastExempt = null, focusOrder = null, statusObservations = null, statusTimelines = null, liveRegionBirths = null, colourStateDeltas = null, hoverFacets = null, autoUpdateCadence = null } = {}) {
  // 2.1.2 keyboard-trap: `confinement` maps each CONFINED element xpath → { members:[{xpath,label}], setSize } (built
  // from the deterministic confinement instrument's REVIEW findings — the lying-static-advisory ones were already
  // promoted to a barrier and are excluded). The keyboard-trap-v0 rubric fires ONLY on a confined member, carrying
  // the trapped set so the regular LLM judge can reveal a buried advisory + verify the key with the tools.
  const confinementFor = (xpath) => (confinement && Object.prototype.hasOwnProperty.call(confinement, xpath)) ? confinement[xpath] : null;
  // 1.4.13: the hover-content-tri observation for a TRIGGER xpath (null when the probe produced none).
  const hoverFacetsFor = (xpath) => (hoverFacets && Object.prototype.hasOwnProperty.call(hoverFacets, xpath)) ? hoverFacets[xpath] : null;
  // 2.4.3: which clause facts this page's recorded ring carries — computed once, read by the clause gates.
  const focusClauses = focusClauseFacts(focusOrder);
  const elByXpath = {};
  for (const el of (collect && collect.elements) || []) if (el && el.xpath) elByXpath[el.xpath] = el;
  const structure = (collect && collect.structure) || null; // page facts threaded to page-structure subjects (Tier-0 #3)
  // Item 14a (2.4.4 in-context, set-not-element): a per-page index of links sharing an accessible name. A
  // link-purpose subject is handed the OTHER same-named links + their destinations so the rubric can judge whether
  // identically-named links go to DIFFERENT places (ACT fd3a94) — the equivalence call a single-element view misses.
  const linksByName = buildLinksByName(collect);
  const sameNameLinksFor = (el) => {
    const nm = (typeof el.axName === 'string' && el.axName.trim()) || (typeof el.text === 'string' && el.text.trim()) || '';
    if (!nm) return null;
    const peers = (linksByName[nm.toLowerCase()] || []).filter((l) => l.xpath !== el.xpath);
    return peers.length ? peers.slice(0, 12) : null;
  };
  // 4.1.2 (4b1c6c, relational duplicate-name): a per-page index of IFRAMES sharing an accessible name. ACT requires
  // that iframes with IDENTICAL accessible names serve an EQUIVALENT purpose; a single-element name-adequacy view
  // cannot see this (and accessible-name-adequacy-v0 explicitly defers it). Hand the duplicate-name-equivalence
  // rubric the OTHER same-named iframes + their src so it can judge whether they point at different content/purpose.
  const iframesByName = {};
  for (const el of (collect && collect.elements) || []) {
    if (!el || !el.xpath) continue;
    if (el.tag !== 'iframe' && el.tag !== 'frame') continue;
    const nm = (typeof el.axName === 'string' && el.axName.trim()) || '';
    if (!nm) continue; // an UNNAMED iframe owns no identical-name obligation
    (iframesByName[nm.toLowerCase()] = iframesByName[nm.toLowerCase()] || []).push({ xpath: el.xpath, name: nm, src: typeof el.iframeSrc === 'string' ? el.iframeSrc : '' });
  }
  const sameNameIframesFor = (el) => {
    if (!el || (el.tag !== 'iframe' && el.tag !== 'frame')) return null;
    const nm = (typeof el.axName === 'string' && el.axName.trim()) || '';
    if (!nm) return null;
    const peers = (iframesByName[nm.toLowerCase()] || []).filter((f) => f.xpath !== el.xpath);
    return peers.length ? peers.slice(0, 12) : null;
  };
  const bySc = {};
  for (const r of Object.values(rubrics || {})) if (r && r.sc) (bySc[r.sc] = bySc[r.sc] || []).push(r);
  // Type-B routing fix (80af7b 2.1.2): the keyboard-trap-escape EXPERIMENT disposes a CONFIRMED-confinement obligation
  // as a terminal PARTIAL (autoPartial=false — it provably cannot decide an async/onblur trap), which the autoPartial
  // filter would then DROP, starving keyboard-trap-v0 of the one subject it exists to judge (the case scored
  // noObligation — a recall miss on BOTH models). A 2.1.2 row carrying a REAL confinement signal is genuinely
  // uncertain (the undocumented-escape question only the rubric can settle) ⇒ keep it in the lane regardless of
  // autoPartial. The keyboard-trap-v0 gate below still requires the confinement, and it is the SOLE 2.1.2 rubric
  // (verified) so no other rubric can leak onto the now-included row.
  //
  // GENERALISED (s10 residual RCA, mechanism a3 APERTURE-STARVED): 2.1.2 was not the only lane starved this way —
  // any experiment that runs and terminally ABSTAINS (disposition PARTIAL, autoPartial=false) left its obligation
  // unreachable by every judge, scoring `noObligation` despite the obligation existing and being undecided. A
  // terminal PARTIAL is exactly the "checker abstains ⇒ hand the judge WHY" case: keep the row in the lane. The
  // per-rubric gates below still apply, so a rubric whose premise-fact is absent drops the subject as before;
  // shadow-lane dispositions stay excluded (non-authoritative by design, never judged).
  //
  // ALLOWLISTED, not universal (adversarial soundness finding #3, probe-confirmed): unconstrained, the dominant
  // admitted channel was `field-label` on every field where the field-label probe abstains — it abstained on 6/6
  // textbook for/id fields on two probed pages — plus 1.4.11 abstains, i.e. a per-field LLM-call flood and fresh
  // FP surface on SCs the residual RCA never priced. The carve-out covers exactly the families whose starvation
  // the RCA measured; widen it only WITH a measured run behind the widening.
  const rows = (ledger || []).filter((r) => (onlyAutoPartial
    ? (r.autoPartial
      || (r.sc === '2.1.2' && !!confinementFor(r.xpath))
      || (TERMINAL_PARTIAL_FAMILIES.has(r.claimFamily)
        && r.disposition === 'PARTIAL' && r.cleared !== true && r.shadow !== true))
    : true));
  const seen = new Set();
  const subjects = [];
  const byKey = new Map(); // key → the pushed subject, for the FACET REBIND below
  for (const row of rows) for (const rub of (bySc[row.sc] || [])) {
    const key = `${row.xpath}::${rub.id}`;
    // FACET REBIND (1.1.1 long-description FN). One subject per (xpath, rubric) is correct — it is ONE LLM call —
    // but the subject inherits the claimFamily of whichever ledger row for (xpath, sc) happened to come FIRST, and
    // an element can own SEVERAL families on one SC. A complex image owns BOTH `non-text-content` and
    // `long-description` on 1.1.1, and the oracle emits non-text-content first, so long-description-completeness-v0
    // bound its verdict to `non-text-content` — answering the LONG-DESCRIPTION question but FILLING the alt-adequacy
    // obligation, while the long-description obligation received no fill at all. Verified live on
    // eval/act-augmented/1.1.1/pages/complex-image-long-description-incomplete/case-03 + case-07. When a LATER row
    // carries the family this rubric actually answers, rebind the existing subject to it — no extra LLM call, the
    // verdict simply lands on its OWN obligation. Rubrics absent from RUBRIC_FAMILY are untouched.
    if (seen.has(key)) {
      const want = RUBRIC_FAMILY[rub.id];
      const s = byKey.get(key);
      if (want && s && row.claimFamily === want && s.claimFamily !== want) s.claimFamily = want;
      continue;
    }
    const baseEl = elByXpath[row.xpath] || { xpath: row.xpath };
    const gate = RUBRIC_GATE[rub.id]; // per-facet gating (Item 7): skip a rubric that is not this element's facet
    if (gate && !gate(baseEl)) continue;
    seen.add(key);
    // attach per-subject evidence via a SHALLOW COPY (never mutate the shared collect.elements record): the
    // whole-page structure for page-structure/grouping rubrics (__pageStructure), and the same-named link set for
    // the relational link-name-equivalence rubric (__sameNameLinks). precomputeSignals reads these.
    const extra = {};
    if (structure && PAGE_STRUCTURE_SKILLS.has(rub.skill || '')) extra.__pageStructure = structure;
    // 2.4.3 FOCUS ORDER: the recorded tab SEQUENCE from the deterministic keyboard instrument. The rubric
    // is written around this artifact and abstains without it ("If the recorded sequence is empty/degenerate
    // … return PARTIAL rather than guessing"), so before this was threaded the lane could only abstain.
    // Keyed on the RUBRIC ID, not the skill: `focus-management` is also 2.4.7/2.4.11's skill and those are
    // element-level subjects that must keep their existing prompts byte-identical.
    // ...and to the four CLAUSE rubrics split out of it, each of which reads the same artifact for its own
    // facet. Keyed on the rubric SET rather than a single id for the same reason as before: `focus-management`
    // is also 2.4.7/2.4.11's skill and those are element-level subjects whose prompts must stay byte-identical.
    if (rub.id === 'focus-order-meaning-v0' || Object.prototype.hasOwnProperty.call(FOCUS_CLAUSE_OF, rub.id)) {
      // CLAUSE GATE. Fire a clause rubric ONLY where its own fact is present on the recorded ring. Without
      // this each of the four would inherit the by-SC routing and fire on every 2.4.3 page — the same defect
      // shape that put a rubric's premise-free verdict on all 53 pages of another SC, where the model answered
      // LIKELY_OK at high confidence rather than abstaining and displaced the incumbent's barrier.
      const clause = FOCUS_CLAUSE_OF[rub.id];
      if (clause && !focusClauses[clause]) { seen.delete(key); continue; }
      if (focusOrder) extra.__focusOrder = focusOrder;
      if (structure) extra.__pageStructure = structure;
    }
    // 1.4.13 FACET GATE + evidence. The tri-probe's per-facet measurements were NEVER threaded to a prompt:
    // the fused rubric told the judge to "DEFER to that CLAIM" for claims it was never handed, and to decide
    // dismissability, hoverability and persistence from two static screenshots — which is what produced the
    // measured coin-flip (9 verdict flips across two runs on one page's triggers, 6 of them moving away from
    // the labelled answer). The facts go over with the subject now, each facet to the rubric that owns it.
    if (HOVER_FACET_RUBRICS.has(rub.id)) {
      const f = hoverFacetsFor(row.xpath);
      if (!hoverFacetOpen(rub.id, f)) { seen.delete(key); continue; }
      if (f) extra.__hoverFacets = f;
    }
    // 4.1.3 STATUS MESSAGES: the per-trigger record of what activation actually did — which regions
    // existed BEFORE the click, which were inserted already carrying their message, which were emptied,
    // and what text was removed. Without it the rubric was asked to judge announcement adequacy from a
    // resting screenshot, which cannot show any of that. Keyed on the RUBRIC ID for the same reason as
    // 2.4.3: `dynamic-announcement` is shared with auto-update-notification-v0, whose element-level
    // prompts must stay byte-identical.
    if (rub.id === 'status-message-v0' && statusObservations && statusObservations.length) extra.__statusObservations = statusObservations;
    // …and the phase-B evidence, threaded on the same key so auto-update-notification-v0 (same skill) stays
    // byte-identical. Timelines/births can exist where observations do not (a state-only trigger, a
    // birth with no drivable trigger), so they are gated independently.
    if (rub.id === 'status-message-v0' && statusTimelines && statusTimelines.length) extra.__statusTimelines = statusTimelines;
    if (rub.id === 'status-message-v0' && autoUpdateCadence) extra.__autoUpdateCadence = autoUpdateCadence;
    if (rub.id === 'status-message-v0' && liveRegionBirths) extra.__liveRegionBirths = liveRegionBirths;
    // 3.3.1 ERROR SUMMARY coherence — page-level evidence handed to every error-identification subject on
    // the page, because the summary is about the form as a whole and any field's judgment can turn on it.
    if (rub.id === 'error-identification-v0') {
      const es = (collect && collect.structure && Array.isArray(collect.structure.errorSummaries)) ? collect.structure.errorSummaries : [];
      if (es.length) {
        extra.__errorSummaries = es;
        // ...plus the PER-SUBJECT correspondence. The summaries above are a PAGE-level fact, but the rubric fires
        // per FIELD, so as shipped the judge had to perform the set-membership step itself — "is the field I am
        // judging one of the ones the summary names but the page does not flag?". Measured: on a page whose summary
        // named a field the page never flagged, the judge held `namedButNotFlagged:[<that field>]` in its prompt,
        // evaluated the field in isolation, found its own markup correct, and cleared — the exact inversion the
        // rubric warns against two lines above the signal. Removing the reasoning STEP is the lever; more rubric
        // prose telling it to reason harder is not. Same shape as `__sameNameLinks`: derived here, where the whole
        // page is in scope, and merely PRESENTED by precomputeSignals.
        const f = resolveSummaryField(collect, baseEl, es);
        if (f) extra.__errorSummaryField = f;
      }
    }
    // 1.3.1 PAGE-LEVEL GROUPING + DECLARED-STRUCTURE EVIDENCE (residual RCA S10/S11). Four exact collector
    // facts plus the page-wide control-group summary and the visual-structure heading discoveries, all of
    // which were computable and reached no prompt: the group question is judged on the page-level
    // info-relationships subject, and the per-member controlGroup records above reach only ELEMENT
    // subjects. Keyed on the RUBRIC ID like __errorSummaries so every other grouping-skill rubric keeps
    // its prompt byte-identical.
    if (rub.id === 'info-relationships-v0') {
      const st = (collect && collect.structure) || null;
      const cg = st && st.controlGroupsSummary;
      if (cg && ((Array.isArray(cg.groups) && cg.groups.length)
        || (Array.isArray(cg.splitFieldGroupXpaths) && cg.splitFieldGroupXpaths.length))) extra.__controlGroupsPage = cg;
      const vh = (st && Array.isArray(st.visualHeadings)) ? st.visualHeadings : [];
      if (vh.length) extra.__visualHeadings = vh;
      const smf = {};
      for (const k of ['blockquotesWithoutSource', 'dlOrderAnomalies', 'radioGroupsWithoutGrouping', 'requiredStateInventory', 'fieldsetsWithoutControls']) {
        if (st && Array.isArray(st[k]) && st[k].length) smf[k] = st[k];
      }
      if (Object.keys(smf).length) extra.__structuralMarkupFacts = smf;
    }
    // 1.4.1 COLOUR PEER GROUP: when this subject is the ANCHOR of a colour-coded peer set, hand over the whole
    // group. Without it the judge sees one element in isolation and cannot see the only thing that matters —
    // that its peers are identical to it except in colour.
    if (rub.id === 'use-of-color-v0') {
      const groups = (collect && collect.structure && Array.isArray(collect.structure.colourPeerGroups)) ? collect.structure.colourPeerGroups : [];
      const g = groups.find((x) => x && Array.isArray(x.members) && x.members[0] && x.members[0].xpath === baseEl.xpath);
      if (g) extra.__colourPeerGroup = g;
      // POST-ACTIVATION COLOUR DELTAS (instrument fact, page-level): a row/tile whose computed colours flip
      // on activation with no text change is 1.4.1's state-conveyed-by-colour-alone shape, and it is
      // invisible to every at-rest signal this rubric otherwise receives.
      if (colourStateDeltas && colourStateDeltas.length) extra.__colourStateDeltas = colourStateDeltas;
    }
    // 2.4.4 SPLIT (fd3a94): the RELATIONAL "do same-named links resolve to equivalent destinations?" question is
    // OWNED by link-name-equivalence-v0, NOT link-purpose-v0 (the single-link purpose-in-context rubric). Mirror the
    // iframe duplicate-name-equivalence gate: this rubric fires ONLY on a link that shares its name with another link;
    // with no same-named peer the relational check is vacuous — skip the subject (no LLM call). link-purpose-v0 no
    // longer receives the peer set, so the two questions are judged independently (a single-link FP/FN cannot leak
    // into the relational decision and vice versa).
    if (rub.id === 'link-name-equivalence-v0') { const peers = sameNameLinksFor(baseEl); if (!peers) { seen.delete(key); continue; } extra.__sameNameLinks = peers; }
    // 4.1.2 relational duplicate-name (4b1c6c): the duplicate-name-equivalence rubric ONLY applies to an iframe that
    // shares its accessible name with ANOTHER iframe. With no same-named peer the relational check is vacuous — skip
    // the subject entirely (no LLM call), so this rubric never fires on a lone iframe or any non-iframe 4.1.2 row.
    if (rub.id === 'duplicate-name-equivalence-v0') {
      const peers = sameNameIframesFor(baseEl);
      if (!peers) { seen.delete(key); continue; }
      // DETERMINISTIC EQUIVALENCE (allSameSrc): every same-named iframe loads the SAME non-empty src ⇒ the same
      // resource ⇒ equivalent purpose ⇒ NOT a barrier. SUBTRACT it from the LLM lane (the rubric's own allSameSrc
      // branch, made deterministic) — this is the 4b1c6c FP source: a judge that ignores allSameSrc and flags a
      // barrier on page-one-vs-page-one. The rubric then fires ONLY for distinctSrcs>=2 (the genuinely ambiguous
      // case it now resolves with compare_iframe_content). Empty src ('') stays in the lane (srcdoc/JS — un-fingerprintable).
      const norm = (u) => (typeof u === 'string' ? u.trim().replace(/[?#].*$/, '').replace(/\/+$/, '').toLowerCase() : '');
      const srcs = new Set([typeof baseEl.iframeSrc === 'string' ? baseEl.iframeSrc : '', ...peers.map((f) => f.src)].map(norm));
      if (srcs.size === 1 && [...srcs][0] !== '') { seen.delete(key); continue; }
      extra.__sameNameIframes = peers;
    }
    // 2.1.2 keyboard-trap: ONLY judge a CONFINED element (the deterministic instrument confirmed the confinement and
    // did not settle it via the lying-static-advisory fast-path). With no confinement finding the rubric is vacuous —
    // skip the subject so it never fires on the thousands of ordinary focusRisk elements.
    if (rub.id === 'keyboard-trap-v0') { const conf = confinementFor(row.xpath); if (!conf) { seen.delete(key); continue; } extra.__confinement = conf; }
    // #3 (1.4.3 non-language exemption): the text-contrast experiment proved this element's rendered text expresses
    // no human language (pure symbols / a separately-named single-letter icon — afw4f7 Passed Ex6/Ex7), so 1.4.3 is
    // inapplicable. SUBTRACT it from the LLM contrast lane — the deterministic facet is settled; the rubric would
    // only re-derive the (true-but-irrelevant) sub-threshold ratio and FALSE-barrier a passing case.
    if (rub.id === 'contrast-over-complex-backdrop-v0' && contrastExempt && contrastExempt.has(row.xpath)) { seen.delete(key); continue; }
    // TERMINAL-ABSTENTION marker (pairs with the generalised a3 carve-out in the row filter above): the subject
    // must be told the deterministic experiment RAN and could not decide — its silence is an abstention, never a
    // pass. Set uniformly on every terminal-PARTIAL row (the 2.1.2 confinement subjects carry it too, truthfully),
    // and surfaced as one generic sentence by precomputeSignals.
    if (row.autoPartial !== true && row.disposition === 'PARTIAL') extra.__terminalPartial = true;
    const element = Object.keys(extra).length ? { ...baseEl, ...extra } : baseEl;
    const subject = { xpath: row.xpath, sc: row.sc, claimFamily: row.claimFamily, rubricId: rub.id, rubric: rub, skill: rub.skill || null, element };
    subjects.push(subject);
    byKey.set(key, subject);
  }
  // 1.4.1 POST-ACTIVATION DELTA SUBJECTS (FN round 1, 2026-08-19). `colourStateDeltas` records that activating
  // some trigger flipped ANOTHER element's computed colours with no text added in or around it — 1.4.1's
  // state-conveyed-by-colour-alone shape, measured. The rows were already broadcast to every `use-of-color-v0`
  // subject on the page, and the signal's own note (correctly) tells the judge to match the row's xpath against
  // its subject before attributing a delta to it. Measured consequence: on a page whose only 1.4.1 subjects were
  // the form fields inside the changed rows, the delta named an element that was NOT any subject, the judge
  // matched, found nothing, and cleared — the harness measured the barrier and then instructed the judge to
  // ignore it. The delta's OWN element becomes a subject here, so the match it is told to perform succeeds.
  //
  // The oracle cannot mint this: it runs on collected at-rest facts, and this fact only exists after an
  // activation the instrument performs later. The subject therefore carries no ledger row, which is exactly
  // right for this lane — the judgment rides as a non-authoritative shadow annotation and can never fill an
  // obligation (the 3.2 PROVISIONAL fill only touches ENUMERATED auto-PARTIAL rows).
  //
  // Bounded four ways: `textAlsoChangedNearby === false` only (a delta accompanied by text is not the
  // colour-alone shape and there is nothing to ask); the element must be a REAL collected element, so the
  // rubric gets the same facts any other subject gets; never duplicates an (xpath, rubric) the loop already
  // produced; and capped, since one activation can tint many peers.
  const ucRubric = (bySc['1.4.1'] || []).find((r) => r && r.id === 'use-of-color-v0');
  if (ucRubric && Array.isArray(colourStateDeltas) && colourStateDeltas.length) {
    const DELTA_SUBJECT_CAP = 6;
    let minted = 0;
    for (const d of colourStateDeltas) {
      if (minted >= DELTA_SUBJECT_CAP) break;
      if (!d || typeof d !== 'object' || d.textAlsoChangedNearby !== false) continue;
      const xp = typeof d.xpath === 'string' ? d.xpath : '';
      if (!xp) continue;
      const key = `${xp}::${ucRubric.id}`;
      if (seen.has(key)) continue;
      const baseEl = elByXpath[xp];
      if (!baseEl) continue;                                   // no collected facts ⇒ nothing to judge on
      seen.add(key);
      const element = { ...baseEl, __colourStateDeltas: colourStateDeltas };
      const subject = { xpath: xp, sc: '1.4.1', claimFamily: 'use-of-color', rubricId: ucRubric.id, rubric: ucRubric, skill: ucRubric.skill || null, element };
      subjects.push(subject);
      byKey.set(key, subject);
      minted += 1;
    }
  }
  return subjects;
}

// Run the atomic rubrics. Returns { judgments, llmVision } to attach to the bundle. The judgment's free
// text (summary/reasoning) rides the judgments artifact (lenient-scanned, never in strict results); the
// crops ride a side llmVision artifact, referenced by opaque id. `runAgent(messages, subject)` is injected
// (default REFUSES). A malformed/unmappable agent reply is dropped, never guessed.
async function runRubricJudgments(rubricSubjects, opts = {}) {
  const runAgent = opts.runAgent || (() => { throw new Error('llm-adjudicator: no runAgent configured (refusing to call an API by default)'); });
  const budget = opts.budget || null;
  const id = { file: opts.file || null, runId: opts.runId || null, pageDigest: opts.pageDigest || null };
  const visionByXpath = opts.visionByXpath || {};
  const transcriptByXpath = opts.transcriptByXpath || {};
  const checkerHintsByXpath = opts.checkerHintsByXpath || {}; // xpath -> [{ sc, checker, rule, note }] (DEFERRED-TODO A)
  const scope = (xpath) => ({ actionTargetRef: xpath, state: opts.state || 'fresh-load', action: opts.action || 'inspect', environment: opts.environment || 'headless-chromium' });
  const judgments = [];
  const traces = [];
  const visionImages = [];
  const concurrency = Math.max(1, Number(opts.llmConcurrency) || 1);
  const stop = () => { if (budget && typeof budget.exceeded === 'function') { try { return budget.exceeded(); } catch (e) { return false; } } return false; };
  // PHASE A (bounded-parallel, PURE): the per-rubric-subject frame id + judgmentId both use the subject's
  // INDEX `i` (position-stable, matching the old `idx`). The required-evidence gate / legacy-token drop
  // return null (the subject abstains), exactly as the prior `continue`.
  const computed = await runPool(rubricSubjects, concurrency, async (subj, i) => {
    if (isLegacyToken(subj.rubricId)) return null; // a legacy-token rubric id would make the artifact reject — drop it
    const rub = subj.rubric || {};
    const signals = precomputeSignals(subj.element, subj.skill, subj.sc);
    const avail = visionByXpath[subj.xpath] || {};
    // #13 fix: vision-capture.js's submit-pair driver (#12) captures a native window.alert()/confirm()'s
    // message text — the ACTUAL evidence 3.3.1/3.3.3 rubrics need ("the textual error/validation message that
    // was shown", error-identification-v0.md) — but nothing surfaced it to the prompt, so the rubric was still
    // judging the state-before/after SCREENSHOTS alone. A native dialog is browser chrome, not page content,
    // so those screenshots can only ever show the page's OWN visual state (e.g. a native :invalid red
    // outline) — never the dialog text. Confirmed live: a real DHS Trusted-Tester page (401807-3, a properly
    // `alert()`-based error-identification form) was judged REPRODUCED ("only a red validation outline...no
    // visible text explaining the error") on every field, a false positive, because the model genuinely could
    // not see the alert's text — it was captured but discarded. Surfaced as a plain signal so it rides the
    // existing JSON.stringify(signals) block already in the prompt (buildPrompt) — no new wiring needed there.
    if (typeof avail.nativeDialogText === 'string' && avail.nativeDialogText) signals.nativeDialogText = avail.nativeDialogText;
    const declaredVision = rub.visionEvidence || [];
    const frames = [];
    for (const state of declaredVision) { const data = avail[state]; if (typeof data === 'string' && data.length) frames.push({ id: `vis:${subj.rubricId}:${i}:${state}`, state, data, mediaType: 'image/png' }); }
    // REQUIRED-EVIDENCE GATE (adversarial): an atomic rubric judges over EXACTLY its declared evidence. If
    // ANY declared frame is missing — capture skipped the element (off-viewport / <6px / hidden), or the
    // transition isn't driven yet (the form-submit pair for 3.3.1/3.3.3 is not produced) — ABSTAIN rather
    // than judge BLIND. Missing declared evidence ⇒ the obligation simply stays auto-PARTIAL (honest "could not decide").
    // NON-VISUAL EXCEPTION (avail.__nonVisual): when capture flagged the element as having NO perceivable visual box
    // (off-screen / sr-only / <6px / hidden — a common WCAG test pattern like `.notInPage{left:-9999px}`), its crop
    // CANNOT exist, but the barrier (programmatic name/role) IS judgeable from the structured signals. So judge
    // TEXT-ONLY rather than silently abstaining — a real recall loss otherwise. This fires ONLY on a legitimately
    // non-visual element (capture set the flag), NOT on a transient capture FAILURE (flag absent ⇒ still abstain), so
    // it is not the FP-inflating blanket no-vision bypass. A signal tells the rubric the element is not perceivable.
    // #15 fix: `rub.requiresVision` (frontmatter) OPTS OUT of this exception — a rubric whose judgment is a PIXEL
    // comparison (not a name/role fact) cannot be answered text-only; confirmed live, a model fabricated a
    // specific "the image actually depicts X" claim with zero pixels rather than abstaining. For such a rubric,
    // __nonVisual now falls through to the SAME auto-PARTIAL abstain as a genuine capture failure.
    const nonVisualUsable = avail.__nonVisual === '1' && !rub.requiresVision;
    if (nonVisualUsable) signals.elementNotPerceivable = true;
    // NO-VISION ablation fairness (V3_NO_VISION_RUBRIC): BYPASS the gate so the LLM is actually CALLED without the
    // crops — otherwise a no-vision run abstains here before the model ever runs, and its 0 recall is a gate
    // artifact, not a measurement of what the model can do from text. (Paired with the de-visioned rubric note.)
    // batch-3 #19a: this abstain was the ONE noVerdict path with no durable diagnostic — it returns null
    // BEFORE the agent is ever called, so llm-agent-adapter's emitNoVerdict (which fires on a null AGENT
    // reply) never sees it, and a page whose single viewport shot failed lost its whole lane SILENTLY
    // (three s12 drops). Emit one structured line per abstaining subject on the same grep-able
    // `[v3:noVerdict]` channel, naming exactly which declared frame(s) are missing. Same opt-out env.
    if (declaredVision.length && frames.length < declaredVision.length && !nonVisualUsable && process.env.V3_NO_VISION_RUBRIC !== '1') {
      if (process.env.V3_NOVERDICT_LOG !== '0') {
        const have = new Set(frames.map((f) => f.state));
        const rec = {
          reason: 'missing-declared-frame',
          frame: declaredVision.filter((st) => !have.has(st)).join(','),
          rubricId: subj.rubricId || null,
          sc: subj.sc || null,
          skill: subj.skill || null,
          xpath: subj.xpath ? String(subj.xpath).slice(0, 70) : null,
        };
        try { process.stderr.write(`[v3:noVerdict] ${JSON.stringify(rec)}\n`); } catch (e) { /* logging must never throw */ }
      }
      return null;
    }
    const checkerHint = (checkerHintsByXpath[subj.xpath] || []).find((h) => h.sc === subj.sc) || null;
    const messages = buildMessages({ xpath: subj.xpath, skill: subj.skill, sc: subj.sc, claimFamily: subj.claimFamily }, signals, transcriptByXpath[subj.xpath], frames, { rubric: rub.text, checkerHint, toolsEnabled: opts.toolsEnabled });
    let out; const t0 = Date.now();
    try { out = await judgeWithMethod(runAgent, messages, subj); } catch (e) { out = null; }
    // COMPLETENESS RETRY: a null here is a TRANSIENT agent failure (timeout / abort / empty under load) — NOT an
    // abstain (the required-evidence gate above already returned null and never reaches this point). Re-run ONCE so a
    // load-shed subject (e.g. a slow multi-turn page-level call) is recovered instead of becoming a silent noVerdict.
    if (!out && process.env.V3_LLM_NO_RETRY !== '1') { try { out = await judgeWithMethod(runAgent, messages, subj); } catch (e) { out = null; } }
    const latencyMs = Date.now() - t0;
    return { subj, i, frames, out, latencyMs };
  }, stop, opts.afterEach);
  for (const c of computed) {
    if (!c) continue; // abstained / budget-stopped / task error
    const { subj, i, frames, out, latencyMs } = c;
    if (out && Array.isArray(out.trace) && out.trace.length) traces.push({ sc: subj.sc, targetXpath: subj.xpath, rubricRef: subj.rubricId, verdict: out.verdict || null, latencyMs, trace: out.trace });
    if (!out || !V2_9_VERDICTS.includes(out.verdict)) continue;
    const verdict = mapToRubricVerdict(out.verdict);
    if (!verdict) continue;
    for (const f of frames) visionImages.push({ id: f.id, xpath: subj.xpath, state: f.state, mediaType: f.mediaType, data: f.data });
    const judgmentId = `jud:${subj.rubricId}:${i}`;
    judgments.push({
      judgmentId, sc: subj.sc, claimFamily: subj.claimFamily, targetXpath: subj.xpath,
      observationScope: scope(subj.xpath), rubricRef: subj.rubricId, verdict,
      confidence: V.LLM_CONFIDENCE.includes(out.confidence) ? out.confidence : 'low',
      evidenceRefs: [...scrubRefs(out.evidenceRefs), ...frames.map((f) => f.id)],
      summary: oneSentence(out.summary) || oneSentence(out.basis),
      reasoning: oneSentence(out.reasoning) || oneSentence(out.basis),
    });
  }
  return { judgments: { ...id, judgments }, llmTrace: { ...id, traces }, llmVision: { ...id, images: visionImages } };
}

module.exports = {
  MECHANISM, V2_9_VERDICTS, validateLlmShape, processLlm, mapToRubricVerdict,
  selectSubjects, selectRubricSubjects, precomputeSignals, buildPrompt, buildMessages,
  runAdjudication, runRubricJudgments, scrubRefs, isLegacyToken, computeLinkPeerGroups,
  runPool, // the one audited order-preserving worker pool — shared by the deterministic experiment lane
  // FN round 1 (2026-08-19) — exported for direct test: the 4.1.3 stand-alone-check enforcement helpers and
  // the 2.4.3 clause facts (whose undeclared-modal disjunct is new).
  announcedFactsOf, standaloneCheckPerformed, applyStandaloneCheck, focusClauseFacts, occludedStopsUnderOverlay,
};
