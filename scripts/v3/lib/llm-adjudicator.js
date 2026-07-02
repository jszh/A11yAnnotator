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
  // 7a: the complex-backdrop 1.4.3 rubric is for a NON-flat backdrop ONLY — a reliably COMPUTABLE ratio is owned
  // by the deterministic text-contrast-pixel runner (Tier-0 #2). Route only when the runner abstained.
  'contrast-over-complex-backdrop-v0': (el) => !!el && el.contrastReliable !== true,
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
  // 1.1.1 text-lookalike-glyph-substitution: the element's visible text / accessible name RENDERS as words but is
  // built from non-letter codepoints an SR cannot read (math-styled / fullwidth / enclosed / Cyrillic-Greek homoglyph
  // mixed into a Latin word). DETERMINISTIC — surfaced so the judge sees the SEEN text vs the AT-readable fold.
  {
    const probe = (typeof element.text === 'string' && element.text) ? element.text : (typeof element.axName === 'string' ? element.axName : '');
    const cf = detectConfusableText(probe);
    if (cf.hasConfusables) s.confusableText = { kinds: cf.kinds, count: cf.count, asciiFold: cf.asciiFold, samples: cf.samples, uncertainReason: 'this element\'s visible text uses CONFUSABLE codepoints (' + cf.kinds.join(', ') + ') that render as ordinary words but are NOT readable letters to assistive technology — a screen reader gets gibberish, the wrong language, or nothing. The seen word folds to "' + cf.asciiFold + '" but the markup does not contain those ASCII letters. Treat styled/decorative glyph-substituted TEXT as non-text content lacking a text alternative (1.1.1) unless a proper text equivalent is present.' };
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
    s.keyboard = A.keyboardOperabilitySignal({
      role: element.role, tabindex: element.tabindex, reachedByTab: element.reachedByTab,
      respondedToSyntheticKey: element.respondedToSyntheticKey, respondsToArrows: element.respondsToArrows, focusable: element.focusable,
    });
    // 2.1.2 keyboard-trap (keyboard-trap-v0): the CONFINED set the deterministic instrument confirmed (attached as
    // __confinement when this element is a confinement member). The rubric reveals/verifies the documented escape.
    if (element.__confinement && Array.isArray(element.__confinement.members)) {
      s.keyboardTrap = {
        members: element.__confinement.members,
        setSize: element.__confinement.setSize,
        uncertainReason: 'a deterministic probe confirmed focus is CONFINED to these elements (cannot leave by Tab, Shift+Tab, or Escape, and an element outside the set is never reached). This is a 2.1.2 barrier UNLESS the user is told how to escape (a non-standard key, possibly behind a help control) AND that key works. Activate each member with observe_state_after_activation to reveal any escape instructions, then drive a focus-then-press sequence with interact_and_observe (actions:[{op:focus,xpath:member},{op:press,key:"Ctrl+M"}]) and read the press step.activeAfter — if it is OUTSIDE this set the key freed focus, otherwise it did nothing. Undocumented or non-working ⇒ REPRODUCED.',
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
      s.enclosingContext = {
        blockText: block.slice(0, 200),
        linkAloneInBlock: aloneInBlock,
        ...(hasCellHdr ? { cellRowHeaders: (chc.rowHeaders || []).slice(0, 4), cellColHeaders: (chc.colHeaders || []).slice(0, 4), cellHeaderSource: chc.headerSource || 'positional' } : {}),
        uncertainReason: hasCellHdr
          ? 'this link sits in a DATA-TABLE CELL: beyond its own block, its programmatic context includes the cell\'s associated headers — cellRowHeaders and cellColHeaders (the cell\'s row/column header text). Per WCAG 2.4.4 the cell\'s row/column header IS enclosing context. The test is SPECIFICITY, NOT row-vs-column: a header (ROW or COLUMN) that names a SPECIFIC SUBJECT/DESTINATION resolves a format-only/action-only link name ⇒ NOT REPRODUCED — e.g. name "EPUB"/"Download" + a header ["Ulysses"] (a specific book) = "download Ulysses as EPUB", determinable. A header that is only a GENERIC CATEGORY or ACTION label ("Books", "Downloads", "Format", "Links") names no specific destination and does NOT resolve it; if neither the name nor a subject-naming header identifies the destination, that is a barrier. (Row headers are MORE OFTEN the subject and column headers MORE OFTEN the category, but judge the actual text, not the slot.) Judge the name TOGETHER WITH these headers; do not demand the name itself restate the subject.'
          : aloneInBlock
            ? 'this link is ALONE in its enclosing block (paragraph/list-item/cell) — its programmatically-determined CONTEXT is ONLY its own name. Any descriptive prose in a SEPARATE sibling block is NOT enclosing context for 2.4.4, and the vision crop showing nearby text must NOT be read as link context. If the name alone (a generic/format/action word) does not identify the link purpose, that is a 2.4.4 barrier — do not clear on neighbouring text the link does not programmatically own.'
            : 'this link sits within enclosing block text that MAY disambiguate it — judge whether the name TOGETHER WITH this enclosing-block context identifies the link purpose.',
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
  if (skill === 'page-structure' || skill === 'grouping-and-reading-order') {
    const struct = element.__pageStructure || null;
    if (struct) {
      if (skill === 'page-structure') {
        const t = typeof struct.title === 'string' ? struct.title : '';
        // #3 fix: frameTitles are distinct child-frame <title> values that differ from the outer title — a
        // frameset's real rendered content can carry its own title unrelated to the outer document's. Surfaced
        // ONLY when non-empty so a non-framed page's pageTitle shape is byte-identical to before this fix.
        const fts = Array.isArray(struct.frameTitles) ? struct.frameTitles.filter((x) => typeof x === 'string' && x) : [];
        s.pageTitle = { value: t || null, present: t.trim().length > 0, ...(fts.length ? { frameTitles: fts } : {}) };
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
      const per = tbls.map(tVerdict);
      const dataN = per.filter((v) => v !== 'NOT_DATA').length;
      const page = dataN === 0 ? 'NO_DATA_TABLE'
        : per.includes('BROKEN') ? 'HAS_BROKEN'
          : per.includes('UNCERTAIN') ? 'HAS_UNCERTAIN' : 'ALL_VALID';
      s.structure.tableAssociation = { page, hasDataTable: dataN > 0, perTable: per };
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
  return [
    // DISTRACTOR-STRIP lever (V3_FP_STRIP_QUESTION, inert by default): drop the task framing + claim-family
    // priming that can nudge the judge toward over-flagging (the "One Token to Fool" finding: the restated
    // question can raise judge FP). The rubric + grounded evidence remain — only the priming framing is removed.
    ...(fpStrip
      ? ['You are evaluating one element. Judge ONLY from the rubric and the evidence provided below.']
      : [`You are the ${subject.skill} skill evaluating WCAG ${subject.sc} for one element.`,
         `Element xpath: ${subject.xpath}`,
         `Claim family (bind your verdict to this): ${subject.claimFamily}`]),
    '--- cross-cutting judgment principles (apply to EVERY SC; the rubric below adds the SC-specific detail) ---',
    KNOWLEDGE_LAYER,
    '--- rubric ---',
    rubric,
    // NO-VISION ablation fairness (V3_NO_VISION_RUBRIC): neutralize the rubric's visual-examination instructions so a
    // text-only run is NOT penalized for abstaining on a crop it was never given. Without this, the rubric's "judge
    // from the crop" lines make the LLM return PARTIAL for lack of vision — confounding the no-vision measurement.
    ...(process.env.V3_NO_VISION_RUBRIC === '1' ? ['--- IMPORTANT: NO visual evidence is available for this judgment ---',
      'No screenshot, crop, image, or rendered-pixel view is provided. DISREGARD every rubric instruction to examine a crop / image / surrounding-region / rendered pixels / "what you can SEE". Judge ONLY from the TEXTUAL evidence in this prompt (accessible name, role, signals, markup, context). Do NOT return PARTIAL merely because you cannot see the rendering — make your best determination from the available textual facts; return PARTIAL only if those facts THEMSELVES genuinely cannot resolve it.'] : []),
    // #44: tell the agent how to READ the deterministic signals — an `uncertainReason` is WHY a checker
    // abstained, and an absent signal/ratio means "could not decide", never "passes". (Atomic rubrics
    // additionally carry this in their "Interpreting the deterministic evidence" section.)
    '--- pre-computed deterministic signals (do not re-derive; a signal\'s `uncertainReason` says WHY a checker abstained — an ABSENT signal or ratio means it could NOT decide, NOT that the page passes) ---',
    JSON.stringify(signals),
    // CHECKER-UNCERTAINTY hint (DEFERRED-TODO A): an external checker (axe/IBM) ran a rule here and returned
    // NEEDS-REVIEW (it could not decide). That is exactly why this obligation reached you — investigate the
    // checker's specific concern; "needs review" is NEVER a pass (absence ≠ pass).
    ...(opts.checkerHint ? ['--- external-checker cross-signal (flagged this for REVIEW — could not auto-decide) ---', JSON.stringify(opts.checkerHint)] : []),
    '--- VSR announcement (realistic accessible name) ---',
    transcriptExcerpt ? JSON.stringify(transcriptExcerpt) : '(none)',
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
  const getRubric = (skill) => { const r = rubricsBySkill[skill]; if (!r) return { text: null, visionEvidence: [] }; if (typeof r === 'string') return { text: r, visionEvidence: [] }; return { text: r.text || null, visionEvidence: Array.isArray(r.visionEvidence) ? r.visionEvidence : [] }; };
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
    const { text: rubricText, visionEvidence } = getRubric(subj.skill);
    // supply EXACTLY the vision frames the rubric declares AND the collector captured for this element.
    const avail = visionByXpath[subj.xpath] || {};
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
    try { out = await judgeWithMethod(runAgent, messages, subj); } catch (e) { out = null; }
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

function selectRubricSubjects(collect, ledger, rubrics, { onlyAutoPartial = true, confinement = null, contrastExempt = null } = {}) {
  // 2.1.2 keyboard-trap: `confinement` maps each CONFINED element xpath → { members:[{xpath,label}], setSize } (built
  // from the deterministic confinement instrument's REVIEW findings — the lying-static-advisory ones were already
  // promoted to a barrier and are excluded). The keyboard-trap-v0 rubric fires ONLY on a confined member, carrying
  // the trapped set so the regular LLM judge can reveal a buried advisory + verify the key with the tools.
  const confinementFor = (xpath) => (confinement && Object.prototype.hasOwnProperty.call(confinement, xpath)) ? confinement[xpath] : null;
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
  const rows = (ledger || []).filter((r) => (onlyAutoPartial ? (r.autoPartial || (r.sc === '2.1.2' && !!confinementFor(r.xpath))) : true));
  const seen = new Set();
  const subjects = [];
  for (const row of rows) for (const rub of (bySc[row.sc] || [])) {
    const key = `${row.xpath}::${rub.id}`;
    if (seen.has(key)) continue;
    const baseEl = elByXpath[row.xpath] || { xpath: row.xpath };
    const gate = RUBRIC_GATE[rub.id]; // per-facet gating (Item 7): skip a rubric that is not this element's facet
    if (gate && !gate(baseEl)) continue;
    seen.add(key);
    // attach per-subject evidence via a SHALLOW COPY (never mutate the shared collect.elements record): the
    // whole-page structure for page-structure/grouping rubrics (__pageStructure), and the same-named link set for
    // the relational link-name-equivalence rubric (__sameNameLinks). precomputeSignals reads these.
    const extra = {};
    if (structure && PAGE_STRUCTURE_SKILLS.has(rub.skill || '')) extra.__pageStructure = structure;
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
    const element = Object.keys(extra).length ? { ...baseEl, ...extra } : baseEl;
    subjects.push({ xpath: row.xpath, sc: row.sc, claimFamily: row.claimFamily, rubricId: rub.id, rubric: rub, skill: rub.skill || null, element });
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
    if (avail.__nonVisual === '1') signals.elementNotPerceivable = true;
    // NO-VISION ablation fairness (V3_NO_VISION_RUBRIC): BYPASS the gate so the LLM is actually CALLED without the
    // crops — otherwise a no-vision run abstains here before the model ever runs, and its 0 recall is a gate
    // artifact, not a measurement of what the model can do from text. (Paired with the de-visioned rubric note.)
    if (declaredVision.length && frames.length < declaredVision.length && avail.__nonVisual !== '1' && process.env.V3_NO_VISION_RUBRIC !== '1') return null;
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
};
