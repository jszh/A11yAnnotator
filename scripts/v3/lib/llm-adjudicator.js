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
      subjects.push({ xpath: r.xpath, skill, sc: r.sc, claimFamily: r.claimFamily, element: elByXpath[r.xpath] || { xpath: r.xpath } });
    }
  }
  return subjects;
}

// v2.9 PURE SIGNAL PRE-COMPUTE (3.1 §3): reuse a11y-eval verbatim where the inputs exist on the
// element facts, so the agent reasons over the SAME deterministic measures v2.9 surfaced — never
// re-deriving them. Side-effect-free; returns a structured signal bundle the prompt embeds.
function precomputeSignals(element, skill) {
  element = element || {}; // the `= {}` default only fires on undefined; a malformed `null` must not crash
  const s = {};
  const num = (v) => (Number.isFinite(v) ? v : undefined);
  if (skill === 'color-and-visual-text' && element.box && typeof element.box === 'object') {
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
  }
  // #44 / adversarial verify #7: for name-role-state, surface the deterministic NAME-PRESENCE result. The
  // ax-name-presence detector is a SHADOW signal (not a CLAIM), so an empty-name 4.1.2 obligation still
  // reaches the (now 4.1.2-owning) adequacy rubric — which must NOT mistake an ABSENT name for an adequate
  // one. Hand it the presence result + the explicit "absence IS the barrier" reading so it can't false-clear.
  if (skill === 'name-role-state') {
    const an = typeof element.axName === 'string' ? element.axName : null;
    s.accessibleName = {
      value: an,
      present: !!(an && an.trim().length > 0),
      resolved: an !== null, // null ⇒ CDP did not resolve a name (uncertain), distinct from '' (resolved-empty)
      uncertainReason: (an !== null && an.trim() === '')
        ? 'the deterministic name-presence detector found an EMPTY accessible name — that absence IS the barrier (judge REPRODUCED); only judge adequacy when a name is present'
        : (an === null ? 'the accessible name could not be resolved deterministically — judge presence/adequacy from the evidence' : undefined),
    };
  }
  s.boxMin = num(element.box && typeof element.box === 'object' ? Math.min(element.box.w, element.box.h) : undefined);
  return s;
}

// Assemble the agent prompt for one subject. Inherits the v2.9 skill rubric (the skills/*.md file when
// available) and embeds the pre-computed signals + the (realism-corrected) VSR transcript excerpt for
// the element. The agent must NAME the claimFamily (M3) and return {verdict, confidence, basis,
// evidenceRefs}. Pure string assembly — no I/O beyond an optional rubric read passed in via opts.
function buildPrompt(subject, signals, transcriptExcerpt, opts = {}) {
  const rubric = opts.rubric || `(rubric for skill "${subject.skill}" — judge whether a WCAG ${subject.sc} barrier is present)`;
  return [
    `You are the ${subject.skill} skill evaluating WCAG ${subject.sc} for one element.`,
    `Element xpath: ${subject.xpath}`,
    `Claim family (bind your verdict to this): ${subject.claimFamily}`,
    '--- rubric ---',
    rubric,
    // #44: tell the agent how to READ the deterministic signals — an `uncertainReason` is WHY a checker
    // abstained, and an absent signal/ratio means "could not decide", never "passes". (Atomic rubrics
    // additionally carry this in their "Interpreting the deterministic evidence" section.)
    '--- pre-computed deterministic signals (do not re-derive; a signal\'s `uncertainReason` says WHY a checker abstained — an ABSENT signal or ratio means it could NOT decide, NOT that the page passes) ---',
    JSON.stringify(signals),
    '--- VSR announcement (realistic accessible name) ---',
    transcriptExcerpt ? JSON.stringify(transcriptExcerpt) : '(none)',
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
async function runPool(items, concurrency, fn, shouldStop) {
  const arr = Array.isArray(items) ? items : [];
  const results = new Array(arr.length).fill(null);
  let cursor = 0, stop = false;
  const worker = async () => {
    while (!stop) {
      if (shouldStop && shouldStop()) { stop = true; return; }
      const i = cursor++;
      if (i >= arr.length) return;
      try { results[i] = await fn(arr[i], i); } catch (e) { results[i] = null; }
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
  // rubric source: the loader's { skills:{[skill]:{text,visionEvidence}} } OR a plain { skill: text } map.
  const rubricsBySkill = (opts.llmRubrics && opts.llmRubrics.skills) || opts.rubrics || {};
  const getRubric = (skill) => { const r = rubricsBySkill[skill]; if (!r) return { text: null, visionEvidence: [] }; if (typeof r === 'string') return { text: r, visionEvidence: [] }; return { text: r.text || null, visionEvidence: Array.isArray(r.visionEvidence) ? r.visionEvidence : [] }; };
  const scope = (xpath) => ({ actionTargetRef: xpath, state: opts.state || 'fresh-load', action: opts.action || 'inspect', environment: opts.environment || 'headless-chromium' });
  const verdicts = [];
  const rationales = [];
  const visionImages = []; // → the side llmVision artifact (crops, never in results)
  const concurrency = Math.max(1, Number(opts.llmConcurrency) || 1);
  // a malformed budget (exceeded() that throws) must not crash the producer — degrade to "run".
  const stop = () => { if (budget && typeof budget.exceeded === 'function') { try { return budget.exceeded(); } catch (e) { return false; } } return false; };
  // PHASE A (bounded-parallel, PURE per subject): judge each subject. The per-subject frame id uses the
  // subject's INDEX `i` (stable, independent of whether the verdict survives), so a dropped verdict can never
  // make another subject reuse an id and bind the wrong element's crop. No shared mutation here.
  const computed = await runPool(subjects, concurrency, async (subj, i) => {
    const transcriptExcerpt = transcriptByXpath[subj.xpath];
    const signals = precomputeSignals(subj.element, subj.skill);
    const { text: rubricText, visionEvidence } = getRubric(subj.skill);
    // supply EXACTLY the vision frames the rubric declares AND the collector captured for this element.
    const avail = visionByXpath[subj.xpath] || {};
    const frames = [];
    for (const state of visionEvidence) {
      const data = avail[state];
      if (typeof data === 'string' && data.length) frames.push({ id: `vis:${subj.skill}:${i}:${state}`, state, data, mediaType: 'image/png' });
    }
    const messages = buildMessages(subj, signals, transcriptExcerpt, frames, { rubric: rubricText });
    let out;
    try { out = await runAgent(messages, subj); } catch (e) { out = null; }
    return { subj, frames, out, signals, transcriptExcerpt };
  }, stop);
  // PHASE B (sequential, IN SUBJECT ORDER): assemble surviving verdicts — dense verdictId, no orphan crops.
  let n = 0;
  for (const c of computed) {
    if (!c) continue; // budget-stopped (not run) or task error
    const { subj, frames, out, signals, transcriptExcerpt } = c;
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
function selectRubricSubjects(collect, ledger, rubrics, { onlyAutoPartial = true } = {}) {
  const elByXpath = {};
  for (const el of (collect && collect.elements) || []) if (el && el.xpath) elByXpath[el.xpath] = el;
  const bySc = {};
  for (const r of Object.values(rubrics || {})) if (r && r.sc) (bySc[r.sc] = bySc[r.sc] || []).push(r);
  const rows = (ledger || []).filter((r) => (onlyAutoPartial ? r.autoPartial : true));
  const seen = new Set();
  const subjects = [];
  for (const row of rows) for (const rub of (bySc[row.sc] || [])) {
    const key = `${row.xpath}::${rub.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    subjects.push({ xpath: row.xpath, sc: row.sc, claimFamily: row.claimFamily, rubricId: rub.id, rubric: rub, skill: rub.skill || null, element: elByXpath[row.xpath] || { xpath: row.xpath } });
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
  const scope = (xpath) => ({ actionTargetRef: xpath, state: opts.state || 'fresh-load', action: opts.action || 'inspect', environment: opts.environment || 'headless-chromium' });
  const judgments = [];
  const visionImages = [];
  const concurrency = Math.max(1, Number(opts.llmConcurrency) || 1);
  const stop = () => { if (budget && typeof budget.exceeded === 'function') { try { return budget.exceeded(); } catch (e) { return false; } } return false; };
  // PHASE A (bounded-parallel, PURE): the per-rubric-subject frame id + judgmentId both use the subject's
  // INDEX `i` (position-stable, matching the old `idx`). The required-evidence gate / legacy-token drop
  // return null (the subject abstains), exactly as the prior `continue`.
  const computed = await runPool(rubricSubjects, concurrency, async (subj, i) => {
    if (isLegacyToken(subj.rubricId)) return null; // a legacy-token rubric id would make the artifact reject — drop it
    const rub = subj.rubric || {};
    const signals = precomputeSignals(subj.element, subj.skill);
    const avail = visionByXpath[subj.xpath] || {};
    const declaredVision = rub.visionEvidence || [];
    const frames = [];
    for (const state of declaredVision) { const data = avail[state]; if (typeof data === 'string' && data.length) frames.push({ id: `vis:${subj.rubricId}:${i}:${state}`, state, data, mediaType: 'image/png' }); }
    // REQUIRED-EVIDENCE GATE (adversarial): an atomic rubric judges over EXACTLY its declared evidence. If
    // ANY declared frame is missing — capture skipped the element (off-viewport / <6px / hidden), or the
    // transition isn't driven yet (the form-submit pair for 3.3.1/3.3.3 is not produced) — ABSTAIN rather
    // than judge BLIND. Missing declared evidence ⇒ the obligation simply stays auto-PARTIAL (honest "could not decide").
    if (declaredVision.length && frames.length < declaredVision.length) return null;
    const messages = buildMessages({ xpath: subj.xpath, skill: subj.skill, sc: subj.sc, claimFamily: subj.claimFamily }, signals, transcriptByXpath[subj.xpath], frames, { rubric: rub.text });
    let out;
    try { out = await runAgent(messages, subj); } catch (e) { out = null; }
    return { subj, i, frames, out };
  }, stop);
  for (const c of computed) {
    if (!c) continue; // abstained / budget-stopped / task error
    const { subj, i, frames, out } = c;
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
  return { judgments: { ...id, judgments }, llmVision: { ...id, images: visionImages } };
}

module.exports = {
  MECHANISM, V2_9_VERDICTS, validateLlmShape, processLlm, mapToRubricVerdict,
  selectSubjects, selectRubricSubjects, precomputeSignals, buildPrompt, buildMessages,
  runAdjudication, runRubricJudgments, scrubRefs, isLegacyToken,
};
